'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import { RiskBadge } from '@/components/common/RiskBadge';
import { TrendSparkline } from '@/components/common/TrendSparkline';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import {
  getPatientSummaryByScope,
  getPatientFlowTrendsByScope,
  getDiseaseCategoryBreakdownByScope,
  getSurgeAnomaliesByScope,
  getSurgeStateConfig,
  type PatientIntelligenceSummary,
  type PatientFlowTrendPoint,
  type DiseaseCategoryTrend,
  type SurgeAnomalyItem,
  type SurgeClassificationState,
} from '@/lib/patientData';
import {
  Activity,
  AlertTriangle,
  Stethoscope,
  Siren,
  Bed,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  Layers,
  Filter,
  Eye,
  FileCheck,
  Radio,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export default function PatientsPage() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, getScopeLabel } = useScopeStore();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [surgeFilter, setSurgeFilter] = useState<'ALL' | SurgeClassificationState>('ALL');
  const [selectedDiseaseCategory, setSelectedDiseaseCategory] = useState<string>('dis-vector');

  // Enforce: clamp level/stateId/districtId to the authenticated user's jurisdiction
  const scope = useMemo(
    () => getEnforcedScope(user, { level, stateId, districtId }),
    [user, level, stateId, districtId]
  );

  // Scope-reactive datasets — driven by enforced scope level
  const summary: PatientIntelligenceSummary = useMemo(() => getPatientSummaryByScope(scope.level), [scope.level]);
  const flowTrends: PatientFlowTrendPoint[] = useMemo(() => getPatientFlowTrendsByScope(scope.level), [scope.level]);
  const diseaseBreakdown: DiseaseCategoryTrend[] = useMemo(
    () => getDiseaseCategoryBreakdownByScope(scope.level),
    [scope.level]
  );
  const surgeAnomalies: SurgeAnomalyItem[] = useMemo(() => getSurgeAnomaliesByScope(scope.level), [scope.level]);

  // Filtered surge anomalies
  const filteredSurges = useMemo(() => {
    if (surgeFilter === 'ALL') return surgeAnomalies;
    return surgeAnomalies.filter((s) => s.state === surgeFilter);
  }, [surgeAnomalies, surgeFilter]);

  // Selected disease detail
  const activeDisease = useMemo(
    () => diseaseBreakdown.find((d) => d.id === selectedDiseaseCategory) || diseaseBreakdown[0],
    [diseaseBreakdown, selectedDiseaseCategory]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Patient Intelligence & Surge Detection
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 9999,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}
            >
              Masterplan §42
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Integrated patient flow trajectories, disease category breakdowns, and multi-facility outbreak verification
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <DataFreshnessLabel
            timestamp={lastRefreshed}
            onRefresh={() => setLastRefreshed(new Date())}
            source="EHR Digital Registry & HMIS Stream"
          />
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Current Jurisdiction: <strong style={{ color: '#0f172a' }}>{getScopeLabel()}</strong>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb Scope Selector ── */}
      <ScopeSelector showFreshness={false} showSummaryChip={true} />

      {/* ── Top Metric Cards (Patient Flow Pillars) ── */}
      <div className="grid-4" style={{ gap: 16 }}>
        {/* Outpatient Consultations (OPD) */}
        <div className="card" style={{ padding: 18, background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              OPD Consultations
            </span>
            <Stethoscope size={16} color="#2563eb" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
              {summary.totalOpdToday.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
              +6.4% vs 7d avg
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Primary care presentations today
          </div>
        </div>

        {/* Emergency Triages */}
        <div className="card" style={{ padding: 18, background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Emergency & Trauma Triage
            </span>
            <Siren size={16} color="#dc2626" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>
              {summary.emergencyCasesToday.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              ({Number(((summary.emergencyCasesToday / summary.totalOpdToday) * 100).toFixed(1))}%)
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Red & Yellow triage cases
          </div>
        </div>

        {/* Inpatient Admissions */}
        <div className="card" style={{ padding: 18, background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Inpatient Admissions
            </span>
            <Bed size={16} color="#059669" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>
              {summary.admissionsToday.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              ({summary.admissionRatePct}% admission rate)
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Ward admissions logged today
          </div>
        </div>

        {/* Upstream Referrals */}
        <div className="card" style={{ padding: 18, background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Upstream Referrals
            </span>
            <ArrowUpRight size={16} color="#7c3aed" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>
              {summary.referralsToday.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
              ({summary.referralRatePct}% rate)
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Transferred to Sub-District / Tertiary
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SURGE-DETECTION PANEL (MASTERPLAN §42 OUTBREAK VERIFICATION ENGINE)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={20} color="#dc2626" />
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Syndromic Surge Detection Panel
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#fee2e2',
                  color: '#dc2626',
                }}
              >
                {surgeAnomalies.length} Signals Monitored
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Statistical anomaly surveillance distinguishing isolated facility artifacts from true regional epidemic clusters
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Filter:</span>
            <button
              onClick={() => setSurgeFilter('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: surgeFilter === 'ALL' ? '#2563eb' : '#e2e8f0',
                background: surgeFilter === 'ALL' ? '#eff6ff' : '#ffffff',
                color: surgeFilter === 'ALL' ? '#1d4ed8' : '#64748b',
              }}
            >
              All States ({surgeAnomalies.length})
            </button>
            <button
              onClick={() => setSurgeFilter('SUDDEN_SURGE')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: surgeFilter === 'SUDDEN_SURGE' ? '#ca8a04' : '#e2e8f0',
                background: surgeFilter === 'SUDDEN_SURGE' ? '#fefce8' : '#ffffff',
                color: surgeFilter === 'SUDDEN_SURGE' ? '#a16207' : '#64748b',
              }}
            >
              Sudden Surge (1 PHC)
            </button>
            <button
              onClick={() => setSurgeFilter('PERSISTENT_INCREASE')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: surgeFilter === 'PERSISTENT_INCREASE' ? '#ea580c' : '#e2e8f0',
                background: surgeFilter === 'PERSISTENT_INCREASE' ? '#fff7ed' : '#ffffff',
                color: surgeFilter === 'PERSISTENT_INCREASE' ? '#c2410c' : '#64748b',
              }}
            >
              Persistent Increase
            </button>
            <button
              onClick={() => setSurgeFilter('REGIONAL_CLUSTER')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: surgeFilter === 'REGIONAL_CLUSTER' ? '#dc2626' : '#e2e8f0',
                background: surgeFilter === 'REGIONAL_CLUSTER' ? '#fee2e2' : '#ffffff',
                color: surgeFilter === 'REGIONAL_CLUSTER' ? '#b91c1c' : '#64748b',
              }}
            >
              Regional Cluster
            </button>
          </div>
        </div>

        {/* Masterplan §42 Mandate Notice Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            marginBottom: 20,
            fontSize: 12,
            color: '#334155',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <strong>Masterplan §42 Epidemiological Guardrail:</strong> A lone sudden spike from a single facility is strictly designated as{' '}
            <span style={{ fontWeight: 700, color: '#ca8a04', background: '#fefce8', padding: '1px 6px', borderRadius: 4 }}>
              "Flagged for Review"
            </span>{' '}
            to prevent false outbreak alarms caused by batched digital entries or isolated localized clusters. Strong language like{' '}
            <span style={{ fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: 4 }}>
              "Outbreak Detected"
            </span>{' '}
            is reserved solely for cross-checked <strong>Regional Clusters</strong> affecting contiguous facilities.
          </div>
        </div>

        {/* Dynamic Surge Anomaly Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredSurges.map((anomaly) => {
            const config = getSurgeStateConfig(anomaly.state);

            return (
              <div
                key={anomaly.id}
                style={{
                  border: `1px solid ${config.cardBorder}`,
                  borderRadius: 8,
                  background: config.cardBg,
                  padding: 16,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        {anomaly.syndromeName}
                      </span>
                      <RiskBadge
                        level={config.badgeLevel}
                        label={config.badgeLabel}
                        pulse={config.pulse}
                        size="sm"
                      />
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color={config.accentColor} />
                        <strong>{anomaly.affectedJurisdiction}</strong>
                      </span>
                      <span>•</span>
                      <span>{anomaly.districtName} ({anomaly.stateCode})</span>
                      <span>•</span>
                      <span>Detected: {anomaly.detectedAt}</span>
                      {anomaly.spatialSpreadKm && (
                        <>
                          <span>•</span>
                          <span style={{ fontWeight: 600, color: config.accentColor }}>
                            Spread Radius: ~{anomaly.spatialSpreadKm} km
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Anomaly baseline metrics pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>7d Baseline</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                        {anomaly.detectedBaselineVsCurrent.baseline7DayAvg} cases/d
                      </div>
                    </div>
                    <div style={{ width: 1, height: 22, background: '#e2e8f0' }} />
                    <div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Current Spike</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {anomaly.detectedBaselineVsCurrent.currentCount} cases
                      </div>
                    </div>
                    <div style={{ width: 1, height: 22, background: '#e2e8f0' }} />
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: config.accentColor,
                      }}
                    >
                      +{anomaly.detectedBaselineVsCurrent.pctIncrease}%
                    </div>
                  </div>
                </div>

                {/* Facilities List & Action Guidance */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.06)',
                    fontSize: 12,
                    color: '#334155',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <strong>Facilities Involved:</strong>{' '}
                    {anomaly.phcNames.map((phc, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          background: '#f1f5f9',
                          padding: '1px 6px',
                          borderRadius: 4,
                          marginRight: 6,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {phc}
                      </span>
                    ))}
                  </div>
                  <div>
                    <strong>Action & Verification Protocol:</strong> {anomaly.actionGuidance}
                  </div>
                </div>

                {/* Interactive Action Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 10,
                    paddingTop: 8,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: config.accentColor }}>
                    Status: {anomaly.statusText}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {anomaly.state === 'SUDDEN_SURGE' ? (
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 4,
                          border: '1px solid #ca8a04',
                          background: '#fefce8',
                          color: '#854d0e',
                          cursor: 'pointer',
                        }}
                      >
                        <FileCheck size={12} />
                        <span>Verify Field Register</span>
                      </button>
                    ) : anomaly.state === 'REGIONAL_CLUSTER' ? (
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 4,
                          border: 'none',
                          background: '#dc2626',
                          color: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <Siren size={12} />
                        <span>Dispatch Rapid Response Team (RRT)</span>
                      </button>
                    ) : (
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 4,
                          border: '1px solid #ea580c',
                          background: '#fff7ed',
                          color: '#9a3412',
                          cursor: 'pointer',
                        }}
                      >
                        <Activity size={12} />
                        <span>Monitor Consumable Burn</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PATIENT FLOW TREND CHARTS (OPD / EMERGENCY / ADMISSION / REFERRAL)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="card" style={{ background: '#ffffff', padding: 24 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 20,
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Patient Flow Trajectories (Last 7 Days)
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Multi-tiered service load: Outpatient Consultations, Emergency Triages, Inpatient Admissions, and Upstream Referrals
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Referral Conversion</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>
                {summary.referralRatePct}% of OPD
              </div>
            </div>
            <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Admission Rate</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                {summary.admissionRatePct}% of Presentations
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 320, width: '100%', marginBottom: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={flowTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="opdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="emgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="opdVisits"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#opdGrad)"
                name="OPD Consultations"
              />
              <Area
                type="monotone"
                dataKey="emergencyTriages"
                stroke="#dc2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#emgGrad)"
                name="Emergency Triage"
              />
              <Line
                type="monotone"
                dataKey="inpatientAdmissions"
                stroke="#059669"
                strokeWidth={2}
                name="Inpatient Admissions"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="upstreamReferrals"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="Upstream Referrals"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          DISEASE-CATEGORY TREND BREAKDOWN
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="card" style={{ background: '#ffffff', padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            Disease-Category Trend Breakdown
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Syndromic surveillance across Respiratory, Vector-Borne, Water-Borne, and Chronic Non-Communicable illness
          </p>
        </div>

        {/* Disease Cards Grid */}
        <div className="grid-5" style={{ gap: 14, marginBottom: 20 }}>
          {diseaseBreakdown.map((cat) => {
            const isSelected = cat.id === selectedDiseaseCategory;
            const isSpiking = cat.weekOverWeekChangePct > 25;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedDiseaseCategory(cat.id)}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: `2px solid ${isSelected ? cat.color : '#e2e8f0'}`,
                  background: isSelected ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {isSpiking && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    +{cat.weekOverWeekChangePct}%
                  </span>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                  {cat.shortCode}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                  {cat.currentActiveCases.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                  {cat.sharePct}% of total presentations
                </div>

                <TrendSparkline
                  data={cat.trendSparkline}
                  width={90}
                  height={22}
                  color={cat.color}
                  higherIsBetter={false}
                />
              </div>
            );
          })}
        </div>

        {/* Selected Disease Deep-Dive Banner */}
        <div
          style={{
            padding: 18,
            borderRadius: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeDisease.color }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                {activeDisease.categoryName}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: activeDisease.weekOverWeekChangePct > 15 ? '#fee2e2' : '#ecfdf5',
                  color: activeDisease.weekOverWeekChangePct > 15 ? '#dc2626' : '#059669',
                }}
              >
                {activeDisease.weekOverWeekChangePct > 0 ? '+' : ''}
                {activeDisease.weekOverWeekChangePct}% week-over-week
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
              <strong>Primary Syndromic Manifestation:</strong> {activeDisease.primarySyndrome}
            </div>
            <div style={{ fontSize: 12, color: '#334155' }}>
              <strong>Clinical Action Advisory:</strong> {activeDisease.clinicalAdvisory}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>Active Case Volume</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: activeDisease.color }}>
              {activeDisease.currentActiveCases.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {activeDisease.sharePct}% caseload share
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

