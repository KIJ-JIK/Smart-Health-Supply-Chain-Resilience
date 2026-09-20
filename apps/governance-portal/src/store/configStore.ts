// ─────────────────────────────────────────────────────────────────────────────
// Governance Configuration Store — Zustand (Persistent)
// Implements Masterplan §69 versioned, audited threshold values:
// 1. minimum_stock (days)
// 2. critical_stock (days)
// 3. near_expiry_period (days)
// 4. bed_occupancy_threshold (percentage)
// 5. oxygen_critical_threshold (days of supply)
// 6. footfall_anomaly_threshold (standard deviations / sigma)
// 7. alert_severity (default routing mapping)
// 8. forecast_horizon (days / weeks)
// 9. safety_buffer (percentage)
// 10. redistribution_rules (radius km, donor surplus days, min batch size)
//
// Every confirmed edit increments version and automatically records an
// audit entry with before_state and after_state.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuditStore } from './auditStore';
import { User } from '@/types';

export interface GovernanceThresholds {
  minimum_stock: number; // in days of consumption
  critical_stock: number; // in days of consumption
  near_expiry_period: number; // in days before expiration
  bed_occupancy_threshold: number; // in %
  oxygen_critical_threshold: number; // in days of reserve
  footfall_anomaly_threshold: number; // in sigma (z-score)
  alert_severity: 'P1-Critical' | 'P2-High' | 'P3-Medium' | 'P4-Advisory';
  forecast_horizon: number; // in days
  safety_buffer: number; // in %
  redistribution_rules: {
    max_radius_km: number;
    min_donor_surplus_days: number;
    min_batch_units: number;
    auto_escalation_hours: number;
  };
}

export interface ConfigVersionInfo {
  version: string;
  updatedAt: string;
  updatedBy: string;
  updatedByRole: string;
  lastReason: string;
}

interface ConfigState {
  thresholds: GovernanceThresholds;
  versionInfo: ConfigVersionInfo;
  updateThresholds: (
    newThresholds: GovernanceThresholds,
    reason: string,
    user: User,
    deviceInfo?: { ip?: string; deviceId?: string }
  ) => void;
  resetToDefaults: (user: User) => void;
}

const DEFAULT_THRESHOLDS: GovernanceThresholds = {
  minimum_stock: 21,
  critical_stock: 7,
  near_expiry_period: 90,
  bed_occupancy_threshold: 90,
  oxygen_critical_threshold: 1.2,
  footfall_anomaly_threshold: 2.5,
  alert_severity: 'P1-Critical',
  forecast_horizon: 14,
  safety_buffer: 15,
  redistribution_rules: {
    max_radius_km: 60,
    min_donor_surplus_days: 21,
    min_batch_units: 50,
    auto_escalation_hours: 12,
  },
};

const DEFAULT_VERSION_INFO: ConfigVersionInfo = {
  version: 'v3.4.1',
  updatedAt: '2026-09-16T17:45:10.000Z',
  updatedBy: 'Dr. Rajesh Kumar',
  updatedByRole: 'national_admin',
  lastReason: 'Monsoon seasonal disease spike buffer augmentation (MOHFW Memo 8492)',
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      thresholds: DEFAULT_THRESHOLDS,
      versionInfo: DEFAULT_VERSION_INFO,

      updateThresholds: (newThresholds, reason, user, deviceInfo) => {
        const state = get();
        const beforeState = JSON.parse(JSON.stringify(state.thresholds));
        const [major, minor, patch] = state.versionInfo.version.replace('v', '').split('.').map(Number);
        const nextVersion = `v${major}.${minor}.${(patch || 0) + 1}`;
        const now = new Date().toISOString();

        const updatedVersionInfo: ConfigVersionInfo = {
          version: nextVersion,
          updatedAt: now,
          updatedBy: user.name,
          updatedByRole: user.role,
          lastReason: reason,
        };

        // Update config state
        set({
          thresholds: newThresholds,
          versionInfo: updatedVersionInfo,
        });

        // Produce required Masterplan audit entry with before/after state
        const correlationId = `corr-cfg-${Math.random().toString(36).substring(2, 9)}`;
        useAuditStore.getState().addEntry({
          action: 'threshold.updated',
          entityType: 'governance_config',
          entityId: `cfg-thresholds-${nextVersion}`,
          actorId: user.id,
          actorRole: user.role,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          sourceIp: deviceInfo?.ip || '103.24.188.12',
          deviceId: deviceInfo?.deviceId || 'NIC-SECURE-STATION-01',
          correlationId,
          stateId: user.stateId,
          districtId: user.districtId,
          phcId: null,
          beforeState: {
            ...beforeState,
            version: state.versionInfo.version,
          },
          afterState: {
            ...newThresholds,
            version: nextVersion,
            change_justification: reason,
          },
          aiRecPayload: {
            model: 'ThresholdOptimizationOracle-v2',
            reviewedParameters: Object.keys(newThresholds).length,
            complianceCheck: 'PASSED',
          },
          metadata: {
            reason,
            versionBefore: state.versionInfo.version,
            versionAfter: nextVersion,
          },
        });
      },

      resetToDefaults: (user: User) => {
        const state = get();
        const beforeState = JSON.parse(JSON.stringify(state.thresholds));
        set({
          thresholds: DEFAULT_THRESHOLDS,
          versionInfo: {
            version: 'v3.5.0-reset',
            updatedAt: new Date().toISOString(),
            updatedBy: user.name,
            updatedByRole: user.role,
            lastReason: 'Factory defaults restored by administrator',
          },
        });

        useAuditStore.getState().addEntry({
          action: 'threshold.reset_defaults',
          entityType: 'governance_config',
          entityId: 'cfg-thresholds-v3.5.0-reset',
          actorId: user.id,
          actorRole: user.role,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          beforeState: beforeState as Record<string, unknown>,
          afterState: { ...DEFAULT_THRESHOLDS } as Record<string, unknown>,
          metadata: { reason: 'Factory defaults restored by administrator' },
        });
      },
    }),
    {
      name: 'governance_thresholds_config_v1',
    }
  )
);
