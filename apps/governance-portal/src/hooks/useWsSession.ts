// ─────────────────────────────────────────────────────────────────────────────
// useWsSession — WebSocket wrapper hook.
//
// Covers the two WS contracts:
//   /api/v1/governance/simulator/session  (Crisis Simulator interactive session)
//   (also usable for AI Copilot streaming if the backend exposes a WS endpoint)
//
// Provides send(), a message queue, connection status, and clean reconnection.
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type WsStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error' | 'reconnecting';

export interface WsMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: string;
}

export interface WsSessionOptions<TIn = unknown> {
  onMessage?: (msg: WsMessage<TIn>) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  /** Automatically reconnect on unexpected close (default: true). */
  autoReconnect?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
  /** Set false to defer connection (e.g., until user opens the simulator). */
  enabled?: boolean;
  /** Optional protocols for the WebSocket handshake. */
  protocols?: string | string[];
}

export interface WsSessionResult<TOut = unknown, TIn = unknown> {
  status: WsStatus;
  messages: WsMessage<TIn>[];
  lastMessage: WsMessage<TIn> | null;
  send: (type: string, payload: TOut) => void;
  close: () => void;
  reconnect: () => void;
  clearMessages: () => void;
}

let msgIdCounter = 0;
const nextId = () => `ws-msg-${++msgIdCounter}`;

export function useWsSession<TOut = unknown, TIn = unknown>(
  url: string,
  options: WsSessionOptions<TIn> = {},
): WsSessionResult<TOut, TIn> {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    maxRetries = 5,
    baseDelayMs = 1_000,
    enabled = true,
    protocols,
  } = options;

  const [status, setStatus] = useState<WsStatus>('connecting');
  const [messages, setMessages] = useState<WsMessage<TIn>[]>([]);
  const [lastMessage, setLastMessage] = useState<WsMessage<TIn> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Keep callbacks in refs so they don't cause reconnect loops
  const cbRefs = useRef({ onMessage, onOpen, onClose, onError });
  cbRefs.current = { onMessage, onOpen, onClose, onError };

  const close = useCallback((code = 1000, reason = 'manual close') => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close(code, reason);
      wsRef.current = null;
    }
    if (mountedRef.current) setStatus('closed');
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    // Don't double-open
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    setStatus('connecting');
    let ws: WebSocket;
    try {
      ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    } catch {
      setStatus('error');
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      retryCountRef.current = 0;
      setStatus('open');
      cbRefs.current.onOpen?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string) as WsMessage<TIn>;
        setLastMessage(msg);
        setMessages((prev) => [...prev.slice(-499), msg]); // keep last 500
        cbRefs.current.onMessage?.(msg);
      } catch {
        // raw text frame — wrap it
        const wrapped: WsMessage<TIn> = {
          id: nextId(),
          type: 'raw',
          payload: event.data as unknown as TIn,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(wrapped);
        setMessages((prev) => [...prev.slice(-499), wrapped]);
        cbRefs.current.onMessage?.(wrapped);
      }
    };

    ws.onclose = (event: CloseEvent) => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      cbRefs.current.onClose?.(event);

      if (!event.wasClean && autoReconnect && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = baseDelayMs * 2 ** (retryCountRef.current - 1);
        setStatus('reconnecting');
        retryTimerRef.current = setTimeout(() => connect(), delay);
      } else {
        setStatus('closed');
      }
    };

    ws.onerror = (event: Event) => {
      if (!mountedRef.current) return;
      setStatus('error');
      cbRefs.current.onError?.(event);
    };
  }, [url, autoReconnect, maxRetries, baseDelayMs, protocols]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    close();
    connect();
  }, [close, connect]);

  const send = useCallback((type: string, payload: TOut) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[useWsSession] Cannot send — socket is not open');
      return;
    }
    const msg: WsMessage<TOut> = {
      id: nextId(),
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();
    return () => {
      mountedRef.current = false;
      close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  return { status, messages, lastMessage, send, close, reconnect, clearMessages };
}
