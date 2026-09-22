// ─────────────────────────────────────────────────────────────────────────────
// Alert store — Zustand
//
// Receives live alerts from the SSE stream and maintains an in-memory ring
// buffer. Also tracks acknowledged state locally (acknowledged flag is
// written back to the server via a REST call, but read optimistically here).
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { Alert } from '@/types';

const MAX_ALERTS = 200;

interface AlertState {
  alerts: Alert[];
  unacknowledgedCount: number;
  /** Ingest a new alert from the SSE stream. */
  addAlert: (alert: Alert) => void;
  /** Bulk set/replace alerts (e.g. from GraphQL query). */
  setAlerts: (alerts: Alert[]) => void;
  /** Mark an alert as acknowledged optimistically. */
  acknowledgeAlert: (alertId: string) => void;
  /** Clear all alerts (e.g. on role switch). */
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unacknowledgedCount: 0,

  addAlert: (alert) => {
    set((state) => {
      // Deduplicate by ID
      if (state.alerts.some((a) => a.id === alert.id)) {
        return state;
      }
      const updated = [alert, ...state.alerts].slice(0, MAX_ALERTS);
      return {
        alerts: updated,
        unacknowledgedCount: updated.filter((a) => !a.acknowledged).length,
      };
    });
  },

  setAlerts: (alerts) => {
    set({
      alerts,
      unacknowledgedCount: alerts.filter((a) => !a.acknowledged).length,
    });
  },

  acknowledgeAlert: (alertId) => {
    set((state) => {
      const updated = state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a,
      );
      return {
        alerts: updated,
        unacknowledgedCount: updated.filter((a) => !a.acknowledged).length,
      };
    });
    // Fire-and-forget REST call to persist acknowledgement
    fetch(`/api/v1/governance/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Silently ignore — optimistic update already applied
    });
  },

  clearAlerts: () => set({ alerts: [], unacknowledgedCount: 0 }),
}));

export const MOCK_SEED_ALERTS: Alert[] = [];

// Seed on module load if empty
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const store = useAlertStore.getState();
    if (store.alerts.length === 0) {
      store.setAlerts(MOCK_SEED_ALERTS);
    }
  }, 300);
}
