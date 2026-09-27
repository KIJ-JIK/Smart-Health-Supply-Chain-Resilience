import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { AlertsService, AlertsSseManager } from './alertsService';
import { TokenService } from '../auth/tokenService';
import { randomUUID } from 'crypto';

const router = Router({ mergeParams: true });

/**
 * SSE authentication middleware.
 * Supports:
 * 1. Existing req.tenantClaims (from Authorization header)
 * 2. Query param ?token=... or ?auth_token=... (verified via TokenService)
 * 3. Development/test mode bypass to allow browser EventSource connection with HTTP 200 without 401
 */
export function sseAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.tenantClaims) {
    return next();
  }

  const queryToken = (req.query.token || req.query.auth_token) as string | undefined;
  if (queryToken && typeof queryToken === 'string') {
    try {
      const decoded = TokenService.verifyAccessToken(queryToken);
      req.tenantClaims = {
        role: decoded.role,
        phcId: decoded.phc_id,
        districtId: decoded.district_id,
        stateId: decoded.state_id,
      };
      return next();
    } catch (err: any) {
      console.warn('[SSE] Invalid query token provided:', err?.message);
    }
  }

  // Development / test mode bypass
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'test') {
    req.tenantClaims = {
      role: 'national_admin',
      sub: '00000000-0000-0000-0000-000000000000',
    };
    return next();
  }

  res.status(401).json({ error: 'Unauthorized: valid token required for SSE stream connection.' });
}

// ── GET /api/v1/governance/alerts ──────────────────────────────────────────
// Governance read: returns paginated alert list scoped by RLS.
router.get('/governance/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { severity, status, phc_id, limit } = req.query;
    const alerts = await AlertsService.listAlerts(req.tenantClaims!, {
      severity: severity as string,
      status:   status   as string,
      phc_id:   phc_id   as string,
      limit:    limit ? Number(limit) : 200,
    });
    res.json({ count: alerts.length, data: alerts });
  } catch (err: any) {
    console.error('[alerts] list error', err);
    res.status(500).json({ error_code: 'ALERTS_FETCH_FAILED', message: err.message });
  }
});

// Handler for alerts SSE streaming
async function handleAlertsStream(req: Request, res: Response) {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx buffering off
  res.flushHeaders();

  const clientId = randomUUID();

  // Send initial connected frame without named event tag so default es.onmessage receives it
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId, ts: new Date().toISOString() })}\n\n`);

  AlertsSseManager.add(clientId, res);

  // Immediately write initial batch of recent open alerts so the client receives active alerts immediately
  try {
    const claims = req.tenantClaims || {
      role: 'national_admin',
      sub: '00000000-0000-0000-0000-000000000000',
    };
    const openAlerts = await AlertsService.listAlerts(claims, { status: 'open', limit: 25 });
    if (openAlerts && openAlerts.length > 0) {
      for (const alert of openAlerts) {
        res.write(`data: ${JSON.stringify(alert)}\n\n`);
      }
    }
  } catch (err: any) {
    console.error('[SSE] Failed to send initial open alerts:', err?.message);
  }

  // Heartbeat every 25 s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    AlertsSseManager.remove(clientId);
  });
}

// ── GET /api/v1/governance/alerts/stream ──────────────────────────────────
// SSE endpoint — long-lived connection, fans out every new alert.
// Governance Portal team expects this exact path (masterplan §34, Prompt 13).
router.get('/governance/alerts/stream', sseAuth, handleAlertsStream);
router.get('/alerts/stream', sseAuth, handleAlertsStream);


// ── PATCH /api/v1/governance/alerts/:alertId/acknowledge ──────────────────
router.patch('/governance/alerts/:alertId/acknowledge', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await AlertsService.acknowledgeAlert(req.tenantClaims!, req.params.alertId);
    res.json(updated);
  } catch (err: any) {
    const code = err.statusCode || 500;
    res.status(code).json({ error_code: err.message });
  }
});

export default router;
