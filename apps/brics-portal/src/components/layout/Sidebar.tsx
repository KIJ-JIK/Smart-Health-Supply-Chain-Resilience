// ---------------------------------------------------------------------------
// Left navigation sidebar for the BRICS Federated Intelligence Portal (Vite SPA).
// Items: Overview, Nodes, Training Rounds, Model Lineage,
//        Privacy & Aggregation, Settings.
// Aligned with design system theme tokens and React Router.
// ---------------------------------------------------------------------------

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store';
import { colors, typography } from '@/styles/theme';

interface NavItem {
  key: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', href: '/' },
  { key: 'nodes', label: 'Nodes', href: '/nodes' },
  { key: 'rounds', label: 'Training Rounds', href: '/rounds' },
  { key: 'lineage', label: 'Model Lineage', href: '/lineage' },
  { key: 'privacy', label: 'Privacy & Aggregation', href: '/privacy' },
  { key: 'settings', label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        backgroundColor: colors.bg.sidebar,
        color: colors.text.primary,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        borderRight: `1px solid ${colors.bg.border}`,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: collapsed ? '16px 8px' : '16px 20px',
          borderBottom: `1px solid ${colors.bg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 56,
        }}
      >
        {!collapsed && (
          <div>
            <div
              style={{
                ...typography.body,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: colors.text.primary,
              }}
            >
              BRICS Federation
            </div>
            <div
              style={{
                ...typography.bodySmall,
                color: colors.text.muted,
                marginTop: 2,
              }}
            >
              Oversight Portal
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text.muted,
            cursor: 'pointer',
            fontSize: 14,
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              to={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: collapsed ? '10px 8px' : '10px 20px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                color: isActive ? colors.brand.primary : colors.text.secondary,
                backgroundColor: isActive ? colors.brand.primaryBg : 'transparent',
                borderLeft: isActive
                  ? `3px solid ${colors.brand.primary}`
                  : '3px solid transparent',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {collapsed ? item.label.slice(0, 3) : item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — portal version */}
      {!collapsed && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${colors.bg.border}`,
            ...typography.bodySmall,
            color: colors.text.muted,
          }}
        >
          BRICS Portal v0.1.0
        </div>
      )}
    </aside>
  );
}
