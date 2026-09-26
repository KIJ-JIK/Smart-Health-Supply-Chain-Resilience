'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { AUDIT_LOG } from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { useAuditStore } from '@/store/auditStore';
import { useScopeStore } from '@/store/scopeStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import type { AuditEntry, UserRole } from '@/types';
import {
  Search,
  Filter,
  ShieldCheck,
  Cpu,
  FileCode,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Laptop,
  Network,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
} from 'lucide-react';

const ROLE_BADGE: Record<string, string> = {
  national_admin: 'badge-critical',
  state_admin: 'badge-warn',
  district_admin: 'badge-info',
};

const ACTION_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'threshold.updated': { bg: '#e0e7ff', color: '#3730a3', label: 'Threshold Update' },
  'redistribution.approved': { bg: 'var(--color-ok-bg)', color: 'var(--color-ok)', label: 'Redistribution Approved' },
  'redistribution.rejected': { bg: 'var(--color-critical-bg)', color: 'var(--color-critical)', label: 'Redistribution Rejected' },
  'redistribution.modified': { bg: 'var(--color-warn-bg)', color: 'var(--color-warn)', label: 'Redistribution Modified' },
  'crisis_mode.activated': { bg: '#fee2e2', color: '#991b1b', label: 'Crisis Mode Activated' },
  'alert.acknowledged': { bg: '#e0f2fe', color: '#0369a1', label: 'Alert Acknowledged' },
  'report.exported': { bg: '#f3e8ff', color: '#6b21a8', label: 'Report Exported' },
  'shipment.rerouted': { bg: '#fef3c7', color: '#92400e', label: 'Shipment Rerouted' },
  'user.created': { bg: '#ecfdf5', color: '#065f46', label: 'User Created' },
  'role.permission_verified': { bg: '#f1f5f9', color: '#475569', label: 'Permission Verified' },
  'threshold.reset_defaults': { bg: '#fecaca', color: '#dc2626', label: 'Threshold Reset' },
};

