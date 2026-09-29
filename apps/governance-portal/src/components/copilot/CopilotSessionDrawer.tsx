'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Cpu,
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useChatHistoryStore, ChatSessionSummary } from '@/store/chatHistoryStore';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';

interface CopilotSessionDrawerProps {
  onSelectSession?: (sessionId: string) => void;
}

export function CopilotSessionDrawer({ onSelectSession }: CopilotSessionDrawerProps) {
  const {
    sessions,
    activeSessionId,
    searchQuery,
    setSearchQuery,
    isDrawerOpen,
    toggleDrawer,
    fetchSessions,
    selectSession,
    createNewSession,
    deleteSession,
    renameSession,
    setMcpModalOpen,
  } = useChatHistoryStore();

  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchSessions(user?.id || 'dev-nat-001');
  }, [user?.id, fetchSessions]);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.preview && s.preview.toLowerCase().includes(q));
  });

  const handleStartRename = (s: ChatSessionSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
  };

  const handleSessionClick = (id: string) => {
    selectSession(id);
    if (onSelectSession) {
      onSelectSession(id);
    }
  };

  if (!isDrawerOpen) {
    return (
      <div
        style={{
          width: 48,
          background: 'white',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 6px',
          gap: 12,
        }}
      >
        <button
          onClick={toggleDrawer}
          title={language === 'hi' ? 'साइड विंडो खोलें' : 'Open Chat History Side Window'}
          style={{
            padding: 8,
            borderRadius: 'var(--radius-md)',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
            display: 'flex',
            color: '#475569',
          }}
        >
          <ChevronRight size={16} />
        </button>

        <button
          onClick={() => {
            const newId = createNewSession();
            if (onSelectSession) onSelectSession(newId);
          }}
          title={language === 'hi' ? 'नई चैट' : 'New Chat'}
          style={{
            padding: 8,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <Plus size={16} />
        </button>

        <button
          onClick={() => setMcpModalOpen(true)}
          title="MCP Tools"
          style={{
            padding: 8,
            borderRadius: 'var(--radius-md)',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#2563EB',
            cursor: 'pointer',
            display: 'flex',
            marginTop: 'auto',
          }}
        >
          <Cpu size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        background: 'white',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Top Header & Actions */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {language === 'hi' ? 'चैट इतिहास' : 'Chat History'}
            </span>
          </div>
          <button
            onClick={toggleDrawer}
            title={language === 'hi' ? 'साइड विंडो छुपाएं' : 'Collapse Drawer'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            const newId = createNewSession();
            if (onSelectSession) onSelectSession(newId);
          }}
          style={{
            width: '100%',
            padding: '9px 12px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            transition: 'opacity 0.15s ease',
          }}
        >
          <Plus size={16} />
          <span>{language === 'hi' ? '+ नई चैट शुरू करें' : '+ New Conversation'}</span>
        </button>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            padding: '6px 10px',
          }}
        >
          <Search size={14} style={{ color: '#94A3B8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'सत्र खोजें...' : 'Search past chats...'}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              outline: 'none',
              width: '100%',
              color: '#1E293B',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filteredSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: 12 }}>
            <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            {searchQuery
              ? (language === 'hi' ? 'कोई मेल खाने वाला सत्र नहीं मिला।' : 'No matching chat sessions.')
              : (language === 'hi' ? 'कोई पिछला इतिहास नहीं। नई चैट शुरू करें!' : 'No previous chat sessions. Start a new chat!')}
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = activeSessionId === s.id;
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => handleSessionClick(s.id)}
                style={{
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.id, e as any)}
                        style={{
                          fontSize: 12,
                          padding: '2px 4px',
                          border: '1px solid #3B82F6',
                          borderRadius: 4,
                          width: '100%',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveRename(s.id, e)}
                        style={{ border: 'none', background: 'transparent', color: '#16A34A', cursor: 'pointer', padding: 2 }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', padding: 2 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <MessageSquare size={13} style={{ color: isActive ? '#2563EB' : '#94A3B8', flexShrink: 0 }} />
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#1E40AF' : '#1E293B',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.title}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={(e) => handleStartRename(s, e)}
                          title="Rename"
                          style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(s.id, e)}
                          title="Delete"
                          style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && s.preview && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingLeft: 19,
                    }}
                  >
                    {s.preview}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer: MCP Status & Full History Link */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--color-border)',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <button
          onClick={() => setMcpModalOpen(true)}
          style={{
            padding: '7px 10px',
            background: 'white',
            border: '1px solid #DBEAFE',
            borderRadius: 6,
            color: '#1E40AF',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={14} style={{ color: '#2563EB' }} />
            <span>MCP Tools (6 Active)</span>
          </div>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
        </button>

        <Link
          href="/copilot/history"
          style={{
            fontSize: 11.5,
            color: '#64748B',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '4px 0',
          }}
        >
          <History size={13} />
          <span>{language === 'hi' ? 'पूर्ण इतिहास पृष्ठ खोलें' : 'View Full History Page'}</span>
        </Link>
      </div>
    </div>
  );
}
