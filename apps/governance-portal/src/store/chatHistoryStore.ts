import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatSessionSummary {
  id: string;
  user_id: string;
  tenant_id?: string;
  title: string;
  preview?: string;
  message_count: number;
  language?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  supporting_data?: any;
  citations?: any;
  mcp_tool_calls?: string[];
  created_at: string;
}

interface ChatHistoryState {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  searchQuery: string;
  isLoading: boolean;
  isDrawerOpen: boolean;
  isMcpModalOpen: boolean;

  setSearchQuery: (query: string) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleMcpModal: () => void;
  setMcpModalOpen: (open: boolean) => void;

  fetchSessions: (userId?: string) => Promise<void>;
  selectSession: (sessionId: string) => void;
  createNewSession: () => string;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  addOrUpdateSession: (session: Partial<ChatSessionSummary> & { id: string }) => void;
}

const BACKEND = '/api/v1';

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      searchQuery: '',
      isLoading: false,
      isDrawerOpen: true,
      isMcpModalOpen: false,

      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      toggleMcpModal: () => set((s) => ({ isMcpModalOpen: !s.isMcpModalOpen })),
      setMcpModalOpen: (open) => set({ isMcpModalOpen: open }),

      fetchSessions: async (userId = 'dev-nat-001') => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${BACKEND}/governance/copilot/sessions?userId=${encodeURIComponent(userId)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.sessions)) {
              set({ sessions: data.sessions });
            }
          }
        } catch (err) {
          console.warn('[ChatHistoryStore] fetchSessions fallback to local cache:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      selectSession: (sessionId) => {
        set({ activeSessionId: sessionId });
      },

      createNewSession: () => {
        const newId = `session-${Date.now()}`;
        set({ activeSessionId: newId });
        return newId;
      },

      deleteSession: async (sessionId) => {
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== sessionId),
          activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId,
        }));
        try {
          await fetch(`${BACKEND}/governance/copilot/sessions/${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.warn('[ChatHistoryStore] deleteSession network error:', err);
        }
      },

      renameSession: async (sessionId, title) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, title, updated_at: new Date().toISOString() } : sess
          ),
        }));
        try {
          await fetch(`${BACKEND}/governance/copilot/sessions/${encodeURIComponent(sessionId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          });
        } catch (err) {
          console.warn('[ChatHistoryStore] renameSession network error:', err);
        }
      },

      addOrUpdateSession: (session) => {
        const { sessions } = get();
        const existing = sessions.find((s) => s.id === session.id);
        if (existing) {
          set({
            sessions: sessions.map((s) =>
              s.id === session.id ? { ...s, ...session, updated_at: new Date().toISOString() } : s
            ),
          });
        } else {
          const newSession: ChatSessionSummary = {
            id: session.id,
            user_id: session.user_id || 'dev-nat-001',
            title: session.title || 'Healthcare Session',
            preview: session.preview || '',
            message_count: session.message_count || 2,
            language: session.language || 'en',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ sessions: [newSession, ...sessions] });
        }
      },
    }),
    {
      name: 'aura-copilot-sessions-v1',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        isDrawerOpen: state.isDrawerOpen,
      }),
    }
  )
);
