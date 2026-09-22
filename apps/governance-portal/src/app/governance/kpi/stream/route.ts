// ─────────────────────────────────────────────────────────────────────────────
// SSE Route Handler for live KPI ticks: /governance/kpi/stream
// Fetches real data from the backend and streams KPI updates to the UI.
// Falls back to a static tick if the backend is unavailable.
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/graphql', '') || 'http://localhost:8000';

async function fetchBackendKpis(): Promise<Record<string, number>> {
  try {
    // Fetch national overview via GraphQL
    const res = await fetch(`${BACKEND}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ nationalOverview { totalPhcs activePhcs criticalPhcs totalBeds occupiedBeds bedOccupancyRate oxygenCylindersAvailable openAlertsCount criticalAlertsCount staffShortagePhcCount pendingRedistributionsCount } }`,
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.nationalOverview ?? {};
  } catch {
    return {};
  }
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      const sendTick = async () => {
        const data = await fetchBackendKpis();

        const ticks = [
          { metric: 'Critical PHCs',      value: data.criticalPhcs              ?? 0, unit: 'PHCs',   severity: 'critical' },
          { metric: 'Medicine Alerts',     value: data.openAlertsCount           ?? 0, unit: 'Alerts', severity: 'warn' },
          { metric: 'Bed Utilization',     value: Math.round(data.bedOccupancyRate ?? 0), unit: '%', severity: data.bedOccupancyRate > 90 ? 'critical' : 'ok' },
          { metric: 'Oxygen Status',       value: data.oxygenCylindersAvailable  ?? 0, unit: 'cyl',   severity: data.oxygenCylindersAvailable < 20 ? 'warn' : 'ok' },
          { metric: 'Pending Requests',    value: data.pendingRedistributionsCount ?? 0, unit: 'Reqs', severity: 'warn' },
          { metric: 'Active PHCs',         value: data.activePhcs                ?? 0, unit: 'PHCs',  severity: 'ok' },
          { metric: 'Critical Alerts',     value: data.criticalAlertsCount       ?? 0, unit: 'Alerts', severity: 'critical' },
        ];

        for (const tick of ticks) {
          const payload = { ...tick, delta: 0, timestamp: new Date().toISOString() };
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            return;
          }
        }
      };

      // First tick immediately
      sendTick();
      // Then every 8 seconds
      const interval = setInterval(() => sendTick(), 8000);

      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
