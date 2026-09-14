import { PoolClient } from 'pg';
import { withTenantContext, TenantClaims } from '../../db/pool';

export interface ConsumptionVelocityRecord {
  time: string;
  phc_id: string;
  medicine_id: string;
  qty_dispensed: number;
}

export interface VelocityStats {
  phc_id: string;
  medicine_id: string;
  total_consumed: number;
  days_window: number;
  daily_average: number;
  velocity_trend: 'stable' | 'accelerating' | 'decelerating';
}

export class VelocityService {
  static async recordConsumption(
    client: PoolClient,
    phcId: string,
    medicineId: string,
    qtyDispensed: number,
    time: string = new Date().toISOString(),
  ): Promise<void> {
    if (qtyDispensed <= 0) return;
    await client.query(
      `INSERT INTO consumption_velocity (time, phc_id, medicine_id, qty_dispensed)
       VALUES ($1, $2, $3, $4)`,
      [time, phcId, medicineId, qtyDispensed],
    );
  }

  static async getVelocityStats(
    claims: TenantClaims,
    phcId: string,
    medicineId: string,
    daysWindow: number = 14,
  ): Promise<VelocityStats> {
    return withTenantContext(claims, async (client) => {
      const res = await client.query<{ total: string; recent_total: string }>(
        `SELECT 
           COALESCE(SUM(qty_dispensed), 0) AS total,
           COALESCE(SUM(CASE WHEN time >= now() - ($1::text || ' days')::interval / 2 THEN qty_dispensed ELSE 0 END), 0) AS recent_total
         FROM consumption_velocity
         WHERE phc_id = $2 AND medicine_id = $3
           AND time >= now() - ($1::text || ' days')::interval`,
        [daysWindow, phcId, medicineId],
      );

      const total = Number(res.rows[0]?.total ?? 0);
      const recentTotal = Number(res.rows[0]?.recent_total ?? 0);
      const dailyAvg = Number((total / Math.max(daysWindow, 1)).toFixed(2));

      const priorHalf = total - recentTotal;
      let trend: 'stable' | 'accelerating' | 'decelerating' = 'stable';
      if (recentTotal > priorHalf * 1.25 && total > 5) {
        trend = 'accelerating';
      } else if (recentTotal < priorHalf * 0.75 && total > 5) {
        trend = 'decelerating';
      }

      return {
        phc_id: phcId,
        medicine_id: medicineId,
        total_consumed: total,
        days_window: daysWindow,
        daily_average: dailyAvg,
        velocity_trend: trend,
      };
    });
  }

  static async getConsumptionHistory(
    claims: TenantClaims,
    phcId: string,
    medicineId?: string,
    limit: number = 100,
  ): Promise<ConsumptionVelocityRecord[]> {
    return withTenantContext(claims, async (client) => {
      let query = `SELECT time, phc_id, medicine_id, qty_dispensed FROM consumption_velocity WHERE phc_id = $1`;
      const params: any[] = [phcId];
      if (medicineId) {
        params.push(medicineId);
        query += ` AND medicine_id = $2`;
      }
      query += ` ORDER BY time DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await client.query(query, params);
      return res.rows;
    });
  }
}
