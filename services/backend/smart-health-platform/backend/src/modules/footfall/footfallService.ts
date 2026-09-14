import { withTenantContext, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';

export interface FootfallRecord {
  time: string;
  phc_id: string;
  category: string;
  count: number;
}

export interface FootfallInput {
  time?: string;
  category: string;
  count: number;
}

export interface FootfallAdjustmentInput {
  original_date: string;
  category: string;
  count_adjustment: number;
  reason: string;
}

export class FootfallService {
  private static VALID_CATEGORIES = [
    'opd',
    'emergency',
    'admission',
    'referral',
    'disease_infectious',
    'disease_chronic',
    'disease_maternal',
    'other',
  ];

  static normalizeCategory(raw: string): string {
    const c = (raw || 'opd').toLowerCase().trim();
    if (c === 'general_opd') return 'opd';
    if (c === 'maternal_child') return 'disease_maternal';
    if (c === 'chronic_followup') return 'disease_chronic';
    if (c === 'infectious') return 'disease_infectious';
    if (this.VALID_CATEGORIES.includes(c)) return c;
    return 'other';
  }

  static async recordFootfall(
    claims: TenantClaims,
    phcId: string,
    input: FootfallInput,
  ): Promise<FootfallRecord> {
    if (input.count < 0) {
      const err: any = new Error('Count must be non-negative.');
      err.statusCode = 400;
      throw err;
    }

    const category = this.normalizeCategory(input.category);
    const time = input.time || new Date().toISOString();

    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `INSERT INTO patient_footfall (time, phc_id, category, count)
         VALUES ($1, $2, $3, $4)
         RETURNING time, phc_id, category, count`,
        [time, phcId, category, input.count],
      );

      const record = res.rows[0];

      setImmediate(() => {
        eventBus.publish('footfall.updated', {
          phc_id: phcId,
          time,
          category,
          count: input.count,
        }, 'footfall-service').catch(() => {});
      });

      return record;
    });
  }

  static async recordAdjustment(
    claims: TenantClaims,
    phcId: string,
    input: FootfallAdjustmentInput,
  ): Promise<{ adjustment_record: FootfallRecord; note: string }> {
    if (!input.reason || input.reason.trim().length === 0) {
      const err: any = new Error('Reason is required when submitting a footfall adjustment.');
      err.statusCode = 400;
      throw err;
    }

    const category = this.normalizeCategory(input.category);
    const time = new Date().toISOString();
    const count = Math.max(0, input.count_adjustment);

    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `INSERT INTO patient_footfall (time, phc_id, category, count)
         VALUES ($1, $2, $3, $4)
         RETURNING time, phc_id, category, count`,
        [time, phcId, category, count],
      );

      const record = res.rows[0];
      const note = `Correction for ${input.original_date} (${category}): adjusted to ${count}. Reason: ${input.reason}`;

      setImmediate(() => {
        eventBus.publish('footfall.updated', {
          phc_id: phcId,
          time,
          category,
          count,
          adjustment_note: note,
        }, 'footfall-service').catch(() => {});
      });

      return {
        adjustment_record: record,
        note,
      };
    });
  }

  static async getFootfall(
    claims: TenantClaims,
    phcId: string,
    options: { startDate?: string; endDate?: string; category?: string; limit?: number } = {},
  ): Promise<{ count: number; data: FootfallRecord[] }> {
    return withTenantContext(claims, async (client) => {
      let query = `SELECT time, phc_id, category, count FROM patient_footfall WHERE phc_id = $1`;
      const params: any[] = [phcId];

      if (options.startDate) {
        params.push(options.startDate);
        query += ` AND time >= $${params.length}`;
      }
      if (options.endDate) {
        params.push(options.endDate);
        query += ` AND time <= $${params.length}`;
      }
      if (options.category) {
        params.push(this.normalizeCategory(options.category));
        query += ` AND category = $${params.length}`;
      }

      query += ` ORDER BY time DESC LIMIT $${params.length + 1}`;
      params.push(options.limit || 200);

      const res = await client.query(query, params);
      return { count: res.rows.length, data: res.rows };
    });
  }
}
