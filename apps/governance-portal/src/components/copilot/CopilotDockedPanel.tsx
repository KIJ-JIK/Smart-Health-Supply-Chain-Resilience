'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCopilotStore, CopilotMessage } from '@/store/copilotStore';
import { CopilotMessageRenderer } from './CopilotMessageRenderer';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ExternalLink,
  Info,
  Clock,
  Trash2,
  HelpCircle,
  ArrowRight,
  Database,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

const QUICK_PROMPTS = [
  {
    title: 'Why is District A at risk?',
    query: 'Why is Pune District at risk?',
    desc: 'Analyzes compounding emergency, stockout, and bed factors',
  },
  {
    title: 'Why did the system issue this alert?',
    query: 'Why did the system issue the critical alert for Amoxicillin stockout?',
    desc: 'Explains deterministic thresholds vs statistical anomaly',
  },
  {
    title: 'Why is this transfer recommended?',
    query: 'Why is transfer REC-PUNE-001 recommended between Kothrud and Hadapsar?',
    desc: 'Details surplus allocation and recipient deficit relief',
  },
  {
    title: 'What happens if patient load rises 30%?',
    query: 'What happens if patient load rises 30% across Pune PHCs?',
    desc: 'Simulates secondary stockout and bed surge impacts',
  },
];

export function CopilotDockedPanel() {
  const { isOpen, closeCopilot, toggleCopilot, messages, sendMessage, clearHistory } = useCopilotStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : input;
    const trimmed = raw.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  };

  return (
    <>
      {/* ── FLOATING SUMMON BUTTON (When Panel is Closed) ────────────────────── */}
      {!isOpen && (
        <button
          id="copilot-docked-floating-btn"
          onClick={toggleCopilot}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 45,
            padding: '10px 18px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.01em',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
          aria-label="Open AI Copilot"
        >
          <Bot size={18} />
          <span>Ask Copilot "Why"</span>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            AI Active
          </span>
        </button>
      )}

      {/* ── DOCKED SIDE PANEL ────────────────────────────────────────────────── */}
      <aside
        id="copilot-docked-side-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 460,
          maxWidth: '92vw',
          height: '100vh',
          background: 'white',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: isOpen ? '-4px 0 28px rgba(0, 0, 0, 0.16)' : 'none',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        aria-label="Health Governance Copilot Panel"
      >
        {/* Panel Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#EEF2FF',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  Health Governance Copilot
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  §44 Contract
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                Model: MedCopilot-v2.4-Gov
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 4,
                }}
                title="Clear Copilot Conversation"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={closeCopilot}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close Copilot Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Panel Scrollable Message Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: '#F8FAFC',
          }}
        >
          {/* Empty State / 4 Masterplan Example Questions */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <Sparkles size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                  Ask "Why" Without Losing Your Place
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                  This docked assistant provides root-cause explanations and counterfactual impact assessments compliant with the Masterplan §44 Response Contract.
                </p>
              </div>

              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Masterplan §44 Standard Inquiries:
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(qp.query)}
                      style={{
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = '#EFF6FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E40AF' }}>
                          "{qp.title}"
                        </span>
                        <ArrowRight size={13} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#64748B' }}>
                        {qp.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: '14px 14px 2px 14px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      fontSize: 13,
                      lineHeight: 1.4,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            // ── ASSISTANT MESSAGE PER MASTERPLAN §44 RESPONSE CONTRACT ────────
            return (
              <div
                key={msg.id}
                style={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* 1. Answer Text */}
                <CopilotMessageRenderer content={msg.content} />

                {/* 2. Mandatory Supporting Data Attribution (NEVER a bare chat bubble!) */}
                {msg.supportingData && msg.supportingData.length > 0 && (
                  <div
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: 8,
                      }}
                    >
                      <Database size={13} />
                      <span>Supporting Telemetry Attribution:</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {msg.supportingData.map((dp, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'white',
                            padding: '6px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--color-border-light)',
                            fontSize: 11,
                          }}
                        >
                          <div style={{ color: '#64748B', fontWeight: 500 }}>{dp.label}</div>
                          <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 1 }}>{dp.value}</div>
                          {dp.delta && (
                            <div style={{ fontSize: 10, color: '#0369A1', fontWeight: 600 }}>{dp.delta}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Link to Source Entity / Alert / Recommendation ID */}
                {msg.sourceEntityId && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 4,
                      padding: '6px 10px',
                      fontSize: 11,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1E40AF', fontWeight: 600 }}>
                      <Info size={13} />
                      <span>
                        Source Anchor: <strong style={{ fontFamily: 'monospace' }}>{msg.sourceEntityId}</strong>
                      </span>
                    </div>

                    {msg.sourceLink && (
                      <Link
                        href={msg.sourceLink}
                        onClick={closeCopilot}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          textDecoration: 'none',
                        }}
                      >
                        <span>Navigate to Record</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                )}

                {/* 4. Visible Confidence & Limitations Note (Required per §44) */}
                {msg.limitationsNote && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#475569',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 4,
                      padding: '6px 10px',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>Model Confidence: {Math.round((msg.confidenceScore ?? 0.94) * 100)}%</strong> •{' '}
                    <span>{msg.limitationsNote}</span>
                  </div>
                )}

                {/* 5. Footer Metadata: Timestamp & Model Version Caption */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 6,
                    borderTop: '1px solid var(--color-border-light)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <span>Model: {msg.modelVersion || 'MedCopilot-v2.4-Gov'}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock Bar */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--color-border)',
            background: 'white',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <input
            id="copilot-docked-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask why: e.g. 'Why is this transfer recommended?'"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
              outline: 'none',
              background: '#F8FAFC',
            }}
            aria-label="Copilot question input"
          />
          <button
            id="copilot-docked-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: input.trim() ? 'var(--color-primary)' : '#E2E8F0',
              color: input.trim() ? 'white' : '#94A3B8',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              fontSize: 12,
            }}
            aria-label="Send query to Copilot"
          >
            <Send size={14} />
          </button>
        </div>
      </aside>
    </>
  );
}
