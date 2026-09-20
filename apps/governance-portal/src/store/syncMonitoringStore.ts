// ─────────────────────────────────────────────────────────────────────────────
// Sync Monitoring Store (Zustand)
// Maintains live state of PHC sync statuses and mutation queue.
// Provides helpers to compute stale PHC percentage per active jurisdiction scope.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PhcSyncTelemetry,
  SyncMutationRecord,
  INITIAL_PHC_SYNC_TELEMETRY,
  INITIAL_MUTATION_QUEUE,
} from '@/lib/syncMonitoringData';

interface SyncMonitoringState {
  phcTelemetry: PhcSyncTelemetry[];
  mutationQueue: SyncMutationRecord[];
  /** Threshold in minutes after which a PHC is considered stale (default 60 mins) */
  staleThresholdMinutes: number;
  /** Percentage of stale PHCs that triggers a portal-wide warning banner (default 25%) */
  alertThresholdPct: number;
  /** Banner dismissed timestamp to prevent badgering user across navigation */
  bannerDismissedUntil: number | null;

  // Actions
  triggerManualPhcSync: (phcId: string) => void;
  resolveConflict: (mutationId: string, resolutionAction: 'force_accept' | 'discard') => void;
  dismissStaleBanner: (durationMinutes?: number) => void;
  resetTelemetryToDefault: () => void;
}

export const useSyncMonitoringStore = create<SyncMonitoringState>()(
  persist(
    (set, get) => ({
      phcTelemetry: INITIAL_PHC_SYNC_TELEMETRY,
      mutationQueue: INITIAL_MUTATION_QUEUE,
      staleThresholdMinutes: 60,
      alertThresholdPct: 25,
      bannerDismissedUntil: null,

      triggerManualPhcSync: (phcId: string) => {
        const nowIso = new Date().toISOString();
        set((state) => ({
          phcTelemetry: state.phcTelemetry.map((item) =>
            item.phcId === phcId
              ? {
                  ...item,
                  lastSync: nowIso,
                  lastSuccessfulSync: nowIso,
                  deviceStatus: 'online',
                  offlineDurationMinutes: 0,
                  pendingMutationCount: 0,
                  failedMutationCount: 0,
                  conflictCount: 0,
                }
              : item
          ),
          // Clear any rejected mutations for that PHC
          mutationQueue: state.mutationQueue.map((m) =>
            m.phcId === phcId ? { ...m, syncStatus: 'accepted' as const, errorCode: null } : m
          ),
        }));
      },

      resolveConflict: (mutationId: string, resolutionAction: 'force_accept' | 'discard') => {
        set((state) => {
          const target = state.mutationQueue.find((m) => m.mutationId === mutationId);
          if (!target) return state;

          const updatedQueue = state.mutationQueue.map((m) =>
            m.mutationId === mutationId
              ? {
                  ...m,
                  syncStatus: resolutionAction === 'force_accept' ? ('accepted' as const) : ('rejected' as const),
                  errorMessage: resolutionAction === 'force_accept' ? 'Conflict manually overridden by Officer' : 'Conflict discarded by Officer',
                }
              : m
          );

          // Decrement conflictCount on the PHC
          const updatedTelemetry = state.phcTelemetry.map((phc) =>
            phc.phcId === target.phcId
              ? {
                  ...phc,
                  conflictCount: Math.max(0, phc.conflictCount - 1),
                }
              : phc
          );

          return {
            mutationQueue: updatedQueue,
            phcTelemetry: updatedTelemetry,
          };
        });
      },

      dismissStaleBanner: (durationMinutes = 30) => {
        set({ bannerDismissedUntil: Date.now() + durationMinutes * 60 * 1000 });
      },

      resetTelemetryToDefault: () => {
        set({
          phcTelemetry: INITIAL_PHC_SYNC_TELEMETRY,
          mutationQueue: INITIAL_MUTATION_QUEUE,
          bannerDismissedUntil: null,
        });
      },
    }),
    {
      name: 'sync_monitoring_store_v1',
    }
  )
);
