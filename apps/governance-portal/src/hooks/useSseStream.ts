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
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const close = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStatus('closed');
  }, []);

  const connect = useCallback(() => {
    if (!enabledRef.current) return;

    // Guard: don't open if already open
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) return;

    setStatus('connecting');
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      retryCountRef.current = 0;
      setStatus('connected');
      setError(null);
      onOpenRef.current?.();
    };

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
  }, [url, maxRetries, baseDelayMs]);

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
