import crypto from 'crypto';
import { BillingService } from '../billing/billingService';
import { ConfigService } from '../config/configService';
import { PoolClient } from 'pg';
import { adminPool, TenantClaims } from '../../db/pool';

export interface MutationInput<T = Record<string, any>> {
  id:               string; // Client UUID idempotency key
  entity_type:      'billing_transaction' | 'inventory_batch_update' | 'resource_request' |
                    'footfall_entry' | 'facility_update' | 'staff_attendance' | 'alert_report' |
                    'system_config' | 'config_update';
  operation:        'create' | 'update';
  payload:          T;
  local_seq:        number;
  client_timestamp: string;
}

export interface SyncPushRequestInput {
  device_id:     string;
  phc_id:        string;
  client_clock?: string;
  mutations:     MutationInput[];
}

export interface ConflictDetailResult {
  conflict_type:        'stock_oversold' | 'concurrent_absolute_edit' | 'stale_reference';
  server_state:         Record<string, any>;
  suggested_resolution: 'requeue_with_reduced_quantity' | 'discard_local_edit' | 'manual_reconciliation_required';
  reconciliation_ref:   string;
}

export interface MutationResultOutput {
  mutation_id:       string;
  status:            'accepted' | 'duplicate' | 'rejected' | 'conflict';
  server_entity_id?: string;
  error_code?:       string;
  conflict?:         ConflictDetailResult;
}

export interface SyncPushResponseOutput {
  server_seq: number;
  results:    MutationResultOutput[];
}

export interface DeltaOutput {
  server_seq:        number;
  entity_type:       'redistribution_approval' | 'request_status_change' | 'alert' |
                     'threshold_config_update' | 'facility_config_update';
  operation:         'upsert' | 'delete';
  entity_id:         string;
  payload:           Record<string, any>;
  server_timestamp?: string;
}

export interface SyncPullResponseOutput {
  server_seq: number;
  has_more:   boolean;
  deltas:     DeltaOutput[];
}

// Configurable retention window for incremental sync deltas
const RETENTION_WINDOW = 10_000;

