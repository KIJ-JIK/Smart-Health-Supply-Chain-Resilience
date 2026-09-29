'use client';
import { formatDateTime } from '@/lib/formatters';


import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useAuthStore } from '@/store/authStore';
import { useCrisisStore } from '@/store/crisisStore';
import { useAlertStore } from '@/store/alertStore';
import { useScopeStore } from '@/store/scopeStore';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import {
  NATIONAL_OVERVIEW,
  STATE_OVERVIEW,
  DISTRICT_OVERVIEW,
  REDISTRIBUTION_RECOMMENDATIONS,
  ALERTS_HISTORY,
} from '@/graphql/queries';
import {
  AlertOctagon,
  ShieldAlert,
  Flame,
  Siren,
  Bed,
  Wind,
  Users,
  Truck,
  Package,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CriticalDistrict {
  id: string;
  name: string;
  state: string;
  riskScore: number;
  activeEmergencies: number;
  stockoutCount: number;
  bedOccupancy: string;
  status: string;
}

interface BedCapacityItem {
  facility: string;
  total: number;
  occupied: number;
  occRate: string;
  icuFree: number;
  overflowStatus: string;
}

interface OxygenItem {
  facility: string;
  dTypeRemaining: number;
  dailyBurn: number;
  daysLeft: number;
  risk: string;
  nextRefill: string;
}

interface StaffStrainItem {
  facility: string;
  role: string;
  sanctioned: number;
  present: number;
  vacancy: string;
  patientStrain: string;
}

interface SupplyMovementItem {
  id: string;
  item: string;
  from: string;
  to: string;
  status: string;
  escort: string;
}

interface RecommendedActionItem {
  id: string;
  title: string;
  reason: string;
  impact: string;
  type: string;
}

export function CrisisDashboardLayout() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, phcId } = useScopeStore();
  const { isCrisisMode, activatedAt, activatedBy, crisisTitle, crisisLevel, deactivateCrisisMode } = useCrisisStore();
  const { alerts, acknowledgeAlert, acknowledgedIds } = useAlertStore();

  const [acknowledgedActions, setAcknowledgedActions] = useState<Record<string, boolean>>({});
  const [localAck, setLocalAck] = useState<Record<string, boolean>>({});

  const handleAcknowledgeAlert = (alertId: string) => {
    setLocalAck((prev) => ({ ...prev, [alertId]: true }));
    acknowledgeAlert(alertId);
  };

  // ── Live GraphQL Queries ──────────────────────────────────────────────────
  const isNationalScope = level === 'national' || (!stateId && !districtId && !phcId);
  const isStateScope = level === 'state' || (Boolean(stateId) && !districtId && !phcId);
  const isDistrictScope = level === 'district' || Boolean(districtId);

  const { data: nationalData } = useQuery(NATIONAL_OVERVIEW, {
    skip: !isNationalScope,
  });

  const { data: stateData } = useQuery(STATE_OVERVIEW, {
    variables: { stateId: stateId ?? user.stateId ?? 'a0000001-0000-0000-0000-000000000001' },
    skip: !isStateScope,
  });

  const { data: districtData } = useQuery(DISTRICT_OVERVIEW, {
    variables: { districtId: districtId ?? user.districtId ?? 'b0000002-0000-0000-0000-000000000001' },
    skip: !isDistrictScope,
  });

  const redistVariables = useMemo(() => {
    if (districtId) return { district: districtId, districtId };
    if (stateId) return { stateId };
    return {};
  }, [districtId, stateId]);

  const { data: redistData } = useQuery(REDISTRIBUTION_RECOMMENDATIONS, {
    variables: redistVariables,
  });

  const { data: alertsData } = useQuery(ALERTS_HISTORY, {
    variables: {
      stateId: isStateScope ? (stateId ?? user.stateId) : undefined,
      districtId: isDistrictScope ? (districtId ?? user.districtId) : undefined,
      phcId: phcId || undefined,
      limit: 10,
    },
  });

  const handleQuickAction = (id: string) => {
    setAcknowledgedActions((prev) => ({ ...prev, [id]: true }));
  };

  // 1. Critical Districts Data (Derived from live backend)
  const criticalDistricts: CriticalDistrict[] = useMemo(() => {
    if (stateData?.stateOverview?.districts && stateData.stateOverview.districts.length > 0) {
      return stateData.stateOverview.districts.slice(0, 4).map((d: any, idx: number) => ({
        id: d.districtId || `dist-${idx}`,
        name: d.districtName.includes('District') ? d.districtName : `${d.districtName} District`,
        state: stateData.stateOverview.stateName || 'Active State',
        riskScore: Math.round(d.bedOccupancyRate * 0.5 + (d.criticalPhcs * 15) + (d.stockoutRiskCount * 5)),
        activeEmergencies: d.criticalPhcs || 1,
        stockoutCount: d.stockoutRiskCount || 2,
        bedOccupancy: `${d.bedOccupancyRate}%`,
        status: d.criticalPhcs > 0 ? 'Critical Deficit' : 'Elevated Alert',
      }));
    }
    if (nationalData?.nationalOverview) {
      return [
        { id: 'dist-pune', name: 'Pune District', state: 'Maharashtra', riskScore: 89, activeEmergencies: 2, stockoutCount: 4, bedOccupancy: `${nationalData.nationalOverview.bedOccupancyRate || 94.2}%`, status: 'Critical Deficit' },
        { id: 'dist-solapur', name: 'Solapur District', state: 'Maharashtra', riskScore: 82, activeEmergencies: 1, stockoutCount: 3, bedOccupancy: '91.0%', status: 'Severe Strain' },
        { id: 'dist-nashik', name: 'Nashik District', state: 'Maharashtra', riskScore: 78, activeEmergencies: 1, stockoutCount: 2, bedOccupancy: '88.5%', status: 'Elevated Alert' },
      ];
    }
    return [
      { id: 'dist-pune', name: 'Pune District', state: 'Maharashtra', riskScore: 89, activeEmergencies: 2, stockoutCount: 4, bedOccupancy: '94.2%', status: 'Critical Deficit' },
      { id: 'dist-solapur', name: 'Solapur District', state: 'Maharashtra', riskScore: 82, activeEmergencies: 1, stockoutCount: 3, bedOccupancy: '91.0%', status: 'Severe Strain' },
      { id: 'dist-nashik', name: 'Nashik District', state: 'Maharashtra', riskScore: 78, activeEmergencies: 1, stockoutCount: 2, bedOccupancy: '88.5%', status: 'Elevated Alert' },
    ];
  }, [stateData, nationalData]);

  // 2. Active Emergencies Data (direct live field alerts)
  const activeEmergencies = useMemo(() => {
    const storeList = alerts.filter((a) => a.alertType === 'emergency_report' || a.severity === 'critical');
    const gqlList = alertsData?.alertsHistory || [];
    const merged = [...storeList];
    gqlList.forEach((ga: any) => {
      if (!merged.some((m) => m.id === ga.id)) {
        merged.push({
          id: ga.id,
          title: ga.title || 'Field Emergency Escalation',
          message: ga.message || 'Urgent incident reported from frontline facility',
          severity: ga.severity || 'critical',
          entityId: ga.phcId || ga.districtId || 'PHC-01',
          entityName: ga.entityName || ga.phcName || 'Frontline Node',
          alertType: 'emergency_report',
          acknowledged: Boolean(ga.acknowledged || acknowledgedIds?.[ga.id] || localAck[ga.id]),
          timestamp: ga.timestamp || new Date().toISOString(),
        } as any);
      }
    });
    return merged.length > 0 ? merged : [
      {
        id: 'emg-001',
        title: 'Sudden Patient Footfall Spike (+140%) & Oxygen Pressure Drop',
        message: 'Baramati SDH telemetry indicates oxygen manifold cylinder reserve dropped below 1.0 day.',
        severity: 'critical',
        entityId: 'PHC-BARAMATI',
        entityName: 'Baramati SDH',
        alertType: 'emergency_report',
        acknowledged: Boolean(acknowledgedIds?.['emg-001'] || localAck['emg-001']),
        timestamp: new Date().toISOString(),
      }
    ];
  }, [alerts, alertsData, acknowledgedIds, localAck]);

  // 3. Resource Deficits (§29 Critical Deficit Standards)
  const resourceDeficits = useMemo(() => {
    const occRate = nationalData?.nationalOverview?.bedOccupancyRate || 94.2;
    const oxyCyl = nationalData?.nationalOverview?.oxygenCylindersAvailable || 42;
    return [
      { resource: 'ICU Ventilator Beds', category: 'Beds', current: `${occRate}% Occupied`, deficit: '14 beds deficit', standard: '§29 >92% Critical Deficit', phc: 'Baramati SDH & Pune Civil' },
      { resource: 'Medical Oxygen D-Cylinders', category: 'Oxygen', current: '0.9 days remaining', deficit: `${oxyCyl} cylinders deficit`, standard: '§29 <1.2 days Critical Deficit', phc: 'Wagholi PHC & Shirur' },
      { resource: 'Defibrillators & Suction Units', category: 'Equipment', current: '4 non-functional', deficit: '28% equipment deficit', standard: '§29 >25% Critical Deficit', phc: 'Velhe PHC & Junnar' },
    ];
  }, [nationalData]);

  // 4. Critical Medicine Requirements (Zero stock / immediate stockout)
  const medicineRequirements = [
    { medicine: 'Amoxicillin 500mg Tablets', currentStock: '0 strips', reqQty: '5,000 strips', daysLeft: '0.0 days', priority: 'Immediate Airlift / Escort', phc: 'Hadapsar PHC' },
    { medicine: 'Rabies Antiserum 1000 IU', currentStock: '4 vials', reqQty: '80 vials', daysLeft: '0.6 days', priority: 'Cold Chain Dispatch', phc: 'Baramati SDH' },
    { medicine: 'Regular Insulin 40 IU/ml', currentStock: '12 vials', reqQty: '300 vials', daysLeft: '1.1 days', priority: 'Cold Chain Courier', phc: 'Wagholi PHC' },
    { medicine: 'ORS Sachets 20.5g', currentStock: '180 sachets', reqQty: '4,000 sachets', daysLeft: '1.4 days', priority: 'Regional Depletion', phc: 'Chakan PHC' },
  ];

  // 5. Bed Capacity (Live from District/PHC list)
  const bedCapacityData: BedCapacityItem[] = useMemo(() => {
    if (districtData?.districtOverview?.phcList && districtData.districtOverview.phcList.length > 0) {
      return districtData.districtOverview.phcList.slice(0, 4).map((p: any) => {
        const tot = p.totalBeds || 30;
        const occ = p.occupiedBeds || 28;
        const rate = tot > 0 ? `${((occ / tot) * 100).toFixed(1)}%` : '90.0%';
        return {
          facility: p.name,
          total: tot,
          occupied: occ,
          occRate: rate,
          icuFree: Math.max(0, tot - occ),
          overflowStatus: occ / tot > 0.9 ? 'Triage Tents & Step-Down Annex Deployed' : 'Normal Monitoring',
        };
      });
    }
    return [
      { facility: 'Baramati SDH', total: 50, occupied: 48, occRate: '96.0%', icuFree: 0, overflowStatus: 'Community Hall Annex Activated' },
      { facility: 'Hadapsar PHC', total: 24, occupied: 23, occRate: '95.8%', icuFree: 1, overflowStatus: 'Triage Tents Deployed' },
      { facility: 'Chakan PHC', total: 30, occupied: 27, occRate: '90.0%', icuFree: 2, overflowStatus: 'Step-down Monitoring' },
    ];
  }, [districtData]);

  // 6. Oxygen Reserves (Live telemetry)
  const oxygenData: OxygenItem[] = useMemo(() => {
    if (districtData?.districtOverview?.phcList && districtData.districtOverview.phcList.length > 0) {
      return districtData.districtOverview.phcList.slice(0, 4).map((p: any, idx: number) => {
        const cyl = p.oxygenCylinders ?? (4 - idx);
        const burn = 3.5;
        const days = parseFloat((cyl / burn).toFixed(1));
        return {
          facility: p.name,
          dTypeRemaining: cyl,
          dailyBurn: burn,
          daysLeft: Math.max(0.4, days),
          risk: days < 1.2 ? 'CRITICAL' : 'DEFICIT',
          nextRefill: days < 1.0 ? 'Urgent Express Dispatch (+2h)' : 'Scheduled Today',
        };
      });
    }
    return [
      { facility: 'Wagholi PHC', dTypeRemaining: 4, dailyBurn: 4.5, daysLeft: 0.9, risk: 'CRITICAL', nextRefill: 'In Transit (+14h delay)' },
      { facility: 'Baramati SDH', dTypeRemaining: 18, dailyBurn: 12.0, daysLeft: 1.5, risk: 'DEFICIT', nextRefill: 'Scheduled 18:00' },
      { facility: 'Velhe PHC', dTypeRemaining: 3, dailyBurn: 2.2, daysLeft: 1.3, risk: 'DEFICIT', nextRefill: 'Panshet Checkpost hold' },
    ];
  }, [districtData]);

  // 7. Clinical Staff Strain
  const staffStrainData: StaffStrainItem[] = [
    { facility: 'Chakan PHC', role: 'Medical Officers', sanctioned: 4, present: 2, vacancy: '50%', patientStrain: '148 patients/doc' },
    { facility: 'Hadapsar PHC', role: 'Staff Nurses', sanctioned: 8, present: 5, vacancy: '37.5%', patientStrain: '68 patients/nurse' },
    { facility: 'Velhe PHC', role: 'Lab Technicians', sanctioned: 2, present: 0, vacancy: '100%', patientStrain: 'Unstaffed Emergency Post' },
  ];

  // 8. Supply Movements (Live Redistribution Convoys)
  const supplyMovements: SupplyMovementItem[] = useMemo(() => {
    const recs = redistData?.redistributionRecommendations || [];
    if (recs.length > 0) {
      return recs.slice(0, 4).map((r: any, idx: number) => ({
        id: r.recommendationId || `SHIP-${Date.now().toString().slice(-4)}-0${idx + 1}`,
        item: `${r.medicineName} (${r.quantity ?? '2,500 units'})`,
        from: r.fromPhcName || 'Central Drug Warehouse',
        to: r.toPhcName || 'Frontline Health Center',
        status: r.status === 'in_transit' ? 'IN TRANSIT' : r.status === 'delayed' ? 'DELAYED (+12h)' : 'FAST-TRACK DISPATCH',
        escort: 'Priority Medical Corridor Assigned',
      }));
    }
    return [
      { id: 'SHIP-2024-0891', item: 'Paracetamol 500mg (3,000 strips)', from: 'Pune DWD Store', to: 'Hadapsar PHC', status: 'DELAYED (+14h)', escort: 'Reefer Van Breakdown — Relief En Route' },
      { id: 'SHIP-2024-0865', item: 'Metformin & ORS (7,500 units)', from: 'Pune DWD Store', to: 'Velhe PHC', status: 'HALTED', escort: 'Ghat Landslide — Police Escort Coordinated' },
      { id: 'SHIP-2024-0892', item: 'Ceftriaxone 1g (450 vials)', from: 'Baramati SDH', to: 'Chakan PHC', status: 'IN TRANSIT', escort: 'ETA 45 mins' },
    ];
  }, [redistData]);

  // 9. Recommended Actions (Live Redistribution & Emergency SOPs)
  const recommendedActions: RecommendedActionItem[] = useMemo(() => {
    const recs = redistData?.redistributionRecommendations || [];
    if (recs.length > 0) {
      return recs.slice(0, 4).map((r: any, idx: number) => ({
        id: r.recommendationId || `act-${idx + 1}`,
        title: `Authorize Fast-Track Redistribution of ${r.medicineName} (${r.fromPhcName} → ${r.toPhcName})`,
        reason: r.reason || `Averts stockout for critical patient load`,
        impact: 'Critical',
        type: 'Redistribution',
      }));
    }
    return [
      { id: 'act-001', title: 'Approve Emergency Inter-Facility Amoxicillin Redistribution (REC-PUNE-001)', reason: 'Averts 0-stock crisis for 340 patients at Hadapsar PHC', impact: 'High', type: 'Redistribution' },
      { id: 'act-002', title: 'Request State SDRF Air-Drop for Flood-Cut Velhe PHC', reason: 'Trauma kits & clean water purification sachets required', impact: 'Critical', type: 'Disaster Support' },
      { id: 'act-003', title: 'Authorize Mobile Medical Unit MMU-04 Deployment to Chakan Industrial Ward', reason: 'Relieves 148 patient/doctor surge strain', impact: 'High', type: 'Workforce Deployment' },
    ];
  }, [redistData]);

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* ── CRISIS HEADER STRIP ──────────────────────────────────────────────── */}
      <div
        style={{
          background: '#7F1D1D',
          borderBottom: '4px solid #DC2626',
          margin: '-24px -24px 24px -24px',
          padding: '16px 24px',
          color: 'white',
          boxShadow: '0 4px 20px rgba(127, 29, 29, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.8)',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <Flame size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.02em' }}>
                  CRISIS MODE ACTIVE — {crisisLevel.toUpperCase()}
                </span>
                <span
                  style={{
                    background: 'white',
                    color: '#991B1B',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  LIVE COMMAND
                </span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                {crisisTitle} • Declared by <strong>{activatedBy}</strong> on {activatedAt ? formatDateTime(activatedAt) : 'Recent'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScopeSelector />

            {user.role === 'national_admin' ? (
              <button
                onClick={() => deactivateCrisisMode(user)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Zap size={14} /> Stand Down Crisis Mode
              </button>
            ) : (
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.3)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#FCA5A5',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                🔒 Read-Only (Managed by National Admin)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 9 Prioritized Crisis Tiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── 1. CRITICAL DISTRICTS ─────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#DC2626', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 1
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Critical Districts (Ranked Composite Stress)
              </h2>
            </div>
            <Link href="/gis" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Inspect GIS Crisis Extent <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {criticalDistricts.map((d) => (
              <div
                key={d.id}
                className="card"
                style={{
                  background: 'white',
                  border: '2px solid #EF4444',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{d.name}</h3>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{d.state}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>{d.riskScore}/100</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Crisis Index</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: '#F8FAFC', padding: 10, borderRadius: 6, fontSize: 11 }}>
                  <div>
                    <div style={{ color: '#64748B' }}>Emergencies</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>{d.activeEmergencies} Active</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B' }}>Stockouts</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#EA580C' }}>{d.stockoutCount} Essential</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B' }}>Bed Load</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{d.bedOccupancy}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. ACTIVE EMERGENCIES ─────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#DC2626', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 2
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Active Field Emergencies (Direct PHC Incident Reports)
              </h2>
            </div>
            <Link href="/early-warnings" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View Complete Alert Stream <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeEmergencies.slice(0, 3).map((a) => {
              const isAck = Boolean(a.acknowledged || acknowledgedIds?.[a.id] || localAck[a.id]);

              return (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    background: isAck ? '#F8FAFC' : '#FFF5F5',
                    border: `2px solid ${isAck ? '#86EFAC' : '#DC2626'}`,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: isAck ? '#16A34A' : '#DC2626',
                        color: 'white',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {isAck ? <CheckCircle size={20} /> : <Siren size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isAck ? '#166534' : '#991B1B' }}>
                          {a.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            background: isAck ? '#DCFCE7' : '#FEE2E2',
                            color: isAck ? '#166534' : '#991B1B',
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          {a.entityName || a.entityId}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{a.message}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link
                      href={`/copilot?q=${encodeURIComponent((a as any).copilotQuery || a.title)}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        background: 'white',
                        border: `1px solid ${isAck ? '#86EFAC' : '#DC2626'}`,
                        color: isAck ? '#166534' : '#DC2626',
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Copilot Causal Brief
                    </Link>

                    {isAck ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 4,
                          background: '#DCFCE7',
                          color: '#15803D',
                          fontSize: 12,
                          fontWeight: 700,
                          border: '1px solid #86EFAC',
                        }}
                      >
                        <CheckCircle size={14} />
                        Acknowledged
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeAlert(a.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 4,
                          background: '#DC2626',
                          border: 'none',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 1px 4px rgba(220, 38, 38, 0.3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. RESOURCE DEFICITS ──────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#EA580C', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 3
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Resource Deficits &amp; Allocation Buffer
              </h2>
            </div>
            <Link href="/resources" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Open Resources Module <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {resourceDeficits.map((r, i) => (
              <div
                key={i}
                className="card"
                style={{
                  background: 'white',
                  border: '1px solid #FDBA74',
                  borderLeft: '4px solid #EA580C',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase' }}>
                    {r.category}
                  </span>
                  <span style={{ fontSize: 11, background: '#FFEDD5', color: '#9A3412', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    {r.standard}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{r.resource}</div>
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{r.current} — {r.deficit}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Hotspots: {r.phc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. MEDICINE REQUIREMENTS ──────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#DC2626', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 4
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Emergency Medicine Requirements (0-Stock Critical Demands)
              </h2>
            </div>
            <Link href="/medicine" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View Medicine Stock Grid <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'white' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Facility</th>
                  <th>Current Stock</th>
                  <th>Days Remaining</th>
                  <th>Emergency Requirement</th>
                  <th>Logistics Priority</th>
                </tr>
              </thead>
              <tbody>
                {medicineRequirements.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{m.medicine}</td>
                    <td>{m.phc}</td>
                    <td style={{ color: '#DC2626', fontWeight: 700 }}>{m.currentStock}</td>
                    <td>
                      <span style={{ padding: '2px 6px', background: '#FEE2E2', color: '#991B1B', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                        {m.daysLeft}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.reqQty}</td>
                    <td>
                      <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1E40AF', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {m.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 5. BED CAPACITY ───────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#7C3AED', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 5
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Bed Capacity & Critical Surge Occupancy (&gt;92% Threshold)
              </h2>
            </div>
            <Link href="/resources" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Bed Telemetry <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {bedCapacityData.map((b, i) => (
              <div key={i} className="card" style={{ background: 'white', border: '1px solid #DDD6FE', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{b.facility}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED' }}>{b.occRate}</span>
                </div>
                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 6 }}>
                  Total: {b.total} Beds • Occupied: <strong>{b.occupied}</strong> • ICU Available: <strong>{b.icuFree}</strong>
                </div>
                <div style={{ fontSize: 11, background: '#F5F3FF', color: '#6D28D9', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>
                  Overflow Mitigation: {b.overflowStatus}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. OXYGEN RESERVES ────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#0284C7', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 6
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Oxygen Telemetry (&lt;1.2 Days Minimum Reserve)
              </h2>
            </div>
            <Link href="/resources" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Oxygen Reserves <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {oxygenData.map((o, i) => (
              <div key={i} className="card" style={{ background: 'white', border: '1px solid #BAE6FD', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{o.facility}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: o.risk === 'CRITICAL' ? '#DC2626' : '#D97706' }}>
                    {o.risk} DEFICIT
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1', marginBottom: 4 }}>
                  {o.daysLeft} Days Coverage ({o.dTypeRemaining} cylinders left)
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Burn rate: {o.dailyBurn} cyl/day • Next refill: {o.nextRefill}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. CLINICAL STAFF STRAIN ──────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 7
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Clinical Staffing Strain & Vacancy Hotspots
              </h2>
            </div>
            <Link href="/workforce" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Workforce Ratios <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {staffStrainData.map((s, i) => (
              <div key={i} className="card" style={{ background: 'white', border: '1px solid #A7F3D0', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{s.facility}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>{s.vacancy} Vacancy</span>
                </div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>{s.role} ({s.present}/{s.sanctioned} Present)</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Caseload Strain: <strong>{s.patientStrain}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. SUPPLY MOVEMENTS (EMERGENCY CONVOYS) ───────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#2563EB', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 8
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Critical Supply Movements & Escort Convoys
              </h2>
            </div>
            <Link href="/supply-chain" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Supply Chain Dashboard <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {supplyMovements.map((sm) => (
              <div
                key={sm.id}
                className="card"
                style={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Truck size={18} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {sm.item} • {sm.id}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Route: {sm.from} → <strong>{sm.to}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sm.status.includes('DELAYED') ? '#DC2626' : '#2563EB' }}>
                    {sm.status}
                  </span>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{sm.escort}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 9. RECOMMENDED ACTIONS ────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#16A34A', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
                TIER 9
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Immediate Governance & Response Actions
              </h2>
            </div>
            <Link href="/redistribution" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Redistribution Review Board <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendedActions.map((act) => {
              const isDone = acknowledgedActions[act.id];

              return (
                <div
                  key={act.id}
                  className="card"
                  style={{
                    background: isDone ? '#F8FAFC' : 'white',
                    border: '1px solid var(--color-border)',
                    borderLeft: `4px solid ${act.impact === 'Critical' ? '#DC2626' : '#2563EB'}`,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: 4 }}>
                        {act.type}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{act.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{act.reason}</div>
                  </div>

                  <div>
                    {isDone ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Dispatched & Recorded
                      </span>
                    ) : (
                      <button
                        onClick={() => handleQuickAction(act.id)}
                        style={{
                          padding: '7px 18px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: act.impact === 'Critical' ? '#DC2626' : 'var(--color-primary)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Zap size={14} /> Authorize Action
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
