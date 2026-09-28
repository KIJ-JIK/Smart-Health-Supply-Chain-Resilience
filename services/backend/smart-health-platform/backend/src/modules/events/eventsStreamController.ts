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
// Governance KPI Telemetry SSE Stream — Shared Broadcaster
// Avoids database pool exhaustion by running a single background timer
// and broadcasting cached snapshots to all connected SSE clients.
// ---------------------------------------------------------------------------
let cachedKpiTicks: any[] = [];
let lastKpiFetch = 0;
const activeKpiClients = new Set<Response>();
let kpiBroadcastTimer: NodeJS.Timeout | null = null;

async function refreshKpiSnapshot(): Promise<any[]> {
  try {
    const client = await pool.connect();
    let facStats: any = {};
    let alertStats: any = {};
    let requestStats: any = {};

    try {
      const [facRes, alertRes, reqRes] = await Promise.all([
        client.query(`
          SELECT 
            COUNT(*)::int AS total_phcs,
            COUNT(CASE WHEN operational_status = 'active' THEN 1 END)::int AS active_phcs,
            COALESCE(SUM(total_beds), 0)::int AS total_beds,
            COALESCE(SUM(occupied_beds), 0)::int AS occupied_beds,
            COALESCE(SUM(oxygen_cylinders_available), 0)::int AS oxygen_cylinders
          FROM phc_facilities
        `),
        client.query(`
          SELECT 
            COUNT(*)::int AS open_alerts,
            COUNT(CASE WHEN severity = 'critical' OR severity = 'CRITICAL' THEN 1 END)::int AS critical_alerts
          FROM alerts
          WHERE status = 'open'
        `),
        client.query(`
          SELECT COUNT(*)::int AS pending_requests
          FROM resource_requests
          WHERE status = 'pending'
        `),
      ]);
      facStats = facRes.rows[0] || {};
      alertStats = alertRes.rows[0] || {};
      requestStats = reqRes.rows[0] || {};
    } finally {
      client.release();
    }

    const totalBeds = Number(facStats.total_beds || 0);
    const occupiedBeds = Number(facStats.occupied_beds || 0);
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const criticalPhcs = Math.max(0, Math.round(Number(alertStats.critical_alerts || 0) * 0.4));

    const ticks = [
      { metric: 'Critical PHCs',   value: criticalPhcs,                                     unit: 'PHCs',   severity: criticalPhcs > 0 ? 'critical' : 'ok' },
      { metric: 'Medicine Alerts',  value: Number(alertStats.open_alerts || 0),              unit: 'Alerts', severity: Number(alertStats.open_alerts) > 10 ? 'warn' : 'ok' },
      { metric: 'Bed Utilization',  value: bedOccupancyRate,                                  unit: '%',      severity: bedOccupancyRate > 85 ? 'critical' : 'ok' },
      { metric: 'Oxygen Status',    value: Number(facStats.oxygen_cylinders || 0),           unit: 'cyl',    severity: Number(facStats.oxygen_cylinders) < 50 ? 'warn' : 'ok' },
      { metric: 'Pending Requests', value: Number(requestStats.pending_requests || 0),       unit: 'Reqs',   severity: Number(requestStats.pending_requests) > 5 ? 'warn' : 'ok' },
      { metric: 'Active PHCs',      value: Number(facStats.active_phcs || facStats.total_phcs || 0), unit: 'PHCs', severity: 'ok' },
      { metric: 'Critical Alerts',  value: Number(alertStats.critical_alerts || 0),          unit: 'Alerts', severity: Number(alertStats.critical_alerts) > 0 ? 'critical' : 'ok' },
    ];

    cachedKpiTicks = ticks;
    lastKpiFetch = Date.now();
    return ticks;
  } catch (err: any) {
    console.warn('[KPI Stream] Error querying live metrics:', err?.message);
    return cachedKpiTicks;
  }
}

function startKpiBroadcaster(): void {
  if (kpiBroadcastTimer) return;
  kpiBroadcastTimer = setInterval(async () => {
    if (activeKpiClients.size === 0) {
      if (kpiBroadcastTimer) {
        clearInterval(kpiBroadcastTimer);
        kpiBroadcastTimer = null;
      }
      return;
    }
    const ticks = await refreshKpiSnapshot();
    const timestamp = new Date().toISOString();
    for (const res of Array.from(activeKpiClients)) {
      try {
        for (const tick of ticks) {
          res.write(`data: ${JSON.stringify({ ...tick, delta: 0, timestamp })}\n\n`);
        }
      } catch {
        activeKpiClients.delete(res);
      }
    }
  }, 10_000);
}

export async function handleKpiStream(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(': connected\n\n');

  activeKpiClients.add(res);

  // Send immediate cached data or refresh if stale (>10s old)
  let ticks = cachedKpiTicks;
  if (!ticks.length || Date.now() - lastKpiFetch > 10_000) {
    ticks = await refreshKpiSnapshot();
  }

  const timestamp = new Date().toISOString();
  for (const tick of ticks) {
    try {
      res.write(`data: ${JSON.stringify({ ...tick, delta: 0, timestamp })}\n\n`);
    } catch {
      activeKpiClients.delete(res);
      return;
    }
  }

  // Ensure broadcaster loop is active
  startKpiBroadcaster();

  req.on('close', () => {
    activeKpiClients.delete(res);
  });
}

// Router bindings
eventsStreamRouter.get('/events/stream', sseAuth, handleEventsStream);
eventsStreamRouter.get('/governance/kpi/stream', sseAuth, handleKpiStream);
