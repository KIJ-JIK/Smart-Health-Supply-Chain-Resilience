'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { useSyncMonitoringStore } from '@/store/syncMonitoringStore';
import { AlertTriangle, RefreshCw, X, ChevronRight, WifiOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function StalePhcSyncBanner() {
  const { user } = useAuthStore();
  const { stateId, districtId } = useScopeStore();
  const {
    phcTelemetry,
    staleThresholdMinutes,
    alertThresholdPct,
    bannerDismissedUntil,
    dismissStaleBanner,
  } = useSyncMonitoringStore();

  const isDismissed = Boolean(bannerDismissedUntil && Date.now() < bannerDismissedUntil);
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

  // Compute scoped PHCs
  const scopedPhcs = useMemo(() => {
    return phcTelemetry.filter((phc) => {
      if (user.role === 'district_admin' && user.districtId) {
        return phc.districtId === user.districtId;
      }
      if (user.role === 'state_admin' && user.stateId) {
        return phc.stateId === user.stateId;
      }
      // national_admin or active scope selection
      if (districtId) return phc.districtId === districtId;
      if (stateId) return phc.stateId === stateId;
      return true;
    });
  }, [phcTelemetry, user, stateId, districtId]);

  // Compute stale PHCs in current scope
  const stalePhcs = useMemo(() => {
    const now = Date.now();
    return scopedPhcs.filter((phc) => {
      const syncTime = new Date(phc.lastSync).getTime();
      const diffMins = Math.floor((now - syncTime) / 60000);
      return diffMins >= staleThresholdMinutes || phc.deviceStatus === 'offline';
    });
  }, [scopedPhcs, staleThresholdMinutes]);

  const totalCount = scopedPhcs.length;
  const staleCount = stalePhcs.length;
  const stalePct = totalCount > 0 ? Math.round((staleCount / totalCount) * 100) : 0;

  // Banner is triggered SPARINGLY: only when stale share exceeds alertThresholdPct and not dismissed
if (!mounted) return null;
  if (isDismissed || totalCount === 0 || stalePct < alertThresholdPct) {
    return null;
  }

  return (
    <div
      id="stale-phc-sync-banner"
      style={{
        background: 'linear-gradient(90deg, #7c2d12 0%, #b45309 50%, #7c2d12 100%)',
        color: '#fff',
        padding: '7px 18px',
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        boxShadow: '0 2px 8px rgba(180, 83, 9, 0.35)',
        zIndex: 90,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <WifiOff size={13} color="#fef08a" />
        </span>
        <span style={{ letterSpacing: '0.02em', textTransform: 'uppercase', color: '#fef08a', fontWeight: 700 }}>
          Telemetry Stale Warning:
        </span>
        <span>
          <strong>{staleCount} of {totalCount} PHCs ({stalePct}%)</strong> in your jurisdiction haven&apos;t synced in over {staleThresholdMinutes} minutes.
          Portal numbers may reflect cached offline state.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          href="/admin?tab=sync"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: 4,
            color: '#fff',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Inspect Sync Health <ChevronRight size={12} />
        </Link>

        <button
          onClick={() => dismissStaleBanner(30)}
          title="Dismiss warning for 30 minutes"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
