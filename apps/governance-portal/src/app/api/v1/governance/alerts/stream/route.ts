// ─────────────────────────────────────────────────────────────────────────────
// SSE Route Handler for Governance Live Alert Stream
// Streams real-time alert events from backend port 8000 to connected clients.
// Provides immediate connection handshake, initial alert hydration, and keep-alive.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/graphql', '') || 'http://localhost:8000';

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const urlObj = new URL(req.url);
  const token =
    urlObj.searchParams.get('token') ||
    urlObj.searchParams.get('auth_token') ||
    req.headers.get('Authorization')?.replace('Bearer ', '');

  const backendStreamUrl = new URL(`${BACKEND_URL}/api/v1/governance/alerts/stream`);
  if (token) {
    backendStreamUrl.searchParams.set('token', token);
  }

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      const safeEnqueue = (data: Uint8Array) => {
        if (!isClosed) {
          try {
            controller.enqueue(data);
          } catch {
            isClosed = true;
          }
        }
      };

      // 1. Immediately flush connection acknowledgment handshake
      safeEnqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            clientId: 'governance-sse-gateway',
            ts: new Date().toISOString(),
          })}\n\n`
        )
      );

      // 2. Hydrate client immediately with open alerts from backend REST
      try {
        const restHeaders: Record<string, string> = {
          Accept: 'application/json',
        };
        if (token) {
          restHeaders['Authorization'] = `Bearer ${token}`;
        }
        const alertsRes = await fetch(`${BACKEND_URL}/api/v1/governance/alerts?limit=100`, {
          headers: restHeaders,
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        });

        if (alertsRes.ok) {
          const json = await alertsRes.json();
          const alertsList = Array.isArray(json) ? json : json.data || json.alerts || [];
          if (alertsList.length > 0) {
            safeEnqueue(encoder.encode(`event: alert\ndata: ${JSON.stringify(alertsList)}\n\n`));
            safeEnqueue(encoder.encode(`data: ${JSON.stringify(alertsList)}\n\n`));
          }
        }
      } catch (err) {
        // Backend REST may be initializing or unreachable
        console.debug('[Next.js SSE Gateway] Initial alerts fetch skipped:', (err as any)?.message);
      }

      // 3. Connect to backend port 8000 SSE stream
      let backendAbort: AbortController | null = null;
      let heartbeatTimer: NodeJS.Timeout | null = null;

      try {
        backendAbort = new AbortController();
        const sseHeaders: Record<string, string> = {
          Accept: 'text/event-stream',
        };
        if (token) {
          sseHeaders['Authorization'] = `Bearer ${token}`;
        }
        const sseRes = await fetch(backendStreamUrl.toString(), {
          headers: sseHeaders,
          cache: 'no-store',
          signal: backendAbort.signal,
        });

        if (sseRes.ok && sseRes.body) {
          const reader = sseRes.body.getReader();
          (async () => {
            try {
              while (!isClosed) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) safeEnqueue(value);
              }
            } catch {
              // Upstream stream ended or aborted
            }
          })();
        } else {
          // If backend SSE stream is not available, emit periodic heartbeat
          heartbeatTimer = setInterval(() => {
            if (isClosed) {
              if (heartbeatTimer) clearInterval(heartbeatTimer);
              return;
            }
            safeEnqueue(encoder.encode(': heartbeat\n\n'));
          }, 15_000);
        }
      } catch {
        // Upstream SSE connection failed; keep connection alive with heartbeat
        heartbeatTimer = setInterval(() => {
          if (isClosed) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            return;
          }
          safeEnqueue(encoder.encode(': heartbeat\n\n'));
        }, 15_000);
      }

      // Clean up on client disconnect
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        if (backendAbort) backendAbort.abort();
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
