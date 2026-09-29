'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  MessageSquare,
  Search,
  Plus,
  ArrowRight,
  Trash2,
  Calendar,
  Clock,
  Cpu,
  Download,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useChatHistoryStore, ChatSessionSummary } from '@/store/chatHistoryStore';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';

export default function CopilotHistoryPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const {
    sessions,
    fetchSessions,
    selectSession,
    createNewSession,
    deleteSession,
    isLoading,
  } = useChatHistoryStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSessions(user?.id || 'dev-nat-001');
  }, [user?.id, fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.preview && s.preview.toLowerCase().includes(q));
  });

  const totalMessages = sessions.reduce((acc, s) => acc + (s.message_count || 2), 0);

  const handleOpenSession = (sessionId: string) => {
    selectSession(sessionId);
    router.push(`/copilot?session=${encodeURIComponent(sessionId)}`);
  };

  const handleStartNew = () => {
    const newId = createNewSession();
    router.push(`/copilot?session=${encodeURIComponent(newId)}`);
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aura_copilot_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link
              href="/copilot"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#64748B',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} />
              <span>{language === 'hi' ? 'एआई कोपायलट पर वापस जाएं' : 'Back to AI Copilot'}</span>
            </Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={26} style={{ color: 'var(--color-primary)' }} />
            <span>{language === 'hi' ? 'कोपायलट वार्तालाप इतिहास (Chat History)' : 'Copilot Conversation History'}</span>
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: '4px 0 0' }}>
            {language === 'hi'
              ? `लॉगिन सत्र (${user?.name || 'National Admin'}) के तहत सहेजे गए सभी पूर्व वार्तालाप और टेलीमेट्री सत्र।`
              : `All archived conversations and health telemetry inquiries for ${user?.name || 'National Admin'}.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleExportAll}
            style={{
              padding: '9px 16px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Download size={15} />
            <span>{language === 'hi' ? 'इतिहास निर्यात करें' : 'Export JSON'}</span>
          </button>

          <button
            onClick={handleStartNew}
            style={{
              padding: '9px 18px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>{language === 'hi' ? '+ नया वार्तालाप शुरू करें' : '+ New Chat'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: 'white', padding: '18px 20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{sessions.length}</div>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>{language === 'hi' ? 'कुल वार्तालाप सत्र' : 'Total Chat Sessions'}</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '18px 20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{totalMessages}</div>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>{language === 'hi' ? 'कुल प्रेषित संदेश' : 'Messages Exchanged'}</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '18px 20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>6 Tools</div>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>{language === 'hi' ? 'सक्रिय MCP टूल्स' : 'Connected MCP Tools'}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ background: 'white', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={18} style={{ color: '#94A3B8' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={language === 'hi' ? 'वार्तालाप शीर्षक या सामग्री खोजें...' : 'Search past conversations by topic, facility, or query text...'}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: 14,
            width: '100%',
            color: '#1E293B',
          }}
        />
      </div>

      {/* Sessions Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', padding: '60px 20px', borderRadius: 12, border: '1px solid var(--color-border)', textAlign: 'center', color: '#64748B' }}>
          <History size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
            {language === 'hi' ? 'कोई वार्तालाप सत्र नहीं मिला' : 'No Conversation History Found'}
          </h3>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
            {language === 'hi' ? 'नया प्रश्न पूछकर अपना पहला AI कोपायलट सत्र शुरू करें।' : 'Start your first health intelligence conversation with the AI Copilot.'}
          </p>
          <button
            onClick={handleStartNew}
            style={{
              padding: '9px 18px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'hi' ? '+ नई चैट शुरू करें' : '+ Start New Chat'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((s) => (
            <div
              key={s.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1E40AF' }}>
                    {s.message_count || 2} Messages
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 11 }}>
                    <Clock size={12} />
                    <span>{new Date(s.updated_at || s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {s.title}
                </h3>

                {s.preview && (
                  <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {s.preview}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                <button
                  onClick={() => deleteSession(s.id)}
                  title="Delete Session"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  <Trash2 size={14} />
                  <span>{language === 'hi' ? 'हटाएं' : 'Delete'}</span>
                </button>

                <button
                  onClick={() => handleOpenSession(s.id)}
                  style={{
                    padding: '7px 14px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 6,
                    color: '#1E40AF',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{language === 'hi' ? 'चैट जारी रखें' : 'Continue Chat'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
