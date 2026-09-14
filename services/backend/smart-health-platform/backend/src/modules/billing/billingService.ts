import { PoolClient } from 'pg';
import { pool, withTenantContext, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';
import { InventoryService } from '../inventory/inventoryService';

export interface BillingItem {
  medicine_id: string;
  quantity: number;
  unit_price?: number;
}

export interface CheckoutInput {
  client_txn_id: string;
  patient_ref?: string;
  dispensed_by_staff_id?: string;
  items: BillingItem[];
  client_timestamp?: string;
}

export interface DispensedItemResult {
  batch_id: string;
  medicine_id: string;
  quantity_deducted: number;
  unit_price: number;
}

export interface CheckoutSuccess {
  outcome: 'success';
  transaction_id: string;
  client_txn_id: string;
  already_existed: boolean;
  total_amount: number;
  dispensed_items: DispensedItemResult[];
}

export interface StockShortfall {
  medicine_id: string;
  requested_qty: number;
  available_qty: number;
}

export interface CheckoutInsufficientStock {
  outcome: 'insufficient_stock';
  shortfalls: StockShortfall[];
}

export type CheckoutResult = CheckoutSuccess | CheckoutInsufficientStock;

export class BillingService {
  /**
   * Canonical FEFO checkout. Both REST (checkoutRest) and sync engine delegate here.
   * Architecture SS3.3.1, SS5.1: single implementation, no drift.
   *
   * Steps:
   *  1. Idempotency guard on client_txn_id
   *  2. SELECT ... FOR UPDATE SKIP LOCKED ordered expiry_date ASC per item
   *  3. Return CheckoutInsufficientStock if any item under-stocked
   *  4. INSERT billing_transactions, deduct batches in FEFO order,
   *     INSERT dispensed_items + consumption_velocity per batch slice
   *  5. Recompute threshold status per medicine, emit events
   */
  static async checkout(
    client: PoolClient,
    phcId: string,
    input: CheckoutInput,
  ): Promise<CheckoutResult> {
    const { client_txn_id, patient_ref, dispensed_by_staff_id, items, client_timestamp } = input;
    const txnTs = client_timestamp ?? new Date().toISOString();

    // 1. Idempotency guard
    const existingRes = await client.query<{ id: string; total_amount: number }>(
      `SELECT id, total_amount FROM billing_transactions
       WHERE phc_id = $1 AND client_txn_id = $2`,
      [phcId, client_txn_id],
    );
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const diRes = await client.query<DispensedItemResult>(
        `SELECT batch_id, medicine_id, quantity AS quantity_deducted, unit_price
         FROM dispensed_items WHERE billing_transaction_id = $1`,
        [existing.id],
      );
      return {
        outcome: 'success',
        transaction_id: existing.id,
        client_txn_id,
        already_existed: true,
        total_amount: Number(existing.total_amount),
        dispensed_items: diRes.rows,
      };
    }

    // 2. FEFO lock + availability scan (SKIP LOCKED prevents deadlocks on concurrent checkouts)
    interface BatchRow { id: string; remaining_qty: number; expiry_date: string; minimum_threshold: number; }
    const batchCache = new Map<string, BatchRow[]>();
    const shortfalls: StockShortfall[] = [];

    for (const item of items) {
      const batchRes = await client.query<BatchRow>(
        `SELECT id, remaining_qty, expiry_date, minimum_threshold
         FROM inventory_batches
         WHERE phc_id = $1
           AND medicine_id = $2
           AND remaining_qty > 0
           AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
         ORDER BY expiry_date ASC
         FOR UPDATE SKIP LOCKED`,
        [phcId, item.medicine_id],
      );
      const available = batchRes.rows.reduce((acc, r) => acc + Number(r.remaining_qty), 0);
      batchCache.set(item.medicine_id, batchRes.rows);
      if (available < item.quantity) {
        shortfalls.push({ medicine_id: item.medicine_id, requested_qty: item.quantity, available_qty: available });
      }
    }

    // 3. Return insufficient stock (caller maps to HTTP 409 or sync conflict shape)
    if (shortfalls.length > 0) {
      return { outcome: 'insufficient_stock', shortfalls };
    }

    // 4. Persist billing_transactions header
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * (i.unit_price ?? 0), 0);
    const txnRes = await client.query<{ id: string }>(
      `INSERT INTO billing_transactions (
         phc_id, client_txn_id, patient_ref, dispensed_by_staff_id,
         total_amount, client_timestamp, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'completed')
       RETURNING id`,
      [phcId, client_txn_id, patient_ref ?? null, dispensed_by_staff_id ?? null, totalAmount, txnTs],
    );
    const transactionId = txnRes.rows[0].id;
    const dispensedItems: DispensedItemResult[] = [];

    // 5. FEFO deduction across batches
    for (const item of items) {
      const batches = batchCache.get(item.medicine_id) ?? [];
      let needed = item.quantity;
      const unitPrice = item.unit_price ?? 0;
      for (const batch of batches) {
        if (needed <= 0) break;
        const deduct = Math.min(needed, Number(batch.remaining_qty));
        await client.query(
          `UPDATE inventory_batches SET remaining_qty = remaining_qty - $1 WHERE id = $2`,
          [deduct, batch.id],
        );
        await client.query(
          `INSERT INTO dispensed_items (billing_transaction_id, batch_id, medicine_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [transactionId, batch.id, item.medicine_id, deduct, unitPrice],
        );
        await client.query(
          `INSERT INTO consumption_velocity (time, phc_id, medicine_id, qty_dispensed)
           VALUES ($1, $2, $3, $4)`,
          [txnTs, phcId, item.medicine_id, deduct],
        );
        dispensedItems.push({ batch_id: batch.id, medicine_id: item.medicine_id, quantity_deducted: deduct, unit_price: unitPrice });
        needed -= deduct;
      }
    }

    // 6. Recompute threshold status per medicine after deduction
    const dispensedMedIds = [...new Set(items.map((i) => i.medicine_id))];
    for (const medId of dispensedMedIds) {
      const freshBatches = await client.query<{ remaining_qty: number; expiry_date: string; minimum_threshold: number }>(
        `SELECT remaining_qty, expiry_date, minimum_threshold FROM inventory_batches
         WHERE phc_id = $1 AND medicine_id = $2`,
        [phcId, medId],
      );
      const healthStatus = InventoryService.deriveStockStatus(freshBatches.rows);
      if (healthStatus === 'CRITICAL' || healthStatus === 'EXPIRED') {
        setImmediate(() => {
          eventBus.publish('stock.threshold_breached', { phc_id: phcId, medicine_id: medId, health_status: healthStatus, triggered_by: 'billing_checkout' }, 'billing-service').catch(() => {});
        });
      }
    }

    // 7. Emit billing.transaction_completed (fire-and-forget, safe after commit)
    setImmediate(() => {
      eventBus.publish(
        'billing.transaction_completed',
        { transaction_id: transactionId, phc_id: phcId, client_txn_id, patient_ref: patient_ref ?? null, total_amount: totalAmount, item_count: dispensedItems.length, dispensed_medicine_ids: dispensedMedIds },
        'billing-service',
      ).catch(() => {});
    });

    return { outcome: 'success', transaction_id: transactionId, client_txn_id, already_existed: false, total_amount: totalAmount, dispensed_items: dispensedItems };
  }

  /** REST wrapper: manages its own BEGIN/COMMIT around checkout(). */
  static async checkoutRest(phcId: string, input: CheckoutInput): Promise<CheckoutResult> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [phcId]);
      const result = await BillingService.checkout(client, phcId, input);
      if (result.outcome === 'success') {
        await client.query('COMMIT');
      } else {
        await client.query('ROLLBACK');
      }
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** List billing history for a PHC (most-recent first, capped at 500). */
  static async listTransactions(phcId: string, claims: TenantClaims): Promise<{ transactions: any[] }> {
    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `SELECT id, client_txn_id, patient_ref, dispensed_by_staff_id,
                total_amount, client_timestamp, server_timestamp, status
         FROM billing_transactions
         WHERE phc_id = $1
         ORDER BY server_timestamp DESC LIMIT 500`,
        [phcId],
      );
      return { transactions: res.rows };
    });
  }

  /** Full detail for one transaction (header + dispensed_items). */
  static async getTransactionDetails(phcId: string, transactionId: string, claims: TenantClaims): Promise<any> {
    return withTenantContext(claims, async (client) => {
      const txnRes = await client.query(
        `SELECT id, client_txn_id, patient_ref, dispensed_by_staff_id,
                total_amount, client_timestamp, server_timestamp, status
         FROM billing_transactions WHERE id = $1 AND phc_id = $2`,
        [transactionId, phcId],
      );
      if (txnRes.rows.length === 0) {
        const err: any = new Error('TRANSACTION_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }
      const diRes = await client.query(
        `SELECT di.id, di.batch_id, di.medicine_id, m.name AS medicine_name,
                di.quantity, di.unit_price
         FROM dispensed_items di
         JOIN medicines m ON m.id = di.medicine_id
         WHERE di.billing_transaction_id = $1`,
        [transactionId],
      );
      return { transaction: txnRes.rows[0], dispensed_items: diRes.rows };
    });
  }
}