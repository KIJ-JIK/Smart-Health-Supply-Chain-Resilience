'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWsSession } from '@/hooks/useWsSession';
import {
  Send,
  Bot,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Cpu,
  History,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { CopilotMessageRenderer } from '@/components/copilot/CopilotMessageRenderer';
import { CopilotSessionDrawer } from '@/components/copilot/CopilotSessionDrawer';
import { McpToolInspectorModal } from '@/components/copilot/McpToolInspectorModal';
import { useLanguageStore, useT } from '@/store/languageStore';
import { useChatHistoryStore } from '@/store/chatHistoryStore';
import { useAuthStore } from '@/store/authStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mcpToolsUsed?: string[];
}

const SUGGESTED_EN = [
  'How many doctors and staff are in Bihar and Maharashtra?',
  'Which medicines have critical stockouts across Indian states?',
  'Show bed occupancy and available capacity across all facilities',
  'What are the active clinical and epidemiological outbreak alerts?',
  'How many PHCs are listed throughout India?',
];

const SUGGESTED_HI = [
  'बिहार और महाराष्ट्र में कितने डॉक्टर्स और स्टाफ उपलब्ध हैं?',
  'किन-किन राज्यों में दवाओं का गंभीर स्टॉकआउट (Stockout) है?',
  'सभी PHC केंद्रों में बेड ऑक्यूपेंसी और खाली बेड्स की स्थिति दिखाएं',
  'वर्तमान में सक्रिय डेंगू और मलेरिया के क्या अलर्ट हैं?',
  'पूरे भारत में कुल कितने PHC केंद्र पंजीकृत हैं?',
];

function CopilotChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialSession = searchParams.get('session') ?? '';
  const { language } = useLanguageStore();
  const t = useT();
  const { user } = useAuthStore();
  const {
    activeSessionId,
    selectSession,
    createNewSession,
    addOrUpdateSession,
    setMcpModalOpen,
  } = useChatHistoryStore();

  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const SUGGESTED = language === 'hi' ? SUGGESTED_HI : SUGGESTED_EN;

  const { status, send } = useWsSession('governance-copilot');

  // Handle URL session ID
  useEffect(() => {
    if (initialSession && initialSession !== activeSessionId) {
      selectSession(initialSession);
    }
  }, [initialSession, activeSessionId, selectSession]);

  // Load session messages when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      fetch(`/api/v1/governance/copilot/sessions/${encodeURIComponent(activeSessionId)}`)
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data && Array.isArray(data.messages) && data.messages.length > 0) {
            setChatHistory(
              data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.created_at,
                mcpToolsUsed: m.mcp_tool_calls,
              }))
            );
          } else {
            setChatHistory([]);
          }
        })
        .catch(() => {});
    } else {
      setChatHistory([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : input;
    const trimmed = raw.trim();
    if (!trimmed || isLoading) return;

    let currentSession = activeSessionId;
    if (!currentSession) {
      currentSession = createNewSession();
    }

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
        body: JSON.stringify({
          phcId: 'phc-001',
          message: trimmed,
          language,
          sessionId: currentSession,
          userId: user?.id || 'dev-nat-001',
        }),
        signal: AbortSignal.timeout(15000),
      });

      let replyText: string;
      let toolsUsed: string[] = ['search_health_db'];
      if (res.ok) {
        const data = await res.json();
        replyText = data.message ?? data.answer ?? (language === 'hi' ? 'एआई इंजन से कोई प्रतिक्रिया नहीं मिली।' : 'No response from AI engine.');
        if (Array.isArray(data.mcpToolsUsed)) {
          toolsUsed = data.mcpToolsUsed;
        }
      } else {
        replyText = language === 'hi'
          ? `बैकएंड कनेक्शन त्रुटि (HTTP ${res.status})। कृपया सिस्टम कनेक्टिविटी जांचें और पुनः प्रयास करें।`
          : `Backend connection error (HTTP ${res.status}). Please check system connectivity and retry.`;
      }

      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: replyText,
                timestamp: new Date().toISOString(),
                mcpToolsUsed: toolsUsed,
              }
            : m
        )
      );

      // Sync session to store
      addOrUpdateSession({
        id: currentSession,
        user_id: user?.id || 'dev-nat-001',
        title: trimmed.slice(0, 40),
        preview: replyText.slice(0, 80).replace(/[#*•_`]/g, ''),
        language,
      });
    } catch (err) {
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                id: `ai-err-${Date.now()}`,
                role: 'assistant',
                content: 'Unable to reach the backend. Ensure the smart health backend service is active.',
                timestamp: new Date().toISOString(),
              }
            : m
        )
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
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', minHeight: 650, margin: '-20px -24px' }}>
      {/* ── Side Window: Session Drawer ──────────────────────────────────────── */}
      <CopilotSessionDrawer onSelectSession={(id) => selectSession(id)} />

      {/* ── Main Chat Area ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflow: 'hidden' }}>
        {/* Top Chat Subheader */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{t('copilot.title', 'AURA AI Copilot')}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1E40AF' }}>
                  v2.5 Cascading
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                {activeSessionId ? `Session: ${activeSessionId}` : (language === 'hi' ? 'नया वार्तालाप सत्र' : 'Live Autonomous Clinical Intelligence')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* MCP Status Button */}
            <button
              onClick={() => setMcpModalOpen(true)}
              style={{
                padding: '6px 12px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-md)',
                color: '#15803D',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Cpu size={14} />
              <span>MCP Tools (6 Connected)</span>
            </button>

            {/* History Page Link */}
            <Link
              href="/copilot/history"
              style={{
                padding: '6px 12px',
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: '#334155',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <History size={14} />
              <span>{language === 'hi' ? 'इतिहास' : 'History'}</span>
            </Link>

            {/* New Chat Button */}
            <button
              onClick={() => {
                createNewSession();
                setChatHistory([]);
              }}
              style={{
                padding: '6px 12px',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={14} />
              <span>{language === 'hi' ? 'नई चैट' : 'New Chat'}</span>
            </button>
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
                {language === 'hi' ? 'मैं आपके स्वास्थ्य प्रशासन की क्या सहायता कर सकता हूँ?' : 'How can I assist your health administration today?'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
                {language === 'hi'
                  ? 'PHC सुविधाओं, डॉक्टर्स/स्टाफ, दवा स्टॉकआउट, बेड ऑक्यूपेंसी, या सक्रिय महामारी अलर्ट के बारे में पूछें।'
                  : 'Ask questions about facility stockouts, doctors/staff, bed occupancies, epidemic clusters, or redistribution logic.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('copilot.quickPrompts', 'Suggested Inquiries')}
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
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1E293B',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                {msg.role === 'user' ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                ) : (
                  <div>
                    <CopilotMessageRenderer content={msg.content} />
                    {msg.mcpToolsUsed && msg.mcpToolsUsed.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: '1px solid #F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          color: '#64748B',
                        }}
                      >
                        <Cpu size={12} style={{ color: '#2563EB' }} />
                        <span>MCP Tools:</span>
                        {msg.mcpToolsUsed.map((t) => (
                          <span
                            key={t}
                            style={{
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: '#F1F5F9',
                              fontFamily: 'monospace',
                              color: '#334155',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
            placeholder={t('copilot.placeholder', 'Ask about alert reasons, stockouts, redistribution logic, or epidemiology...')}
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
            aria-label="Send message"
          >
            <Send size={15} />
            <span>{t('copilot.send', 'Send')}</span>
          </button>
        </div>
      </div>

      {/* MCP Inspector Modal */}
      <McpToolInspectorModal />
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading AURA Copilot...</div>}>
      <CopilotChatContent />
    </Suspense>
  );
}
