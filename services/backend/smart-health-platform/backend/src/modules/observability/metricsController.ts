import { Router, Request, Response } from 'express';
import { MetricsService } from './metricsService';
import { Logger } from '../../middleware/structuredLogger';
import { requireAuth } from '../../middleware/tenantContext';

export const metricsRouter = Router();

/**
 * GET /metrics
 * Standard Prometheus scraping endpoint (Prompt 21).
 */
metricsRouter.get('/metrics', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  return res.send(MetricsService.toPrometheusFormat());
});

/**
 * GET /api/v1/observability/dashboard
 * Administrative telemetry dashboard: latency percentiles, error rate, queue depth, DB latency, alerts.
 */
metricsRouter.get('/observability/dashboard', (_req: Request, res: Response) => {
  const snapshot = MetricsService.getMetricsSnapshot();
  return res.json({
    status: snapshot.activeAlerts.length === 0 ? 'healthy' : 'degraded',
    data: snapshot,
  });
});

/**
 * GET /api/v1/observability/logs
 * Scoped query endpoint for recent structured logs.
 */
metricsRouter.get('/observability/logs', requireAuth, (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const logs = Logger.getRecentLogs(limit);
  return res.json({ count: logs.length, data: logs });
});
