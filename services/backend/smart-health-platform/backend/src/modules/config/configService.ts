import { adminPool, pool, TenantClaims } from '../../db/pool';

export interface ConfigRow {
  config_key: string;
  config_value: string;
  scope: 'global' | 'state' | 'district' | 'phc';
  scope_id: string | null;
  description?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

export const DEFAULT_CONFIGS: Record<string, string> = {
  min_stock_threshold_pct:         '20',
  critical_stock_threshold_pct:    '10',
  near_expiry_days:                '90',
  bed_occupancy_alert_pct:         '85',
  oxygen_critical_threshold:       '5',
  footfall_anomaly_sigma:          '2.5',
  forecast_horizon_days:           '30',
  safety_buffer_pct:               '15',
  redistribution_max_distance_km:  '50',
  sync_batch_max_mutations:        '100',
};

export class ConfigService {
  /**
   * Hierarchical resolution: PHC -> District -> State -> Global -> Default
   */
  static async getConfig(
    key: string,
    ctx?: { phcId?: string; districtId?: string; stateId?: string },
  ): Promise<string> {
    const scopes: { scope: string; id: string | null }[] = [];

    if (ctx?.phcId) {
      scopes.push({ scope: 'phc', id: ctx.phcId });
    }
    if (ctx?.districtId) {
      scopes.push({ scope: 'district', id: ctx.districtId });
    }
    if (ctx?.stateId) {
      scopes.push({ scope: 'state', id: ctx.stateId });
    }
    scopes.push({ scope: 'global', id: null });

    for (const s of scopes) {
      const res = await adminPool.query<ConfigRow>(
        `SELECT config_key, config_value, scope, scope_id, updated_at
         FROM system_config
         WHERE config_key = $1
           AND scope = $2
           AND (scope_id = $3 OR ($3 IS NULL AND scope_id IS NULL))
         LIMIT 1`,
        [key, s.scope, s.id],
      );
      if (res.rows.length > 0 && res.rows[0].config_value !== undefined) {
        return res.rows[0].config_value;
      }
    }

    return DEFAULT_CONFIGS[key] || '';
  }

  /**
   * List all configurations matching optional scope filters
   */
  static async listConfigs(scope?: string, scopeId?: string): Promise<ConfigRow[]> {
    if (scope && scopeId) {
      const res = await adminPool.query<ConfigRow>(
        `SELECT config_key, config_value, scope, scope_id, description, updated_by, updated_at
         FROM system_config WHERE scope = $1 AND scope_id = $2
         ORDER BY config_key ASC`,
        [scope, scopeId],
      );
      return res.rows;
    } else if (scope) {
      const res = await adminPool.query<ConfigRow>(
        `SELECT config_key, config_value, scope, scope_id, description, updated_by, updated_at
         FROM system_config WHERE scope = $1
         ORDER BY config_key ASC`,
        [scope],
      );
      return res.rows;
    }

    const res = await adminPool.query<ConfigRow>(
      `SELECT config_key, config_value, scope, scope_id, description, updated_by, updated_at
       FROM system_config
       ORDER BY scope ASC, config_key ASC`,
    );
    return res.rows;
  }

  /**
   * Update or insert configuration with scope validation and audit logging
   */
  static async setConfig(
    claims: TenantClaims,
    key: string,
    value: string,
    scope: 'global' | 'state' | 'district' | 'phc' = 'global',
    scopeId: string | null = null,
    description?: string,
  ): Promise<ConfigRow> {
    // Authority validation
    if (scope === 'global' && claims.role !== 'national_admin') {
      const err = new Error('FORBIDDEN: global configuration requires national_admin');
      (err as any).statusCode = 403;
      throw err;
    }
    if (scope === 'state' && claims.role !== 'national_admin' && claims.role !== 'state_admin') {
      const err = new Error('FORBIDDEN: state configuration requires state_admin or higher');
      (err as any).statusCode = 403;
      throw err;
    }
    if (scope === 'district' && claims.role === 'phc_user') {
      const err = new Error('FORBIDDEN: district configuration requires district_admin or higher');
      (err as any).statusCode = 403;
      throw err;
    }
    if (scope === 'phc' && claims.role === 'phc_user' && claims.phcId !== scopeId) {
      const err = new Error('FORBIDDEN: PHC users can only modify their own PHC configuration');
      (err as any).statusCode = 403;
      throw err;
    }

    // Fetch previous state for audit log
    const prevRes = await adminPool.query<ConfigRow>(
      `SELECT config_value, description FROM system_config
       WHERE config_key = $1 AND scope = $2 AND (scope_id = $3 OR ($3 IS NULL AND scope_id IS NULL))`,
      [key, scope, scopeId],
    );
    const beforeState = prevRes.rows[0] ? { value: prevRes.rows[0].config_value } : null;

    // Upsert into system_config
    const upsertRes = await adminPool.query<ConfigRow>(
      `INSERT INTO system_config (config_key, config_value, scope, scope_id, description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (config_key, scope, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
       DO UPDATE SET
         config_value = EXCLUDED.config_value,
         description = COALESCE(EXCLUDED.description, system_config.description),
         updated_by = EXCLUDED.updated_by,
         updated_at = now()
       RETURNING config_key, config_value, scope, scope_id, description, updated_by, updated_at`,
      [key, value, scope, scopeId || null, description || null, claims.sub || claims.role],
    );

    const saved = upsertRes.rows[0];

    // Write to audit_log (Prompt 18 / §6.3)
    await adminPool.query(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, phc_id, district_id, state_id)
       VALUES ($1, $2, 'CONFIG_UPDATE', 'system_config', $3, $4, $5, $6, $7, $8)`,
      [
        claims.sub || '00000000-0000-0000-0000-000000000000',
        claims.role,
        key,
        JSON.stringify(beforeState),
        JSON.stringify({ value, scope, scopeId }),
        scope === 'phc' ? scopeId : null,
        scope === 'district' ? scopeId : null,
        scope === 'state' ? scopeId : null,
      ],
    ).catch(() => {});

    return saved;
  }

  /**
   * Generates facility_config_update delta records for GET /sync/pull
   */
  static async getConfigDeltasSince(phcId: string, sinceDate: string): Promise<any[]> {
    // Look up phc district and state
    const phcRes = await adminPool.query(
      `SELECT district_id, state_id FROM phc_facilities WHERE id = $1`,
      [phcId],
    );
    const districtId = phcRes.rows[0]?.district_id;
    const stateId = phcRes.rows[0]?.state_id;

    const res = await adminPool.query<ConfigRow>(
      `SELECT config_key, config_value, scope, scope_id, updated_at
       FROM system_config
       WHERE updated_at > $1
         AND (
           (scope = 'phc' AND scope_id = $2)
           OR (scope = 'district' AND scope_id = $3)
           OR (scope = 'state' AND scope_id = $4)
           OR (scope = 'global')
         )
       ORDER BY updated_at ASC`,
      [sinceDate, phcId, districtId || null, stateId || null],
    );

    return res.rows.map((row) => ({
      entity_type: 'facility_config_update',
      action: 'upsert',
      data: {
        config_key: row.config_key,
        config_value: row.config_value,
        scope: row.scope,
      },
      server_time: row.updated_at,
    }));
  }
}
