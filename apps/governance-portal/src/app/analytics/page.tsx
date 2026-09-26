'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import {
  REPORT_TIERS,
  ReportTier,
  ExportFormat,
  GeneratedReport,
} from '@/lib/analyticsData';
import {
  FileText,
  Download,
  CheckCircle,
  Lock,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Building,
  Building2,
  Home,
  Check,
} from 'lucide-react';

const TIER_ICONS: Record<ReportTier, any> = {
  national: ShieldCheck,
  state: Building,
  district: Building2,
  phc: Home,
};

const FORMAT_ICONS: Record<ExportFormat, any> = {
  PDF: FileText,
  CSV: FileCode,
  XLSX: FileSpreadsheet,
};

// Tier order — used to detect if a role is attempting to request a higher-tier report
const TIER_AUTHORITY: Record<string, ReportTier[]> = {
  national_admin: ['national', 'state', 'district', 'phc'],
  state_admin: ['state', 'district', 'phc'],
  district_admin: ['district', 'phc'],
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, getScopeLabel } = useScopeStore();

  // getEnforcedScope used to derive the authoritative jurisdiction for query params
  const enforcedScope = useMemo(
    () => getEnforcedScope(user, { level, stateId, districtId }),
    [user, level, stateId, districtId]
  );

  const defaultTier: ReportTier =
    user.role === 'district_admin' ? 'district'
    : user.role === 'state_admin' ? 'state'
    : 'national';

  const [selectedTier, setSelectedTier] = useState<ReportTier>(defaultTier);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'quarter' | 'ytd'>('30d');
  const [reports, setReports] = useState<GeneratedReport[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('governance_analytics_reports');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        // Fallback to empty
      }
    }
    return [];
  });

  const updateReports = (newReports: GeneratedReport[] | ((prev: GeneratedReport[]) => GeneratedReport[])) => {
    setReports((prev) => {
      const updated = typeof newReports === 'function' ? newReports(prev) : newReports;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('governance_analytics_reports', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const activeConfig = REPORT_TIERS[selectedTier];
  // Enforce: tier must be in the role's allowed tiers (second line of defence after requiredRole)
  const allowedTiers: ReportTier[] = TIER_AUTHORITY[user.role] ?? [];
  const isAllowed = activeConfig.requiredRole.includes(user.role) && allowedTiers.includes(selectedTier);

  // Prevent setting a tier outside authority (URL/console manipulation guard)
  const handleSetTier = (tier: ReportTier) => {
    if (!allowedTiers.includes(tier)) return; // silently reject unauthorized tier switch
    setSelectedTier(tier);
  };

  // Non-blocking async report generation
  const handleGenerate = (format: ExportFormat) => {
    if (!isAllowed) return;

    const newReportId = `RPT-${Date.now().toString().slice(-6)}`;
    const newReportTitle = `${activeConfig.title} (${dateRange.toUpperCase()})`;
    const currentScope = getScopeLabel();

    const newJob: GeneratedReport = {
      id: newReportId,
      title: newReportTitle,
      tier: selectedTier,
      format,
      status: 'processing',
      progressPct: 20,
      size: format === 'PDF' ? '3.4 MB' : format === 'CSV' ? '920 KB' : '1.8 MB',
      createdAt: new Date().toISOString(),
      scopeLabel: currentScope,
      generatedBy: `${user.name} (${user.role})`,
    };

    // Prepend to list immediately without blocking UI
    updateReports((prev) => [newJob, ...prev]);

    // Simulate backend async processing pipeline (e.g. Lambda/Worker + S3 Object Storage)
    setTimeout(() => {
      updateReports((prev) =>
        prev.map((r) =>
          r.id === newReportId
            ? { ...r, progressPct: 65 }
            : r
        )
      );
    }, 1000);

    setTimeout(() => {
      const s3Url = `https://gov-health-reports.s3.ap-south-1.amazonaws.com/exports/2026/09/${selectedTier}_${format.toLowerCase()}_${newReportId}.${format.toLowerCase()}`;
      updateReports((prev) =>
        prev.map((r) =>
          r.id === newReportId
            ? {
                ...r,
                status: 'ready',
                progressPct: 100,
                downloadUrl: s3Url,
              }
            : r
        )
      );
    }, 2400);
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
            <BarChart3 size={24} style={{ color: 'var(--color-primary)' }} />
            Analytics & Reports Governance Engine
          </h1>
          <p className="page-subtitle">
            Masterplan four-tier statutory reporting (National → State → District → PHC) with non-blocking async export generation and object-storage links.
          </p>
        </div>
        <ScopeSelector />
      </div>

      {/* ── FOUR REPORT TIERS TAB STRIP ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {(['national', 'state', 'district', 'phc'] as ReportTier[]).map((tierKey) => {
          const cfg = REPORT_TIERS[tierKey];
          const IconComponent = TIER_ICONS[tierKey];
          const isSelected = selectedTier === tierKey;
          const roleHasAccess = cfg.requiredRole.includes(user.role);

          return (
            <div
              key={tierKey}
              onClick={() => handleSetTier(tierKey)}
              style={{
                background: isSelected ? '#EFF6FF' : 'white',
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    background: isSelected ? 'var(--color-primary)' : '#F1F5F9',
                    color: isSelected ? 'white' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComponent size={18} />
                </div>

                {!roleHasAccess ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#F1F5F9',
                      color: '#64748B',
                      padding: '2px 8px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Lock size={10} /> Role Locked
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#DCFCE7',
                      color: '#15803D',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    Authorized
                  </span>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#1E40AF' : '#0F172A' }}>
                  {tierKey.toUpperCase()} TIER
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {cfg.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── REPORT CONFIGURATION & INTERACTIVE PREVIEW ──────────────────────── */}
      <div
        className="card"
        style={{
          background: 'white',
          padding: 24,
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {selectedTier} Tier Report
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {activeConfig.title}
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              {activeConfig.subtitle}
            </p>
          </div>

          {/* Date Range Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Period:</span>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 'var(--radius-sm)', padding: 2 }}>
              {(['7d', '30d', 'quarter', 'ytd'] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => setDateRange(rng)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background: dateRange === rng ? 'white' : 'transparent',
                    color: dateRange === rng ? '#0F172A' : '#64748B',
                    fontWeight: dateRange === rng ? 700 : 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: dateRange === rng ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {rng === '7d' ? 'Last 7 Days' : rng === '30d' ? 'Last 30 Days' : rng === 'quarter' ? 'Q2 FY26' : 'Year to Date'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Role Access Enforcement Warning if Restricted */}
        {!isAllowed ? (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Lock size={22} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#991B1B' }}>
              <strong>Access Restricted:</strong> Generating {selectedTier.toUpperCase()} Tier reports requires{' '}
              {activeConfig.requiredRole.join(' or ')} privileges. Your current role is <strong>{user.role}</strong>. Please select your jurisdiction tier or switch roles in dev mode.
            </div>
          </div>
        ) : (
          <>
            {/* Live Metrics Preview Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                background: '#F8FAFC',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              {activeConfig.keyMetrics.map((km, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{km.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{km.value}</div>
                  {km.delta && <div style={{ fontSize: 11, color: '#0369A1', fontWeight: 600 }}>{km.delta}</div>}
                </div>
              ))}
            </div>

            {/* Included Statutory Sections */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Included Statutory Analysis Sections:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 8, marginTop: 10 }}>
                {activeConfig.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: '#334155',
                      background: '#F8FAFC',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-light)',
                    }}
                  >
                    <Check size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── NON-BLOCKING ASYNC EXPORT ACTIONS ────────────────────────── */}
            <div
              style={{
                paddingTop: 16,
                borderTop: '1px solid var(--color-border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Target Scope: <strong>{getScopeLabel()}</strong> • Processing executes asynchronously in cloud object storage
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* PDF EXPORT */}
                <button
                  id="export-pdf-btn"
                  onClick={() => handleGenerate('PDF')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: '#DC2626',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                  }}
                  aria-label="Export as PDF"
                >
                  <FileText size={14} /> Export PDF Report
                </button>

                {/* CSV EXPORT */}
                <button
                  id="export-csv-btn"
                  onClick={() => handleGenerate('CSV')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    color: '#0F172A',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  aria-label="Export as CSV"
                >
                  <FileCode size={14} /> Export CSV Data
                </button>

                {/* EXCEL EXPORT */}
                <button
                  id="export-xlsx-btn"
                  onClick={() => handleGenerate('XLSX')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #86EFAC',
                    background: '#F0FDF4',
                    color: '#15803D',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  aria-label="Export as Excel"
                >
                  <FileSpreadsheet size={14} /> Export Excel (.xlsx)
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── GENERATED REPORTS & OBJECT-STORAGE DOWNLOAD TRAY ─────────────────── */}
      <div className="card" style={{ background: 'white', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Recent Generated Reports & Object-Storage Links
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Secure S3/Cloud Storage endpoints generated for governance dossiers
            </div>
          </div>
          <span className="badge badge-info">{reports.length} files available</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Title</th>
                <th>Tier</th>
                <th>Format</th>
                <th>File Size</th>
                <th>Jurisdiction Scope</th>
                <th>Status / Progress</th>
                <th>Download Link</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <FileText size={28} color="#cbd5e1" />
                      <div style={{ fontWeight: 500 }}>No reports generated yet.</div>
                      <div style={{ fontSize: 11 }}>Select a report tier and click Export to generate your first report.</div>
                    </div>
                  </td>
                </tr>
              ) : (
              reports.map((r) => {
                const isReady = r.status === 'ready';

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            padding: 6,
                            borderRadius: 4,
                            background: r.format === 'PDF' ? '#FEE2E2' : r.format === 'CSV' ? '#EFF6FF' : '#DCFCE7',
                            color: r.format === 'PDF' ? '#DC2626' : r.format === 'CSV' ? '#2563EB' : '#15803D',
                          }}
                        >
                          <FileText size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                            ID: {r.id} • {new Date(r.createdAt).toLocaleTimeString()} by {r.generatedBy}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-muted" style={{ textTransform: 'uppercase' }}>
                        {r.tier}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: r.format === 'PDF' ? '#FEE2E2' : r.format === 'CSV' ? '#EFF6FF' : '#DCFCE7',
                          color: r.format === 'PDF' ? '#991B1B' : r.format === 'CSV' ? '#1E40AF' : '#166534',
                        }}
                      >
                        {r.format}
                      </span>
                    </td>

                    <td className="text-muted">{r.size}</td>
                    <td className="text-muted">{r.scopeLabel}</td>

                    <td>
                      {isReady ? (
                        <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} /> Ready
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              border: '2px solid #3B82F6',
                              borderTopColor: 'transparent',
                              animation: 'spin 1s linear infinite',
                            }}
                          />
                          <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                            Generating ({r.progressPct}%)
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      {isReady && r.downloadUrl ? (
                        <a
                          href={r.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '5px 12px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: 'var(--radius-xs)',
                            color: '#1D4ED8',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            textDecoration: 'none',
                          }}
                          aria-label={`Download ${r.title}`}
                        >
                          <Download size={12} />
                          <span>Download {r.format}</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Building object…
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
