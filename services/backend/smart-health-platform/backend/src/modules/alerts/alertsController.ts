import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { AlertsService, AlertsSseManager } from './alertsService';
import { randomUUID } from 'crypto';

const router = Router({ mergeParams: true });

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

// ── GET /api/v1/governance/alerts/stream ──────────────────────────────────
// SSE endpoint — long-lived connection, fans out every new alert.
// Governance Portal team expects this exact path (masterplan §34, Prompt 13).
router.get('/governance/alerts/stream', requireAuth, (req: Request, res: Response) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx buffering off
  res.flushHeaders();

  const clientId = randomUUID();

  // Send a hello ping so the client knows the connection is live
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, ts: new Date().toISOString() })}\n\n`);

  AlertsSseManager.add(clientId, res);

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
});

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
