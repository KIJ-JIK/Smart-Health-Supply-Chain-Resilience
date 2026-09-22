import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks';
import { useBricsAuthStore } from '@/store/auth-store';
import { colors, typography } from '@/styles/theme';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Layers,
  ChevronDown,
  LogOut,
  Building2,
  HeartPulse,
  Globe2,
} from 'lucide-react';

export function Header() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { logout, selectedCountry } = useBricsAuthStore();
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

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
        {/* Active Sovereign Country Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            backgroundColor: '#fff8c5',
            border: '1px solid #fae17d',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#9a6700',
          }}
          title={`Active Sovereign Delegation: ${selectedCountry.name}`}
        >
          <span style={{ fontSize: '1rem' }}>{selectedCountry.flag}</span>
          <span>{selectedCountry.name} Node</span>
        </div>

        {/* User Role & Name */}
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

        {/* Global Platform Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setPortalMenuOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 6,
              border: `1px solid ${colors.bg.border}`,
              backgroundColor: colors.bg.surface,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: colors.text.primary,
            }}
            title="Switch Platform Portals"
          >
            <Layers size={13} style={{ color: '#0969da' }} />
            <span>Portals</span>
            <ChevronDown size={11} />
          </button>

          {portalMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 6,
                width: 250,
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: 8,
                zIndex: 100,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #1e293b',
                  marginBottom: 4,
                }}
              >
                Cross-Portal Navigation
              </div>
              <a
                href="http://localhost:3000"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  fontSize: 12,
                }}
              >
                <Building2 size={15} style={{ color: '#06b6d4' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Platform Hub</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Command Gateway</div>
                </div>
              </a>
              <a
                href="http://localhost:5173"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  fontSize: 12,
                }}
              >
                <HeartPulse size={15} style={{ color: '#14b8a6' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>PHC Health Centre</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Port 5173 · Clinical</div>
                </div>
              </a>
              <a
                href="http://localhost:3000/governance"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  fontSize: 12,
                }}
              >
                <Building2 size={15} style={{ color: '#3b82f6' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Governance Portal</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Port 3000 · Macro</div>
                </div>
              </a>
              <a
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  color: '#f59e0b',
                  textDecoration: 'none',
                  fontSize: 12,
                  background: 'rgba(245,158,11,0.12)',
                }}
              >
                <Globe2 size={15} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>BRICS Federated</div>
                  <div style={{ fontSize: 10, color: '#fbbf24' }}>Active · Port 3001</div>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cf222e',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Sign Out to Login"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
