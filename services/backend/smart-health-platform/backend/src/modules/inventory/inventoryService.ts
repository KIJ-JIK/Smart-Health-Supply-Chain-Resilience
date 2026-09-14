import { pool, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';

export type StockHealthStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED' | 'NEAR_EXPIRY';

export interface MedicineRecord {
  id:       string;
  name:     string;
  category: string;
  unit:     string;
}

export interface InventoryBatchRecord {
  id:                string;
  phc_id:            string;
  medicine_id:       string;
  medicine_name?:    string;
  batch_no:          string;
  received_qty:      number;
  remaining_qty:     number;
  minimum_threshold: number;
  expiry_date:       string;
  received_at:       string;
  status?:           StockHealthStatus;
}

export interface PhcMedicineStockSummary {
  medicine_id:       string;
  medicine_name:     string;
  category:          string;
  unit:              string;
  total_remaining:   number;
  minimum_threshold: number;
  health_status:     StockHealthStatus;
  batches:           InventoryBatchRecord[];
}

export class InventoryService {
  /**
   * Derive stock health status dynamically (Masterplan §12).
   * Computed live, never stored as a database column.
   */
  static deriveStockStatus(batches: { remaining_qty: number; expiry_date: string; minimum_threshold: number }[]): StockHealthStatus {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const totalRemaining = batches.reduce((acc, b) => acc + Number(b.remaining_qty || 0), 0);
    const minThreshold = batches.length > 0 ? Math.max(...batches.map((b) => Number(b.minimum_threshold || 0))) : 10;

    // Check for expired batches with stock remaining
    const hasExpiredWithStock = batches.some((b) => b.remaining_qty > 0 && b.expiry_date < today);
    if (hasExpiredWithStock) {
      return 'EXPIRED';
    }

    // Check for stockout or critical shortage (< 20% of min threshold)
    if (totalRemaining <= 0 || totalRemaining < minThreshold * 0.2) {
      return 'CRITICAL';
    }

    // Check for batches expiring within 30 days
    const hasNearExpiry = batches.some((b) => b.remaining_qty > 0 && b.expiry_date >= today && b.expiry_date <= thirtyDaysAhead);
    if (hasNearExpiry) {
      return 'NEAR_EXPIRY';
    }

    // Check if below threshold
    if (totalRemaining <= minThreshold) {
      return 'WARNING';
    }

    return 'NORMAL';
  }

  // ---------------------------------------------------------------------------
  // Medicines Master
  // ---------------------------------------------------------------------------

  static async listMedicines(category?: string): Promise<MedicineRecord[]> {
    const client = await pool.connect();
    try {
      let sql = `SELECT id, name, category, unit FROM medicines`;
      const params: any[] = [];
      if (category) {
        sql += ` WHERE category = $1`;
        params.push(category);
      }
      sql += ` ORDER BY name ASC`;
      const res = await client.query(sql, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  static async getMedicine(id: string): Promise<MedicineRecord> {
    const client = await pool.connect();
    try {
      const res = await client.query(`SELECT id, name, category, unit FROM medicines WHERE id = $1`, [id]);
      if (res.rowCount === 0) {
        const err: any = new Error('MEDICINE_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  static async createMedicine(data: { name: string; category?: string; unit?: string }): Promise<MedicineRecord> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO medicines (name, category, unit) VALUES ($1, $2, $3) RETURNING id, name, category, unit`,
        [data.name, data.category || 'General', data.unit || 'strip'],
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Inventory Batches & Live Stock Summary
  // ---------------------------------------------------------------------------

  /**
   * Get all batches and per-medicine live derived health status for a PHC (RLS enforced)
   */
  static async getPhcInventory(phcId: string, claims?: TenantClaims): Promise<PhcMedicineStockSummary[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      const res = await client.query(
        `SELECT b.id, b.phc_id, b.medicine_id, m.name AS medicine_name, m.category, m.unit,
                b.batch_no, b.received_qty, b.remaining_qty, b.minimum_threshold,
                b.expiry_date, b.received_at
         FROM inventory_batches b
         JOIN medicines m ON m.id = b.medicine_id
         WHERE b.phc_id = $1
         ORDER BY m.name ASC, b.expiry_date ASC`,
        [phcId],
      );

      await client.query('COMMIT');

      // Group batches by medicine
      const grouped = new Map<string, {
        medicine: { id: string; name: string; category: string; unit: string };
        batches: InventoryBatchRecord[];
      }>();

      for (const r of res.rows) {
        if (!grouped.has(r.medicine_id)) {
          grouped.set(r.medicine_id, {
            medicine: { id: r.medicine_id, name: r.medicine_name, category: r.category, unit: r.unit },
            batches: [],
          });
        }
        grouped.get(r.medicine_id)!.batches.push({
          id:                r.id,
          phc_id:            r.phc_id,
          medicine_id:       r.medicine_id,
          medicine_name:     r.medicine_name,
          batch_no:          r.batch_no,
          received_qty:      Number(r.received_qty),
          remaining_qty:     Number(r.remaining_qty),
          minimum_threshold: Number(r.minimum_threshold),
          expiry_date:       r.expiry_date?.toISOString?.().split('T')[0] || r.expiry_date,
          received_at:       r.received_at?.toISOString?.() || r.received_at,
        });
      }

      const result: PhcMedicineStockSummary[] = [];
      for (const [medId, data] of grouped.entries()) {
        const totalRemaining = data.batches.reduce((acc, b) => acc + b.remaining_qty, 0);
        const minThreshold = data.batches.length > 0 ? Math.max(...data.batches.map((b) => b.minimum_threshold)) : 10;
        const healthStatus = this.deriveStockStatus(data.batches);

        result.push({
          medicine_id:       medId,
          medicine_name:     data.medicine.name,
          category:          data.medicine.category,
          unit:              data.medicine.unit,
          total_remaining:   totalRemaining,
          minimum_threshold: minThreshold,
          health_status:     healthStatus,
          batches:           data.batches,
        });
      }

      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Receive a new batch of medicine into PHC inventory
   */
  static async receiveStock(
    phcId: string,
    data: {
      medicine_id:       string;
      batch_no:          string;
      quantity:          number;
      expiry_date:       string;
      minimum_threshold?: number;
    },
    claims?: TenantClaims,
  ): Promise<InventoryBatchRecord> {
    if (claims?.role === 'phc_user' && claims.phcId !== phcId) {
      const err: any = new Error('FORBIDDEN_PHC_ACCESS');
      err.statusCode = 403;
      throw err;
    }

    if (!data.medicine_id || !data.batch_no || !data.quantity || !data.expiry_date) {
      const err: any = new Error('MISSING_STOCK_RECEIVE_FIELDS');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      const res = await client.query(
        `INSERT INTO inventory_batches (
           phc_id, medicine_id, batch_no, received_qty, remaining_qty, minimum_threshold, expiry_date
         ) VALUES ($1, $2, $3, $4, $4, $5, $6)
         ON CONFLICT (phc_id, medicine_id, batch_no) DO UPDATE
         SET received_qty = inventory_batches.received_qty + EXCLUDED.received_qty,
             remaining_qty = inventory_batches.remaining_qty + EXCLUDED.remaining_qty,
             expiry_date = EXCLUDED.expiry_date
         RETURNING id, phc_id, medicine_id, batch_no, received_qty, remaining_qty, minimum_threshold, expiry_date, received_at`,
        [
          phcId,
          data.medicine_id,
          data.batch_no,
          data.quantity,
          data.minimum_threshold || 10,
          data.expiry_date,
        ],
      );

      await client.query('COMMIT');
      const r = res.rows[0];

      await eventBus.publish('stock.received', {
        phcId,
        medicine_id: r.medicine_id,
        batch_id: r.id,
        batch_no: r.batch_no,
        quantity: data.quantity,
        remaining_qty: Number(r.remaining_qty),
        expiry_date: r.expiry_date,
      });

      return {
        id:                r.id,
        phc_id:            r.phc_id,
        medicine_id:       r.medicine_id,
        batch_no:          r.batch_no,
        received_qty:      Number(r.received_qty),
        remaining_qty:     Number(r.remaining_qty),
        minimum_threshold: Number(r.minimum_threshold),
        expiry_date:       r.expiry_date?.toISOString?.().split('T')[0] || r.expiry_date,
        received_at:       r.received_at?.toISOString?.() || r.received_at,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Adjust stock for an inventory batch (Prompt 8 & Masterplan §9).
   * Invariant: Requires mandatory reason, user_id, previous_qty, and new_qty.
   * Emits stock.adjusted, and emits stock.threshold_breached if remaining_qty < minimum_threshold.
   */
  static async adjustStock(
    phcId: string,
    batchId: string,
    adjustData: {
      reason:           string;  // MANDATORY per Masterplan §9
      quantity_delta?:  number;  // e.g. -5 or +10
      new_quantity?:    number;  // e.g. 15
      device_id?:       string;
      user_id?:         string;
    },
    claims?: TenantClaims,
  ) {
    if (claims?.role === 'phc_user' && claims.phcId !== phcId) {
      const err: any = new Error('FORBIDDEN_PHC_ACCESS');
      err.statusCode = 403;
      throw err;
    }

    // Strict validation: Reason is mandatory!
    if (!adjustData.reason || !adjustData.reason.trim()) {
      const err: any = new Error('REASON_REQUIRED');
      err.statusCode = 400;
      err.message = 'Stock adjustment rejected: mandatory audit reason is missing.';
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      // Lock batch row
      const batchRes = await client.query(
        `SELECT id, phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date
         FROM inventory_batches
         WHERE id = $1 AND phc_id = $2
         FOR UPDATE`,
        [batchId, phcId],
      );

      if (batchRes.rowCount === 0) {
        const err: any = new Error('BATCH_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }

      const batch = batchRes.rows[0];
      const prevQty = Number(batch.remaining_qty);

      let targetQty: number;
      let deltaQty: number;

      if (adjustData.new_quantity !== undefined) {
        targetQty = Math.max(0, Number(adjustData.new_quantity));
        deltaQty = targetQty - prevQty;
      } else if (adjustData.quantity_delta !== undefined) {
        deltaQty = Number(adjustData.quantity_delta);
        targetQty = Math.max(0, prevQty + deltaQty);
      } else {
        const err: any = new Error('QUANTITY_OR_DELTA_REQUIRED');
        err.statusCode = 400;
        throw err;
      }

      // Update remaining quantity on batch
      await client.query(
        `UPDATE inventory_batches
         SET remaining_qty = $1
         WHERE id = $2`,
        [targetQty, batchId],
      );

      // Record audit in stock_adjustments table
      const userId = adjustData.user_id || claims?.sub || null;
      const deviceId = adjustData.device_id || null;

      const auditRes = await client.query(
        `INSERT INTO stock_adjustments (
           phc_id, batch_id, medicine_id, previous_qty, new_qty, adjustment_qty, reason, user_id, device_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, recorded_at`,
        [
          phcId,
          batchId,
          batch.medicine_id,
          prevQty,
          targetQty,
          deltaQty,
          adjustData.reason.trim(),
          userId,
          deviceId,
        ],
      );

      await client.query('COMMIT');

      // Emit domain events
      await eventBus.publish('stock.adjusted', {
        adjustmentId: auditRes.rows[0].id,
        phcId,
        batchId,
        medicine_id: batch.medicine_id,
        previous_qty: prevQty,
        new_qty: targetQty,
        adjustment_qty: deltaQty,
        reason: adjustData.reason.trim(),
        user_id: userId,
        recorded_at: auditRes.rows[0].recorded_at,
      });

      // Threshold breach detection: if drop below minimum_threshold
      const minThreshold = Number(batch.minimum_threshold);
      if (targetQty < minThreshold) {
        await eventBus.publish('stock.threshold_breached', {
          phcId,
          medicine_id: batch.medicine_id,
          batchId,
          remaining_qty: targetQty,
          minimum_threshold: minThreshold,
          breached_at: new Date().toISOString(),
        });
      }

      return {
        adjustment_id: auditRes.rows[0].id,
        batch_id:      batchId,
        medicine_id:   batch.medicine_id,
        previous_qty:  prevQty,
        new_qty:       targetQty,
        adjustment_qty: deltaQty,
        reason:        adjustData.reason.trim(),
        recorded_at:   auditRes.rows[0].recorded_at,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}
