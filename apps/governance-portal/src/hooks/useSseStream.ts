// ─────────────────────────────────────────────────────────────────────────────
// useSseStream — generic SSE client hook.
//
// Wraps the native EventSource API and integrates with the backend contract:
//   GET /api/v1/governance/alerts/stream
//   GET /api/v1/governance/kpi/stream
//
// Usage:
//   const { data, status, error } = useSseStream<Alert[]>(
//     '/api/v1/governance/alerts/stream',
//     (payload) => dispatch(payload),
//   );
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type SseStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';

export interface SseStreamOptions<T> {
  /** Called every time a new message arrives. */
  onMessage?: (payload: T) => void;
  /** Called when the stream opens. */
  onOpen?: () => void;
  /** Called on a non-recoverable error. */
  onError?: (err: Event) => void;
  /** Max reconnect attempts before giving up (default: 5). */
  maxRetries?: number;
  /** Base reconnect delay in ms — exponential back-off applied (default: 1000). */
  baseDelayMs?: number;
  /** Whether to start connected (default: true). */
  enabled?: boolean;
}

export interface SseStreamResult<T> {
  /** Last received message payload. */
  lastMessage: T | null;
  status: SseStatus;
  error: Event | null;
  /** Manually close the stream. */
  close: () => void;
  /** Reconnect after a manual close or error. */
  reconnect: () => void;
}

export function useSseStream<T = unknown>(
  url: string,
  options: SseStreamOptions<T> = {},
): SseStreamResult<T> {
  const {
    onMessage,
    onOpen,
    onError,
    maxRetries = 5,
    baseDelayMs = 1_000,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<SseStatus>('connecting');
  const [error, setError] = useState<Event | null>(null);
  const [lastMessage, setLastMessage] = useState<T | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!enabledRef.current || pollingTimerRef.current) return;

    const pollFallback = async () => {
      if (!enabledRef.current) return;
      try {
        const endpoints = [
          '/api/v1/governance/alerts',
          'http://localhost:8000/api/v1/governance/alerts',
          'http://localhost:8000/api/v1/alerts',
        ];
        let data: any = null;
        for (const ep of endpoints) {
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const res = await fetch(ep, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              cache: 'no-store',
            });
            if (res.ok) {
              data = await res.json();
              break;
            }
          } catch {}
        }
        if (data) {
          const payload = (Array.isArray(data) ? data : data.data || data.alerts || data) as T;
          setLastMessage(payload);
          setStatus('connected');
          onMessageRef.current?.(payload);
        }
      } catch (err) {
        console.warn('[useSseStream] Fallback poll error:', err);
      }
    };

    // Execute immediately once, then every 10 seconds
    pollFallback();
    pollingTimerRef.current = setInterval(pollFallback, 10_000);
  }, []);

  const close = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    stopPolling();
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStatus('closed');
  }, [stopPolling]);

  const connect = useCallback(() => {
    if (!enabledRef.current) return;

    // Guard: don't open if already open
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) return;

    setStatus('connecting');

    // Build URL with optional token query parameter for non-cookie auth
    let streamUrl = url;
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && !streamUrl.includes('token=')) {
        streamUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
      }
    }

    // Connect without withCredentials: true to avoid W3C CORS wildcard origin issues
    let es: EventSource;
    try {
      es = new EventSource(streamUrl);
    } catch {
      setStatus('error');
      startPolling();
      return;
    }
    esRef.current = es;

    // Fallback timer if SSE stays stuck in connecting > 8s
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = setTimeout(() => {
      if (es.readyState === EventSource.CONNECTING) {
        console.warn('[useSseStream] Connection timeout — activating HTTP fallback polling');
        startPolling();
      }
    }, 8_000);

    const handleOpenSuccess = () => {
      retryCountRef.current = 0;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      stopPolling();
      setStatus('connected');
      setError(null);
      onOpenRef.current?.();
    };

    es.onopen = handleOpenSuccess;

    // Listen for custom 'connected' event
    es.addEventListener('connected', handleOpenSuccess);

    // Listen for custom 'alert' event
    es.addEventListener('alert', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as T;
        setLastMessage(payload);
        onMessageRef.current?.(payload);
      } catch {
        // Non-JSON or keep-alive
      }
    });

    // Default message listener
    es.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as T;
        setLastMessage(payload);
        onMessageRef.current?.(payload);
      } catch {
        // Non-JSON heartbeat or keep-alive — safe to ignore
      }
    };

    es.onerror = (event: Event) => {
      es.close();
      esRef.current = null;

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Activate fallback polling on error
      startPolling();

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = baseDelayMs * 2 ** (retryCountRef.current - 1);
        setStatus('reconnecting');
        retryTimerRef.current = setTimeout(() => connect(), delay);
      } else {
        setStatus('error');
        setError(event);
        onErrorRef.current?.(event);
      }
    };
  }, [url, maxRetries, baseDelayMs, startPolling, stopPolling]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    close();
    connect();
  }, [close, connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      close();
    }
    return () => {
      close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  return { lastMessage, status, error, close, reconnect };
}
