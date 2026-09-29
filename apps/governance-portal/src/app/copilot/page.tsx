'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWsSession } from '@/hooks/useWsSession';
import { Send, Bot, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { CopilotMessageRenderer } from '@/components/copilot/CopilotMessageRenderer';
import { useLanguageStore } from '@/store/languageStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
  const { language, t } = useLanguageStore();

  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const SUGGESTED = language === 'hi' ? SUGGESTED_HI : SUGGESTED_EN;

  const { status, send } = useWsSession('governance-copilot');

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
        body: JSON.stringify({ phcId: 'phc-001', message: trimmed, language }),
        signal: AbortSignal.timeout(15000),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.message ?? data.answer ?? (language === 'hi' ? 'एआई इंजन से कोई प्रतिक्रिया नहीं मिली।' : 'No response from AI engine.');
      } else {
        replyText = language === 'hi'
          ? `बैकएंड कनेक्शन त्रुटि (HTTP ${res.status})। कृपया सिस्टम कनेक्टिविटी जांचें और पुनः प्रयास करें।`
          : `Backend connection error (HTTP ${res.status}). Please check system connectivity and retry.`;
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
          {t('copilot.title', 'AURA AI Copilot')}
        </h1>
        <p className="page-subtitle">
          {t('copilot.subtitle', 'Natural language root-cause analysis, epidemiological intelligence, and decision support')}
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
                {language === 'hi' ? 'इंटरैक्टिव स्वास्थ्य खुफिया एजेंट' : 'Interactive Intelligence Agent'}
              </span>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {language === 'hi' ? 'लाइव टेलीमेट्री, 36 राज्यों के PHC डेटा और क्लिनिकल अलर्ट ग्राफ से सुसज्जित' : 'Equipped with real-time telemetry, masterplan §88.9 forecast contracts, and alert causal graph'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span className={`sse-dot ${sessionOpen ? status : 'connected'}`} />
            <span>{sessionOpen ? `WS ${status}` : (language === 'hi' ? 'एआई तैयार है' : 'AI Ready')}</span>
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
                {language === 'hi' ? 'PHC सुविधाओं, डॉक्टर्स/स्टाफ, दवा स्टॉकआउट, बेड ऑक्यूपेंसी, या सक्रिय महामारी अलर्ट के बारे में पूछें।' : 'Ask questions about facility stockouts, doctors/staff, bed occupancies, epidemic clusters, or redistribution logic.'}
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
                  <CopilotMessageRenderer content={msg.content} />
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
            aria-label="Send message to copilot"
          >
            <Send size={15} /> {t('copilot.send', 'Send')}
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
