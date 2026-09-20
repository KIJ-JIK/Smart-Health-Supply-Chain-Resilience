'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Lock,
  Globe,
  MapPin,
  Building2,
  Stethoscope,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import {
  STATES,
  getStateById,
  getDistrictById,
  getPhcById,
  getDistrictsForState,
  getPhcsForDistrict,
} from '@/lib/geography';
import { DataFreshnessLabel } from './DataFreshnessLabel';

export interface ScopeSelectorProps {
  /** Optional callback fired whenever the selected scope changes */
  onScopeChange?: (scope: {
    level: 'national' | 'state' | 'district' | 'phc';
    stateId: string | null;
    districtId: string | null;
    phcId: string | null;
  }) => void;
  /** Whether to show the data freshness badge in the scope selector bar */
  showFreshness?: boolean;
  /** Whether to show the active jurisdiction summary chip */
  showSummaryChip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ScopeSelector({
  onScopeChange,
  showFreshness = true,
  showSummaryChip = true,
  className = '',
  style,
}: ScopeSelectorProps) {
  const { user } = useAuthStore();
  const {
    level,
    stateId,
    districtId,
    phcId,
    setNational,
    setState,
    setDistrict,
    setPhc,
    clearDistrict,
    clearPhc,
    syncWithUserRole,
  } = useScopeStore();

  // Always enforce RBAC constraints when user persona changes
  useEffect(() => {
    syncWithUserRole(user);
  }, [user, syncWithUserRole]);

  // Notify parent component if callback provided
  useEffect(() => {
    onScopeChange?.({ level, stateId, districtId, phcId });
  }, [level, stateId, districtId, phcId, onScopeChange]);

  // Derived state
  const isStateAdmin = user.role === 'state_admin';
  const isDistrictAdmin = user.role === 'district_admin';
  const isNationalAdmin = user.role === 'national_admin';

  // Locks per Masterplan §26
  const nationalLocked = isStateAdmin || isDistrictAdmin;
  const stateLocked = isDistrictAdmin;
  const districtLocked = isDistrictAdmin;

  // Resolved nodes
  const currentState = getStateById(stateId);
  const currentDistrict = getDistrictById(districtId, stateId);
  const currentPhc = getPhcById(phcId, districtId);

  // Available options
  const availableDistricts = stateId ? getDistrictsForState(stateId) : [];
  const availablePhcs = districtId ? getPhcsForDistrict(districtId) : [];

  // Determine freshness timestamp of the lowest selected node
  const activeSyncTimestamp =
    currentPhc?.lastSyncTime ??
    (level === 'district' ? new Date(Date.now() - 14 * 60 * 1000).toISOString() : undefined);

  return (
    <div
      className={`scope-selector-container ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '10px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        marginBottom: '20px',
        ...style,
      }}
    >
      {/* Left side: Breadcrumb & Level Dropdowns */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            marginRight: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Scope:
        </span>

        {/* ── 1. National Level ──────────────────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {nationalLocked ? (
            <button
              disabled
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                border: '1px dashed #cbd5e1',
                cursor: 'not-allowed',
              }}
              title="Locked: Restricted to your state/district jurisdiction"
            >
              <Lock size={12} />
              <Globe size={13} />
              <span>National</span>
            </button>
          ) : (
            <button
              onClick={setNational}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: level === 'national' ? 700 : 500,
                backgroundColor: level === 'national' ? '#e8effd' : '#ffffff',
                color: level === 'national' ? '#1a56db' : '#334155',
                border: `1px solid ${level === 'national' ? '#bfdbfe' : '#e2e8f0'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="View all 36 States & Union Territories"
            >
              <Globe size={13} />
              <span>National</span>
            </button>
          )}
        </div>

        <ChevronRight size={14} style={{ color: '#cbd5e1' }} />

        {/* ── 2. State Level ─────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {isDistrictAdmin ? (
            // District admin has state locked
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#f8fafc',
                color: '#334155',
                border: '1px solid #e2e8f0',
              }}
              title="State locked by user role"
            >
              <Lock size={11} color="#64748b" />
              <MapPin size={13} color="#1a56db" />
              <span>{currentState?.name ?? 'State'}</span>
            </div>
          ) : isStateAdmin ? (
            // State admin is locked to their state
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: level === 'state' ? '#e8effd' : '#f8fafc',
                color: level === 'state' ? '#1a56db' : '#334155',
                border: `1px solid ${level === 'state' ? '#bfdbfe' : '#e2e8f0'}`,
              }}
              title="State locked to your admin assignment"
            >
              <Lock size={11} color="#64748b" />
              <MapPin size={13} color="#1a56db" />
              <span>{currentState?.name ?? 'State'}</span>
            </div>
          ) : (
            // National admin can choose any state or None
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                id="scope-state-select"
                value={stateId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) setNational();
                  else setState(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '5px 26px 5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: stateId ? 600 : 400,
                  backgroundColor: stateId ? '#e8effd' : '#ffffff',
                  color: stateId ? '#1a56db' : '#334155',
                  border: `1px solid ${stateId ? '#bfdbfe' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Select State"
              >
                <option value="">-- All States (National) --</option>
                {STATES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                style={{
                  position: 'absolute',
                  right: 8,
                  pointerEvents: 'none',
                  color: stateId ? '#1a56db' : '#94a3b8',
                }}
              />
            </div>
          )}
        </div>

        <ChevronRight size={14} style={{ color: '#cbd5e1' }} />

        {/* ── 3. District Level ──────────────────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {districtLocked ? (
            // District admin has district locked
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: level === 'district' ? '#e8effd' : '#f8fafc',
                color: level === 'district' ? '#1a56db' : '#334155',
                border: `1px solid ${level === 'district' ? '#bfdbfe' : '#e2e8f0'}`,
              }}
              title="District locked by user role"
            >
              <Lock size={11} color="#64748b" />
              <Building2 size={13} color="#1a56db" />
              <span>{currentDistrict?.name ?? 'District'}</span>
            </div>
          ) : !stateId ? (
            // Disabled if no state is selected
            <button
              disabled
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: '#f8fafc',
                color: '#cbd5e1',
                border: '1px solid #f1f5f9',
                cursor: 'not-allowed',
              }}
            >
              All Districts
            </button>
          ) : (
            // Select from available districts in state
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                id="scope-district-select"
                value={districtId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) clearDistrict();
                  else setDistrict(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '5px 26px 5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: districtId ? 600 : 400,
                  backgroundColor: districtId ? '#e8effd' : '#ffffff',
                  color: districtId ? '#1a56db' : '#334155',
                  border: `1px solid ${districtId ? '#bfdbfe' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Select District"
              >
                <option value="">-- All Districts in {currentState?.code ?? 'State'} --</option>
                {availableDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.totalPhcs} PHCs)
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                style={{
                  position: 'absolute',
                  right: 8,
                  pointerEvents: 'none',
                  color: districtId ? '#1a56db' : '#94a3b8',
                }}
              />
            </div>
          )}
        </div>

        <ChevronRight size={14} style={{ color: '#cbd5e1' }} />

        {/* ── 4. PHC Level ───────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {!districtId ? (
            <button
              disabled
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: '#f8fafc',
                color: '#cbd5e1',
                border: '1px solid #f1f5f9',
                cursor: 'not-allowed',
              }}
            >
              All PHCs
            </button>
          ) : (
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                id="scope-phc-select"
                value={phcId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) clearPhc();
                  else setPhc(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '5px 26px 5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: phcId ? 600 : 400,
                  backgroundColor: phcId ? '#e8effd' : '#ffffff',
                  color: phcId ? '#1a56db' : '#334155',
                  border: `1px solid ${phcId ? '#bfdbfe' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Select Primary Health Centre"
              >
                <option value="">-- All PHCs in {currentDistrict?.name ?? 'District'} --</option>
                {availablePhcs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                style={{
                  position: 'absolute',
                  right: 8,
                  pointerEvents: 'none',
                  color: phcId ? '#1a56db' : '#94a3b8',
                }}
              />
            </div>
          )}
        </div>

        {/* Clear drill-down button if drilled down */}
        {(phcId || (districtId && !districtLocked) || (stateId && !stateLocked && !nationalLocked)) && (
          <button
            onClick={() => {
              if (phcId) clearPhc();
              else if (districtId && !districtLocked) clearDistrict();
              else if (stateId && !stateLocked && !nationalLocked) setNational();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
            title="Step up one scope level"
          >
            <X size={11} />
            <span>Reset Step</span>
          </button>
        )}
      </div>

      {/* Right side: Summary pill & Masterplan §59 Data Freshness */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {showSummaryChip && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              color: '#475569',
            }}
          >
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {level === 'phc'
                ? currentPhc?.name
                : level === 'district'
                ? `${currentDistrict?.name} District (${currentDistrict?.totalPhcs} PHCs)`
                : level === 'state'
                ? `${currentState?.name} State (${currentState?.totalPhcs} PHCs)`
                : 'National Jurisdiction (45,320 PHCs)'}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ textTransform: 'capitalize', color: '#64748b' }}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}

        {showFreshness && (
          <DataFreshnessLabel
            timestamp={activeSyncTimestamp}
            source={
              currentPhc
                ? `${currentPhc.name} Tablet Gateway`
                : currentDistrict
                ? `${currentDistrict.name} District Hub`
                : 'Central Data Warehouse'
            }
          />
        )}
      </div>
    </div>
  );
}
