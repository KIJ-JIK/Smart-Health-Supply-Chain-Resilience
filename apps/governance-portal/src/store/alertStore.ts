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

// ── Masterplan Seed Alerts (Deterministic, Statistical, Emergency Report) ──────
export const MOCK_SEED_ALERTS: Alert[] = [
  {
    id: 'alert-em-001',
    severity: 'critical',
    category: 'system',
    alertType: 'emergency_report',
    alertClass: 'emergency',
    title: 'Emergency Report — Power Generator Failure',
    message: 'Hadapsar PHC reported main electrical grid failure & generator starter fault. Vaccine cold chain at risk.',
    entityId: 'phc-hadapsar',
    entityName: 'Hadapsar PHC',
    entityType: 'phc',
    copilotQuery: 'What is emergency backup protocol for vaccine cold storage at Hadapsar PHC?',
    timestamp: new Date(Date.now() - 4 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-det-001',
    severity: 'critical',
    category: 'stockout',
    alertType: 'stock_below_threshold',
    alertClass: 'deterministic',
    title: 'Stock Below Critical Threshold — Amoxicillin 500mg',
    message: 'Stock at Hadapsar PHC dropped to 0 units. Fixed threshold: <15% buffer (150 units). Patient load: 340/day.',
    entityId: 'med-001',
    entityName: 'Amoxicillin 500mg',
    entityType: 'medicine',
    copilotQuery: 'Why is Amoxicillin stock below threshold at Hadapsar PHC and which neighboring facility has surplus?',
    timestamp: new Date(Date.now() - 15 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-stat-001',
    severity: 'warning',
    category: 'outbreak',
    alertType: 'consumption_spike',
    alertClass: 'statistical',
    title: 'Unusual Consumption Spike — Paracetamol 500mg',
    message: 'Daily dispenses jumped +340% (3.8σ above 30-day baseline) at Kothrud PHC. AI-flagged — review recommended.',
    entityId: 'med-002',
    entityName: 'Paracetamol 500mg',
    entityType: 'medicine',
    copilotQuery: 'Why is Paracetamol consumption spiking at Kothrud PHC and is it linked to fever cluster?',
    timestamp: new Date(Date.now() - 28 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-det-002',
    severity: 'critical',
    category: 'system',
    alertType: 'bed_occupancy_above_threshold',
    alertClass: 'deterministic',
    title: 'Bed Occupancy Above Limit — Baramati SDH',
    message: 'Bed occupancy reached 96.5% (48/50 beds occupied). Fixed threshold: >92.0% Critical Deficit.',
    entityId: 'phc-baramati',
    entityName: 'Baramati SDH',
    entityType: 'phc',
    copilotQuery: 'Why is bed occupancy above critical limit at Baramati SDH and what is patient surge forecast?',
    timestamp: new Date(Date.now() - 42 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-stat-002',
    severity: 'warning',
    category: 'workforce',
    alertType: 'footfall_spike',
    alertClass: 'statistical',
    title: 'Sudden Footfall Surge — Chakan PHC',
    message: 'OPD footfall +185% vs 4-week seasonal mean. Lone facility anomaly — Flagged for Review (not outbreak).',
    entityId: 'phc-chakan',
    entityName: 'Chakan PHC',
    entityType: 'phc',
    copilotQuery: 'What caused sudden OPD footfall surge at Chakan PHC?',
    timestamp: new Date(Date.now() - 65 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-det-003',
    severity: 'warning',
    category: 'system',
    alertType: 'oxygen_below_threshold',
    alertClass: 'deterministic',
    title: 'Oxygen Reserve Below Minimum — Wagholi PHC',
    message: 'Available D-type cylinders cover 0.9 days of consumption. Fixed threshold: <1.2 days Critical Deficit.',
    entityId: 'phc-wagholi',
    entityName: 'Wagholi PHC',
    entityType: 'phc',
    copilotQuery: 'Why is oxygen reserve critical at Wagholi PHC and when is next refill scheduled?',
    timestamp: new Date(Date.now() - 95 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-em-002',
    severity: 'critical',
    category: 'supply_chain',
    alertType: 'emergency_report',
    alertClass: 'emergency',
    title: 'Emergency Report — Road Access Blockade',
    message: 'Velhe PHC reports road landslide. Emergency medical kit airlift requested for trauma cases.',
    entityId: 'phc-velhe',
    entityName: 'Velhe PHC',
    entityType: 'phc',
    copilotQuery: 'What is emergency logistics status for flood-isolated Velhe PHC?',
    timestamp: new Date(Date.now() - 110 * 60_000).toISOString(),
    acknowledged: true,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
  {
    id: 'alert-stat-003',
    severity: 'warning',
    category: 'outbreak',
    alertType: 'regional_surge',
    alertClass: 'statistical',
    title: 'Regional Outbreak Cluster — Pune East Cluster',
    message: 'Gastroenteritis cases elevated across 4 contiguous PHCs (Hadapsar, Wagholi, Manjari, Loni). Regional cluster verified.',
    entityId: 'dist-pune',
    entityName: 'Pune District',
    entityType: 'district',
    copilotQuery: 'What is the epidemiological analysis for Pune East regional outbreak cluster?',
    timestamp: new Date(Date.now() - 150 * 60_000).toISOString(),
    acknowledged: false,
    districtId: 'dist-pune',
    stateId: 'state-mh',
  },
];

// Seed on module load if empty
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const store = useAlertStore.getState();
    if (store.alerts.length === 0) {
      store.setAlerts(MOCK_SEED_ALERTS);
    }
  }, 300);
}
