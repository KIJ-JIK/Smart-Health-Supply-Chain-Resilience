// ─────────────────────────────────────────────────────────────────────────────
// SSE Route Handler for live KPI ticks: /governance/kpi/stream
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const metrics = [
    { metric: 'Critical PHCs', unit: 'PHCs', min: 72, max: 82, sev: 'critical' as const },
    { metric: 'Medicine Alerts', unit: 'Alerts', min: 228, max: 242, sev: 'warn' as const },
    { metric: 'Bed Utilization', unit: '%', min: 72, max: 78, sev: 'ok' as const },
    { metric: 'Oxygen Status', unit: '%', min: 95, max: 98, sev: 'ok' as const },
    { metric: 'Staff Availability', unit: '%', min: 83, max: 88, sev: 'warn' as const },
    { metric: 'Patient Load', unit: '/day', min: 308000, max: 316000, sev: 'ok' as const },
    { metric: 'Pending Requests', unit: 'Reqs', min: 150, max: 162, sev: 'warn' as const },
  ];

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keep-alive
      controller.enqueue(encoder.encode(': connected\n\n'));

      const interval = setInterval(() => {
        const target = metrics[Math.floor(Math.random() * metrics.length)];
        const delta = Math.floor(Math.random() * 5) - 2;
        const value = Math.floor(Math.random() * (target.max - target.min + 1)) + target.min;

        const tick = {
          metric: target.metric,
          value,
          unit: target.unit,
          delta,
          severity: target.sev,
          timestamp: new Date().toISOString(),
        };

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(tick)}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 4000);

      // Clean up when client disconnects
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
