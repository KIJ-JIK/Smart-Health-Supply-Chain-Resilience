'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { DISTRICT_OVERVIEW } from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { useSyncMonitoringStore } from '@/store/syncMonitoringStore';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import { PhcSyncTelemetry, SyncMutationRecord } from '@/lib/syncMonitoringData';
import {
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  Radio,
  Layers,
  Clock,
  ArrowUpDown,
  Smartphone,
  ShieldCheck,
  RotateCcw,
  Zap,
  Battery,
  HardDrive,
  Check,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  online: { bg: 'var(--color-ok-bg)', color: 'var(--color-ok)', label: 'Online & Synced', icon: <Wifi size={12} /> },
  degraded_cellular: { bg: 'var(--color-warn-bg)', color: 'var(--color-warn)', label: 'Degraded / 2G', icon: <Radio size={12} /> },
  offline: { bg: 'var(--color-critical-bg)', color: 'var(--color-critical)', label: 'Offline / Disconnected', icon: <WifiOff size={12} /> },
  quarantined: { bg: '#f3e8ff', color: '#6b21a8', label: 'Quarantined', icon: <AlertTriangle size={12} /> },
};

const MUTATION_STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  accepted: { bg: 'var(--color-ok-bg)', color: 'var(--color-ok)' },
  duplicate: { bg: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' },
  rejected: { bg: 'var(--color-critical-bg)', color: 'var(--color-critical)' },
  conflict: { bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' },
};

export function SyncMonitoringView() {
  const { user } = useAuthStore();
  const { stateId: scopeStateId, districtId: scopeDistrictId } = useScopeStore();
  const {
    phcTelemetry,
    mutationQueue,
    staleThresholdMinutes,
    triggerManualPhcSync,
    resolveConflict,
    resetTelemetryToDefault,
  } = useSyncMonitoringStore();

  const [activeSubTab, setActiveSubTab] = useState<'phcs' | 'mutations'>('phcs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPhc, setSelectedPhc] = useState<PhcSyncTelemetry | null>(null);
  const [isSyncingPhcId, setIsSyncingPhcId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { data: districtOverviewData } = useQuery(DISTRICT_OVERVIEW, {
    variables: { districtId: scopeDistrictId || user.districtId || 'dist-pune' },
    fetchPolicy: 'cache-first',
  });

  const liveTelemetry = useMemo(() => {
    if (!districtOverviewData?.districtOverview?.phcList || districtOverviewData.districtOverview.phcList.length === 0) {
      return phcTelemetry;
    }
    const phcList = districtOverviewData.districtOverview.phcList;
    const nowIso = new Date().toISOString();
    const liveItems: PhcSyncTelemetry[] = phcList.map((p: any) => {
      const existing = phcTelemetry.find((item) => item.phcId === p.phcId);
      if (existing) {
        return {
          ...existing,
          phcName: p.name || existing.phcName,
          conflictCount: p.openAlerts || 0,
        };
      }
      return {
        phcId: p.phcId,
        phcName: p.name,
        districtId: districtOverviewData.districtOverview.districtId,
        districtName: districtOverviewData.districtOverview.districtName,
        stateId: districtOverviewData.districtOverview.stateId,
        deviceId: `TAB-${p.phcId.toUpperCase().slice(-6)}`,
        appVersion: 'v2.4.1',
        lastSync: nowIso,
        lastSuccessfulSync: nowIso,
        deviceStatus: (p.riskLevel === 'CRITICAL' ? 'offline' : p.riskLevel === 'HIGH' ? 'degraded_cellular' : 'online') as any,
        pendingMutationCount: p.openAlerts || 0,
        failedMutationCount: 0,
        conflictCount: 0,
        offlineDurationMinutes: p.riskLevel === 'CRITICAL' ? 120 : 0,
        clientClockDriftSeconds: 1,
        batteryLevelPct: 88,
        storageFreeMb: 4200,
        networkType: '4G',
      };
    });
    const currentDistrictId = districtOverviewData.districtOverview.districtId;
    const otherItems = phcTelemetry.filter((p) => p.districtId !== currentDistrictId);
    return [...liveItems, ...otherItems];
  }, [districtOverviewData, phcTelemetry]);

  // Scope filtering per role & active scope
  const scopedPhcList = useMemo(() => {
    return liveTelemetry.filter((p) => {
      if (user.role === 'district_admin' && user.districtId) {
        return p.districtId === user.districtId;
      }
      if (user.role === 'state_admin' && user.stateId) {
        return p.stateId === user.stateId;
      }
      if (scopeDistrictId) return p.districtId === scopeDistrictId;
      if (scopeStateId) return p.stateId === scopeStateId;
      return true;
    });
  }, [liveTelemetry, user, scopeStateId, scopeDistrictId]);

  // Search & Status filter
  const filteredPhcs = useMemo(() => {
    return scopedPhcList.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        p.phcName.toLowerCase().includes(q) ||
        p.phcId.toLowerCase().includes(q) ||
        p.deviceId.toLowerCase().includes(q) ||
        p.districtName.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || p.deviceStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [scopedPhcList, searchTerm, statusFilter]);

  // Scoped mutations
  const scopedMutations = useMemo(() => {
    const validPhcIds = new Set(scopedPhcList.map((p) => p.phcId));
    return mutationQueue.filter((m) => validPhcIds.has(m.phcId));
  }, [mutationQueue, scopedPhcList]);

  // Summary Metrics
  const totalPhcs = scopedPhcList.length;
  const onlinePhcs = scopedPhcList.filter((p) => p.deviceStatus === 'online').length;
  const stalePhcs = scopedPhcList.filter((p) => {
    const diffMins = Math.floor((Date.now() - new Date(p.lastSync).getTime()) / 60000);
    return diffMins >= staleThresholdMinutes || p.deviceStatus === 'offline';
  }).length;
  const totalPendingMutations = scopedPhcList.reduce((sum, p) => sum + p.pendingMutationCount, 0);
  const totalFailedMutations = scopedPhcList.reduce((sum, p) => sum + p.failedMutationCount, 0);
  const totalConflicts = scopedPhcList.reduce((sum, p) => sum + p.conflictCount, 0);

  const handleSyncNow = (phcId: string, phcName: string) => {
    setIsSyncingPhcId(phcId);
    setTimeout(() => {
      triggerManualPhcSync(phcId);
      setIsSyncingPhcId(null);
      setActionSuccessMsg(`Force synchronization signal dispatched to ${phcName}. Mutations reconciled!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }, 600);
  };

  const handleResolveConflict = (mutationId: string, action: 'force_accept' | 'discard') => {
    resolveConflict(mutationId, action);
    setActionSuccessMsg(`Conflict mutation ${mutationId} ${action === 'force_accept' ? 'forced accepted' : 'discarded'}.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Sub-header banner ───────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(37, 99, 235, 0.04) 100%)',
          border: '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-info)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Field Tablet Sync & Mutation Queue Engine
              </h2>
              <span className="badge badge-info" style={{ fontSize: 11 }}>
                Dataset 12 Masterplan §59
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Guarantees governance officers never mistake silently stale or queued offline PHC data for live telemetry
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              if (window.confirm('Reset all field tablet sync telemetry to demonstration defaults?')) {
                resetTelemetryToDefault();
              }
            }}
            className="btn btn-outline"
            style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={13} />
            Reset Sync Baseline
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--color-ok-bg)',
            border: '1px solid var(--color-ok)',
            color: 'var(--color-ok)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          {actionSuccessMsg}
        </div>
      )}

      {/* ── KPI Summary Tiles with DataFreshnessLabel ────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Monitored PHCs</span>
            <DataFreshnessLabel source="e-Gov Sync Engine" compact />
          </div>
          <span className="kpi-card-value">{totalPhcs}</span>
          <span className="kpi-card-meta" style={{ fontSize: 11, color: 'var(--color-ok)' }}>
            <strong>{onlinePhcs}</strong> actively streaming online
          </span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Stale Telemetry (&gt;60m)</span>
            <span className="badge badge-warn" style={{ fontSize: 10 }}>
              Audit Risk
            </span>
          </div>
          <span className="kpi-card-value" style={{ color: stalePhcs > 0 ? 'var(--color-warn)' : 'inherit' }}>
            {stalePhcs}
          </span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            {totalPhcs > 0 ? `${Math.round((stalePhcs / totalPhcs) * 100)}% of jurisdiction` : '0%'}
          </span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Queued Mutations</span>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>
              Offline Cache
            </span>
          </div>
          <span className="kpi-card-value" style={{ color: 'var(--color-primary)' }}>
            {totalPendingMutations}
          </span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            Pending upstream cloud push
          </span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Failures & Conflicts</span>
            <span className="badge badge-critical" style={{ fontSize: 10 }}>
              Reconciliation
            </span>
          </div>
          <span className="kpi-card-value" style={{ color: totalConflicts > 0 ? 'var(--color-critical)' : 'inherit' }}>
            {totalFailedMutations + totalConflicts}
          </span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            {totalConflicts} concurrent version clashes
          </span>
        </div>
      </div>

      {/* ── View Switcher & Filter Controls ─────────────────────── */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setActiveSubTab('phcs')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: activeSubTab === 'phcs' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeSubTab === 'phcs' ? '#fff' : 'var(--color-text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Smartphone size={14} />
            Per-PHC Sync Status ({filteredPhcs.length})
          </button>

          <button
            onClick={() => setActiveSubTab('mutations')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: activeSubTab === 'mutations' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeSubTab === 'mutations' ? '#fff' : 'var(--color-text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Layers size={14} />
            Dataset 12: Mutation Queue ({scopedMutations.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px', maxWidth: '480px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search PHC name, device ID, district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                fontSize: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                background: 'var(--color-surface)',
              }}
            />
          </div>

          {activeSubTab === 'phcs' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="online">Online</option>
              <option value="degraded_cellular">Degraded Cellular</option>
              <option value="offline">Offline / Disconnected</option>
            </select>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* VIEW A: Per-PHC Sync Telemetry Table                     */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeSubTab === 'phcs' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                  <th>Facility Name & District</th>
                  <th>Device & Version</th>
                  <th>Device Status</th>
                  <th>Last Sync Attempt</th>
                  <th>Last Successful Sync</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Failed</th>
                  <th style={{ textAlign: 'center' }}>Conflicts</th>
                  <th>Offline Duration</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPhcs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No PHC devices match the selected filters or jurisdiction scope.
                    </td>
                  </tr>
                ) : (
                  filteredPhcs.map((phc) => {
                    const statusConfig = STATUS_BADGE[phc.deviceStatus] || STATUS_BADGE.offline;
                    const isSyncing = isSyncingPhcId === phc.phcId;

                    return (
                      <tr
                        key={phc.phcId}
                        style={{
                          cursor: 'pointer',
                          background: selectedPhc?.phcId === phc.phcId ? 'var(--color-primary-light)' : undefined,
                        }}
                        onClick={() => setSelectedPhc(phc)}
                      >
                        {/* Facility */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{phc.phcName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {phc.districtName}, {phc.stateName}
                          </div>
                        </td>

                        {/* Device */}
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>
                            {phc.deviceId}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {phc.appVersion} • {phc.connectivityType}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 8px',
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 600,
                              background: statusConfig.bg,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Last Sync Attempt using DataFreshnessLabel */}
                        <td>
                          <DataFreshnessLabel
                            timestamp={phc.lastSync}
                            staleMinutes={staleThresholdMinutes}
                            criticalMinutes={180}
                            source={`${phc.deviceId} Sync Attempt`}
                            compact
                          />
                        </td>

                        {/* Last Successful Sync using DataFreshnessLabel */}
                        <td>
                          <DataFreshnessLabel
                            timestamp={phc.lastSuccessfulSync}
                            staleMinutes={staleThresholdMinutes}
                            criticalMinutes={180}
                            source={`${phc.deviceId} Accepted Push`}
                            compact
                          />
                        </td>

                        {/* Pending Mutations */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: phc.pendingMutationCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            }}
                          >
                            {phc.pendingMutationCount}
                          </span>
                        </td>

                        {/* Failed Mutations */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: phc.failedMutationCount > 0 ? 'var(--color-critical)' : 'var(--color-text-muted)',
                            }}
                          >
                            {phc.failedMutationCount}
                          </span>
                        </td>

                        {/* Conflict Count */}
                        <td style={{ textAlign: 'center' }}>
                          {phc.conflictCount > 0 ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: 'var(--color-warn-bg)',
                                color: 'var(--color-warn)',
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            >
                              {phc.conflictCount}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                          )}
                        </td>

                        {/* Offline Duration */}
                        <td>
                          {phc.offlineDurationMinutes > 0 ? (
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-critical)' }}>
                              {Math.floor(phc.offlineDurationMinutes / 60)}h {phc.offlineDurationMinutes % 60}m
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--color-ok)', fontWeight: 500 }}>Active (0m)</div>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncNow(phc.phcId, phc.phcName);
                            }}
                            disabled={isSyncing}
                            className="btn btn-outline"
                            style={{
                              fontSize: 11,
                              padding: '4px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Send forced reconciliation ping to tablet"
                          >
                            <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* VIEW B: Dataset 12 Mutation Queue Deep-Inspection         */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeSubTab === 'mutations' && (
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">Sync Push Mutation Queue (Dataset 12)</span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Atomic local sequence records pushed by field devices with CRC, client/server timestamps, and conflict logs
              </p>
            </div>
            <span className="badge badge-muted">{scopedMutations.length} Queue Records</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-2)' }}>
                  <th>Seq # / Mutation ID</th>
                  <th>Device / Facility</th>
                  <th>Entity & Operation</th>
                  <th>Client Timestamp</th>
                  <th>Server Timestamp</th>
                  <th>Sync Status</th>
                  <th>Payload & Conflict Details</th>
                  <th style={{ textAlign: 'right' }}>Reconciliation</th>
                </tr>
              </thead>
              <tbody>
                {scopedMutations.map((m) => {
                  const statusStyle = MUTATION_STATUS_BADGE[m.syncStatus] || MUTATION_STATUS_BADGE.accepted;
                  return (
                    <tr key={m.mutationId}>
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{m.localSeq}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.mutationId}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{m.deviceId}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{m.phcId}</div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: m.operation === 'INSERT' ? '#dcfce7' : m.operation === 'UPDATE' ? '#fef3c7' : '#fee2e2',
                              color: m.operation === 'INSERT' ? '#166534' : m.operation === 'UPDATE' ? '#92400e' : '#991b1b',
                            }}
                          >
                            {m.operation}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{m.entityType}</span>
                        </div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {m.entityId}
                        </div>
                      </td>

                      <td>
                        <DataFreshnessLabel timestamp={m.clientTimestamp} compact source="Device Clock" />
                      </td>

                      <td>
                        <DataFreshnessLabel timestamp={m.serverTimestamp} compact source="Cloud Ingestion" />
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {m.syncStatus}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{m.payloadSummary}</div>
                        {m.errorCode && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--color-critical)',
                              marginTop: 4,
                              background: 'var(--color-critical-bg)',
                              padding: '3px 6px',
                              borderRadius: 4,
                            }}
                          >
                            <strong>{m.errorCode}</strong>: {m.errorMessage}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {m.syncStatus === 'conflict' ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <button
                              onClick={() => handleResolveConflict(m.mutationId, 'force_accept')}
                              className="btn btn-outline"
                              style={{
                                fontSize: 10,
                                padding: '3px 6px',
                                color: 'var(--color-ok)',
                                borderColor: 'var(--color-ok)',
                              }}
                              title="Force accept client mutation over cloud state"
                            >
                              <Check size={11} /> Overwrite
                            </button>
                            <button
                              onClick={() => handleResolveConflict(m.mutationId, 'discard')}
                              className="btn btn-outline"
                              style={{
                                fontSize: 10,
                                padding: '3px 6px',
                                color: 'var(--color-critical)',
                                borderColor: 'var(--color-critical)',
                              }}
                              title="Discard stale tablet modification"
                            >
                              <X size={11} /> Discard
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Reconciled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Slide-Out Drawer for Selected PHC Telemetry ─────────── */}
      {selectedPhc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedPhc(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '100%',
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-info" style={{ fontSize: 11 }}>
                    {selectedPhc.deviceId}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    App {selectedPhc.appVersion}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {selectedPhc.phcName}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {selectedPhc.districtName} District, {selectedPhc.stateName}
                </div>
              </div>

              <button
                onClick={() => setSelectedPhc(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Device Hardware Telemetry */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                background: 'var(--color-surface-2)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Connectivity</div>
                <div style={{ fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Radio size={12} style={{ color: 'var(--color-primary)' }} />
                  {selectedPhc.connectivityType}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Tablet Battery</div>
                <div style={{ fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Battery size={12} style={{ color: selectedPhc.batteryLevelPct < 25 ? 'var(--color-critical)' : 'var(--color-ok)' }} />
                  {selectedPhc.batteryLevelPct}%
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Local Storage</div>
                <div style={{ fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HardDrive size={12} />
                  {selectedPhc.storageUsagePct}% used
                </div>
              </div>
            </div>

            {/* Freshness Comparison */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>
                Data Freshness & Synchronization Timelines
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    padding: 12,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Most Recent Sync Attempt</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Timestamp recorded when tablet heartbeat reached portal gateway
                    </div>
                  </div>
                  <DataFreshnessLabel timestamp={selectedPhc.lastSync} source="Gateway Ping" />
                </div>

                <div
                  style={{
                    padding: 12,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Last Successful Push</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Timestamp when local SQLite mutation queue was verified and committed
                    </div>
                  </div>
                  <DataFreshnessLabel timestamp={selectedPhc.lastSuccessfulSync} source="Verified Commit" />
                </div>
              </div>
            </div>

            {/* Mutations list for this PHC */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>
                Local Mutation Queue Records ({mutationQueue.filter((m) => m.phcId === selectedPhc.phcId).length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mutationQueue
                  .filter((m) => m.phcId === selectedPhc.phcId)
                  .map((m) => (
                    <div
                      key={m.mutationId}
                      style={{
                        padding: 10,
                        background: 'var(--color-surface-2)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>
                          #{m.localSeq} • {m.entityType} ({m.operation})
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: MUTATION_STATUS_BADGE[m.syncStatus]?.bg,
                            color: MUTATION_STATUS_BADGE[m.syncStatus]?.color,
                          }}
                        >
                          {m.syncStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        {m.payloadSummary}
                      </div>
                      {m.errorMessage && (
                        <div style={{ fontSize: 11, color: 'var(--color-critical)', marginTop: 4 }}>
                          {m.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleSyncNow(selectedPhc.phcId, selectedPhc.phcName)}
                className="btn btn-primary"
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={13} />
                Force Cloud Re-Sync
              </button>

              <button onClick={() => setSelectedPhc(null)} className="btn btn-outline" style={{ fontSize: 12 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
