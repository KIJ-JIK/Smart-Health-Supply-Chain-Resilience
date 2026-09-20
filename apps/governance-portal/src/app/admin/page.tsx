'use client';

import React, { useState } from 'react';
import { useAuthStore, DEV_PERSONAS } from '@/store/authStore';
import { useConfigStore, GovernanceThresholds } from '@/store/configStore';
import { useAuditStore } from '@/store/auditStore';
import {
  Settings,
  Users,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
  FileCheck,
  Building2,
  MapPin,
  Mail,
  Fingerprint,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SyncMonitoringView } from '@/components/admin/SyncMonitoringView';

// Detailed directory of system operators across tiers (read-mostly administrative list)
const INITIAL_SYSTEM_USERS = [
  {
    id: 'usr-nat-001',
    name: 'Dr. Rajesh Kumar',
    designation: 'Director General of Health Services',
    department: 'MOHFW Governance Council',
    role: 'national_admin',
    email: 'nat-admin@gov.in',
    phone: '+91 11 2306 1234',
    jurisdiction: 'All India (National)',
    status: 'Active',
    lastLogin: '2026-09-16 17:45',
    mfaStatus: 'Hardware FIDO2 Token',
    securityClearance: 'Level 4 Statutory',
  },
  {
    id: 'usr-nat-002',
    name: 'Dr. Arvind Swaminathan',
    designation: 'Chief Logistics & Supply Officer',
    department: 'National Essential Drugs Directorate',
    role: 'national_admin',
    email: 'arvind.swaminathan@gov.in',
    phone: '+91 11 2306 5678',
    jurisdiction: 'All India (National)',
    status: 'Active',
    lastLogin: '2026-09-16 14:10',
    mfaStatus: 'Hardware FIDO2 Token',
    securityClearance: 'Level 4 Statutory',
  },
  {
    id: 'usr-state-001',
    name: 'Smt. Priya Sharma',
    designation: 'State Health Commissioner',
    department: 'Directorate of Health Services, Maharashtra',
    role: 'state_admin',
    email: 'mh-admin@gov.in',
    phone: '+91 22 2262 0123',
    jurisdiction: 'Maharashtra (MH)',
    status: 'Active',
    lastLogin: '2026-09-16 16:30',
    mfaStatus: 'TOTP Authenticator',
    securityClearance: 'Level 3 State Delegated',
  },
  {
    id: 'usr-state-002',
    name: 'Dr. B. Ramanathan',
    designation: 'Additional Mission Director, NHM',
    department: 'Health & Family Welfare, Karnataka',
    role: 'state_admin',
    email: 'ka-admin@gov.in',
    phone: '+91 80 2287 4567',
    jurisdiction: 'Karnataka (KA)',
    status: 'Active',
    lastLogin: '2026-09-15 19:20',
    mfaStatus: 'TOTP Authenticator',
    securityClearance: 'Level 3 State Delegated',
  },
  {
    id: 'usr-dist-001',
    name: 'Suresh Iyer',
    designation: 'District Health Officer (DHO)',
    department: 'District Collectorate Health Cell, Pune',
    role: 'district_admin',
    email: 'pune-admin@gov.in',
    phone: '+91 20 2612 8901',
    jurisdiction: 'Pune District (MH)',
    status: 'Active',
    lastLogin: '2026-09-16 16:30',
    mfaStatus: 'SMS OTP + Aadhaar eSign',
    securityClearance: 'Level 2 District Operational',
  },
  {
    id: 'usr-dist-002',
    name: 'Dr. Kavita Deshmukh',
    designation: 'Civil Surgeon & Chief Medical Officer',
    department: 'Thane District Hospital Administration',
    role: 'district_admin',
    email: 'thane-cmo@gov.in',
    phone: '+91 22 2542 3456',
    jurisdiction: 'Thane District (MH)',
    status: 'Active',
    lastLogin: '2026-09-16 08:15',
    mfaStatus: 'SMS OTP + Aadhaar eSign',
    securityClearance: 'Level 2 District Operational',
  },
  {
    id: 'usr-dist-003',
    name: 'Dr. Ananya Rao',
    designation: 'District Logistics Officer',
    department: 'Bengaluru Urban Health Depo',
    role: 'district_admin',
    email: 'ananya.rao@karnataka.gov.in',
    phone: '+91 80 2345 6789',
    jurisdiction: 'Bengaluru Urban (KA)',
    status: 'Active',
    lastLogin: '2026-09-15 14:15',
    mfaStatus: 'SMS OTP + Aadhaar eSign',
    securityClearance: 'Level 2 District Operational',
  },
];

