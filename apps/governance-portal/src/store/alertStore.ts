// ─────────────────────────────────────────────────────────────────────────────
// Alert store — Zustand
//
// Receives live alerts from the SSE stream and maintains an in-memory ring
// buffer. Also tracks acknowledged state locally (persisted in localStorage
// and written back to the server via a REST call, but read optimistically here).
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Alert } from '@/types';

const MAX_ALERTS = 200;

interface AlertState {
  alerts: Alert[];
  acknowledgedIds: Record<string, boolean>;
  unacknowledgedCount: number;
  /** Ingest a new alert from the SSE stream. */
  addAlert: (alert: Alert) => void;
  /** Bulk set/replace alerts (e.g. from GraphQL query). */
  setAlerts: (alerts: Alert[]) => void;
  /** Mark an alert as acknowledged optimistically. */
  acknowledgeAlert: (alertId: string) => void;
  /** Check if an alert ID is acknowledged. */
  isAcknowledged: (alertId: string) => boolean;
  /** Clear all alerts (e.g. on role switch). */
  clearAlerts: () => void;
}

export function normalizeAlert(raw: any, acknowledgedIds: Record<string, boolean> = {}): Alert {
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
  const rawId = raw.id || raw._id || `alert-${Math.random().toString(36).substring(7)}`;
  const acknowledged = Boolean(
    raw.acknowledged ||
    raw.status === 'acknowledged' ||
    acknowledgedIds[rawId]
  );

  return {
    ...raw,
    id: rawId,
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
    entityName: raw.entityName || raw.phcName || raw.entity_name || 'Frontline Center',
    entityType: raw.entityType || (raw.phc_id ? 'phc' : 'system'),
  };
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      acknowledgedIds: {},
      unacknowledgedCount: 0,

      addAlert: (rawAlert) => {
        const currentAckIds = get().acknowledgedIds;
        const alert = normalizeAlert(rawAlert, currentAckIds);
        if (!alert || !alert.id) return;
        set((state) => {
          // Deduplicate by ID
          if (state.alerts.some((a) => a.id === alert.id)) {
            return state;
          }
          const updated = [alert, ...state.alerts].slice(0, MAX_ALERTS);
          return {
            alerts: updated,
            unacknowledgedCount: updated.filter((a) => !a.acknowledged && !state.acknowledgedIds[a.id]).length,
          };
        });
      },

      setAlerts: (rawAlerts) => {
        const currentAckIds = get().acknowledgedIds;
        const alerts = (rawAlerts || []).map((a) => normalizeAlert(a, currentAckIds));
        set({
          alerts,
          unacknowledgedCount: alerts.filter((a) => !a.acknowledged && !currentAckIds[a.id]).length,
        });
      },

      acknowledgeAlert: (alertId) => {
        set((state) => {
          const newAckIds = { ...state.acknowledgedIds, [alertId]: true };
          const updated = state.alerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a,
          );
          return {
            acknowledgedIds: newAckIds,
            alerts: updated,
            unacknowledgedCount: updated.filter((a) => !a.acknowledged && !newAckIds[a.id]).length,
          };
        });

        // Fire-and-forget REST call to persist acknowledgement on the backend
        if (typeof window !== 'undefined') {
          fetch(`/api/v1/governance/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            credentials: 'include',
          }).catch(() => {
            // Silently ignore — optimistic update already recorded
          });
        }
      },

      isAcknowledged: (alertId) => {
        return Boolean(get().acknowledgedIds[alertId]);
      },

      clearAlerts: () => set({ alerts: [], unacknowledgedCount: 0 }),
    }),
    {
      name: 'governance-portal-alerts-v2',
      partialize: (state) => ({
        acknowledgedIds: state.acknowledgedIds,
      }),
    },
  ),
);

export const MOCK_SEED_ALERTS: Alert[] = [];
