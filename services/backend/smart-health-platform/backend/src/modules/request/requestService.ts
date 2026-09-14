import { withTenantContext, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'rejected';

export type RequestType = 'medicine' | 'oxygen' | 'bed' | 'staff' | 'equipment';
export type RequestPriority = 'routine' | 'urgent' | 'critical';

export interface ResourceRequestItem {
  id: string;
  phc_id: string;
  request_type: RequestType;
  item_ref?: string;
  quantity: number;
  priority: RequestPriority;
  reason?: string;
  source: 'manual' | 'auto_draft';
  status: RequestStatus;
  created_at: string;
  decided_at?: string;
  decided_by?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// State-machine: valid transitions
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending:    ['approved', 'rejected'],
  approved:   ['dispatched', 'rejected'],
  dispatched: ['in_transit'],
  in_transit: ['delivered'],
  delivered:  [],
  rejected:   [],
};

// ---------------------------------------------------------------------------
// Authority: who can approve/reject/dispatch?
// district_admin+, within their own jurisdiction.
// phc_user can only submit (create) and cancel their own draft requests.
// ---------------------------------------------------------------------------
const DECISION_ROLES: TenantClaims['role'][] = [
  'district_admin',
  'state_admin',
  'national_admin',
];

function canDecide(claims: TenantClaims): boolean {
  return DECISION_ROLES.includes(claims.role);
}

// ---------------------------------------------------------------------------
// RequestService
// ---------------------------------------------------------------------------
export class RequestService {
  // ── Helpers ────────────────────────────────────────────────────────────────

  static normalizeRequestType(raw: string): RequestType {
    const t = (raw || 'medicine').toLowerCase();
    if (t === 'replenishment') return 'medicine';
    if (['medicine', 'oxygen', 'bed', 'staff', 'equipment'].includes(t)) {
      return t as RequestType;
    }
    return 'medicine';
  }

  static normalizePriority(raw: string): RequestPriority {
    const p = (raw || 'routine').toLowerCase();
    if (p === 'normal' || p === 'low') return 'routine';
    if (p === 'high') return 'urgent';
    if (['routine', 'urgent', 'critical'].includes(p)) {
      return p as RequestPriority;
    }
    return 'routine';
  }

  // ── List ───────────────────────────────────────────────────────────────────

  static async listRequests(
    claims: TenantClaims,
    phcId: string,
    filter?: { status?: string; source?: string },
  ): Promise<ResourceRequestItem[]> {
    return withTenantContext(claims, async (client) => {
      let query = `SELECT id, phc_id, request_type, item_ref, quantity, priority,
                          reason, source, status, created_at, decided_at, decided_by, notes
                   FROM resource_requests
                   WHERE phc_id = $1`;
      const params: any[] = [phcId];
      if (filter?.status) {
        params.push(filter.status);
        query += ` AND status = $${params.length}`;
      }
      if (filter?.source) {
        params.push(filter.source);
        query += ` AND source = $${params.length}`;
      }
      query += ` ORDER BY created_at DESC LIMIT 200`;

      const res = await client.query(query, params);
      return res.rows;
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  static async createRequest(
    claims: TenantClaims,
    phcId: string,
    input: {
      request_type: string;
      item_ref?: string;
      quantity?: number;
      priority?: string;
      reason?: string;
      notes?: string;
      items?: Array<{ medicine_id: string; requested_qty: number }>;
    },
  ): Promise<ResourceRequestItem> {
    const reqType   = this.normalizeRequestType(input.request_type);
    const priority  = this.normalizePriority(input.priority || 'routine');
    const itemRef   = input.item_ref || (input.items && input.items[0]?.medicine_id) || null;
    const quantity  = Number(input.quantity || (input.items && input.items[0]?.requested_qty) || 1);
    const notes     = input.notes || null;

    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `INSERT INTO resource_requests
           (phc_id, request_type, item_ref, quantity, priority, reason, source, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, 'manual', 'pending', $7)
         RETURNING id, phc_id, request_type, item_ref, quantity, priority,
                   reason, source, status, created_at, notes`,
        [phcId, reqType, itemRef, quantity, priority, input.reason || 'manual', notes],
      );

      const request = res.rows[0];

      setImmediate(() => {
        eventBus.publish('request.created', { ...request, phc_id: phcId }, 'request-service').catch(() => {});
      });

      return request;
    });
  }

  // ── Status transition (state machine) ──────────────────────────────────────

  static async transitionStatus(
    claims: TenantClaims,
    phcId: string,
    requestId: string,
    targetStatus: RequestStatus,
    opts?: { notes?: string; decidedBy?: string },
  ): Promise<ResourceRequestItem> {
    // Authority check — only district_admin+ can approve/reject/dispatch
    const decisiveStatuses: RequestStatus[] = ['approved', 'rejected', 'dispatched', 'in_transit', 'delivered'];
    if (decisiveStatuses.includes(targetStatus) && !canDecide(claims)) {
      const err = new Error('FORBIDDEN: only district_admin or above can approve, reject, or dispatch requests');
      (err as any).statusCode = 403;
      throw err;
    }

    return withTenantContext(claims, async (client) => {
      // Fetch current request row — RLS enforces jurisdiction
      const fetchRes = await client.query<ResourceRequestItem>(
        `SELECT id, phc_id, status, priority FROM resource_requests WHERE id = $1 AND phc_id = $2`,
        [requestId, phcId],
      );

      if (fetchRes.rows.length === 0) {
        const err = new Error('REQUEST_NOT_FOUND');
        (err as any).statusCode = 404;
        throw err;
      }

      const current = fetchRes.rows[0];
      const allowed = VALID_TRANSITIONS[current.status];

      if (!allowed.includes(targetStatus)) {
        const err = new Error(
          `INVALID_TRANSITION: cannot move from '${current.status}' to '${targetStatus}'. ` +
          `Allowed: [${allowed.join(', ')}]`,
        );
        (err as any).statusCode = 422;
        throw err;
      }

      const decidedBy  = opts?.decidedBy || claims.sub || claims.role;
      const decidedAt  = new Date().toISOString();
      const notes      = opts?.notes || null;

      const updateRes = await client.query<ResourceRequestItem>(
        `UPDATE resource_requests
         SET status = $1, decided_at = $2, decided_by = $3, notes = COALESCE($4, notes)
         WHERE id = $5
         RETURNING id, phc_id, request_type, item_ref, quantity, priority,
                   reason, source, status, created_at, decided_at, decided_by, notes`,
        [targetStatus, decidedAt, decidedBy, notes, requestId],
      );

      const updated = updateRes.rows[0];

      // Emit domain events
      setImmediate(() => {
        if (targetStatus === 'approved') {
          eventBus.publish('request.approved', updated, 'request-service').catch(() => {});
        }
        eventBus.publish('request.status_changed', { ...updated, previous_status: current.status }, 'request-service').catch(() => {});
      });

      return updated;
    });
  }

  // ── Cancel (PHC user self-service for pending drafts) ─────────────────────

  static async cancelRequest(
    claims: TenantClaims,
    phcId: string,
    requestId: string,
  ): Promise<{ id: string; status: string }> {
    return withTenantContext(claims, async (client) => {
      const fetchRes = await client.query<{ status: string }>(
        `SELECT status FROM resource_requests WHERE id = $1 AND phc_id = $2`,
        [requestId, phcId],
      );

      if (fetchRes.rows.length === 0) {
        const err = new Error('REQUEST_NOT_FOUND');
        (err as any).statusCode = 404;
        throw err;
      }

      if (fetchRes.rows[0].status !== 'pending') {
        const err = new Error('INVALID_TRANSITION: only pending requests can be cancelled by PHC users');
        (err as any).statusCode = 422;
        throw err;
      }

      await client.query(
        `UPDATE resource_requests SET status = 'rejected', decided_at = now(), decided_by = 'phc_self_cancel'
         WHERE id = $1`,
        [requestId],
      );

      return { id: requestId, status: 'rejected' };
    });
  }

  // ── Emergency fast-path ────────────────────────────────────────────────────

  static async reportEmergency(
    claims: TenantClaims,
    phcId: string,
    input: { alert_type: string; title: string; description: string },
  ): Promise<any> {
    return withTenantContext(claims, async (client) => {
      const facRes = await client.query<{ district_id: string; state_id: string }>(
        `SELECT district_id, state_id FROM phc_facilities WHERE id = $1`,
        [phcId],
      );
      const districtId = facRes.rows[0]?.district_id || null;
      const stateId    = facRes.rows[0]?.state_id    || null;

      const payload = {
        title:       input.title,
        description: input.description,
        source:      'phc_emergency_fastpath',
        reported_at: new Date().toISOString(),
      };

      const res = await client.query(
        `INSERT INTO alerts (phc_id, district_id, state_id, alert_type, severity, payload, status)
         VALUES ($1, $2, $3, 'emergency_report', 'critical', $4, 'open')
         RETURNING id, phc_id, district_id, state_id, alert_type, severity, payload, status, created_at`,
        [phcId, districtId, stateId, JSON.stringify(payload)],
      );

      const alert = res.rows[0];

      // CRITICAL path — synchronous (no batching), as close to immediate as possible
      eventBus.publish('emergency.created', alert, 'emergency-fastpath').catch(() => {});
      eventBus.publish('alert.created',     alert, 'emergency-fastpath').catch(() => {});

      return alert;
    });
  }
}