export default function AdminPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading Administration...</div>}>
      <AdminContent />
    </React.Suspense>
  );
}

function AdminContent() {
  const { user } = useAuthStore();
  const { thresholds, versionInfo, updateThresholds, resetToDefaults } = useConfigStore();
  const { entries } = useAuditStore();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'config' | 'users' | 'sync'>(
    initialTab === 'sync' ? 'sync' : initialTab === 'users' ? 'users' : 'config'
  );

  // Form editable state for §69 thresholds
  const [formData, setFormData] = useState<GovernanceThresholds>(thresholds);
  const [dirty, setDirty] = useState(false);

  // Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [justificationReason, setJustificationReason] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync if external updates happen
  React.useEffect(() => {
    setFormData(thresholds);
    setDirty(false);
  }, [thresholds]);

  const handleFieldChange = <K extends keyof GovernanceThresholds>(
    key: K,
    value: GovernanceThresholds[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setDirty(true);
  };

  const handleNestedRuleChange = <K extends keyof GovernanceThresholds['redistribution_rules']>(
    key: K,
    value: GovernanceThresholds['redistribution_rules'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      redistribution_rules: {
        ...prev.redistribution_rules,
        [key]: value,
      },
    }));
    setDirty(true);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setJustificationReason('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    if (!justificationReason.trim()) return;

    updateThresholds(formData, justificationReason.trim(), user, {
      ip: '14.139.122.45',
      deviceId: 'GOV-SEC-INSP-MAC-98A1',
    });

    setIsConfirmModalOpen(false);
    setDirty(false);
    setSaveSuccessMessage(`Successfully applied changes as version ${versionInfo.version}! Audit entry generated.`);
    setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ margin: 0 }}>System Administration & Governance</h1>
              <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Shield size={13} />
                Masterplan §69 Audited
              </span>
            </div>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
              Statutory clinical thresholds, versioned governance parameters, and RBAC authority directory
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/audit" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <History size={14} />
              View Audit Log ({entries.length})
            </Link>
          </div>
        </div>
      </div>

      {/* ── Success banner ─────────────────────────────────────── */}
      {saveSuccessMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'var(--color-ok-bg)',
            border: '1px solid var(--color-ok)',
            color: 'var(--color-ok)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
            <CheckCircle2 size={16} />
            {saveSuccessMessage}
          </div>
          <Link href="/audit" style={{ fontSize: 12, textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>
            Inspect in Audit Trail ➔
          </Link>
        </div>
      )}

      {/* ── Tab Switcher ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setActiveTab('config')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'config' ? 700 : 500,
            color: activeTab === 'config' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'config' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          <Sliders size={16} />
          Threshold Values & Governance Rules (§69)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'users' ? 700 : 500,
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'users' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          <Users size={16} />
          User & Authority Directory (RBAC)
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'sync' ? 700 : 500,
            color: activeTab === 'sync' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'sync' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          <Radio size={16} />
          Sync Monitoring & Mutation Queue (Dataset 12)
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 1: Masterplan §69 Threshold Configuration Screen     */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'config' && (
        <div>
          {/* Active Version Ribbon */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(99,102,241,0.05) 100%)',
              border: '1px solid #c7d2fe',
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
                  background: 'var(--color-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCheck size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Current Active Baseline:
                  </span>
                  <span className="badge badge-info" style={{ fontSize: 13, padding: '2px 10px', fontWeight: 700 }}>
                    {versionInfo.version}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                  Last modified on{' '}
                  <strong>{new Date(versionInfo.updatedAt).toLocaleString('en-IN')}</strong> by{' '}
                  <strong>{versionInfo.updatedBy}</strong> ({versionInfo.updatedByRole.replace('_', ' ')})
                </div>
              </div>
            </div>

            <div style={{ maxWidth: '420px', fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
              <div style={{ fontStyle: 'italic' }}>&ldquo;{versionInfo.lastReason}&rdquo;</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Requires confirmation modal + automatic audit logging on every commit
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleOpenConfirm}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
              
              {/* Card 1: Inventory & Stock Thresholds */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>01</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Medicine & Stockpile Thresholds</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Minimum Stock Level (Days of Consumption)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={formData.minimum_stock}
                      onChange={(e) => handleFieldChange('minimum_stock', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Masterplan §69 default: 21 days. Below this generates an early warning replenishment notice.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Critical Stock Level (Days of Consumption)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formData.critical_stock}
                      onChange={(e) => handleFieldChange('critical_stock', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Masterplan §69 default: 7 days. Escalates directly to P1 immediate deterministic alert.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Near-Expiry Window Period (Days)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={365}
                      value={formData.near_expiry_period}
                      onChange={(e) => handleFieldChange('near_expiry_period', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Medicines expiring within this window are prioritized for FEFO dispatch and inter-district transfer.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Safety Buffer Margin (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.safety_buffer}
                      onChange={(e) => handleFieldChange('safety_buffer', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Calculated buffer added on top of ML predicted run-rate during seasonal vulnerability periods.
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Clinical Capacity & Anomaly Thresholds */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>02</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Clinical Capacity & Anomaly Detectors</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Bed Occupancy Critical Threshold (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      step={0.5}
                      value={formData.bed_occupancy_threshold}
                      onChange={(e) => handleFieldChange('bed_occupancy_threshold', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      When bed utilization exceeds this percentage, emergency divert and surge protocols are triggered.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Oxygen Reserve Critical Threshold (Days of Supply)
                    </label>
                    <input
                      type="number"
                      min={0.2}
                      max={14}
                      step={0.1}
                      value={formData.oxygen_critical_threshold}
                      onChange={(e) => handleFieldChange('oxygen_critical_threshold', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Masterplan §69 default: 1.2 days. High-priority deterministic alert requiring tanker dispatch.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Footfall Anomaly Detection Cutoff (σ / Z-Score)
                    </label>
                    <input
                      type="number"
                      min={1.0}
                      max={5.0}
                      step={0.1}
                      value={formData.footfall_anomaly_threshold}
                      onChange={(e) => handleFieldChange('footfall_anomaly_threshold', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Statistically flagged AI alert threshold (e.g. 2.5σ over trailing 28-day weekday mean).
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Default Alert Severity Assignment
                    </label>
                    <select
                      value={formData.alert_severity}
                      onChange={(e) => handleFieldChange('alert_severity', e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    >
                      <option value="P1-Critical">P1-Critical (Immediate Escalation)</option>
                      <option value="P2-High">P2-High (4-Hour Response SLA)</option>
                      <option value="P3-Medium">P3-Medium (Standard Operating Shift)</option>
                      <option value="P4-Advisory">P4-Advisory (Informational Trend)</option>
                    </select>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Baseline routing priority for newly generated deterministic threshold breaches.
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Forecast Horizon & ML Settings */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>03</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Forecast Horizon & Machine Learning</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Primary Forecast Horizon (Days)
                    </label>
                    <input
                      type="number"
                      min={7}
                      max={90}
                      value={formData.forecast_horizon}
                      onChange={(e) => handleFieldChange('forecast_horizon', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Look-ahead window for LSTM and prophet models computing PHC stockout predictions.
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'var(--color-surface-2)',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                      Model Confidence Floor
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      Forecast predictions with confidence below <strong>70%</strong> are automatically marked with
                      &ldquo;AI-flagged, review recommended&rdquo; per Masterplan §44 Copilot Contract.
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Redistribution Rules */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>04</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>AI Redistribution Constraints (§88)</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Maximum Transfer Transit Radius (Kilometers)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={formData.redistribution_rules.max_radius_km}
                      onChange={(e) => handleNestedRuleChange('max_radius_km', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Maximum geographical distance between donor PHC and recipient PHC for automated transfer recommendations.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Donor PHC Minimum Surplus Headroom (Days)
                    </label>
                    <input
                      type="number"
                      min={7}
                      max={90}
                      value={formData.redistribution_rules.min_donor_surplus_days}
                      onChange={(e) => handleNestedRuleChange('min_donor_surplus_days', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Donor facility must maintain at least this many days of stock after transfer is deducted.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Minimum Viable Transfer Batch (Units)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1000}
                      value={formData.redistribution_rules.min_batch_units}
                      onChange={(e) => handleNestedRuleChange('min_batch_units', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Prevents high logistics overhead for negligible quantity reallocations.
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Form Action Controls */}
            <div
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: dirty ? '#fef3c7' : 'var(--color-surface)',
                border: dirty ? '1px solid #f59e0b' : '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {dirty ? (
                  <>
                    <AlertTriangle size={18} style={{ color: '#b45309' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                      Uncommitted parameter modifications detected. Confirmation modal will require operational reason.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} style={{ color: 'var(--color-ok)' }} />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Baseline synchronized with version {versionInfo.version}.
                    </span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all fields back to active baseline values?')) {
                      setFormData(thresholds);
                      setDirty(false);
                    }
                  }}
                  disabled={!dirty}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                >
                  <RotateCcw size={14} />
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={!dirty}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
                >
                  <Save size={15} />
                  Commit & Audit Thresholds
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 2: Role & User Management List (Read-Mostly)         */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <span className="card-title">Authorized Governance Officers & RBAC Directory</span>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Statutory jurisdiction bindings, clearance tiers, and active session tokens
                </p>
              </div>
              <span className="badge badge-muted">{INITIAL_SYSTEM_USERS.length} Registered Officers</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)' }}>
                    <th>Officer Name & Designation</th>
                    <th>Role & Clearance</th>
                    <th>Assigned Jurisdiction</th>
                    <th>Contact & Department</th>
                    <th>MFA Authentication</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_SYSTEM_USERS.map((usr) => {
                    const isCurrentUser = usr.email === user.email;
                    return (
                      <tr
                        key={usr.id}
                        style={{
                          background: isCurrentUser ? 'rgba(37,99,235,0.04)' : undefined,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {usr.name}
                            {isCurrentUser && (
                              <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 6px' }}>
                                (You)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {usr.designation}
                          </div>
                          <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                            ID: {usr.id}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              usr.role === 'national_admin'
                                ? 'badge-critical'
                                : usr.role === 'state_admin'
                                ? 'badge-warn'
                                : 'badge-info'
                            }`}
                            style={{ fontSize: 11 }}
                          >
                            {usr.role.replace('_', ' ')}
                          </span>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {usr.securityClearance}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                            <MapPin size={13} style={{ color: 'var(--color-primary)' }} />
                            <span>{usr.jurisdiction}</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            Strict Row-Level Scoping
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} style={{ color: 'var(--color-text-muted)' }} />
                            <a href={`mailto:${usr.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {usr.email}
                            </a>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {usr.department}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Fingerprint size={13} style={{ color: 'var(--color-ok)' }} />
                            <span>{usr.mfaStatus}</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            Last: {usr.lastLogin}
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-ok" style={{ fontSize: 10 }}>
                            {usr.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dev Mode Switcher Note */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              background: '#f8fafc',
              border: '1px dashed var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} />
                Role Management Policy
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Full user CRUD operations require National Cabinet Health Secretary digital dual-authorization keys.
                Active portal session can test different roles via the header Dev Persona selector.
              </div>
            </div>
            <span className="badge badge-warn">Dual-Signoff Protected</span>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 3: Field Tablet Sync Monitoring & Mutation Queue      */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'sync' && <SyncMonitoringView />}

      {/* ───────────────────────────────────────────────────────── */}
      {/* Confirmation & Audit Generation Modal                    */}
      {/* ───────────────────────────────────────────────────────── */}
      {isConfirmModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--color-surface)',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--color-warn-bg)',
                  color: 'var(--color-warn)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Confirm Threshold Reconfiguration (§69)
                </h3>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  This action will commit version changes and generate an immutable audit log entry.
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-surface-2)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Proposed Changes:</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-text-secondary)' }}>
                {formData.minimum_stock !== thresholds.minimum_stock && (
                  <li>
                    Minimum Stock: <strong>{thresholds.minimum_stock}d</strong> ➔{' '}
                    <strong>{formData.minimum_stock}d</strong>
                  </li>
                )}
                {formData.critical_stock !== thresholds.critical_stock && (
                  <li>
                    Critical Stock: <strong>{thresholds.critical_stock}d</strong> ➔{' '}
                    <strong>{formData.critical_stock}d</strong>
                  </li>
                )}
                {formData.near_expiry_period !== thresholds.near_expiry_period && (
                  <li>
                    Near Expiry: <strong>{thresholds.near_expiry_period}d</strong> ➔{' '}
                    <strong>{formData.near_expiry_period}d</strong>
                  </li>
                )}
                {formData.bed_occupancy_threshold !== thresholds.bed_occupancy_threshold && (
                  <li>
                    Bed Occupancy: <strong>{thresholds.bed_occupancy_threshold}%</strong> ➔{' '}
                    <strong>{formData.bed_occupancy_threshold}%</strong>
                  </li>
                )}
                {formData.oxygen_critical_threshold !== thresholds.oxygen_critical_threshold && (
                  <li>
                    Oxygen Critical: <strong>{thresholds.oxygen_critical_threshold}d</strong> ➔{' '}
                    <strong>{formData.oxygen_critical_threshold}d</strong>
                  </li>
                )}
                {formData.footfall_anomaly_threshold !== thresholds.footfall_anomaly_threshold && (
                  <li>
                    Footfall Anomaly: <strong>{thresholds.footfall_anomaly_threshold}σ</strong> ➔{' '}
                    <strong>{formData.footfall_anomaly_threshold}σ</strong>
                  </li>
                )}
                {formData.safety_buffer !== thresholds.safety_buffer && (
                  <li>
                    Safety Buffer: <strong>{thresholds.safety_buffer}%</strong> ➔{' '}
                    <strong>{formData.safety_buffer}%</strong>
                  </li>
                )}
                {formData.forecast_horizon !== thresholds.forecast_horizon && (
                  <li>
                    Forecast Horizon: <strong>{thresholds.forecast_horizon}d</strong> ➔{' '}
                    <strong>{formData.forecast_horizon}d</strong>
                  </li>
                )}
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Mandatory Operational Justification / Memo Reference <span style={{ color: 'var(--color-critical)' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. MOHFW Memo 9021: Buffer enhancement for seasonal monsoon surge..."
                value={justificationReason}
                onChange={(e) => setJustificationReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  background: 'var(--color-surface)',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Recorded permanently in the national audit trail under your operator ID (<code>{user.id}</code>).
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn btn-outline"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={!justificationReason.trim()}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 18px' }}
              >
                Sign & Commit Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
