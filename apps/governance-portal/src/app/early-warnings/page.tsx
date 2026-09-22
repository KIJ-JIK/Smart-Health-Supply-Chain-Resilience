'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useAlertStore, MOCK_SEED_ALERTS } from '@/store/alertStore';
import { useScopeStore } from '@/store/scopeStore';
import { useAuthStore } from '@/store/authStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import { useSseStream } from '@/hooks/useSseStream';
import { ALERTS_HISTORY } from '@/graphql/queries';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import type { Alert, AlertClass, AlertSeverity } from '@/types';
import {
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Siren,
  CheckCircle,
  ExternalLink,
  Bot,
  Search,
  Filter,
  Radio,
  Clock,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import { useCopilotStore } from '@/store/copilotStore';

const SEV_BADGE: Record<AlertSeverity, { bg: string; text: string; label: string }> = {
  critical: { bg: '#FEE2E2', text: '#991B1B', label: 'CRITICAL' },
  warning: { bg: '#FEF3C7', text: '#92400E', label: 'WARNING' },
  info: { bg: '#E0F2FE', text: '#0369A1', label: 'INFO' },
};

const ITEMS_PER_PAGE = 6;

export default function EarlyWarningsPage() {
  const { user } = useAuthStore();
  const { alerts, addAlert, setAlerts, acknowledgeAlert } = useAlertStore();
  const { level, stateId, districtId, phcId } = useScopeStore();
  const { openCopilot } = useCopilotStore();

  const enforcedScope = useMemo(() => {
    return getEnforcedScope(user, { level, stateId, districtId, phcId });
  }, [user, level, stateId, districtId, phcId]);

  const [activeTab, setActiveTab] = useState<'all' | 'deterministic' | 'statistical' | 'emergency' | 'acknowledged'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── 1. Live SSE Stream Hook ───────────────────────────────────────────────
  const { status: sseStatus, reconnect } = useSseStream<Alert | Alert[]>(
    '/api/v1/governance/alerts/stream',
    {
      enabled: true,
      onMessage: (payload) => {
        if (Array.isArray(payload)) {
          payload.forEach((a) => addAlert(a));
        } else if (payload && payload.id) {
          addAlert(payload);
        }
      },
    },
  );

  // ── 2. GraphQL Fallback for History ───────────────────────────────────────
  const { data: gqlData, loading: gqlLoading, refetch: refetchHistory } = useQuery(ALERTS_HISTORY, {
    variables: {
      districtId: enforcedScope.districtId ?? undefined,
      stateId: enforcedScope.stateId ?? undefined,
      page: currentPage,
      limit: 20,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Hydrate store from live GraphQL
  useEffect(() => {
    if (gqlData?.alertsHistory && gqlData.alertsHistory.length > 0) {
      setAlerts(gqlData.alertsHistory);
    }
  }, [gqlData, setAlerts]);

  // Format relative timestamp
  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  };

  // Helper to determine entity URL
  const getEntityUrl = (alert: Alert) => {
    if (alert.entityType === 'phc' && alert.entityId) {
      return `/gis?phc=${encodeURIComponent(alert.entityId)}`;
    }
    if (alert.entityType === 'medicine') {
      return `/medicine?search=${encodeURIComponent(alert.entityName ?? '')}`;
    }
    if (alert.entityType === 'district') {
      return `/gis`;
    }
    return `/gis`;
  };

  // ── 3. Scope & Filter Pipeline ────────────────────────────────────────────
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // RBAC Scope Check strictly clamped to user authority
      if (enforcedScope.districtId && a.districtId && a.districtId !== enforcedScope.districtId) {
        return false;
      }
      if (enforcedScope.stateId && a.stateId && a.stateId !== enforcedScope.stateId) {
        return false;
      }
      if (enforcedScope.phcId && a.entityId && a.entityId !== enforcedScope.phcId) {
        return false;
      }

      // Class / Tab Filter
      if (activeTab === 'acknowledged') {
        if (!a.acknowledged) return false;
      } else {
        // If not on acknowledged tab, hide acknowledged unless specifically looking at all
        if (a.acknowledged && activeTab !== 'all') return false;

        if (activeTab === 'deterministic' && a.alertClass !== 'deterministic') return false;
        if (activeTab === 'statistical' && a.alertClass !== 'statistical') return false;
        if (activeTab === 'emergency' && a.alertType !== 'emergency_report') return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && a.severity !== severityFilter) {
        return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesMsg = a.message.toLowerCase().includes(q);
        const matchesEntity = (a.entityName ?? '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesEntity) return false;
      }

      return true;
    });
  }, [alerts, level, stateId, districtId, phcId, activeTab, severityFilter, searchQuery]);

  // Statistics breakdown
  const stats = useMemo(() => {
    const unack = alerts.filter((a) => !a.acknowledged);
    return {
      totalUnack: unack.length,
      emergencyCount: unack.filter((a) => a.alertType === 'emergency_report').length,
      deterministicCount: unack.filter((a) => a.alertClass === 'deterministic').length,
      statisticalCount: unack.filter((a) => a.alertClass === 'statistical').length,
    };
  }, [alerts]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE));
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAlerts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAlerts, currentPage]);

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Header & Live Stream Bar */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={24} style={{ color: '#EF4444' }} />
            Early Warnings & Live Alert Feed
          </h1>
          <p className="page-subtitle">
            Continuous AI surveillance stream: Immediate deterministic threshold triggers and statistical anomaly detection.
          </p>
        </div>

        {/* Live SSE Status Pill & Scope Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '999px',
              background: sseStatus === 'connected' ? '#DCFCE7' : '#FEF3C7',
              border: `1px solid ${sseStatus === 'connected' ? '#86EFAC' : '#FCD34D'}`,
              fontSize: 12,
              fontWeight: 600,
              color: sseStatus === 'connected' ? '#166534' : '#92400E',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: sseStatus === 'connected' ? '#22C55E' : '#F59E0B',
                boxShadow: sseStatus === 'connected' ? '0 0 8px #22C55E' : 'none',
                display: 'inline-block',
              }}
            />
            <span>{sseStatus === 'connected' ? 'SSE Live Stream Active' : `SSE: ${sseStatus}`}</span>
            {sseStatus !== 'connected' && (
              <button
                onClick={reconnect}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Reconnect SSE"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
          <ScopeSelector />
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="card"
          style={{
            padding: 16,
            background: 'white',
            borderLeft: '4px solid #EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ padding: 10, borderRadius: 8, background: '#FEE2E2', color: '#DC2626' }}>
            <Siren size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Emergency Reports
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{stats.emergencyCount}</div>
            <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>Field Reports from PHCs</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
            background: 'white',
            borderLeft: '4px solid #EA580C',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ padding: 10, borderRadius: 8, background: '#FFEDD5', color: '#EA580C' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Deterministic Breaches
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{stats.deterministicCount}</div>
            <div style={{ fontSize: 11, color: '#EA580C', fontWeight: 500 }}>Fixed threshold triggers</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
            background: 'white',
            borderLeft: '4px solid #6366F1',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ padding: 10, borderRadius: 8, background: '#EEF2FF', color: '#6366F1' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Statistical / AI Flags
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{stats.statisticalCount}</div>
            <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 500 }}>Review recommended</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
            background: 'white',
            borderLeft: '4px solid #0EA5E9',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ padding: 10, borderRadius: 8, background: '#E0F2FE', color: '#0284C7' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Pending Action
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{stats.totalUnack}</div>
            <div style={{ fontSize: 11, color: '#0284C7', fontWeight: 500 }}>Across current scope</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: 'white',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Class Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-border)',
                background: activeTab === 'all' ? 'var(--color-primary)' : 'white',
                color: activeTab === 'all' ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              All Alerts ({alerts.filter((a) => !a.acknowledged).length})
            </button>

            <button
              onClick={() => { setActiveTab('emergency'); setCurrentPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'emergency' ? '#DC2626' : 'var(--color-border)',
                background: activeTab === 'emergency' ? '#DC2626' : 'white',
                color: activeTab === 'emergency' ? 'white' : '#DC2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Siren size={14} />
              Emergency Reports ({stats.emergencyCount})
            </button>

            <button
              onClick={() => { setActiveTab('deterministic'); setCurrentPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'deterministic' ? '#EA580C' : 'var(--color-border)',
                background: activeTab === 'deterministic' ? '#EA580C' : 'white',
                color: activeTab === 'deterministic' ? 'white' : '#C2410C',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ShieldAlert size={14} />
              Immediate Deterministic ({stats.deterministicCount})
            </button>

            <button
              onClick={() => { setActiveTab('statistical'); setCurrentPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'statistical' ? '#6366F1' : 'var(--color-border)',
                background: activeTab === 'statistical' ? '#6366F1' : 'white',
                color: activeTab === 'statistical' ? 'white' : '#4F46E5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={14} />
              AI Statistical Flags ({stats.statisticalCount})
            </button>

            <button
              onClick={() => { setActiveTab('acknowledged'); setCurrentPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'acknowledged' ? '#64748B' : 'var(--color-border)',
                background: activeTab === 'acknowledged' ? '#64748B' : 'white',
                color: activeTab === 'acknowledged' ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle size={14} />
              History / Acknowledged
            </button>
          </div>

          {/* Severity Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value as any); setCurrentPage(1); }}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: 12,
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warning Only</option>
              <option value="info">Info Only</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search alerts by facility, medicine, reason, or condition..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
              outline: 'none',
              background: 'var(--color-surface)',
            }}
          />
        </div>
      </div>

      {/* Alert Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {paginatedAlerts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 48,
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              background: 'white',
            }}
          >
            <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
              No Alerts Matching Current Criteria
            </div>
            <div style={{ fontSize: 13 }}>
              All threshold limits within acceptable range and no statistical anomalies flagged.
            </div>
          </div>
        ) : (
          paginatedAlerts.map((alert) => {
            const isEmergency = alert.alertType === 'emergency_report';
            const isDeterministic = alert.alertClass === 'deterministic';
            const isStatistical = alert.alertClass === 'statistical';

            // Distinct Visual Treatment per Masterplan:
            // 1. Emergency Report: High-intensity crimson border with pulsating badge
            // 2. Deterministic: Solid high-contrast bold border and background badge
            // 3. Statistical: Distinct dashed/glowing indigo border with AI disclaimer badge
            let cardBorderStyle = '1px solid var(--color-border)';
            let cardBg = 'white';
            let classBadge = null;

            if (isEmergency) {
              cardBorderStyle = '2px solid #DC2626';
              cardBg = '#FFF5F5';
              classBadge = (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: '#DC2626',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    boxShadow: '0 0 10px rgba(220, 38, 38, 0.4)',
                  }}
                >
                  <Siren size={12} />
                  EMERGENCY REPORT (PHC DIRECT)
                </span>
              );
            } else if (isDeterministic) {
              cardBorderStyle = '2px solid #EA580C';
              cardBg = '#FFFBF7';
              classBadge = (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: '#EA580C',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  <ShieldAlert size={12} />
                  DETERMINISTIC THRESHOLD BREACH
                </span>
              );
            } else if (isStatistical) {
              cardBorderStyle = '2px dashed #6366F1';
              cardBg = '#FBFBFF';
              classBadge = (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: '#EEF2FF',
                    color: '#4338CA',
                    border: '1px solid #C7D2FE',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  <Sparkles size={12} style={{ color: '#6366F1' }} />
                  AI-FLAGGED — REVIEW RECOMMENDED
                </span>
              );
            }

            const sev = SEV_BADGE[alert.severity] || SEV_BADGE.info;

            return (
              <div
                key={alert.id}
                className="card"
                style={{
                  border: cardBorderStyle,
                  background: cardBg,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: isEmergency ? '0 4px 20px rgba(220, 38, 38, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative',
                  opacity: alert.acknowledged ? 0.7 : 1,
                }}
              >
                {/* Alert Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {classBadge}

                    {/* Severity Badge */}
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: sev.bg,
                        color: sev.text,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {sev.label}
                    </span>

                    {/* Category Label */}
                    <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
                      {alert.category.replace('_', ' ')}
                    </span>

                    {/* Relative Time */}
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>

                  {/* Acknowledge Button */}
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #10B981',
                        background: '#ECFDF5',
                        color: '#047857',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      title="Acknowledge alert"
                    >
                      <CheckCircle size={14} />
                      Acknowledge
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCircle size={12} /> Acknowledged
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    {alert.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: 0 }}>
                    {alert.message}
                  </p>
                </div>

                {/* Masterplan Callout Treatment */}
                {isStatistical && (
                  <div
                    style={{
                      background: '#F5F3FF',
                      borderLeft: '3px solid #818CF8',
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#4338CA',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>AI Guardrail Note:</strong> This is an algorithmic statistical anomaly (+σ baseline deviation). Operators are advised to cross-verify physical logbooks before initiating emergency redistribution.
                    </span>
                  </div>
                )}

                {isDeterministic && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      borderLeft: '3px solid #EF4444',
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#991B1B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Deterministic Rule Breach:</strong> Hard safety buffer violated. Immediate operational escalation required per standard SOP.
                    </span>
                  </div>
                )}

                {/* Footer Action Links: Source Entity & Copilot "Why" Link */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    paddingTop: 10,
                    borderTop: '1px solid var(--color-border-light)',
                    gap: 10,
                  }}
                >
                  {/* Entity Link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      Source Entity:
                    </span>
                    <Link
                      href={getEntityUrl(alert)}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        textDecoration: 'none',
                        background: 'var(--color-primary-light)',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      <span>{alert.entityName ?? alert.entityId ?? 'View Facility / Entity'}</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  {/* Copilot "Why" Button (Opens Docked Panel without leaving page) */}
                  {alert.copilotQuery && (
                    <button
                      onClick={() => openCopilot(alert.copilotQuery, alert.id, '/early-warnings')}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#4F46E5',
                        background: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Bot size={14} />
                      <span>Ask Copilot "Why did this occur?"</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Page {currentPage} of {totalPages} ({filteredAlerts.length} total alerts)
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'white',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
