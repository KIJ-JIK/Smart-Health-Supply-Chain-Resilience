'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCrisisStore } from '@/store/crisisStore';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import {
  ShieldAlert,
  Zap,
  Flame,
  AlertOctagon,
  CheckCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Radio,
  FileText,
  Lock,
} from 'lucide-react';

const EMERGENCY_PROTOCOLS = [
  {
    id: 'ep-level3-national',
    name: 'National Level-3 Public Health Surge & Strategic Reserve Mobilization',
    level: 'national',
    status: 'active',
    description: 'Mandatory requisition of inter-state pharmaceutical buffers, armed forces logistics corridors, and immediate fast-track procurement.',
  },
  {
    id: 'ep-flood',
    name: 'Monsoon Flood & Waterborne Epidemic Containment',
    level: 'state',
    status: 'active',
    description: 'Air-drop triage kits, mobile chlorine water testing, and emergency oral rehydration stockpiles for cut-off rural settlements.',
  },
  {
    id: 'ep-stockout-fasttrack',
    name: 'Emergency Procurement & Red-Tape Waiver Protocol',
    level: 'national',
    status: 'standby',
    description: 'Bypasses 30-day tender waiting period; authorizes direct district medical store purchasing at state pre-negotiated ceiling rates.',
  },
  {
    id: 'ep-mass-casualty',
    name: 'Mass Casualty & Trauma Incident Response',
    level: 'district',
    status: 'standby',
    description: 'Activates secondary and tertiary surgical bed conversion, blood bank cold-chain surge dispatch, and triage annex deployment.',
  },
];

export default function EmergencyPage() {
  const { user } = useAuthStore();
  const {
    isCrisisMode,
    activatedAt,
    activatedBy,
    crisisTitle,
    crisisLevel,
    activateCrisisMode,
    deactivateCrisisMode,
  } = useCrisisStore();

  const [titleInput, setTitleInput] = useState(crisisTitle);
  const [levelInput, setLevelInput] = useState<any>(crisisLevel);
  const [showConfig, setShowConfig] = useState(false);

  const canManage = user.role === 'national_admin';

  const handleToggle = () => {
    if (!canManage) return;
    if (isCrisisMode) {
      deactivateCrisisMode(user);
    } else {
      activateCrisisMode(user, titleInput, levelInput);
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={24} style={{ color: '#DC2626' }} />
            Crisis Operations & National Emergency Protocols
          </h1>
          <p className="page-subtitle">
            Masterplan Crisis Mode declaration, emergency statutory waivers, and inter-echelon surge coordination
          </p>
        </div>
        <ScopeSelector />
      </div>

      {/* ── HIGH-IMPACT CRISIS MODE ACTIVATION BANNER ──────────────────────── */}
      <div
        style={{
          background: isCrisisMode ? '#7F1D1D' : '#FFF5F5',
          border: `2px solid ${isCrisisMode ? '#DC2626' : '#FCA5A5'}`,
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: 24,
          color: isCrisisMode ? 'white' : '#991B1B',
          boxShadow: isCrisisMode ? '0 8px 24px rgba(220, 38, 38, 0.25)' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isCrisisMode ? '#DC2626' : '#FEE2E2',
                color: isCrisisMode ? 'white' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isCrisisMode ? '0 0 16px #DC2626' : 'none',
              }}
            >
              <ShieldAlert size={26} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>
                  {isCrisisMode
                    ? `CRISIS MODE ACTIVE — ${crisisLevel.toUpperCase()}`
                    : 'Crisis Mode is Currently INACTIVE'}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isCrisisMode ? '#FEF08A' : '#E2E8F0',
                    color: isCrisisMode ? '#854D0E' : '#475569',
                  }}
                >
                  {isCrisisMode ? 'SURGE STATE' : 'STANDBY'}
                </span>
              </div>

              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9, lineHeight: 1.4 }}>
                {isCrisisMode ? (
                  <>
                    Declared: <strong>{crisisTitle}</strong> by <strong>{activatedBy}</strong> on{' '}
                    {activatedAt ? new Date(activatedAt).toLocaleString() : 'Recent'}. Portal primary layout is re-prioritized across the 9 crisis tiers.
                  </>
                ) : (
                  <>
                    Activating Crisis Mode re-prioritizes the entire portal layout into the 9-tier emergency command hierarchy, accelerates redistribution approvals, and issues statutory waivers.
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isCrisisMode && (
              <Link
                href="/"
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'white',
                  color: '#991B1B',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>View 9-Tier Crisis Layout</span>
                <ArrowRight size={14} />
              </Link>
            )}

            {canManage ? (
              <button
                id="crisis-mode-main-toggle"
                onClick={handleToggle}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isCrisisMode ? '#DC2626' : '#991B1B',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <Zap size={15} />
                <span>{isCrisisMode ? 'Stand Down Crisis Mode' : 'Activate Crisis Mode'}</span>
              </button>
            ) : (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: isCrisisMode ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
                  color: isCrisisMode ? '#FCA5A5' : '#64748B',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <Lock size={13} />
                <span>Read-Only: Only National Admin May Activate / Deactivate</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration drawer for National Admin */}
        {canManage && !isCrisisMode && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #FCA5A5' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>
                  Emergency Declaration Title
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid #FCA5A5',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>
                  Crisis Level
                </label>
                <select
                  value={levelInput}
                  onChange={(e) => setLevelInput(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid #FCA5A5',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value="Level-1 (Local)">Level-1 (Local)</option>
                  <option value="Level-2 (Statewide)">Level-2 (Statewide)</option>
                  <option value="Level-3 (National Emergency)">Level-3 (National Emergency)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EMERGENCY PROTOCOLS & STATUTORY DIRECTIVES ─────────────────────── */}
      <div className="card" style={{ background: 'white', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Statutory Emergency Protocols & Contingency Reserves
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Standard Operating Procedures (SOPs) invoked during verified health emergencies
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EMERGENCY_PROTOCOLS.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: p.level === 'national' ? '#FEE2E2' : p.level === 'state' ? '#FFEDD5' : '#E0F2FE',
                      color: p.level === 'national' ? '#991B1B' : p.level === 'state' ? '#9A3412' : '#0369A1',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.level}
                  </span>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {p.name}
                  </h3>
                </div>
                <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {p.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: p.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                    color: p.status === 'active' ? '#15803D' : '#64748B',
                  }}
                >
                  {p.status === 'active' ? '● ACTIVE DEPLOYMENT' : '○ STANDBY'}
                </span>

                {canManage && (
                  <button
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'white',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Configure Directives
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
