import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { eventBus, DomainEvent } from '../../events/eventBus';
import { pool } from '../../db/pool';
import { sseAuth } from '../alerts/alertsController';

export const eventsStreamRouter = Router();

// ---------------------------------------------------------------------------
// Real-Time Domain Events SSE Stream
// GET /api/v1/events/stream
// ---------------------------------------------------------------------------
export function handleEventsStream(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = randomUUID();

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString(), status: 'connected' })}\n\n`);

  // Subscribe to all domain events on the eventBus
  const unsubscribe = eventBus.subscribe('*', (event: DomainEvent<any>) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // Stream write error — client likely disconnected
    }
  });

  // Heartbeat to keep connection alive through load balancers and proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}

// ---------------------------------------------------------------------------
// Governance KPI Telemetry SSE Stream
// GET /governance/kpi/stream & GET /api/v1/governance/kpi/stream
// ---------------------------------------------------------------------------
export async function handleKpiStream(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(': connected\n\n');

  const sendTicks = async () => {
    try {
      const client = await pool.connect();
      let facStats: any = {};
      let alertStats: any = {};
      let requestStats: any = {};

      try {
        const facRes = await client.query(`
          SELECT 
            COUNT(*)::int AS total_phcs,
            COUNT(CASE WHEN operational_status = 'active' THEN 1 END)::int AS active_phcs,
            COALESCE(SUM(total_beds), 0)::int AS total_beds,
            COALESCE(SUM(occupied_beds), 0)::int AS occupied_beds,
            COALESCE(SUM(oxygen_cylinders_available), 0)::int AS oxygen_cylinders
          FROM phc_facilities
        `);
        facStats = facRes.rows[0] || {};

        const alertRes = await client.query(`
          SELECT 
            COUNT(*)::int AS open_alerts,
            COUNT(CASE WHEN severity = 'critical' OR severity = 'CRITICAL' THEN 1 END)::int AS critical_alerts
          FROM alerts
          WHERE status = 'open'
        `);
        alertStats = alertRes.rows[0] || {};

        const reqRes = await client.query(`
          SELECT COUNT(*)::int AS pending_requests
          FROM resource_requests
          WHERE status = 'pending'
        `);
        requestStats = reqRes.rows[0] || {};
      } finally {
        client.release();
      }

      const totalBeds = Number(facStats.total_beds || 0);
      const occupiedBeds = Number(facStats.occupied_beds || 0);
      const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      const criticalPhcs = Math.max(0, Math.round(Number(alertStats.critical_alerts || 0) * 0.4));

      const ticks = [
        { metric: 'Critical PHCs',      value: criticalPhcs,                                     unit: 'PHCs',   severity: criticalPhcs > 0 ? 'critical' : 'ok' },
        { metric: 'Medicine Alerts',     value: Number(alertStats.open_alerts || 0),              unit: 'Alerts', severity: Number(alertStats.open_alerts) > 10 ? 'warn' : 'ok' },
        { metric: 'Bed Utilization',     value: bedOccupancyRate,                                  unit: '%',      severity: bedOccupancyRate > 85 ? 'critical' : 'ok' },
        { metric: 'Oxygen Status',       value: Number(facStats.oxygen_cylinders || 0),           unit: 'cyl',    severity: Number(facStats.oxygen_cylinders) < 50 ? 'warn' : 'ok' },
        { metric: 'Pending Requests',    value: Number(requestStats.pending_requests || 0),       unit: 'Reqs',   severity: Number(requestStats.pending_requests) > 5 ? 'warn' : 'ok' },
        { metric: 'Active PHCs',         value: Number(facStats.active_phcs || facStats.total_phcs || 0), unit: 'PHCs', severity: 'ok' },
        { metric: 'Critical Alerts',     value: Number(alertStats.critical_alerts || 0),          unit: 'Alerts', severity: Number(alertStats.critical_alerts) > 0 ? 'critical' : 'ok' },
      ];

      for (const tick of ticks) {
        const payload = {
          ...tick,
          delta: 0,
          timestamp: new Date().toISOString(),
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    } catch (err: any) {
      console.warn('[KPI Stream] Error querying live metrics:', err?.message);
    }
  };

  // Immediate tick
  await sendTicks();

  // Tick interval every 8 seconds
  const interval = setInterval(sendTicks, 8_000);

  req.on('close', () => {
    clearInterval(interval);
  });
}

// Router bindings
eventsStreamRouter.get('/events/stream', sseAuth, handleEventsStream);
eventsStreamRouter.get('/governance/kpi/stream', sseAuth, handleKpiStream);