export class SyncService {
  /**
   * Process a batch of offline mutations uploaded via POST /sync/push
   */
  static async processPush(
    request: SyncPushRequestInput,
    claims?: TenantClaims,
  ): Promise<SyncPushResponseOutput> {
    if (!request.device_id || !request.phc_id || !Array.isArray(request.mutations)) {
      throw new Error('INVALID_SYNC_ENVELOPE');
    }

    // Role check: phc_user cannot write to another PHC
    if (claims?.role === 'phc_user' && claims.phcId !== request.phc_id) {
      throw new Error('UNAUTHORIZED_PHC_SYNC');
    }

    const results: MutationResultOutput[] = [];

    // Sort mutations deterministically by device-local sequence
    const sorted = [...request.mutations].sort((a, b) => a.local_seq - b.local_seq);

    for (const m of sorted) {
      // 1. Idempotency check: has this mutation already been processed?
      const checkRes = await adminPool.query(
        `SELECT id, sync_status, server_seq FROM mutation_queue
         WHERE (id = $1 OR mutation_id = $1)
            OR (phc_id = $2 AND device_id = $3 AND local_seq = $4)
         LIMIT 1`,
        [m.id, request.phc_id, request.device_id, m.local_seq],
      );

      if ((checkRes.rowCount ?? 0) > 0) {
        const existing = checkRes.rows[0];
        results.push({
          mutation_id: m.id,
          status: 'duplicate',
          server_entity_id: existing.id,
        });
        continue;
      }

      // 2. Process mutation in an isolated transaction
      const client = await adminPool.connect();
      try {
        await client.query('BEGIN');

        const mutationResult = await this.executeMutation(client, request.phc_id, request.device_id, m);

        // Record in mutation_queue with its sync outcome
        await client.query(
          `INSERT INTO mutation_queue (
             id, mutation_id, phc_id, device_id, local_seq, entity_type, operation,
             payload, sync_status, client_timestamp, error_code
           ) VALUES (
             $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
           )`,
          [
            m.id,
            request.phc_id,
            request.device_id,
            m.local_seq,
            m.entity_type,
            m.operation,
            JSON.stringify(m.payload || {}),
            mutationResult.status,
            m.client_timestamp || new Date().toISOString(),
            mutationResult.error_code || null,
          ],
        );

        await client.query('COMMIT');
        results.push(mutationResult);
      } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`[SyncService] Mutation ${m.id} failed:`, err?.message || err);

        // Record rejected mutation outside the aborted transaction for audit and deduplication
        try {
          await adminPool.query(
            `INSERT INTO mutation_queue (
               id, mutation_id, phc_id, device_id, local_seq, entity_type, operation,
               payload, sync_status, client_timestamp, error_code
             ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, 'rejected', $8, $9)
             ON CONFLICT (phc_id, device_id, local_seq) DO UPDATE
             SET sync_status = 'rejected', error_code = EXCLUDED.error_code`,
            [
              m.id,
              request.phc_id,
              request.device_id,
              m.local_seq,
              m.entity_type,
              m.operation,
              JSON.stringify(m.payload || {}),
              m.client_timestamp || new Date().toISOString(),
              err.message || 'MUTATION_FAILED',
            ],
          );
        } catch (_) {}

        results.push({
          mutation_id: m.id,
          status: 'rejected',
          error_code: err.message || 'MUTATION_FAILED',
        });
      } finally {
        client.release();
      }
    }

    // Get current high-watermark server sequence
    const seqRes = await adminPool.query(
      `SELECT COALESCE(MAX(server_seq), (SELECT last_value FROM sync_server_seq), 1)::bigint AS current_seq FROM mutation_queue`,
    );
    const currentSeq = Number(seqRes.rows[0]?.current_seq ?? 1);

    return {
      server_seq: currentSeq,
      results,
    };
  }

  /**
   * Routes a single mutation to its owning domain logic
   */
  private static async executeMutation(
    client: PoolClient,
    phcId: string,
    deviceId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    switch (mutation.entity_type) {
      case 'billing_transaction':
        return this.handleBillingMutation(client, phcId, mutation);

      case 'inventory_batch_update':
        return this.handleInventoryMutation(client, phcId, mutation);

      case 'resource_request':
        return this.handleRequestMutation(client, phcId, mutation);

      case 'footfall_entry':
        return this.handleFootfallMutation(client, phcId, mutation);

      case 'facility_update':
        return this.handleFacilityMutation(client, phcId, mutation);

      case 'staff_attendance':
        return this.handleAttendanceMutation(client, phcId, mutation);

      case 'alert_report':
        return this.handleAlertMutation(client, phcId, mutation);

      case 'system_config':
      case 'config_update':
        return this.handleConfigMutation(client, phcId, mutation);

      default:
        return {
          mutation_id: mutation.id,
          status: 'rejected',
          error_code: `UNSUPPORTED_ENTITY_TYPE: ${mutation.entity_type}`,
        };
    }
  }

  /**
   * Billing mutation handler — delegates to the SINGLE canonical FEFO implementation
   * in BillingService.checkout() (Architecture §5.1: one FEFO implementation, not two).
   *
   * Insufficient stock is translated to the sync conflict shape (§8.3) that offline
   * clients know how to handle (suggested_resolution: requeue_with_reduced_quantity).
   */
  private static async handleBillingMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    const clientTxnId = p.client_txn_id || mutation.id;
    const items = p.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return { mutation_id: mutation.id, status: 'rejected', error_code: 'EMPTY_BILLING_ITEMS' };
    }

    // Delegate to canonical FEFO service — no duplicate logic here
    const result = await BillingService.checkout(client, phcId, {
      client_txn_id: clientTxnId,
      patient_ref: p.patient_ref,
      dispensed_by_staff_id: p.dispensed_by_staff_id,
      items,
      client_timestamp: mutation.client_timestamp,
    });

    if (result.outcome === 'insufficient_stock') {
      // Map to §8.3 sync conflict shape understood by offline clients
      const firstShortfall = result.shortfalls[0];
      return {
        mutation_id: mutation.id,
        status: 'conflict',
        conflict: {
          conflict_type: 'stock_oversold',
          server_state: {
            medicine_id: firstShortfall.medicine_id,
            requested_qty: firstShortfall.requested_qty,
            available_qty: firstShortfall.available_qty,
            all_shortfalls: result.shortfalls,
          },
          suggested_resolution: 'requeue_with_reduced_quantity',
          reconciliation_ref: crypto.randomUUID(),
        },
      };
    }

    return {
      mutation_id: mutation.id,
      status: 'accepted',
      server_entity_id: result.transaction_id,
    };
  }

  private static async handleInventoryMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    const res = await client.query(
      `INSERT INTO inventory_batches (
         phc_id, medicine_id, batch_no, received_qty, remaining_qty, minimum_threshold, expiry_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (phc_id, medicine_id, batch_no) DO UPDATE
       SET remaining_qty = EXCLUDED.remaining_qty
       RETURNING id`,
      [
        phcId,
        p.medicine_id,
        p.batch_no,
        p.received_qty || p.remaining_qty || 0,
        p.remaining_qty || 0,
        p.minimum_threshold || 10,
        p.expiry_date || '2027-12-31',
      ],
    );
    return { mutation_id: mutation.id, status: 'accepted', server_entity_id: res.rows[0].id };
  }

  private static async handleRequestMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    const validTypes = ['medicine', 'oxygen', 'bed', 'staff', 'equipment'];
    let reqType = (p.request_type || 'medicine').toLowerCase();
    if (reqType === 'replenishment') reqType = 'medicine';
    if (!validTypes.includes(reqType)) reqType = 'medicine';

    const validPriorities = ['routine', 'urgent', 'critical'];
    let prio = (p.priority || 'routine').toLowerCase();
    if (prio === 'normal' || prio === 'low') prio = 'routine';
    if (prio === 'high') prio = 'urgent';
    if (!validPriorities.includes(prio)) prio = 'routine';

    const itemRef = p.item_ref || p.medicine_id || (p.items && p.items[0]?.medicine_id) || null;
    const qty = Number(p.quantity || (p.items && p.items[0]?.requested_qty) || (p.items && p.items[0]?.quantity) || 1);
    const itemName = p.item_name || p.medicine_name || null;
    const notes = p.notes || null;
    const reason = p.reason || 'manual';

    // Lookup district_id and state_id so request is visible to district/state/national portals
    const facRes = await client.query(
      `SELECT district_id, state_id FROM phc_facilities WHERE id = $1 LIMIT 1`,
      [phcId],
    );
    const districtId = facRes.rows[0]?.district_id || null;
    const stateId = facRes.rows[0]?.state_id || null;

    const res = await client.query(
      `INSERT INTO resource_requests (
         phc_id, district_id, state_id, request_type, item_ref, item_name, quantity,
         priority, reason, source, status, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manual', 'pending', $10)
       RETURNING id`,
      [phcId, districtId, stateId, reqType, itemRef, itemName, qty, prio, reason, notes],
    );
    return { mutation_id: mutation.id, status: 'accepted', server_entity_id: res.rows[0].id };
  }

  private static async handleFootfallMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    const validCategories = ['opd', 'emergency', 'admission', 'referral', 'disease_infectious', 'disease_chronic', 'disease_maternal', 'other'];
    let cat = (p.category || 'opd').toLowerCase();
    if (cat === 'general_opd') cat = 'opd';
    if (!validCategories.includes(cat)) cat = 'other';

    // Use 'date' column (not 'time') — patient_footfall table schema uses date type
    const footfallDate = p.date || p.time
      ? new Date(p.date || p.time).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    await client.query(
      `INSERT INTO patient_footfall (date, phc_id, category, count)
       VALUES ($1::date, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [footfallDate, phcId, cat, Number(p.count ?? 1)],
    );
    return { mutation_id: mutation.id, status: 'accepted' };
  }

  private static async handleFacilityMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    // Note: DB column is oxygen_cylinders_available, not oxygen_cylinders
    await client.query(
      `UPDATE phc_facilities
       SET total_beds = COALESCE($1, total_beds),
           occupied_beds = COALESCE($2, occupied_beds),
           emergency_beds = COALESCE($5, emergency_beds),
           isolation_beds = COALESCE($6, isolation_beds),
           oxygen_cylinders_available = COALESCE($3, oxygen_cylinders_available),
           oxygen_cylinders = COALESCE($3, oxygen_cylinders),
           oxygen_concentrators = COALESCE($7, oxygen_concentrators),
           updated_at = now()
       WHERE id = $4`,
      [
        p.total_beds ?? null,
        p.occupied_beds ?? null,
        p.oxygen_cylinders ?? p.oxygen_cylinders_available ?? null,
        phcId,
        p.emergency_beds ?? null,
        p.isolation_beds ?? null,
        p.oxygen_concentrators ?? null,
      ],
    );
    return { mutation_id: mutation.id, status: 'accepted', server_entity_id: phcId };
  }

  private static async handleAttendanceMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    // Include phc_id in insert — required column in staff_attendance table
    await client.query(
      `INSERT INTO staff_attendance (staff_id, phc_id, attendance_date, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (staff_id, attendance_date) DO UPDATE
       SET status = EXCLUDED.status`,
      [p.staff_id, phcId, p.attendance_date || new Date().toISOString().split('T')[0], p.status || 'present'],
    );
    return { mutation_id: mutation.id, status: 'accepted' };
  }

  private static async handleAlertMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    const validAlertTypes = [
      'stockout', 'near_stockout', 'bed_shortage', 'staff_shortage',
      'oxygen_critical', 'outbreak_suspected', 'abnormal_consumption',
      'redistribution_conflict', 'crisis_mode', 'emergency_report', 'forecast_risk',
    ];
    let aType = (p.alert_type || 'emergency_report').toLowerCase();
    if (!validAlertTypes.includes(aType)) aType = 'emergency_report';

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    let sev = (p.severity || 'high').toLowerCase();
    if (!validSeverities.includes(sev)) sev = 'high';

    // Lookup district_id and state_id so alert is visible to district/state/national portals
    const facRes = await client.query(
      `SELECT district_id, state_id FROM phc_facilities WHERE id = $1 LIMIT 1`,
      [phcId],
    );
    const districtId = facRes.rows[0]?.district_id || null;
    const stateId = facRes.rows[0]?.state_id || null;

    const res = await client.query(
      `INSERT INTO alerts (phc_id, district_id, state_id, alert_type, severity, status, payload)
       VALUES ($1, $2, $3, $4, $5, 'open', $6)
       RETURNING id`,
      [phcId, districtId, stateId, aType, sev, JSON.stringify(p)],
    );
    return { mutation_id: mutation.id, status: 'accepted', server_entity_id: res.rows[0].id };
  }

  private static async handleConfigMutation(
    client: PoolClient,
    phcId: string,
    mutation: MutationInput,
  ): Promise<MutationResultOutput> {
    const p = mutation.payload;
    if (Array.isArray(p.configs)) {
      for (const item of p.configs) {
        await client.query(
          `INSERT INTO system_config (key, value, updated_at)
           VALUES ($1, $2, now())
           ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = now()`,
          [item.key, JSON.stringify(item.value)],
        );
      }
    } else if (p.key) {
      await client.query(
        `INSERT INTO system_config (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = now()`,
        [p.key, JSON.stringify(p.value)],
      );
    }
    return { mutation_id: mutation.id, status: 'accepted' };
  }

  /**
   * Process a delta download request via GET /sync/pull
   */
  static async processPull(params: {
    phcId:     string;
    since:     number;
    deviceId:  string;
    limit?:    number;
  }): Promise<SyncPullResponseOutput> {
    const { phcId, since, limit = 200 } = params;

    // 1. Watermark validation / Retention window check (§8.2)
    if (since < 0) {
      const err: any = new Error('INVALID_OR_STALE_WATERMARK');
      err.statusCode = 410;
      throw err;
    }

    const seqRes = await adminPool.query(
      `SELECT COALESCE(MAX(server_seq), (SELECT last_value FROM sync_server_seq), 1)::bigint AS current_seq FROM mutation_queue`,
    );
    const currentSeq = Number(seqRes.rows[0]?.current_seq ?? 1);

    if (since > 0 && currentSeq > RETENTION_WINDOW && since < currentSeq - RETENTION_WINDOW) {
      const err: any = new Error('WATERMARK_TOO_STALE');
      err.statusCode = 410;
      throw err;
    }

    // 2. Query deltas from the database since watermark
    const deltas: DeltaOutput[] = [];

    // Redistribution approvals
    const redistRes = await adminPool.query(
      `SELECT id, source_phc_id, dest_phc_id, item_ref, item_type, quantity, status, decided_at
       FROM redistribution_transfers
       WHERE (source_phc_id = $1 OR dest_phc_id = $1)
         AND status = 'approved'
       ORDER BY decided_at DESC NULLS LAST LIMIT $2`,
      [phcId, limit],
    );
    for (const r of redistRes.rows) {
      deltas.push({
        server_seq: currentSeq,
        entity_type: 'redistribution_approval',
        operation: 'upsert',
        entity_id: r.id,
        payload: r,
        server_timestamp: r.decided_at?.toISOString() || new Date().toISOString(),
      });
    }

    // Resource request status updates
    const reqRes = await adminPool.query(
      `SELECT id, request_type, priority, status, decided_at, created_at
       FROM resource_requests
       WHERE phc_id = $1 AND status != 'pending'
       ORDER BY created_at DESC LIMIT $2`,
      [phcId, limit],
    );
    for (const r of reqRes.rows) {
      deltas.push({
        server_seq: currentSeq,
        entity_type: 'request_status_change',
        operation: 'upsert',
        entity_id: r.id,
        payload: r,
        server_timestamp: r.decided_at?.toISOString() || r.created_at?.toISOString() || new Date().toISOString(),
      });
    }

    // Active alerts
    const alertsRes = await adminPool.query(
      `SELECT id, alert_type, severity, status, payload, created_at
       FROM alerts
       WHERE phc_id = $1 AND status = 'open'
       ORDER BY created_at DESC LIMIT $2`,
      [phcId, limit],
    );
    for (const r of alertsRes.rows) {
      deltas.push({
        server_seq: currentSeq,
        entity_type: 'alert',
        operation: 'upsert',
        entity_id: r.id,
        payload: r.payload || {},
        server_timestamp: r.created_at?.toISOString() || new Date().toISOString(),
      });
    }

    // Configuration updates (facility_config_update)
    try {
      const configDeltas = await ConfigService.getConfigDeltasSince(phcId, new Date(0).toISOString());
      for (const cd of configDeltas) {
        deltas.push({
          server_seq: currentSeq,
          entity_type: 'facility_config_update' as any,
          operation: 'upsert',
          entity_id: cd.data.config_key,
          payload: cd.data,
          server_timestamp: cd.server_time || new Date().toISOString(),
        });
      }
    } catch (_) {}

    const cappedDeltas = deltas.slice(0, limit);
    const hasMore = deltas.length > limit;

    return {
      server_seq: currentSeq,
      has_more: hasMore,
      deltas: cappedDeltas,
    };
  }
}
