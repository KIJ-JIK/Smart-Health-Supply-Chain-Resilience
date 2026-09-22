'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWsSession } from '@/hooks/useWsSession';
import { Send, Bot, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED = [
  'Which PHCs in Pune are at risk of stockout this week?',
  'Why is Paracetamol consumption spiking at Kothrud PHC?',
  'Summarise redistribution decisions made in the last 7 days',
  'What are the top 3 workforce vacancy hotspots in Maharashtra?',
  'What caused the sudden OPD footfall surge at Chakan PHC?',
];

function CopilotChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : input;
    const trimmed = raw.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (!sessionOpen) {
      setSessionOpen(true);
      setTimeout(() => send('chat', trimmed), 600);
    } else {
      send('chat', trimmed);
    }

    // Add loading placeholder
    const loadingId = `ai-loading-${Date.now()}`;
    setChatHistory((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '…', timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await fetch('/api/v1/governance/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phcId: 'phc-001', message: trimmed }),
        signal: AbortSignal.timeout(15000),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.message ?? data.answer ?? 'No response from AI engine.';
      } else {
        replyText = `Backend error (HTTP ${res.status}). Please ensure the server is running on port 8000.`;
      }

      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { id: `ai-${Date.now()}`, role: 'assistant', content: replyText, timestamp: new Date().toISOString() }
            : m,
        ),
      );
    } catch (err) {
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                id: `ai-err-${Date.now()}`,
                role: 'assistant',
                content: 'Unable to reach the backend. Ensure `npm run dev:backend` is running.',
                timestamp: new Date().toISOString(),
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL query parameter auto-trigger
  useEffect(() => {
    if (initialQuery && !initializedRef.current) {
      initializedRef.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={24} style={{ color: 'var(--color-primary)' }} />
          Health Governance AI Copilot
        </h1>
        <p className="page-subtitle">
          Natural language root-cause analysis, epidemiological intelligence, and decision support
        </p>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 210px)',
          minHeight: 520,
          background: 'white',
        }}
      >
        {/* Card Header */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 6, borderRadius: 6, background: '#EEF2FF', color: 'var(--color-primary)' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <span className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
                Interactive Intelligence Agent
              </span>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Equipped with real-time telemetry, masterplan §88.9 forecast contracts, and alert causal graph
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span className={`sse-dot ${sessionOpen ? status : 'connected'}`} />
            <span>{sessionOpen ? `WS ${status}` : 'AI Ready'}</span>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--color-surface)',
          }}
        >
          {chatHistory.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: 'auto', maxWidth: 640 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--color-primary)',
                }}
              >
                <Bot size={28} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                How can I assist your health administration today?
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
                Ask questions about facility stockouts, early warning alert causes, bed occupancies, epidemic clusters, or redistribution logic.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Suggested Inquiries
                </span>
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    style={{
                      padding: '10px 14px',
                      background: 'white',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <span>{s}</span>
                    <ArrowRight size={14} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1E293B',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, background: 'white' }}>
          <input
            id="copilot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about alert reasons, stockouts, redistribution logic, or epidemiology..."
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-ui)',
              fontSize: 13.5,
              outline: 'none',
              background: '#F8FAFC',
            }}
            aria-label="Copilot message input"
          />
          <button
            id="copilot-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            style={{
              padding: '10px 20px',
              background: input.trim() ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: input.trim() ? 'white' : 'var(--color-text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              fontSize: 13.5,
              transition: 'background 0.15s ease',
            }}
            aria-label="Send message to copilot"
          >
            <Send size={15} /> Send
          </button>
        </div>
      </div>
    </>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading AI Copilot...</div>}>
      <CopilotChatContent />
    </Suspense>
  );
}