export default function AuditPage() {
  const { user } = useAuthStore();
  const { level, stateId: scopeStateId, districtId: scopeDistrictId } = useScopeStore();
  const { entries, resetToDefaults } = useAuditStore();

  const { data: liveAuditData, loading: liveAuditLoading, refetch: refetchAudit } = useQuery(AUDIT_LOG, {
    fetchPolicy: 'cache-and-network',
  });

  // Effective entries prioritizing authoritative PostgreSQL audit_log entries
  const effectiveEntries = useMemo(() => {
    if (liveAuditData?.auditLog && liveAuditData.auditLog.length > 0) {
      const dbEntries: AuditEntry[] = liveAuditData.auditLog.map((l: any) => ({
        auditId: l.auditId || l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        actorId: l.userId || l.actorId || 'system',
        actorRole: (l.userRole || l.actorRole || 'national_admin') as UserRole,
        userId: l.userId || l.actorId || 'usr-system',
        userName: l.userName || l.actorId || 'System Operator',
        userRole: (l.userRole || l.actorRole || 'national_admin') as UserRole,
        createdAt: l.timestamp || l.createdAt || new Date().toISOString(),
        timestamp: l.timestamp || l.createdAt || new Date().toISOString(),
        sourceIp: l.ipAddress || l.sourceIp || '127.0.0.1',
        deviceId: l.deviceId || 'GATEWAY-NODE-01',
        metadata: l.metadata || {},
        phcId: l.phcId || null,
        districtId: l.districtId || null,
        stateId: l.stateId || null,
      }));
      const existingIds = new Set(dbEntries.map((e) => e.auditId));
      const additionalStoreEntries = entries.filter((e) => !existingIds.has(e.auditId));
      return [...dbEntries, ...additionalStoreEntries];
    }
    return entries;
  }, [liveAuditData, entries]);

  // Enforce: clamp scope IDs to the user's jurisdiction boundary
  const scope = useMemo(
    () => getEnforcedScope(user, { level, stateId: scopeStateId, districtId: scopeDistrictId }),
    [user, level, scopeStateId, scopeDistrictId]
  );

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actorRoleFilter, setActorRoleFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── Scoping Logic per User Role & Jurisdiction (Masterplan §69) ─────────
  // - national_admin: sees all entries across all states/districts
  // - state_admin: sees only entries within their state (or where stateId matches)
  // - district_admin: sees only entries within their district (or where districtId matches)
  const scopedEntries = useMemo(() => {
    return effectiveEntries.filter((entry) => {
      if (user.role === 'national_admin') {
        // Can optionally filter by scope bar if selected (uses enforced stateId, not raw store)
        if (scope.stateId && entry.stateId && entry.stateId !== scope.stateId) return false;
        if (scope.districtId && entry.districtId && entry.districtId !== scope.districtId) return false;
        return true;
      }

      if (user.role === 'state_admin') {
        // Must match enforced state jurisdiction (uses user.stateId via enforcer, not raw store)
        const userState = scope.stateId;
        if (!userState) return true;
        return entry.stateId === userState;
      }

      if (user.role === 'district_admin') {
        // Must match enforced district jurisdiction
        const userDistrict = scope.districtId;
        if (!userDistrict) return false;
        return entry.districtId === userDistrict;
      }

      return false;
    });
  }, [effectiveEntries, user, scope.stateId, scope.districtId]);

  // Apply search and dropdown filters
  const filteredEntries = useMemo(() => {
    return scopedEntries.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        e.action.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.entityId.toLowerCase().includes(q) ||
        (e.userName && e.userName.toLowerCase().includes(q)) ||
        (e.actorId && e.actorId.toLowerCase().includes(q)) ||
        (e.correlationId && e.correlationId.toLowerCase().includes(q)) ||
        (e.sourceIp && e.sourceIp.toLowerCase().includes(q));

      const matchAction = actionFilter === 'ALL' || e.action === actionFilter;
      const matchEntity = entityFilter === 'ALL' || e.entityType === entityFilter;
      const matchRole =
        actorRoleFilter === 'ALL' || (e.actorRole || e.userRole) === actorRoleFilter;

      return matchSearch && matchAction && matchEntity && matchRole;
    });
  }, [scopedEntries, searchTerm, actionFilter, entityFilter, actorRoleFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(scopedEntries.map((e) => e.action)));
  }, [scopedEntries]);

  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(scopedEntries.map((e) => e.entityType)));
  }, [scopedEntries]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ margin: 0 }}>Governance Audit Log</h1>
              <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} />
                Cryptographically Chained & Scoped
              </span>
            </div>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
              Immutable statutory record of all clinical threshold adjustments, AI recommendations, and supply reallocation decisions
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>Jurisdiction Scope:</span>
              <strong style={{ textTransform: 'capitalize' }}>
                {user.role === 'national_admin'
                  ? 'National (All Jurisdictions)'
                  : user.role === 'state_admin'
                  ? `State: ${user.stateId ?? 'Assigned State'}`
                  : `District: ${user.districtId ?? 'Assigned District'}`}
              </strong>
            </div>

            <button
              onClick={() => {
                refetchAudit();
                resetToDefaults();
              }}
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Refresh audit records from PostgreSQL"
            >
              <RefreshCw size={14} />
              {liveAuditLoading ? 'Syncing...' : 'Refresh Log'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Counters ───────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <span className="kpi-card-label">Visible Audit Entries</span>
          <span className="kpi-card-value">{scopedEntries.length}</span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            Filtered to role jurisdiction
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card-label">AI Payloads Logged</span>
          <span className="kpi-card-value" style={{ color: 'var(--color-primary)' }}>
            {scopedEntries.filter((e) => e.aiRecPayload).length}
          </span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            Includes model & confidence
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card-label">Threshold Config Edits</span>
          <span className="kpi-card-value" style={{ color: '#6366f1' }}>
            {scopedEntries.filter((e) => e.action.startsWith('threshold.')).length}
          </span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            Masterplan §69 parameters
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card-label">Resource Decisions</span>
          <span className="kpi-card-value" style={{ color: 'var(--color-ok)' }}>
            {scopedEntries.filter((e) => e.action.startsWith('redistribution.')).length}
          </span>
          <span className="kpi-card-meta text-muted" style={{ fontSize: 11 }}>
            Mandatory human review trail
          </span>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1, minWidth: 320 }}>
          {/* Search box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              maxWidth: 360,
            }}
          >
            <Search
              size={15}
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
              placeholder="Search actions, actors, IP, correlation ID, entity..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                fontSize: 13,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                background: 'var(--color-surface)',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="ALL">All Actions ({scopedEntries.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="ALL">All Entity Types</option>
            {uniqueEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>

          {/* Actor Role Filter */}
          <select
            value={actorRoleFilter}
            onChange={(e) => {
              setActorRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="national_admin">National Admin</option>
            <option value="state_admin">State Admin</option>
            <option value="district_admin">District Admin</option>
          </select>
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Showing <strong>{filteredEntries.length}</strong> matching entries
        </div>
      </div>

      {/* ── Main Audit Table ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ width: '140px' }}>Timestamp</th>
                <th style={{ width: '180px' }}>Action</th>
                <th>Actor & Role</th>
                <th>Entity Target</th>
                <th>Correlation / IP</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Telemetry & Diff</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No audit records match your jurisdiction or search filters.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => {
                  const actionStyle = ACTION_COLORS[entry.action] || {
                    bg: 'var(--color-surface-2)',
                    color: 'var(--color-text-secondary)',
                    label: entry.action,
                  };
                  const hasDiff = Boolean(entry.beforeState || entry.afterState);
                  const hasAi = Boolean(entry.aiRecPayload);

                  return (
                    <tr
                      key={entry.auditId}
                      style={{
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: selectedEntry?.auditId === entry.auditId ? 'var(--color-primary-light)' : undefined,
                      }}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* Timestamp */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>
                          {new Date(entry.createdAt || entry.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {new Date(entry.createdAt || entry.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: 11,
                            fontWeight: 600,
                            background: actionStyle.bg,
                            color: actionStyle.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.action}
                        </span>
                        {Boolean(entry.metadata?.reason) && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                              marginTop: 3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                            }}
                            title={String(entry.metadata?.reason)}
                          >
                            {String(entry.metadata?.reason)}
                          </div>
                        )}
                      </td>

                      {/* Actor & Role */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {entry.userName || entry.actorId || entry.userId}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span
                            className={`badge ${
                              ROLE_BADGE[entry.actorRole || entry.userRole] ?? 'badge-muted'
                            }`}
                            style={{ fontSize: 10, padding: '1px 6px' }}
                          >
                            {(entry.actorRole || entry.userRole).replace('_', ' ')}
                          </span>
                          {entry.districtId ? (
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                              • {entry.districtId}
                            </span>
                          ) : entry.stateId ? (
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                              • {entry.stateId}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>• National</span>
                          )}
                        </div>
                      </td>

                      {/* Entity Target */}
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>{entry.entityType}:</span>
                          <code>{entry.entityId}</code>
                        </div>
                        {entry.phcId && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            PHC: <strong>{entry.phcId}</strong>
                          </div>
                        )}
                      </td>

                      {/* Correlation & IP */}
                      <td>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                          {entry.correlationId ?? entry.auditId}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>IP: {entry.sourceIp ?? entry.ipAddress ?? '—'}</span>
                          {entry.deviceId && (
                            <span title={entry.deviceId} style={{ cursor: 'help' }}>
                              • Dev: {entry.deviceId.slice(0, 10)}…
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Telemetry & Diff */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {hasDiff && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: '2px 6px',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                              title="Contains before & after state snapshot"
                            >
                              <FileCode size={11} />
                              Diff
                            </span>
                          )}
                          {hasAi && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: '2px 6px',
                                background: 'var(--color-info-bg)',
                                color: 'var(--color-info)',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                              title="Includes AI recommendation payload & confidence"
                            >
                              <Sparkles size={11} />
                              AI Rec
                            </span>
                          )}
                          {!hasDiff && !hasAi && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>—</span>}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ─────────────────────────────────── */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
            {filteredEntries.length} total entries)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline"
              style={{ padding: '5px 10px', fontSize: 12 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (
                p === 1 ||
                p === totalPages ||
                (p >= currentPage - 1 && p <= currentPage + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '4px 9px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                      background: currentPage === p ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: currentPage === p ? '#fff' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontWeight: currentPage === p ? 700 : 400,
                    }}
                  >
                    {p}
                  </button>
                );
              }
              if (p === 2 && currentPage > 3) {
                return <span key="ellipsis-1" style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>…</span>;
              }
              if (p === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key="ellipsis-2" style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>…</span>;
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline"
              style={{ padding: '5px 10px', fontSize: 12 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── State Diff & Audit Inspector Drawer / Modal ─────────── */}
      {selectedEntry && (
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
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
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
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: ACTION_COLORS[selectedEntry.action]?.bg || 'var(--color-surface-2)',
                      color: ACTION_COLORS[selectedEntry.action]?.color || 'var(--color-text-primary)',
                    }}
                  >
                    {selectedEntry.action}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                    ID: {selectedEntry.auditId}
                  </span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Audit Record Deep-Inspection
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Masterplan §69 Verification Payload
                </div>
              </div>

              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Statutory Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                padding: '14px',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Actor Identity</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{selectedEntry.userName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  ID: <code>{selectedEntry.actorId || selectedEntry.userId}</code>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Jurisdiction Role</div>
                <div style={{ marginTop: 2 }}>
                  <span className={`badge ${ROLE_BADGE[selectedEntry.actorRole || selectedEntry.userRole] ?? 'badge-muted'}`}>
                    {(selectedEntry.actorRole || selectedEntry.userRole).replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {selectedEntry.districtId
                    ? `District: ${selectedEntry.districtId}`
                    : selectedEntry.stateId
                    ? `State: ${selectedEntry.stateId}`
                    : 'National Authority'}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Timestamp (ISO)</div>
                <div style={{ fontFamily: 'monospace', marginTop: 2 }}>
                  {new Date(selectedEntry.createdAt || selectedEntry.timestamp).toLocaleString('en-IN', {
                    timeZoneName: 'short',
                  })}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Network & Device</div>
                <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Network size={12} style={{ color: 'var(--color-text-muted)' }} />
                  <span>IP: {selectedEntry.sourceIp || selectedEntry.ipAddress || '—'}</span>
                </div>
                {selectedEntry.deviceId && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Laptop size={12} />
                    <span>{selectedEntry.deviceId}</span>
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Correlation ID</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {selectedEntry.correlationId || '—'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Entity Target</div>
                <div style={{ fontWeight: 600 }}>
                  {selectedEntry.entityType} ➔ <code>{selectedEntry.entityId}</code>
                </div>
              </div>
            </div>

            {/* Before vs After State Inspector */}
            {(selectedEntry.beforeState || selectedEntry.afterState) && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FileCode size={16} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                    State Transition Snapshot (Before / After)
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Before State */}
                  <div
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      background: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                      Before State
                    </div>
                    {selectedEntry.beforeState ? (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontFamily: 'monospace',
                          background: 'var(--color-surface-2)',
                          padding: 10,
                          borderRadius: 4,
                          overflowX: 'auto',
                          maxHeight: '260px',
                        }}
                      >
                        {JSON.stringify(selectedEntry.beforeState, null, 2)}
                      </pre>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                        (None — Entity created)
                      </div>
                    )}
                  </div>

                  {/* After State */}
                  <div
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      background: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ok)', marginBottom: 6, textTransform: 'uppercase' }}>
                      After State (Applied)
                    </div>
                    {selectedEntry.afterState ? (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontFamily: 'monospace',
                          background: 'var(--color-surface-2)',
                          padding: 10,
                          borderRadius: 4,
                          overflowX: 'auto',
                          maxHeight: '260px',
                        }}
                      >
                        {JSON.stringify(selectedEntry.afterState, null, 2)}
                      </pre>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                        (None — Entity deleted/purged)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendation Payload */}
            {selectedEntry.aiRecPayload && (
              <div
                style={{
                  border: '1px solid #c7d2fe',
                  background: '#f5f3ff',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#4338ca' }}>
                  <Sparkles size={16} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    AI Recommendation Ingestion Payload (Masterplan §69 / §44)
                  </span>
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    background: '#ffffff',
                    padding: 10,
                    borderRadius: 4,
                    overflowX: 'auto',
                    border: '1px solid #e0e7ff',
                  }}
                >
                  {JSON.stringify(selectedEntry.aiRecPayload, null, 2)}
                </pre>
              </div>
            )}

            {/* Raw Metadata & Close */}
            {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Operational Notes & Metadata
                </div>
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'var(--color-surface-2)',
                    borderRadius: 4,
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {JSON.stringify(selectedEntry.metadata)}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEntry(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
