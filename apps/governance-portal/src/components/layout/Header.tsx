'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, X, ChevronRight } from 'lucide-react';
import { useAuthStore, DEV_PERSONAS } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { UserRole, Alert } from '@/types';
import { useSseStream } from '@/hooks/useSseStream';

// ── Breadcrumb map ─────────────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  '/':               'National Command Center',
  '/gis':            'GIS Health Map',
  '/medicine':       'Medicine Intelligence',
  '/resources':      'Resources',
  '/workforce':      'Workforce',
  '/patients':       'Patient Intelligence',
  '/forecasts':      'AI Forecasts',
  '/early-warnings': 'Early Warnings',
  '/redistribution': 'Redistribution',
  '/supply-chain':   'Supply Chain',
  '/emergency':      'Emergency / Pandemic Mode',
  '/simulator':      'Crisis Simulator',
  '/copilot':        'AI Copilot',
  '/analytics':      'Analytics & Reports',
  '/audit':          'Audit Log',
  '/admin':          'Administration',
};

// ── Alert panel ────────────────────────────────────────────────────────────────
function AlertPanel({
  open,
  onClose,
  alerts,
}: {
  open: boolean;
  onClose: () => void;
  alerts: Alert[];
}) {
  const acknowledge = useAlertStore((s) => s.acknowledgeAlert);

  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`alert-panel${open ? ' open' : ''}`} role="dialog" aria-label="Alerts">
      <div className="alert-panel-header">
        <div>
          <div className="alert-panel-title">Live Alerts</div>
          <div className="text-muted" style={{ fontSize: '11px', marginTop: 2 }}>
            {alerts.filter((a) => !a.acknowledged).length} unacknowledged
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Close alerts panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="alert-list">
        {alerts.length === 0 && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            No active alerts
          </div>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert-item${alert.acknowledged ? ' acknowledged' : ''}`}
            onClick={() => acknowledge(alert.id)}
            role="button"
            tabIndex={0}
            aria-label={`Alert: ${alert.title}`}
          >
            <div className="alert-item-header">
              <span
                className={`alert-severity-dot dot-${
                  alert.severity === 'warning' ? 'warning' : alert.severity
                }`}
              />
              <span className="alert-item-title">{alert.title}</span>
              <span className="alert-item-time">{timeAgo(alert.timestamp)}</span>
            </div>
            <p className="alert-item-message">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCrisisStore } from '@/store/crisisStore';
import { useCopilotStore } from '@/store/copilotStore';
import { Flame, AlertTriangle, Bot } from 'lucide-react';
import { StalePhcSyncBanner } from '@/components/common/StalePhcSyncBanner';

// ── Header component ───────────────────────────────────────────────────────────
interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { user, isDevMode, switchRole } = useAuthStore();
  const { alerts, unacknowledgedCount, addAlert } = useAlertStore();
  const { isCrisisMode, crisisTitle, activatedBy, activateCrisisMode, deactivateCrisisMode } = useCrisisStore();
  const { isOpen: isCopilotOpen, toggleCopilot } = useCopilotStore();
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);

  // SSE — wire the live alert stream. In dev the backend isn't live so we
  // absorb the error silently; mocked alerts come from the store seed.
  useSseStream<Alert>('/api/v1/governance/alerts/stream', {
    onMessage: (alert) => addAlert(alert),
    enabled: process.env.NODE_ENV === 'production',
  });

  // Build breadcrumb
  const currentLabel = ROUTE_LABELS[pathname] ?? pathname.replace('/', '');
  const isHome = pathname === '/';

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <>
      {/* ── Persistent Crisis Mode Banner across entire portal ────────────── */}
      {isCrisisMode && (
        <div
          style={{
            background: 'linear-gradient(90deg, #991B1B 0%, #DC2626 50%, #991B1B 100%)',
            color: 'white',
            padding: '8px 18px',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 12px rgba(220, 38, 38, 0.4)',
            zIndex: 100,
            letterSpacing: '0.02em',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#FEF08A',
                boxShadow: '0 0 8px #FEF08A',
                display: 'inline-block',
              }}
            />
            <span style={{ textTransform: 'uppercase' }}>
              🚨 CRISIS MODE ACTIVATED — NATIONAL HEALTH EMERGENCY PROTOCOL IN EFFECT
            </span>
            <span style={{ opacity: 0.85, fontWeight: 500, fontSize: 11 }}>
              ({crisisTitle} • Authorized by {activatedBy})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/"
              style={{
                color: 'white',
                textDecoration: 'underline',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              View Crisis Layout
            </Link>

            {user.role === 'national_admin' ? (
              <button
                onClick={() => deactivateCrisisMode(user)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Stand Down
              </button>
            ) : (
              <span style={{ fontSize: 11, color: '#FCA5A5' }}>
                🔒 Read-Only (National Admin Managed)
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Stale PHC Telemetry Warning Banner (Used sparingly per Masterplan §59) ── */}
      <StalePhcSyncBanner />

      <header className="header" style={isCrisisMode ? { borderBottom: '2px solid #DC2626' } : {}}>
        {/* Sidebar toggle */}
        <button
          id="sidebar-toggle-btn"
          className="header-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={16} />
        </button>

        {/* Breadcrumb */}
        <div className="header-breadcrumb">
          {!isHome && (
            <>
              <span>Governance</span>
              <ChevronRight size={12} className="header-breadcrumb-sep" />
            </>
          )}
          <span className="header-breadcrumb-current">{currentLabel}</span>
          {isCrisisMode && (
            <span
              style={{
                marginLeft: 8,
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #F87171',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              CRISIS STATE
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="header-actions">
          {/* Crisis Mode Toggle Button */}
          {user.role === 'national_admin' ? (
            <button
              id="crisis-mode-toggle-btn"
              onClick={() => {
                if (isCrisisMode) {
                  deactivateCrisisMode(user);
                } else {
                  activateCrisisMode(user, 'National Public Health Emergency Protocol');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: isCrisisMode ? '1px solid #DC2626' : '1px solid var(--color-border)',
                background: isCrisisMode ? '#DC2626' : '#FFF1F2',
                color: isCrisisMode ? 'white' : '#BE123C',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isCrisisMode ? '0 0 10px rgba(220, 38, 38, 0.4)' : 'none',
              }}
              title="National Admin: Toggle Crisis Mode"
              aria-label="Toggle Crisis Mode"
            >
              <Flame size={14} />
              <span>{isCrisisMode ? 'Crisis Active' : 'Activate Crisis'}</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isCrisisMode ? '#FEE2E2' : '#F1F5F9',
                color: isCrisisMode ? '#991B1B' : '#64748B',
                fontSize: 11,
                fontWeight: 600,
                border: isCrisisMode ? '1px solid #FCA5A5' : '1px solid var(--color-border-light)',
              }}
              title="Crisis Mode status (Read-Only for State/District Admin)"
            >
              <Flame size={12} style={{ color: isCrisisMode ? '#DC2626' : '#94A3B8' }} />
              <span>{isCrisisMode ? 'Crisis Mode: Active (Read-Only)' : 'Normal Mode'}</span>
            </div>
          )}

          {/* Dev-mode role switcher */}
          {isDevMode && (
            <div className="role-switcher" title="Dev mode: switch role">
              <span>👤 Role:</span>
              <select
                id="dev-role-switcher"
                value={user.role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                aria-label="Switch role (dev mode)"
              >
                <option value="national_admin">National Admin</option>
                <option value="state_admin">State Admin</option>
                <option value="district_admin">District Admin</option>
              </select>
            </div>
          )}

          {/* Copilot Docked Side Panel Toggle Button */}
          <button
            id="header-copilot-toggle-btn"
            className="header-toggle-btn"
            onClick={toggleCopilot}
            style={{
              background: isCopilotOpen ? 'var(--color-primary)' : 'var(--color-surface)',
              color: isCopilotOpen ? 'white' : 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
            }}
            title="Toggle AI Copilot Panel"
            aria-label="Toggle AI Copilot Panel"
          >
            <Bot size={16} />
          </button>

          {/* Alert bell */}
          <button
            id="alert-bell-btn"
            className="alert-bell-btn"
            onClick={() => setAlertPanelOpen((o) => !o)}
            aria-label={`Open alerts — ${unacknowledgedCount} unacknowledged`}
          >
            <Bell size={15} />
            {unacknowledgedCount > 0 && (
              <span className="alert-bell-badge">
                {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
              </span>
            )}
          </button>

          {/* User avatar */}
          <div
            id="user-avatar"
            className="user-avatar"
            title={`${user.name} (${user.role})`}
            aria-label={`User: ${user.name}`}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* Alert slide-over */}
      <AlertPanel
        open={alertPanelOpen}
        onClose={() => setAlertPanelOpen(false)}
        alerts={alerts}
      />
    </>
  );
}
