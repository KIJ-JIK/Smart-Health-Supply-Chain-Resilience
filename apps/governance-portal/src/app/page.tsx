'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import {
  NATIONAL_OVERVIEW,
  STATE_OVERVIEW,
  DISTRICT_OVERVIEW,
} from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { useSseStream } from '@/hooks/useSseStream';
import {
  ScopeSelector,
  KpiTile,
  RiskBadge,
  DataFreshnessLabel,
  TrendSparkline,
} from '@/components/common';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Bed,
  Wind,
  Users,
  UserCheck,
  Flame,
  ArrowRight,
  MapPin,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldAlert,
  Clock,
  Truck,
  Zap,
  Radio,
  BarChart3,
  Stethoscope,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  NationalOverview,
  StateOverview,
  DistrictOverview,
  KpiTick,
} from '@/types';
import { RiskLevel } from '@/components/common/RiskBadge';

// ── 7-Day Forecast trajectory data for Panel 3 ───────────────────────────────
const FORECAST_CURVE = [
  { day: 'Day 1 (Today)', baselineCoverage: 87.4, projectedStockout: 78, patientSurge: 0 },
  { day: 'Day 3', baselineCoverage: 86.1, projectedStockout: 84, patientSurge: 4.2 },
  { day: 'Day 5', baselineCoverage: 84.8, projectedStockout: 91, patientSurge: 8.7 },
  { day: 'Day 7', baselineCoverage: 83.2, projectedStockout: 96, patientSurge: 14.8 },
  { day: 'Day 10', baselineCoverage: 81.9, projectedStockout: 104, patientSurge: 17.5 },
  { day: 'Day 14', baselineCoverage: 80.5, projectedStockout: 112, patientSurge: 19.1 },
];

import { useCrisisStore } from '@/store/crisisStore';
import { CrisisDashboardLayout } from '@/components/crisis/CrisisDashboardLayout';

