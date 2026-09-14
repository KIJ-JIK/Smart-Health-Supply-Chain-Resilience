import { withTenantContext, TenantClaims } from '../../db/pool';
import { eventBus, DomainEvent } from '../../events/eventBus';

// ---------------------------------------------------------------------------
// Risk-scoring weights (configurable via system_config in Chunk 13).
// Defaults here; production values come from DB.
// ---------------------------------------------------------------------------
export interface RiskWeights {
  shortage_risk: number;         // 0–1
  consumption_acceleration: number; // 0–1
  emergency_severity: number;    // 0–1
}

const DEFAULT_WEIGHTS: RiskWeights = {
  shortage_risk:              0.50,
  consumption_acceleration:   0.30,
  emergency_severity:         0.20,
};

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AlertRecord {
  id: string;
  phc_id?: string;
  district_id?: string;
  state_id?: string;
  alert_type: string;
  severity: RiskLevel;
  status: 'open' | 'acknowledged' | 'resolved';
  payload: Record<string, any>;
  risk_score: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// AlertsService
// ---------------------------------------------------------------------------
export class AlertsService {
  // ── Risk scoring ───────────────────────────────────────────────────────────

  static computeRiskScore(
    shortageRisk: number,
    consumptionAcceleration: number,
    emergencySeverity: number,
    weights: RiskWeights = DEFAULT_WEIGHTS,
  ): number {
    const raw =
      shortageRisk * weights.shortage_risk +
      consumptionAcceleration * weights.consumption_acceleration +
      emergencySeverity * weights.emergency_severity;
    return Math.min(1, Math.max(0, parseFloat(raw.toFixed(4))));
  }

  static scoreToLevel(score: number): RiskLevel {
    if (score >= 0.75) return 'CRITICAL';
    if (score >= 0.50) return 'HIGH';
    if (score >= 0.25) return 'MODERATE';
    return 'LOW';
  }

  // ── Alert creation ─────────────────────────────────────────────────────────

  static async createAlert(opts: {
    phc_id?: string;
    district_id?: string;
    state_id?: string;
    alert_type: string;
    severity: RiskLevel;
    payload: Record<string, any>;
    risk_score: number;
  }): Promise<AlertRecord> {
    // Use admin pool for background event-driven writes (no tenant context needed)
    const { adminPool } = await import('../../db/pool');
    const res = await adminPool.query(
      `INSERT INTO alerts (phc_id, district_id, state_id, alert_type, severity, payload, status, risk_score)
       VALUES ($1, $2, $3, $4, $5::text, $6, 'open', $7)
       RETURNING id, phc_id, district_id, state_id, alert_type, severity,
                 status, payload, risk_score, created_at`,
      [
        opts.phc_id    || null,
        opts.district_id || null,
        opts.state_id  || null,
        opts.alert_type,
        opts.severity.toLowerCase(),
        JSON.stringify(opts.payload),
        opts.risk_score,
      ],
    );
    const row = res.rows[0];
    eventBus.publish('alert.created', row, 'alerts-service').catch(() => {});
    return row;
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  static async listAlerts(
    claims: TenantClaims,
    filter?: { severity?: string; status?: string; phc_id?: string; limit?: number },
  ): Promise<AlertRecord[]> {
    return withTenantContext(claims, async (client) => {
      const limit = filter?.limit || 200;
      const params: any[] = [];
      const clauses: string[] = [];

      if (filter?.severity) {
        params.push(filter.severity.toLowerCase());
        clauses.push(`severity = $${params.length}`);
      }
      if (filter?.status) {
        params.push(filter.status);
        clauses.push(`status = $${params.length}`);
      }
      if (filter?.phc_id) {
        params.push(filter.phc_id);
        clauses.push(`phc_id = $${params.length}`);
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      params.push(limit);

      const res = await client.query(
        `SELECT id, phc_id, district_id, state_id, alert_type, severity,
                status, payload, risk_score, created_at
         FROM alerts
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length}`,
        params,
      );
      return res.rows;
    });
  }

  static async acknowledgeAlert(
    claims: TenantClaims,
    alertId: string,
  ): Promise<AlertRecord> {
    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `UPDATE alerts SET status = 'acknowledged'
         WHERE id = $1
         RETURNING id, phc_id, district_id, state_id, alert_type, severity,
                   status, payload, risk_score, created_at`,
        [alertId],
      );
      if (res.rows.length === 0) {
        const err = new Error('ALERT_NOT_FOUND');
        (err as any).statusCode = 404;
        throw err;
      }
      return res.rows[0];
    });
  }

  // ── Event consumers ────────────────────────────────────────────────────────

  /**
   * Wire up all event-bus subscriptions.
   * Called once at server start from index.ts.
   */
  static registerEventConsumers(): void {
    // 1. Stock threshold breached ─────────────────────────────────────────────
    eventBus.subscribe('stock.threshold_breached', async (event: DomainEvent) => {
      const p = event.payload;
      const shortageRisk = p.remaining_qty !== undefined && p.minimum_threshold !== undefined
        ? 1 - Math.min(1, p.remaining_qty / Math.max(1, p.minimum_threshold))
        : 0.7;
      const score = AlertsService.computeRiskScore(shortageRisk, 0, 0);
      const level = AlertsService.scoreToLevel(score);

      await AlertsService.createAlert({
        phc_id:      p.phc_id,
        district_id: p.district_id,
        alert_type:  'stock_threshold_breached',
        severity:    level,
        risk_score:  score,
        payload:     p,
      }).catch((e) => console.error('[alerts] stock_threshold_breached write failed', e));
    });

    // 2. Bed occupancy threshold ──────────────────────────────────────────────
    eventBus.subscribe('bed.updated', async (event: DomainEvent) => {
      const p = event.payload;
      const occupancy = p.total_beds > 0 ? p.occupied_beds / p.total_beds : 0;
      if (occupancy < 0.85) return; // Only alert when >= 85%
      const score = AlertsService.computeRiskScore(occupancy, 0, 0);
      const level = AlertsService.scoreToLevel(score);

      await AlertsService.createAlert({
        phc_id:     p.phc_id,
        alert_type: 'bed_occupancy_high',
        severity:   level,
        risk_score: score,
        payload:    { ...p, occupancy_pct: parseFloat((occupancy * 100).toFixed(1)) },
      }).catch((e) => console.error('[alerts] bed_occupancy write failed', e));
    });

    // 3. Oxygen threshold ─────────────────────────────────────────────────────
    eventBus.subscribe('oxygen.updated', async (event: DomainEvent) => {
      const p = event.payload;
      const cylLeft = p.oxygen_cylinders || 0;
      if (cylLeft > 5) return; // Only alert when dangerously low
      const shortageRisk = Math.max(0, 1 - cylLeft / 5);
      const score = AlertsService.computeRiskScore(shortageRisk, 0, 0);
      const level = AlertsService.scoreToLevel(score);

      await AlertsService.createAlert({
        phc_id:     p.phc_id,
        alert_type: 'oxygen_critical_low',
        severity:   level,
        risk_score: score,
        payload:    p,
      }).catch((e) => console.error('[alerts] oxygen write failed', e));
    });

    // 4. Staff shortage ───────────────────────────────────────────────────────
    eventBus.subscribe('staff.shortage_detected', async (event: DomainEvent) => {
      const p = event.payload;
      const score = AlertsService.computeRiskScore(0.6, 0, 0.3);
      const level = AlertsService.scoreToLevel(score);

      await AlertsService.createAlert({
        phc_id:      p.phc_id,
        district_id: p.district_id,
        alert_type:  'staff_shortage',
        severity:    level,
        risk_score:  score,
        payload:     p,
      }).catch((e) => console.error('[alerts] staff_shortage write failed', e));
    });

    // 5. Emergency created — already at CRITICAL, no re-scoring needed ────────
    eventBus.subscribe('emergency.created', async (event: DomainEvent) => {
      // emergency.created already writes to alerts table in RequestService.reportEmergency.
      // Here we broadcast to SSE only (no duplicate DB write).
      AlertsSseManager.broadcast(event.payload);
    });

    // 6. Broadcast all new alerts to SSE clients ───────────────────────────────
    eventBus.subscribe('alert.created', async (event: DomainEvent) => {
      AlertsSseManager.broadcast(event.payload);
    });
  }
}

// ---------------------------------------------------------------------------
// SSE Client Manager
// Maintains a registry of connected SSE Response objects and fans-out alerts.
// ---------------------------------------------------------------------------
import { Response as ExpressResponse } from 'express';

export class AlertsSseManager {
  private static clients: Map<string, ExpressResponse> = new Map();

  static add(id: string, res: ExpressResponse): void {
    this.clients.set(id, res);
    console.log(`[SSE] client connected: ${id} (total: ${this.clients.size})`);
  }

  static remove(id: string): void {
    this.clients.delete(id);
    console.log(`[SSE] client disconnected: ${id} (total: ${this.clients.size})`);
  }

  static broadcast(data: any): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const [id, res] of this.clients) {
      try {
        res.write(payload);
      } catch {
        this.remove(id);
      }
    }
  }

  static count(): number {
    return this.clients.size;
  }
}
