import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CURRENT_DEVICE_ID, getCurrentPhcId } from '../db/seedData';
import {
  EntityType,
  MutationQueueEntry,
  SyncStatus,
  BillingTransaction,
  DispensedItem,
  StockMovement,
  InventoryBatch,
  PHCFacility,
  Equipment,
  StaffAttendance,
  PatientFootfall,
  ResourceRequest,
  Alert,
} from '../types';

// Generate standard UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useMutationQueue() {
  const pendingMutations = useLiveQuery(async () => {
    return await db.mutation_queue
      .where('sync_status')
      .anyOf(['pending', 'in_flight', 'failed'])
      .sortBy('local_seq');
  }, []) || [];

  const allMutations = useLiveQuery(async () => {
    return await db.mutation_queue.reverse().sortBy('created_at');
  }, []) || [];

  const conflictMutations = useLiveQuery(async () => {
    return await db.mutation_queue
      .where('sync_status')
      .equals('conflict')
      .toArray();
  }, []) || [];

  /**
   * Enqueue a mutation and apply optimistic local changes immediately
   */
  const enqueue = async (
    entityType: EntityType,
    payload: any,
    explicitId?: string
  ): Promise<MutationQueueEntry> => {
    const mutationId = explicitId || generateUUID();
    const now = new Date().toISOString();
    const currentPhcId = getCurrentPhcId();

    // Get current max local_seq
    const lastEntry = await db.mutation_queue.orderBy('local_seq').last();
    const nextSeq = (lastEntry?.local_seq || 0) + 1;

    const entry: MutationQueueEntry = {
      id: mutationId,
      entity_type: entityType,
      payload,
      device_id: CURRENT_DEVICE_ID,
      local_seq: nextSeq,
      created_at: now,
      sync_status: 'pending',
      retry_count: 0,
      last_error: null,
    };

    // Atomic transaction: Store in mutation queue and apply optimistic local write
    await db.transaction('rw', [
      db.mutation_queue,
      db.billing_transactions,
      db.dispensed_items,
      db.inventory_batches,
      db.stock_movements,
      db.phc_facilities,
      db.equipment,
      db.staff_attendance,
      db.patient_footfall,
      db.resource_requests,
      db.alerts,
    ], async () => {
      // 1. Insert into persistent mutation queue
      await db.mutation_queue.put(entry);

      // 2. Optimistic local table updates
      switch (entityType) {
        case 'billing_transaction': {
          const { client_txn_id, patient_ref, dispensed_by_staff_id, dispensed_by_staff_name, total_amount, items } = payload;
          const billingTxn: BillingTransaction = {
            id: client_txn_id || mutationId,
            phc_id: currentPhcId,
            client_txn_id: client_txn_id || mutationId,
            patient_ref: patient_ref || 'Walk-in',
            dispensed_by_staff_id: dispensed_by_staff_id || 'staff-05',
            dispensed_by_staff_name: dispensed_by_staff_name || 'Pharmacist',
            total_amount: total_amount || 0,
            client_timestamp: now,
            status: 'pending_sync',
            sync_status: 'pending',
          };
          await db.billing_transactions.put(billingTxn);

          // Deduct from batches optimistically and record dispensed items
          if (Array.isArray(items)) {
            for (const item of items) {
              const dispensedItem: DispensedItem = {
                id: generateUUID(),
                billing_transaction_id: billingTxn.id,
                batch_id: item.batch_id,
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name,
                batch_no: item.batch_no,
                quantity: item.quantity,
                unit_price: item.unit_price || 0,
              };
              await db.dispensed_items.put(dispensedItem);

              // Deduct from batch
              if (item.batch_id) {
                const batch = await db.inventory_batches.get(item.batch_id);
                if (batch) {
                  const prevQty = batch.remaining_qty;
                  const newQty = Math.max(0, prevQty - item.quantity);
                  await db.inventory_batches.update(item.batch_id, {
                    remaining_qty: newQty,
                  });

                  // Stock movement log
                  await db.stock_movements.put({
                    id: generateUUID(),
                    phc_id: currentPhcId,
                    medicine_id: item.medicine_id,
                    batch_id: item.batch_id,
                    batch_no: batch.batch_no,
                    type: 'dispense',
                    quantity: item.quantity,
                    previous_qty: prevQty,
                    new_qty: newQty,
                    reason: `FEFO Dispense - Patient ${patient_ref || 'Walk-in'}`,
                    user_name: dispensed_by_staff_name || 'Pharmacist',
                    device_id: CURRENT_DEVICE_ID,
                    timestamp: now,
                  });
                }
              }
            }
          }
          break;
        }

        case 'inventory_batch_create': {
          const batchData: InventoryBatch = {
            id: payload.id || mutationId,
            phc_id: currentPhcId,
            medicine_id: payload.medicine_id,
            batch_no: payload.batch_no,
            received_qty: Number(payload.received_qty),
            remaining_qty: Number(payload.remaining_qty ?? payload.received_qty),
            minimum_threshold: Number(payload.minimum_threshold || 50),
            expiry_date: payload.expiry_date,
            received_at: payload.received_at || now,
            source: payload.source || 'State Medical Supply Depot',
          };
          await db.inventory_batches.put(batchData);

          await db.stock_movements.put({
            id: generateUUID(),
            phc_id: currentPhcId,
            medicine_id: payload.medicine_id,
            batch_id: batchData.id,
            batch_no: batchData.batch_no,
            type: 'receive',
            quantity: batchData.received_qty,
            previous_qty: 0,
            new_qty: batchData.received_qty,
            reason: `Stock Received from ${batchData.source}`,
            user_name: payload.user_name || 'Store Officer',
            device_id: CURRENT_DEVICE_ID,
            timestamp: now,
          });
          break;
        }

        case 'inventory_batch_update': {
          const { batch_id, medicine_id, new_quantity, previous_quantity, reason, user_name } = payload;
          if (batch_id) {
            await db.inventory_batches.update(batch_id, {
              remaining_qty: Number(new_quantity),
            });

            const batch = await db.inventory_batches.get(batch_id);
            await db.stock_movements.put({
              id: generateUUID(),
              phc_id: currentPhcId,
              medicine_id: medicine_id || batch?.medicine_id || '',
              batch_id,
              batch_no: batch?.batch_no || '',
              type: 'adjust',
              quantity: Math.abs(new_quantity - previous_quantity),
              previous_qty: Number(previous_quantity),
              new_qty: Number(new_quantity),
              reason: reason || 'Inventory Audit Adjustment',
              user_name: user_name || 'Admin',
              device_id: CURRENT_DEVICE_ID,
              timestamp: now,
            });
          }
          break;
        }

        case 'facility_update': {
          const targetFacility = (await db.phc_facilities.get(currentPhcId)) || (await db.phc_facilities.toCollection().first());
          if (targetFacility) {
            await db.phc_facilities.update(targetFacility.id, {
              ...payload,
              updated_at: now,
            });
          }
          break;
        }

        case 'equipment_update':
        case 'equipment_create': {
          const eqId = payload.id || mutationId;
          const eqRecord: Equipment = {
            id: eqId,
            phc_id: currentPhcId,
            equipment_type: payload.equipment_type,
            quantity: Number(payload.quantity || 1),
            working_qty: Number(payload.working_qty || 0),
            non_working_qty: Number(payload.non_working_qty || 0),
            maintenance_status: payload.maintenance_status || 'operational',
            last_serviced_at: payload.last_serviced_at || now.split('T')[0],
            next_service_date: payload.next_service_date || '',
            created_at: payload.created_at || now,
          };
          await db.equipment.put(eqRecord);
          break;
        }

        case 'staff_attendance': {
          const attId = payload.id || mutationId;
          const attRecord: StaffAttendance = {
            id: attId,
            staff_id: payload.staff_id,
            phc_id: payload.phc_id || currentPhcId,
            attendance_date: payload.attendance_date || now.split('T')[0],
            status: payload.status,
            notes: payload.notes,
          };
          await db.staff_attendance.put(attRecord);
          break;
        }

        case 'footfall_entry': {
          const footfallRecord: PatientFootfall = {
            id: payload.id || mutationId,
            phc_id: payload.phc_id || currentPhcId,
            category: payload.category,
            count: Number(payload.count),
            date: payload.date || now.split('T')[0],
            created_at: now,
            correction_ref_id: payload.correction_ref_id,
          };
          await db.patient_footfall.put(footfallRecord);
          break;
        }

        case 'resource_request': {
          const reqRecord: ResourceRequest = {
            id: payload.id || mutationId,
            phc_id: payload.phc_id || currentPhcId,
            request_type: payload.request_type,
            item_ref: payload.item_ref,
            item_name: payload.item_name,
            quantity: Number(payload.quantity),
            priority: payload.priority || 'routine',
            reason: payload.reason || 'manual',
            source: payload.source || 'manual',
            status: payload.status || 'pending',
            notes: payload.notes,
            created_at: now,
          };
          await db.resource_requests.put(reqRecord);
          break;
        }

        case 'alert_report': {
          const alertRecord: Alert = {
            id: payload.id || mutationId,
            phc_id: payload.phc_id || currentPhcId,
            alert_type: payload.alert_type,
            severity: payload.severity,
            title: payload.title,
            message: payload.message,
            source_module: payload.source_module || 'emergency',
            payload: payload.payload,
            status: 'open',
            created_at: now,
          };
          await db.alerts.put(alertRecord);
          break;
        }
      }
    });

    return entry;
  };

  /**
   * Update sync status of a mutation in the queue
   */
  const markStatus = async (
    id: string,
    status: SyncStatus,
    extra?: {
      last_error?: string | null;
      conflict_detail?: any;
      retry_count?: number;
    }
  ) => {
    const updateData: Partial<MutationQueueEntry> = {
      sync_status: status,
    };
    if (extra?.last_error !== undefined) updateData.last_error = extra.last_error;
    if (extra?.conflict_detail !== undefined) updateData.conflict_detail = extra.conflict_detail;
    if (extra?.retry_count !== undefined) updateData.retry_count = extra.retry_count;

    await db.mutation_queue.update(id, updateData);

    // If billing mutation synced, update corresponding billing transaction
    if (status === 'synced') {
      const entry = await db.mutation_queue.get(id);
      if (entry && entry.entity_type === 'billing_transaction') {
        const txnId = entry.payload?.client_txn_id || entry.id;
        await db.billing_transactions.update(txnId, {
          sync_status: 'synced',
          status: 'completed',
        });
      }
    } else if (status === 'conflict') {
      const entry = await db.mutation_queue.get(id);
      if (entry && entry.entity_type === 'billing_transaction') {
        const txnId = entry.payload?.client_txn_id || entry.id;
        await db.billing_transactions.update(txnId, {
          sync_status: 'conflict',
          status: 'conflict',
        });
      }
    }
  };

  /**
   * Delete synced mutations or clear history
   */
  const clearSynced = async () => {
    const syncedIds = await db.mutation_queue
      .where('sync_status')
      .equals('synced')
      .primaryKeys();
    await db.mutation_queue.bulkDelete(syncedIds);
  };

  return {
    pendingMutations,
    allMutations,
    conflictMutations,
    pendingCount: pendingMutations.length,
    conflictCount: conflictMutations.length,
    enqueue,
    markStatus,
    clearSynced,
  };
}