export default function CommandCenterPage() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, phcId } = useScopeStore();
  const { isCrisisMode } = useCrisisStore();

  // State to hold live SSE KPI overrides
  const [liveKpiTicks, setLiveKpiTicks] = useState<Record<string, KpiTick>>({});
  const [lastSsePulse, setLastSsePulse] = useState<string | null>(null);

  // Wire to live KPI SSE stream per contract: /governance/kpi/stream
  const { status: sseStatus } = useSseStream<KpiTick>('/governance/kpi/stream', {
    onMessage: (tick) => {
      if (tick && tick.metric) {
        setLiveKpiTicks((prev) => ({
          ...prev,
          [tick.metric]: tick,
        }));
        setLastSsePulse(tick.timestamp);
      }
    },
    enabled: true,
  });

  // Fetch GraphQL based on active role/scope (initial load & refresh fallback)
  const isNationalScope = level === 'national' || (!stateId && !districtId);
  const isStateScope = level === 'state' || (Boolean(stateId) && !districtId);

  const { data: nationalData, loading: nationalLoading } = useQuery(NATIONAL_OVERVIEW, {
    skip: !isNationalScope,
  });

  const { data: stateData, loading: stateLoading } = useQuery(STATE_OVERVIEW, {
    variables: { stateId: stateId ?? user.stateId ?? 'state-mh' },
    skip: !isStateScope,
  });

  const { data: districtData, loading: districtLoading } = useQuery(DISTRICT_OVERVIEW, {
    variables: { districtId: districtId ?? user.districtId ?? 'dist-pune' },
    skip: isNationalScope || isStateScope,
  });

  const loading = isNationalScope ? nationalLoading : isStateScope ? stateLoading : districtLoading;

  const nationalOverview: NationalOverview | undefined = nationalData?.nationalOverview;
  const stateOverview: StateOverview | undefined = stateData?.stateOverview;
  const districtOverview: DistrictOverview | undefined = districtData?.districtOverview;

  // ── Baseline KPI values resolved by scope ─────────────────────────────────
  const baselineKpis = useMemo(() => {
    if (isNationalScope) {
      return {
        totalPhcs: nationalOverview?.totalPhcs ?? 45320,
        activePhcs: nationalOverview?.activePhcs ?? 44108,
        criticalPhcs: nationalOverview?.criticalShortages ?? 78,
        medicineAlerts: nationalOverview?.stockoutAlerts ?? 234,
        bedUtilization: 74.2,
        oxygenStatus: 96.8,
        staffAvailability: 85.8,
        patientLoad: 312400,
        openEmergencies: nationalOverview?.outbreakAlerts ?? 12,
        pendingRequests: nationalOverview?.pendingRedistributions ?? 156,
      };
    }

    if (isStateScope) {
      return {
        totalPhcs: stateOverview?.totalPhcs ?? 3682,
        activePhcs: stateOverview?.activePhcs ?? 3601,
        criticalPhcs: stateOverview?.criticalShortages ?? 12,
        medicineAlerts: stateOverview?.stockoutAlerts ?? 32,
        bedUtilization: 78.5,
        oxygenStatus: 95.1,
        staffAvailability: 83.3,
        patientLoad: 24800,
        openEmergencies: 3,
        pendingRequests: 24,
      };
    }

    return {
      totalPhcs: districtOverview?.totalPhcs ?? 148,
      activePhcs: districtOverview?.activePhcs ?? 145,
      criticalPhcs: 3,
      medicineAlerts: districtOverview?.stockoutAlerts ?? 6,
      bedUtilization: 81.2,
      oxygenStatus: 98.4,
      staffAvailability: 88.7,
      patientLoad: 1420,
      openEmergencies: 1,
      pendingRequests: 5,
    };
  }, [isNationalScope, isStateScope, nationalOverview, stateOverview, districtOverview]);

  // Helper to resolve live SSE tick with GraphQL fallback
  const getKpiValue = (metricName: string, fallbackVal: number | string) => {
    const live = liveKpiTicks[metricName];
    if (live && live.value !== undefined) {
      return {
        value: live.value,
        delta: live.delta,
        severity: live.severity,
        isLive: true,
        updatedAt: live.timestamp,
      };
    }
    return {
      value: fallbackVal,
      delta: undefined,
      severity: undefined,
      isLive: false,
      updatedAt: undefined,
    };
  };

  // Resolve the 10 top row KPIs
  const kpi1 = getKpiValue('Total PHCs', baselineKpis.totalPhcs.toLocaleString());
  const kpi2 = getKpiValue('Active PHCs', baselineKpis.activePhcs.toLocaleString());
  const kpi3 = getKpiValue('Critical PHCs', baselineKpis.criticalPhcs);
  const kpi4 = getKpiValue('Medicine Alerts', baselineKpis.medicineAlerts);
  const kpi5 = getKpiValue('Bed Utilization', baselineKpis.bedUtilization);
  const kpi6 = getKpiValue('Oxygen Status', baselineKpis.oxygenStatus);
  const kpi7 = getKpiValue('Staff Availability', baselineKpis.staffAvailability);
  const kpi8 = getKpiValue(
    'Patient Load',
    typeof baselineKpis.patientLoad === 'number'
      ? baselineKpis.patientLoad.toLocaleString()
      : baselineKpis.patientLoad
  );
  const kpi9 = getKpiValue('Open Emergencies', baselineKpis.openEmergencies);
  const kpi10 = getKpiValue('Pending Requests', baselineKpis.pendingRequests);

  // If Crisis Mode is activated by national admin, re-prioritize primary layout into the 9-tier Crisis Layout
  if (isCrisisMode) {
    return <CrisisDashboardLayout />;
  }

  return (
    <div className="command-center-container" style={{ paddingBottom: '32px' }}>
      {/* ── Page Header with Live SSE indicator ────────────────────────────── */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            National Command Center
          </h1>
          <p className="page-subtitle">
            Executive multi-echelon oversight & real-time operational posture
          </p>
        </div>

        {/* Live SSE status indicator badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: '99px',
              backgroundColor: sseStatus === 'connected' ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${sseStatus === 'connected' ? '#a7f3d0' : '#fde68a'}`,
              fontSize: '11px',
              fontWeight: 600,
              color: sseStatus === 'connected' ? '#065f46' : '#92400e',
            }}
            title="Wired to /governance/kpi/stream SSE feed"
          >
            <Radio
              size={12}
              style={{
                color: sseStatus === 'connected' ? '#059669' : '#d97706',
                animation: sseStatus === 'connected' ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span>
              {sseStatus === 'connected' ? 'SSE Live Stream Active' : 'Connecting to Stream…'}
            </span>
          </div>

          <RiskBadge
            level={
              Number(kpi3.value) > 50 || Number(kpi9.value) > 10
                ? 'HIGH'
                : 'LOW'
            }
            size="md"
          />
        </div>
      </div>

      {/* ── Shared Drill-down Breadcrumb & Scope Selector per Masterplan §26 ── */}
      <ScopeSelector />

      {/* ──────────────────────────────────────────────────────────────────────
          TOP KPI ROW (10 KPIs specified in prompt):
          Total PHCs, Active PHCs, Critical PHCs, Medicine Alerts, Bed Utilization,
          Oxygen Status, Staff Availability, Patient Load, Open Emergencies, Pending Requests
          ────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        {/* 1. Total PHCs */}
        <KpiTile
          label="Total PHCs"
          value={kpi1.value}
          unit="PHCs"
          trend="flat"
          riskLevel="LOW"
          severity="ok"
          icon={<Building2 size={16} />}
          loading={loading}
          lastUpdated={kpi1.updatedAt}
          source="Master Facility Registry"
          sparklineData={[45000, 45100, 45200, 45250, 45300, 45310, 45320]}
        />

        {/* 2. Active PHCs */}
        <KpiTile
          label="Active PHCs"
          value={kpi2.value}
          unit="Live"
          trend="up"
          delta={0.4}
          deltaPeriod="vs yesterday"
          riskLevel="LOW"
          severity="ok"
          icon={<CheckCircle2 size={16} />}
          loading={loading}
          lastUpdated={kpi2.updatedAt}
          source="Heartbeat SSE Feed"
          sparklineData={[43800, 43900, 44020, 44080, 44100, 44095, 44108]}
        />

        {/* 3. Critical PHCs */}
        <KpiTile
          label="Critical PHCs"
          value={kpi3.value}
          unit="PHCs"
          trend="down"
          delta={-4}
          deltaPeriod="vs 48h ago"
          higherIsBetter={false}
          riskLevel="CRITICAL"
          severity="critical"
          icon={<AlertOctagon size={16} />}
          loading={loading}
          lastUpdated={kpi3.updatedAt}
          source="/governance/kpi/stream"
          sparklineData={[92, 88, 85, 82, 80, 79, 78]}
        />

        {/* 4. Medicine Alerts */}
        <KpiTile
          label="Medicine Alerts"
          value={kpi4.value}
          unit="Stockouts"
          trend="down"
          delta={-8}
          higherIsBetter={false}
          riskLevel="HIGH"
          severity="warn"
          icon={<AlertTriangle size={16} />}
          loading={loading}
          lastUpdated={kpi4.updatedAt}
          source="/governance/kpi/stream"
          sparklineData={[260, 252, 248, 241, 238, 236, 234]}
        />

        {/* 5. Bed Utilization */}
        <KpiTile
          label="Bed Utilization"
          value={kpi5.value}
          unit="%"
          trend="up"
          delta={1.2}
          higherIsBetter={false}
          riskLevel="MODERATE"
          severity="ok"
          icon={<Bed size={16} />}
          loading={loading}
          lastUpdated={kpi5.updatedAt}
          source="Inpatient Bed Census"
          sparklineData={[71, 72, 73, 73.5, 74, 74.1, 74.2]}
        />

        {/* 6. Oxygen Status */}
        <KpiTile
          label="Oxygen Status"
          value={kpi6.value}
          unit="%"
          trend="up"
          delta={0.5}
          higherIsBetter={true}
          riskLevel="LOW"
          severity="ok"
          icon={<Wind size={16} />}
          loading={loading}
          lastUpdated={kpi6.updatedAt}
          source="PSA & Cylinder Telemetry"
          sparklineData={[94, 94.5, 95.2, 95.8, 96.2, 96.5, 96.8]}
        />

        {/* 7. Staff Availability */}
        <KpiTile
          label="Staff Availability"
          value={kpi7.value}
          unit="%"
          trend="up"
          delta={1.8}
          higherIsBetter={true}
          riskLevel="LOW"
          severity="ok"
          icon={<UserCheck size={16} />}
          loading={loading}
          lastUpdated={kpi7.updatedAt}
          source="Biometric Duty Roster"
          sparklineData={[82, 83, 83.5, 84.2, 84.8, 85.2, 85.8]}
        />

        {/* 8. Patient Load */}
        <KpiTile
          label="Patient Load"
          value={kpi8.value}
          unit="/day"
          trend="up"
          delta={3200}
          deltaPeriod="outpatient OPD"
          higherIsBetter={true}
          riskLevel="LOW"
          severity="ok"
          icon={<Users size={16} />}
          loading={loading}
          lastUpdated={kpi8.updatedAt}
          source="PHC Ground Telemetry"
          sparklineData={[295000, 298000, 302000, 306000, 309000, 311000, 312400]}
        />

        {/* 9. Open Emergencies */}
        <KpiTile
          label="Open Emergencies"
          value={kpi9.value}
          unit="Clusters"
          trend="flat"
          higherIsBetter={false}
          riskLevel="CRITICAL"
          severity="critical"
          icon={<Flame size={16} />}
          loading={loading}
          lastUpdated={kpi9.updatedAt}
          source="Epidemic Surveillance"
          sparklineData={[11, 12, 13, 12, 13, 12, 12]}
        />

        {/* 10. Pending Requests */}
        <KpiTile
          label="Pending Requests"
          value={kpi10.value}
          unit="Decisions"
          trend="down"
          delta={-12}
          higherIsBetter={false}
          riskLevel="MODERATE"
          severity="warn"
          icon={<Clock size={16} />}
          loading={loading}
          lastUpdated={kpi10.updatedAt}
          source="Redistribution Optimizer"
          sparklineData={[184, 176, 169, 164, 161, 158, 156]}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          FOUR MANDATORY DASHBOARD PANELS (Masterplan §26 Exact Order):
          1. "What is happening?" (current status)
          2. "Where is it happening?" (top at-risk districts list, click-through to GIS)
          3. "What will happen next?" (a compact forecast/risk summary)
          4. "What should we do?" (top pending redistribution recommendations & open emergencies)
          ────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ── PANEL 1: "What is happening?" (Current Status) ───────────────── */}
        <div className="card" id="panel-what-is-happening" style={{ borderLeft: '4px solid #1a56db' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: '#e8effd',
                  color: '#1a56db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                1
              </div>
              <div>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  What is happening?
                </span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  Real-time health network operational posture & active systemic bottlenecks
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiskBadge level="MODERATE" size="sm" />
              <DataFreshnessLabel
                timestamp={lastSsePulse ?? new Date(Date.now() - 4 * 60000).toISOString()}
                source="Central Telemetry Gateway"
              />
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Pillar 1: Sub-system Operational Resilience Meters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Network Operational Health
                </div>

                {/* Meter: Essential Medicine Coverage */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Essential Medicine Stock Adequacy</span>
                    <span style={{ fontWeight: 700, color: '#0e9f6e' }}>87.4% (Target &gt;90%)</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '87.4%', height: '100%', backgroundColor: '#0e9f6e', borderRadius: 4 }} />
                  </div>
                </div>

                {/* Meter: Cold Chain Equipment Monitoring */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Cold-Chain Equipment (ILR/Deep Freezer)</span>
                    <span style={{ fontWeight: 700, color: '#0e9f6e' }}>98.2% Optimal Temp</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '98.2%', height: '100%', backgroundColor: '#0e9f6e', borderRadius: 4 }} />
                  </div>
                </div>

                {/* Meter: Critical Emergency Response Capacity */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Emergency Rapid Dispatch Readiness</span>
                    <span style={{ fontWeight: 700, color: '#d97706' }}>82.5% Ready</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '82.5%', height: '100%', backgroundColor: '#d97706', borderRadius: 4 }} />
                  </div>
                </div>
              </div>

              {/* Pillar 2: Active Systemic Stressors & Bottlenecks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Systemic Bottlenecks
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                  }}
                >
                  <AlertOctagon size={16} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                    <strong style={{ color: '#991b1b' }}>Pediatric Antibiotic Deficit:</strong> 42 rural PHCs have &lt;3 days stock of Amoxicillin 250mg following unseasonal monsoon respiratory infections.
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                  }}
                >
                  <AlertTriangle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                    <strong style={{ color: '#92400e' }}>Vector Surge in 12 Districts:</strong> Dengue & Chikungunya test positivity increased by +18.4% week-on-week; IV Fluid buffer depleted in primary centers.
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Clock size={16} color="#475569" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, lineHeight: 1.4, color: '#334155' }}>
                    <strong>Inter-facility Transport Fluidity:</strong> 91.6% on-time logistics delivery; 4 mountain pass shipments delayed by mudslides in Konkan corridor.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PANEL 2: "Where is it happening?" (Top At-Risk Districts List & Click-Through to GIS) ── */}
        <div className="card" id="panel-where-is-it-happening" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                2
              </div>
              <div>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  Where is it happening?
                </span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  Top at-risk districts & jurisdictions ranked by composite vulnerability index
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                href="/gis"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#1a56db',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <MapPin size={13} />
                <span>Open Interactive GIS Map</span>
                <ArrowRight size={13} />
              </Link>
              <DataFreshnessLabel timestamp={new Date(Date.now() - 8 * 60000).toISOString()} compact />
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Rank & District</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>State</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Composite Vulnerability</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Primary Vulnerability Driver</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Facility Scope</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Geospatial Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      rank: 1,
                      name: 'Pune District',
                      districtId: 'dist-pune',
                      state: 'Maharashtra',
                      score: 84,
                      risk: 'CRITICAL' as RiskLevel,
                      driver: '7 PHCs <3 days Insulin & DPT; 2 active Cholera clusters',
                      phcs: '148 PHCs (145 Reporting)',
                    },
                    {
                      rank: 2,
                      name: 'Gadchiroli Tribal',
                      districtId: 'dist-gadchiroli',
                      state: 'Maharashtra',
                      score: 79,
                      risk: 'HIGH' as RiskLevel,
                      driver: 'Monsoon river cutoff; Anti-malarial stockout at 9 sub-centers',
                      phcs: '64 PHCs (58 Reporting)',
                    },
                    {
                      rank: 3,
                      name: 'Varanasi Urban',
                      districtId: 'dist-varanasi',
                      state: 'Uttar Pradesh',
                      score: 72,
                      risk: 'HIGH' as RiskLevel,
                      driver: 'Bed utilization 92%; Oxygen cylinder turn-around bottleneck',
                      phcs: '95 PHCs (92 Reporting)',
                    },
                    {
                      rank: 4,
                      name: 'Thane Coastal',
                      districtId: 'dist-thane',
                      state: 'Maharashtra',
                      score: 68,
                      risk: 'MODERATE' as RiskLevel,
                      driver: 'Pediatric respiratory viral surge; ORS buffer depleted',
                      phcs: '135 PHCs (131 Reporting)',
                    },
                    {
                      rank: 5,
                      name: 'Coimbatore Rural',
                      districtId: 'dist-coimbatore',
                      state: 'Tamil Nadu',
                      score: 61,
                      risk: 'MODERATE' as RiskLevel,
                      driver: 'Delayed bulk IV fluid dispatch from regional medical warehouse',
                      phcs: '98 PHCs (97 Reporting)',
                    },
                  ].map((row) => (
                    <tr
                      key={row.rank}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: row.rank <= 2 ? '#fee2e2' : '#f1f5f9',
                              color: row.rank <= 2 ? '#dc2626' : '#64748b',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {row.rank}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{row.state}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: row.score >= 80 ? '#dc2626' : '#d97706' }}>
                            {row.score}/100
                          </span>
                          <RiskBadge level={row.risk} size="sm" />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', maxWidth: 280 }}>
                        {row.driver}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                        {row.phcs}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Link
                          href={`/gis?district=${row.districtId}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            backgroundColor: '#eff6ff',
                            color: '#1a56db',
                            fontWeight: 600,
                            fontSize: 11,
                            textDecoration: 'none',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          <span>Drilldown in GIS</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── PANEL 3: "What will happen next?" (Compact Forecast & Risk Summary) ── */}
        <div className="card" id="panel-what-will-happen-next" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                3
              </div>
              <div>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  What will happen next?
                </span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  AI predictive multi-echelon forecasting & 7-14 day hazard trajectory models
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                href="/forecasts"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#ffffff',
                  color: '#1a56db',
                  border: '1px solid #1a56db',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <BarChart3 size={13} />
                <span>Full AI Forecast Models</span>
                <ArrowRight size={13} />
              </Link>
              <DataFreshnessLabel timestamp={new Date(Date.now() - 14 * 60000).toISOString()} compact />
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Forecast Area Chart */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                    14-Day Stock Adequacy vs Projected Stockout Risk
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    Confidence: <strong>94.2%</strong>
                  </span>
                </div>

                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={FORECAST_CURVE} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[70, 100]} unit="%" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="baselineCoverage"
                        stroke="#d97706"
                        strokeWidth={2}
                        fill="url(#predGrad)"
                        name="Coverage Projection %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3 Key Early Warning Projections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: '#c2410c' }}>
                      <AlertTriangle size={14} />
                      <span>72-Hour Stockout Inflection</span>
                    </div>
                    <RiskBadge level="HIGH" size="sm" />
                  </div>
                  <p style={{ fontSize: 12, color: '#431407', lineHeight: 1.4 }}>
                    <strong>18 additional PHCs</strong> projected to breach emergency safety thresholds within 72 hours unless pending redistributions are authorized immediately.
                  </p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
                      <TrendingUp size={14} color="#dc2626" />
                      <span>Seasonal Inpatient Surge (+14.8%)</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Western Ghats Corridor</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                    Post-monsoon vector proliferation indicates a <strong>+14.8% spike in acute febrile admissions</strong> over the next 10 days across rural Pune, Satara, and Kolhapur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PANEL 4: "What should we do?" (Top Pending Recommendations & Open Emergencies) ── */}
        <div className="card" id="panel-what-should-we-do" style={{ borderLeft: '4px solid #0e9f6e' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: '#ecfdf5',
                  color: '#0e9f6e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                4
              </div>
              <div>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  What should we do?
                </span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  Actionable decisions ready for sign-off: redistribution recommendations & emergency escalations
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                href="/redistribution"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#0e9f6e',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Truck size={13} />
                <span>Redistribution Module</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/emergency"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Flame size={13} />
                <span>Emergency Mode</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Action Column A: Top Pending Redistribution Decisions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={14} color="#0e9f6e" />
                    <span>Top AI Redistribution Recommendations</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>2 of 156 ready</span>
                </div>

                {/* Rec 1 */}
                <div style={{ padding: '14px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        Amoxicillin 500mg (2,500 units)
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Source: <strong>Mumbai Central Depot</strong> (Surplus: 14,000)
                      </div>
                      <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                        Target: <strong>Hadapsar PHC, Pune</strong> (Stock: 0, CRITICAL)
                      </div>
                    </div>
                    <RiskBadge level="CRITICAL" size="sm" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 11 }}>
                    <span style={{ color: '#475569' }}>Transit: <strong>2.1 hrs</strong> via NH-48 Express</span>
                    <Link
                      href="/redistribution"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        backgroundColor: '#1a56db',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Review & Authorize</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Rec 2 */}
                <div style={{ padding: '14px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        ORS & Zinc Sachets (5,000 packs)
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Source: <strong>Nashik District Warehouse</strong> (Surplus: 8,200)
                      </div>
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>
                        Target: <strong>Shirur Rural PHC, Pune</strong> (Stock: 1.8 days left)
                      </div>
                    </div>
                    <RiskBadge level="HIGH" size="sm" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 11 }}>
                    <span style={{ color: '#475569' }}>Transit: <strong>3.4 hrs</strong> cold-safe</span>
                    <Link
                      href="/redistribution"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        backgroundColor: '#1a56db',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Review & Authorize</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Column B: Open Emergencies Requiring Sign-Off */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Flame size={14} color="#dc2626" />
                    <span>Open Emergency Escalations</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>2 active incidents</span>
                </div>

                {/* Emergency 1 */}
                <div style={{ padding: '14px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>
                        Stage-2 Dengue Vector Cluster #EMG-MH-04
                      </div>
                      <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 2 }}>
                        Jurisdiction: <strong>Hadapsar & Haveli Sub-Districts</strong>
                      </div>
                    </div>
                    <RiskBadge level="CRITICAL" size="sm" pulse />
                  </div>

                  <p style={{ fontSize: 12, color: '#450a0a', lineHeight: 1.3 }}>
                    Action Required: Authorize emergency dispatch of 500 NS1 Antigen test cassettes & deploy mobile fever clinic.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #fecaca', fontSize: 11 }}>
                    <span style={{ color: '#991b1b', fontWeight: 600 }}>Awaiting Secretary Approval</span>
                    <Link
                      href="/emergency"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Open Incident Portal</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Emergency 2 */}
                <div style={{ padding: '14px', borderRadius: 8, backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>
                        Cold-Chain Excursion Alert #EMG-TEMP-08
                      </div>
                      <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                        Jurisdiction: <strong>Junnar Tribal PHC (ILR #2 Temp: +9.4°C)</strong>
                      </div>
                    </div>
                    <RiskBadge level="HIGH" size="sm" />
                  </div>

                  <p style={{ fontSize: 12, color: '#78350f', lineHeight: 1.3 }}>
                    Action Required: Relocate 380 doses of Pentavalent vaccine to secondary solar cold box.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #fde68a', fontSize: 11 }}>
                    <span style={{ color: '#92400e', fontWeight: 600 }}>Technician En Route</span>
                    <Link
                      href="/emergency"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Open Incident Portal</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
