import { PoolClient } from 'pg';
import { withTenantContext, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';

export interface AutoDraftResult {
  request_id?: string;
  phc_id: string;
  medicine_id: string;
  recommended_quantity: number;
  priority: 'routine' | 'urgent' | 'critical';
  reason: 'auto_velocity' | 'threshold_breach';
  action_taken: 'draft_created' | 'draft_updated' | 'adequate_stock';
  current_stock: number;
  projected_need: number;
}

export class AutoDraftService {
  static async evaluateForMedicine(
    client: PoolClient,
    phcId: string,
    medicineId: string,
    options: {
      forecastHorizonDays?: number;
      safetyBufferPct?: number;
      reasonOverride?: 'auto_velocity' | 'threshold_breach';
    } = {},
  ): Promise<AutoDraftResult> {
    const horizonDays = options.forecastHorizonDays ?? 14;
    const safetyBuffer = options.safetyBufferPct ?? 0.20;

    const stockRes = await client.query<{ total_remaining: string; min_thresh: string }>(
      `SELECT 
         COALESCE(SUM(remaining_qty), 0) AS total_remaining,
         COALESCE(MIN(minimum_threshold), 10) AS min_thresh
       FROM inventory_batches
       WHERE phc_id = $1 AND medicine_id = $2`,
      [phcId, medicineId],
    );
    const currentStock = Number(stockRes.rows[0]?.total_remaining ?? 0);
    const minThresh = Number(stockRes.rows[0]?.min_thresh ?? 10);

    const histRes = await client.query<{ total_consumed: string }>(
      `SELECT COALESCE(SUM(qty_dispensed), 0) AS total_consumed
       FROM consumption_velocity
       WHERE phc_id = $1 AND medicine_id = $2
         AND time >= now() - INTERVAL '14 days'`,
      [phcId, medicineId],
    );
    const totalConsumed = Number(histRes.rows[0]?.total_consumed ?? 0);
    const dailyAvg = Math.max(totalConsumed / 14, 1);

    const projectedNeed = Math.ceil(dailyAvg * horizonDays * (1 + safetyBuffer));
    const shortfall = projectedNeed - currentStock;

    if (shortfall <= 0 && currentStock >= minThresh) {
      return {
        phc_id: phcId,
        medicine_id: medicineId,
        recommended_quantity: 0,
        priority: 'routine',
        reason: 'auto_velocity',
        action_taken: 'adequate_stock',
        current_stock: currentStock,
        projected_need: projectedNeed,
      };
    }

    const recommendedQuantity = Math.max(shortfall, minThresh);

    let priority: 'routine' | 'urgent' | 'critical' = 'routine';
    if (currentStock === 0) {
      priority = 'critical';
    } else if (currentStock < minThresh) {
      priority = 'urgent';
    }

    const reason: 'auto_velocity' | 'threshold_breach' =
      options.reasonOverride || (currentStock < minThresh ? 'threshold_breach' : 'auto_velocity');

    const existingReq = await client.query<{ id: string; quantity: number }>(
      `SELECT id, quantity FROM resource_requests
       WHERE phc_id = $1 AND item_ref = $2 AND source = 'auto_draft' AND status = 'pending'`,
      [phcId, medicineId],
    );

    let requestId: string;
    let actionTaken: 'draft_created' | 'draft_updated';

    if (existingReq.rows.length > 0) {
      requestId = existingReq.rows[0].id;
      await client.query(
        `UPDATE resource_requests
         SET quantity = $1, priority = $2, reason = $3
         WHERE id = $4`,
        [recommendedQuantity, priority, reason, requestId],
      );
      actionTaken = 'draft_updated';
    } else {
      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO resource_requests (
           phc_id, request_type, item_ref, quantity, priority, reason, source, status
         ) VALUES ($1, 'medicine', $2, $3, $4, $5, 'auto_draft', 'pending')
         RETURNING id`,
        [phcId, medicineId, recommendedQuantity, priority, reason],
      );
      requestId = insertRes.rows[0].id;
      actionTaken = 'draft_created';

      setImmediate(() => {
        eventBus.publish('request.created', {
          request_id: requestId,
          phc_id: phcId,
          item_ref: medicineId,
          quantity: recommendedQuantity,
          priority,
          source: 'auto_draft',
          status: 'pending',
        }, 'auto-draft-service').catch(() => {});
      });
    }

    return {
      request_id: requestId,
      phc_id: phcId,
      medicine_id: medicineId,
      recommended_quantity: recommendedQuantity,
      priority,
      reason,
      action_taken: actionTaken,
      current_stock: currentStock,
      projected_need: projectedNeed,
    };
  }

  static async evaluateStandalone(
    claims: TenantClaims,
    phcId: string,
    medicineId: string,
    options: {
      forecastHorizonDays?: number;
      safetyBufferPct?: number;
      reasonOverride?: 'auto_velocity' | 'threshold_breach';
    } = {},
  ): Promise<AutoDraftResult> {
    return withTenantContext(claims, async (client) => {
      return this.evaluateForMedicine(client, phcId, medicineId, options);
    });
  }

  static async evaluateAllMedicines(claims: TenantClaims, phcId: string): Promise<AutoDraftResult[]> {
    return withTenantContext(claims, async (client) => {
      const medRes = await client.query<{ medicine_id: string }>(
        `SELECT DISTINCT medicine_id FROM inventory_batches WHERE phc_id = $1`,
        [phcId],
      );
      const results: AutoDraftResult[] = [];
      for (const row of medRes.rows) {
        const r = await this.evaluateForMedicine(client, phcId, row.medicine_id);
        results.push(r);
      }
      return results;
    });
  }
}

eventBus.subscribe('stock.threshold_breached', async (event) => {
  const { phc_id, medicine_id } = event.payload || {};
  if (!phc_id || !medicine_id) return;
  try {
    const adminClaims: TenantClaims = {
      role: 'national_admin',
      sub: 'system-event-bus',
    };
    await AutoDraftService.evaluateStandalone(adminClaims, phc_id, medicine_id, {
      reasonOverride: 'threshold_breach',
    });
  } catch (err: any) {
    console.error('[AutoDraftService] Failed auto-draft on threshold breach:', err?.message || err);
  }
});
