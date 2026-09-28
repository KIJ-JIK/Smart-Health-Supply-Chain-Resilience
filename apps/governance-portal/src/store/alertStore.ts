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

export function normalizeAlert(raw: any): Alert {
  if (!raw) return raw;
  const alertType = raw.alertType || raw.alert_type || 'system_alert';
  const category = (raw.category || alertType || 'general') as any;

  let alertClass = raw.alertClass;
  if (!alertClass) {
    if (alertType === 'emergency_report') alertClass = 'emergency';
    else if (
      ['outbreak_suspected', 'outbreak_risk', 'abnormal_consumption', 'forecast_risk', 'demand_spike', 'anomaly'].includes(
        alertType
      )
    ) {
      alertClass = 'statistical';
    } else {
      alertClass = 'deterministic';
    }
  }

  const title =
    raw.title ||
    alertType
      .split('_')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  const message =
    raw.message ||
    raw.payload?.message ||
    raw.payload?.affected_patients ||
    raw.payload?.recommendation ||
    title;
  const timestamp = raw.timestamp || raw.created_at || new Date().toISOString();
  const acknowledged = raw.acknowledged ?? (raw.status === 'acknowledged');

  return {
    ...raw,
    alertType,
    category,
    alertClass,
    title,
    message,
    timestamp,
    acknowledged,
    districtId: raw.districtId || raw.district_id,
    stateId: raw.stateId || raw.state_id,
    phcId: raw.phcId || raw.phc_id || (raw.entityType === 'phc' ? raw.entityId : undefined),
    entityId: raw.entityId || raw.phc_id || raw.district_id,
    entityType: raw.entityType || (raw.phc_id ? 'phc' : 'system'),
  };
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unacknowledgedCount: 0,

  addAlert: (rawAlert) => {
    const alert = normalizeAlert(rawAlert);
    if (!alert || !alert.id) return;
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

  setAlerts: (rawAlerts) => {
    const alerts = (rawAlerts || []).map(normalizeAlert);
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
