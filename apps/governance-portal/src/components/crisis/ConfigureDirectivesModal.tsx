'use client';

import React, { useState, useEffect } from 'react';
import {
  EmergencyProtocol,
  ProtocolDirective,
  useCrisisStore,
} from '@/store/crisisStore';
import {
  X,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Radio,
  Clock,
  Layers,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

interface ConfigureDirectivesModalProps {
  protocol: EmergencyProtocol | null;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
}

export function ConfigureDirectivesModal({
  protocol,
  isOpen,
  onClose,
  canManage,
}: ConfigureDirectivesModalProps) {
  const { updateProtocol } = useCrisisStore();

  const [localProtocol, setLocalProtocol] = useState<EmergencyProtocol | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when protocol changes or opens
  useEffect(() => {
    if (protocol) {
      setLocalProtocol(JSON.parse(JSON.stringify(protocol)));
      setSavedSuccess(false);
    }
  }, [protocol, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !localProtocol) return null;

  const handleToggleDirective = (directiveId: string) => {
    if (!canManage) return;
    setLocalProtocol((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        directives: prev.directives.map((d) =>
          d.id === directiveId ? { ...d, enabled: !d.enabled } : d
        ),
      };
    });
  };

  const handleParamChange = (directiveId: string, value: string) => {
    if (!canManage) return;
    setLocalProtocol((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        directives: prev.directives.map((d) =>
          d.id === directiveId ? { ...d, paramValue: value } : d
        ),
      };
    });
  };

  const handleStatusChange = (newStatus: 'active' | 'standby') => {
    if (!canManage) return;
    setLocalProtocol((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  const handleNotesChange = (notes: string) => {
    if (!canManage) return;
    setLocalProtocol((prev) => (prev ? { ...prev, notes } : prev));
  };

  const handleSave = () => {
    if (!localProtocol || !canManage) return;
    updateProtocol(localProtocol.id, {
      status: localProtocol.status,
      directives: localProtocol.directives,
      notes: localProtocol.notes,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const activeCount = localProtocol.directives.filter((d) => d.enabled).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ──────────────────────────────────────────────── */}
        <div
          style={{
            padding: '20px 24px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  background:
                    localProtocol.level === 'national'
                      ? '#FEE2E2'
                      : localProtocol.level === 'state'
                      ? '#FFEDD5'
                      : '#E0F2FE',
                  color:
                    localProtocol.level === 'national'
                      ? '#991B1B'
                      : localProtocol.level === 'state'
                      ? '#9A3412'
                      : '#0369A1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {localProtocol.level} PROTOCOL
              </span>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                ID: {localProtocol.id}
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
              {localProtocol.name}
            </h2>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
              Statutory Lead Authority: <strong>{localProtocol.leadAgency}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── MODAL BODY (SCROLLABLE) ────────────────────────────────────── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Success Banner */}
          {savedSuccess && (
            <div
              style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#15803D',
                padding: '12px 16px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={18} />
              Directives updated successfully and synchronized across the national crisis network!
            </div>
          )}

          {/* Protocol Deployment Status Control */}
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: 8,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                Operational Deployment State
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                Currently <strong>{activeCount} of {localProtocol.directives.length}</strong> statutory directives active
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => handleStatusChange('active')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: localProtocol.status === 'active' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                  background: localProtocol.status === 'active' ? '#DCFCE7' : '#FFFFFF',
                  color: localProtocol.status === 'active' ? '#15803D' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: canManage ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: localProtocol.status === 'active' ? '#16A34A' : '#94A3B8',
                  }}
                />
                Active Deployment
              </button>

              <button
                type="button"
                disabled={!canManage}
                onClick={() => handleStatusChange('standby')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: localProtocol.status === 'standby' ? '2px solid #475569' : '1px solid #CBD5E1',
                  background: localProtocol.status === 'standby' ? '#E2E8F0' : '#FFFFFF',
                  color: localProtocol.status === 'standby' ? '#1E293B' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: canManage ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: localProtocol.status === 'standby' ? '#475569' : '#94A3B8',
                  }}
                />
                Standby
              </button>
            </div>
          </div>

          {/* Statutory Directives List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={16} style={{ color: 'var(--color-primary)' }} />
                Statutory Sub-Directives & Tactical Controls
              </h3>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Toggle statutory permissions and set operational thresholds
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {localProtocol.directives.map((dir, idx) => (
                <div
                  key={dir.id}
                  style={{
                    border: `1px solid ${dir.enabled ? '#BFDBFE' : '#E2E8F0'}`,
                    borderRadius: 8,
                    background: dir.enabled ? '#F8FAFC' : '#FFFFFF',
                    padding: '14px 16px',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: dir.enabled ? '#1D4ED8' : '#64748B',
                            background: dir.enabled ? '#DBEAFE' : '#F1F5F9',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                        >
                          DIRECTIVE #{idx + 1}
                        </span>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {dir.name}
                        </h4>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', margin: '6px 0 0', lineHeight: 1.4 }}>
                        {dir.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => handleToggleDirective(dir.id)}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 999,
                          background: dir.enabled ? '#2563EB' : '#CBD5E1',
                          border: 'none',
                          cursor: canManage ? 'pointer' : 'not-allowed',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          padding: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            transform: dir.enabled ? 'translateX(20px)' : 'translateX(0px)',
                            transition: 'transform 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Configurable Parameter (If enabled & has param) */}
                  {dir.enabled && dir.paramLabel && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: '1px dashed #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        {dir.paramLabel}
                      </label>

                      {dir.paramType === 'select' && dir.paramOptions ? (
                        <select
                          disabled={!canManage}
                          value={dir.paramValue || dir.paramOptions[0]}
                          onChange={(e) => handleParamChange(dir.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#FFFFFF',
                            color: '#0F172A',
                            outline: 'none',
                          }}
                        >
                          {dir.paramOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={dir.paramType === 'number' ? 'number' : 'text'}
                          disabled={!canManage}
                          value={dir.paramValue || ''}
                          onChange={(e) => handleParamChange(dir.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#FFFFFF',
                            color: '#0F172A',
                            outline: 'none',
                            minWidth: 180,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operational Dispatch Orders / Field Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              Immediate Operational Notes & Dispatch Directives
            </label>
            <textarea
              rows={3}
              disabled={!canManage}
              value={localProtocol.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Enter special executive authorizations, emergency logistics contact numbers, or specific district orders..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                color: '#0F172A',
                outline: 'none',
                resize: 'vertical',
                background: canManage ? '#FFFFFF' : '#F8FAFC',
              }}
            />
            {localProtocol.lastUpdated && (
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Last synchronized: {formatDateTime(localProtocol.lastUpdated)}
              </div>
            )}
          </div>
        </div>

        {/* ── MODAL FOOTER ──────────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {!canManage ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <Lock size={14} />
              Read-Only: Only National Admin has authorization to deploy changes.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#64748B' }}>
              All modifications logged with biometric & role audit trail.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {canManage ? 'Cancel' : 'Close'}
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--color-primary, #2563EB)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Save size={15} />
                Save & Deploy Directives
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
