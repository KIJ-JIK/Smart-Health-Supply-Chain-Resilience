// ─────────────────────────────────────────────────────────────────────────────
// Copilot Store — Zustand
//
// Manages the docked side panel state across the entire governance portal.
// Supports opening with pre-filled queries and source alert/recommendation links.
// Sends messages to the REAL backend: POST /api/v1/governance/copilot/chat
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';

export interface SupportingDataPoint {
  label: string;
  value: string | number;
  delta?: string;
  sourceMetric?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;

  // Masterplan §44 Response Contract fields (required on every assistant message):
  supportingData?: SupportingDataPoint[];
  sourceEntityId?: string;
  sourceEntityType?: 'alert' | 'recommendation' | 'district' | 'phc' | 'medicine';
  sourceLink?: string;
  modelVersion?: string;
  confidenceScore?: number; // e.g. 0.94
  limitationsNote?: string;
  isLoading?: boolean;
}

interface CopilotState {
  isOpen: boolean;
  messages: CopilotMessage[];
  pendingQuery: string;
  isLoading: boolean;

  openCopilot: (query?: string, sourceId?: string, sourceLink?: string) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  sendMessage: (query: string, sourceId?: string, sourceLink?: string) => void;
  clearHistory: () => void;
}

const BACKEND = '/api/v1'; // proxied via next.config.js to http://localhost:8000/api/v1

export const useCopilotStore = create<CopilotState>((set, get) => ({
  isOpen: false,
  messages: [],
  pendingQuery: '',
  isLoading: false,

  openCopilot: (query, sourceId, sourceLink) => {
    set({ isOpen: true });
    if (query) {
      get().sendMessage(query, sourceId, sourceLink);
    }
  },

  closeCopilot: () => set({ isOpen: false }),

  toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),

  sendMessage: async (query, sourceId, sourceLink) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Add loading placeholder for assistant
    const loadingId = `ai-loading-${Date.now()}`;
    const loadingMessage: CopilotMessage = {
      id: loadingId,
      role: 'assistant',
      content: '…',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, loadingMessage],
      pendingQuery: '',
      isLoading: true,
    }));

    try {
      // Get phcId from localStorage if available (PHC-scoped users)
      const phcId = 'phc-001'; // default; replace with authStore in production

      const res = await fetch(`${BACKEND}/governance/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({ phcId, message: trimmed }),
        signal: AbortSignal.timeout(45000),
      });

      let assistantMessage: CopilotMessage;

      if (res.ok) {
        const data: {
          sessionId?: string;
          message: string;
          citations?: { sourceType: string; entityId?: string; excerpt?: string }[];
          supporting_data?: Record<string, unknown>;
          confidence?: number;
          model_version?: string;
          limitations?: string;
          suggestedFollowUps?: string[];
        } = await res.json();

        // Map backend citations → supportingData display format
        const supportingData: SupportingDataPoint[] = (data.citations ?? []).map((c) => ({
          label: c.sourceType.replace(/_/g, ' '),
          value: c.entityId ?? '—',
          delta: c.excerpt ?? undefined,
        }));

        // Merge any backend supporting_data fields
        if (data.supporting_data) {
          for (const [k, v] of Object.entries(data.supporting_data)) {
            supportingData.push({ label: k.replace(/_/g, ' '), value: String(v) });
          }
        }

        assistantMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          supportingData: supportingData.length > 0 ? supportingData : undefined,
          sourceEntityId: sourceId ?? data.supporting_data?.source_entity_id as string | undefined,
          sourceEntityType: 'alert',
          sourceLink: sourceLink,
          modelVersion: data.model_version ?? 'copilot-v1.2',
          confidenceScore: data.confidence ?? 0.90,
          limitationsNote: data.limitations ?? undefined,
        };
      } else {
        // Non-2xx: show a graceful error
        assistantMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I'm having trouble connecting to the health intelligence system right now (HTTP ${res.status}). Please check system network connectivity and try again.`,
          timestamp: new Date().toISOString(),
          modelVersion: 'offline',
          confidenceScore: 0,
          limitationsNote: 'Backend unreachable',
        };
      }

      // Replace the loading placeholder with the real response
      set((state) => ({
        messages: state.messages.map((m) => (m.id === loadingId ? assistantMessage : m)),
        isLoading: false,
      }));
    } catch (err) {
      const errMessage: CopilotMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          'Unable to reach the health intelligence backend. Please check that the backend server is running (`npm run dev:backend`) and try again.',
        timestamp: new Date().toISOString(),
        modelVersion: 'offline',
        confidenceScore: 0,
        limitationsNote: String(err),
      };
      set((state) => ({
        messages: state.messages.map((m) => (m.id === loadingId ? errMessage : m)),
        isLoading: false,
      }));
    }
  },

  clearHistory: () => set({ messages: [] }),
}));
