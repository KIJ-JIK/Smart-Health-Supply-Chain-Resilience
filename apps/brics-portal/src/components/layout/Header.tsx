
// ---------------------------------------------------------------------------
// Top header bar for the BRICS Portal.
// Displays the portal title, current user with role badge, and connectivity status.
// Aligned with design system theme tokens.
// ---------------------------------------------------------------------------

import React from 'react';
import { useCurrentUser } from '@/hooks';
import { colors, typography } from '@/styles/theme';
import { StatusBadge } from '@/components/common/StatusBadge';

export function Header() {
  const user = useCurrentUser();

  return (
    <header
      style={{
        height: 56,
        backgroundColor: colors.bg.surface,
        borderBottom: `1px solid ${colors.bg.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        color: colors.text.primary,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <h1
          style={{
            ...typography.titleMedium,
            margin: 0,
            color: colors.text.primary,
          }}
        >
          BRICS Federated AI Monitoring &amp; Coordination Portal
        </h1>
        <StatusBadge status="online" label="Coordinator Online" size="sm" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '3px 8px',
            borderRadius: 4,
            backgroundColor: colors.brand.primaryBg,
            color: colors.brand.primary,
            border: `1px solid ${colors.brand.primary}40`,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {user.role.replace('_', ' ')}
        </span>
        <span
          style={{
            ...typography.bodySmall,
            color: colors.text.primary,
            fontWeight: 500,
          }}
        >
          {user.name}
        </span>
      </div>
    </header>
  );
}

