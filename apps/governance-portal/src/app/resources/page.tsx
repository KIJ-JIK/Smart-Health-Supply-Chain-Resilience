'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { RESOURCE_INTELLIGENCE } from '@/graphql/queries';
import { useScopeStore } from '@/store/scopeStore';
import { useAuthStore } from '@/store/authStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import { RiskBadge } from '@/components/common/RiskBadge';
import { TrendSparkline } from '@/components/common/TrendSparkline';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import {
  getBedDataByScope,
  getOxygenDataByScope,
  getEquipmentDataByScope,
  getClassificationBadgeProps,
  getBedClassification,
  getOxygenClassification,
  getEquipmentClassification,
  type BedCategoryItem,
  type OxygenSupplyItem,
  type ClinicalEquipmentItem,
  type ResourceClassification,
} from '@/lib/resourceData';
import {
  Bed,
  Wind,
  Wrench,
  AlertTriangle,
  Info,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

type TabKey = 'beds' | 'oxygen' | 'equipment';

export default function ResourcesPage() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, getScopeLabel } = useScopeStore();
  const [activeTab, setActiveTab] = useState<TabKey>('beds');
  const [selectedBedCat, setSelectedBedCat] = useState<string | null>('bed-general');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Enforce: clamp to user's authenticated jurisdiction boundary
  const scope = useMemo(
    () => getEnforcedScope(user, { level, stateId, districtId }),
    [user, level, stateId, districtId]
  );

  // Live GraphQL query
  const { data: resData } = useQuery(RESOURCE_INTELLIGENCE, {
    variables: {
      scope: {
        level: scope.level,
        stateId: scope.stateId,
        districtId: scope.districtId,
      },
    },
  });

  // Scope-reactive datasets — live bound from PostgreSQL
  const bedsData = useMemo(() => {
    const base = getBedDataByScope(scope.level);
    const liveBedItem = resData?.resourceIntelligence?.find((r: any) => r.resourceId === 'res-beds');
    if (liveBedItem && liveBedItem.required > 0) {
      const occupied = liveBedItem.required - liveBedItem.available;
      const utilPct = liveBedItem.utilization || Math.round((occupied / liveBedItem.required) * 100);
      return base.map((b) => {
        if (b.id === 'bed-general') {
          return {
            ...b,
            totalBeds: liveBedItem.required,
            occupiedBeds: occupied,
            utilizationPct: utilPct,
            classification: getBedClassification(utilPct),
          };
        }
        return b;
      });
    }
    return base;
  }, [scope.level, resData]);

  const oxygenData = useMemo(() => {
    const base = getOxygenDataByScope(scope.level);
    const liveO2Item = resData?.resourceIntelligence?.find((r: any) => r.resourceId === 'res-o2');
    if (liveO2Item) {
      return base.map((o) => {
        if (o.sourceType === 'D_TYPE_CYLINDERS') {
          return {
            ...o,
            currentlyAvailable: liveO2Item.available,
            totalCapacity: Math.max(liveO2Item.available, liveO2Item.required || 300),
          };
        }
        return o;
      });
    }
    return base;
  }, [scope.level, resData]);

  const equipmentData = useMemo(() => getEquipmentDataByScope(scope.level), [scope.level]);

  // Aggregate stats for Beds
  const bedAggregates = useMemo(() => {
    const total = bedsData.reduce((acc, b) => acc + b.totalBeds, 0);
    const occupied = bedsData.reduce((acc, b) => acc + b.occupiedBeds, 0);
    const available = total - occupied;
    const utilPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const overallCls = getBedClassification(utilPct);
    const criticalCount = bedsData.filter((b) => b.classification === 'CRITICAL_DEFICIT').length;
    const deficitCount = bedsData.filter((b) => b.classification === 'DEFICIT').length;
    return { total, occupied, available, utilPct, overallCls, criticalCount, deficitCount };
  }, [bedsData]);

  // Aggregate stats for Oxygen
  const oxygenAggregates = useMemo(() => {
    const totalCylinders = oxygenData.find((o) => o.sourceType === 'D_TYPE_CYLINDERS')?.totalCapacity ?? 0;
    const availableCylinders = oxygenData.find((o) => o.sourceType === 'D_TYPE_CYLINDERS')?.currentlyAvailable ?? 0;
    const totalConcentrators = oxygenData.find((o) => o.sourceType === 'CONCENTRATORS')?.totalCapacity ?? 0;
    const availableConcentrators = oxygenData.find((o) => o.sourceType === 'CONCENTRATORS')?.currentlyAvailable ?? 0;

    // Weighted average days remaining across sources
    const validSources = oxygenData.filter((o) => o.dailyConsumptionRate > 0);
    const totalRemainingCapacity = validSources.reduce((acc, o) => acc + o.currentlyAvailable, 0);
    const totalDailyBurn = validSources.reduce((acc, o) => acc + o.dailyConsumptionRate, 0);
    const avgDays = totalDailyBurn > 0 ? Number((totalRemainingCapacity / totalDailyBurn).toFixed(1)) : 5.0;
    const overallCls = getOxygenClassification(avgDays);
    const deficitCount = oxygenData.filter((o) => o.classification === 'DEFICIT' || o.classification === 'CRITICAL_DEFICIT').length;

    return {
      totalCylinders,
      availableCylinders,
      totalConcentrators,
      availableConcentrators,
      avgDays,
      overallCls,
      deficitCount,
    };
  }, [oxygenData]);

  // Aggregate stats for Equipment
  const equipmentAggregates = useMemo(() => {
    const sanctioned = equipmentData.reduce((acc, e) => acc + e.totalSanctioned, 0);
    const working = equipmentData.reduce((acc, e) => acc + e.working, 0);
    const maintenance = equipmentData.reduce((acc, e) => acc + e.underMaintenance, 0);
    const deficit = equipmentData.reduce((acc, e) => acc + e.deficit, 0);
    const operabilityPct = sanctioned > 0 ? Math.round((working / sanctioned) * 100) : 0;
    const overallCls = getEquipmentClassification(sanctioned, working, maintenance);
    const criticalCount = equipmentData.filter((e) => e.classification === 'CRITICAL_DEFICIT').length;

    return { sanctioned, working, maintenance, deficit, operabilityPct, overallCls, criticalCount };
  }, [equipmentData]);

  // Selected bed category for detail chart
  const activeBedDetail = useMemo(() => {
    return bedsData.find((b) => b.id === selectedBedCat) || bedsData[0];
  }, [bedsData, selectedBedCat]);

  // Filtered Equipment items
  const filteredEquipment = useMemo(() => {
    return equipmentData.filter((item) => {
      const matchesSearch = item.equipmentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory = selectedFilterCategory === 'all' || item.category === selectedFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [equipmentData, searchFilter, selectedFilterCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header & Scope Controls ── */}
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
              Resource Capacity & Preparedness
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 9999,
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
              }}
            >
              Masterplan §29
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Tri-pillar allocation metrics: Inpatient Beds, Oxygen logistics, and Clinical Equipment with threshold classifications
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <DataFreshnessLabel
            timestamp={lastRefreshed}
            onRefresh={() => setLastRefreshed(new Date())}
            source="Field Telemetry & Supply Feeds"
          />
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Current Jurisdiction: <strong style={{ color: '#0f172a' }}>{getScopeLabel()}</strong>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb Scope Selector Bar (Masterplan §26) ── */}
      <ScopeSelector showFreshness={false} showSummaryChip={true} />

      {/* ── Navigation Tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 2,
        }}
      >
        <button
          onClick={() => setActiveTab('beds')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'beds' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'beds' ? '#1d4ed8' : '#64748b',
            transition: 'all 0.15s ease',
          }}
        >
          <Bed size={18} />
          <span>Beds Intelligence</span>
          {bedAggregates.criticalCount > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: '#fee2e2',
                color: '#dc2626',
                fontWeight: 700,
              }}
            >
              {bedAggregates.criticalCount} Critical
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('oxygen')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'oxygen' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'oxygen' ? '#0369a1' : '#64748b',
            transition: 'all 0.15s ease',
          }}
        >
          <Wind size={18} />
          <span>Oxygen Buffer & Logistics</span>
          {oxygenAggregates.deficitCount > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: '#ffedd5',
                color: '#ea580c',
                fontWeight: 700,
              }}
            >
              {oxygenAggregates.deficitCount} Deficit
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'equipment' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'equipment' ? '#047857' : '#64748b',
            transition: 'all 0.15s ease',
          }}
        >
          <Wrench size={18} />
          <span>Clinical Equipment</span>
          {equipmentAggregates.criticalCount > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: '#fee2e2',
                color: '#dc2626',
                fontWeight: 700,
              }}
            >
              {equipmentAggregates.criticalCount} Deficit
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: BEDS INTELLIGENCE
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'beds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI row */}
          <div className="grid-4" style={{ gap: 16 }}>
            {/* Total Beds */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Sanctioned Beds
                </span>
                <Bed size={16} color="#64748b" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                {bedAggregates.total.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Across {bedsData.length} functional wards
              </div>
            </div>

            {/* Occupied & Utilization */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Occupancy & Utilization
                </span>
                <Activity size={16} color="#3b82f6" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                  {bedAggregates.occupied.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color:
                      bedAggregates.utilPct > 92
                        ? '#dc2626'
                        : bedAggregates.utilPct > 80
                        ? '#ea580c'
                        : '#059669',
                  }}
                >
                  ({bedAggregates.utilPct}%)
                </span>
              </div>
              {/* Mini progress bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 4,
                  background: '#f1f5f9',
                  marginTop: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, bedAggregates.utilPct)}%`,
                    background:
                      bedAggregates.utilPct > 92
                        ? '#ef4444'
                        : bedAggregates.utilPct > 80
                        ? '#f97316'
                        : '#10b981',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Available Beds */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Available Vacancies
                </span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>
                {bedAggregates.available.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Instant admit capacity
              </div>
            </div>

            {/* System Classification per Masterplan §29 */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Masterplan §29 Classification
                </span>
                <Info size={16} color="#64748b" />
              </div>
              <div style={{ marginTop: 4 }}>
                {(() => {
                  const badgeProps = getClassificationBadgeProps(bedAggregates.overallCls);
                  return (
                    <RiskBadge
                      level={badgeProps.level}
                      label={badgeProps.label}
                      pulse={badgeProps.pulse}
                      size="lg"
                    />
                  );
                })()}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                {bedAggregates.overallCls === 'CRITICAL_DEFICIT'
                  ? 'Severe bed saturation (>92%). Emergency redistribution mandated.'
                  : bedAggregates.overallCls === 'DEFICIT'
                  ? 'Capacity strain (80-92%). Elective admission controls advised.'
                  : bedAggregates.overallCls === 'BALANCED'
                  ? 'Standard operating equilibrium (65-80%).'
                  : 'Sufficient surplus buffer (<65% occupancy).'}
              </div>
            </div>
          </div>

          {/* Masterplan §29 Rule Banner */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 12,
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} color="#3b82f6" />
              <span>
                <strong>Masterplan §29 Bed Thresholds:</strong> &lt;65% (SURPLUS) | 65%–80% (BALANCED) | 80%–92% (DEFICIT) | &gt;92% (CRITICAL DEFICIT).
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                Surplus / Balanced
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
                Deficit
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                Critical Deficit
              </span>
            </div>
          </div>

          {/* Main Content: Categories Table + Interactive Forecast Panel */}
          <div className="grid-2" style={{ gap: 20 }}>
            {/* Table of categories */}
            <div className="card" style={{ background: '#ffffff', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Ward-Level Capacity & Classification
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Click a row to inspect the 4-week forecast trajectory
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Ward Category</th>
                      <th>Total</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Utilization %</th>
                      <th>7-Day Trend</th>
                      <th>Masterplan §29</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bedsData.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: 13 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <Bed size={28} color="#cbd5e1" />
                            <div>No bed capacity data available for the selected scope.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                    bedsData.map((bed) => {
                      const badgeProps = getClassificationBadgeProps(bed.classification);
                      const isSelected = bed.id === activeBedDetail?.id;

                      return (
                        <tr
                          key={bed.id}
                          onClick={() => setSelectedBedCat(bed.id)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0fdf4' : undefined,
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          <td>
                            <div style={{ color: '#0f172a', fontWeight: 600 }}>{bed.categoryName}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              ALOS: {bed.avgLengthOfStayDays}d | Turnover: {bed.turnoverIntervalDays}d
                            </div>
                          </td>
                          <td>{bed.totalBeds.toLocaleString()}</td>
                          <td>{bed.occupiedBeds.toLocaleString()}</td>
                          <td style={{ color: bed.availableBeds <= 2 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                            {bed.availableBeds.toLocaleString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  width: 38,
                                  color:
                                    bed.utilizationPct > 92
                                      ? '#dc2626'
                                      : bed.utilizationPct > 80
                                      ? '#ea580c'
                                      : '#0f172a',
                                }}
                              >
                                {bed.utilizationPct}%
                              </span>
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  minWidth: 50,
                                  borderRadius: 3,
                                  background: '#e2e8f0',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, bed.utilizationPct)}%`,
                                    background:
                                      bed.utilizationPct > 92
                                        ? '#ef4444'
                                        : bed.utilizationPct > 80
                                        ? '#f97316'
                                        : '#10b981',
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <TrendSparkline
                              data={bed.trendSparkline}
                              width={70}
                              height={24}
                              higherIsBetter={false}
                            />
                          </td>
                          <td>
                            <RiskBadge
                              level={badgeProps.level}
                              label={badgeProps.label}
                              pulse={badgeProps.pulse}
                              size="sm"
                            />
                          </td>
                        </tr>
                        );
                      }))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Ward 4-Week Forecast Detail */}
            <div className="card" style={{ background: '#ffffff', padding: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {activeBedDetail.categoryName}
                    </h3>
                    {(() => {
                      const p = getClassificationBadgeProps(activeBedDetail.classification);
                      return <RiskBadge level={p.level} label={p.label} pulse={p.pulse} size="sm" />;
                    })()}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    4-Week Ahead Inpatient Demand & Occupancy Forecast Curve
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Total Sanctioned</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    {activeBedDetail.totalBeds.toLocaleString()} Beds
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 240, width: '100%', marginBottom: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activeBedDetail.forecastNext4Weeks}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="forecastBedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={[40, 100]}
                      unit="%"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip
                      formatter={(val: number) => [`${val}% Occupancy`, 'Projected']}
                      labelFormatter={(label) => `Forecast Horizon: ${label}`}
                    />
                    {/* Critical Threshold line at 92% */}
                    <ReferenceLine
                      y={92}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'Critical Deficit (92%)', fill: '#ef4444', fontSize: 10, position: 'top' }}
                    />
                    {/* Deficit Threshold line at 80% */}
                    <ReferenceLine
                      y={80}
                      stroke="#f97316"
                      strokeDasharray="4 4"
                      label={{ value: 'Deficit (80%)', fill: '#f97316', fontSize: 10, position: 'top' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedOccupancyPct"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#forecastBedGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Projection Metric Breakdown */}
              <div className="grid-4" style={{ gap: 8 }}>
                {activeBedDetail.forecastNext4Weeks.map((fw, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{fw.week}</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color:
                          fw.projectedOccupancyPct > 92
                            ? '#dc2626'
                            : fw.projectedOccupancyPct > 80
                            ? '#ea580c'
                            : '#059669',
                      }}
                    >
                      {fw.projectedOccupancyPct}%
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      ~{fw.projectedBedNeed.toLocaleString()} beds
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: OXYGEN BUFFER & LOGISTICS
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'oxygen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards for Oxygen */}
          <div className="grid-4" style={{ gap: 16 }}>
            {/* Cylinders */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Type-D Cylinders (46.7L)
                </span>
                <Wind size={16} color="#0284c7" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                  {oxygenAggregates.availableCylinders.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  / {oxygenAggregates.totalCylinders.toLocaleString()} total
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Available buffer ready for deployment
              </div>
            </div>

            {/* Concentrators */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Medical Concentrators
                </span>
                <Activity size={16} color="#059669" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>
                  {oxygenAggregates.availableConcentrators.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  / {oxygenAggregates.totalConcentrators.toLocaleString()} units
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                10 LPM & 5 LPM ambient air units
              </div>
            </div>

            {/* Estimated Days Remaining */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Buffer Days Remaining
                </span>
                <Calendar size={16} color="#eab308" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color:
                      oxygenAggregates.avgDays < 1.2
                        ? '#dc2626'
                        : oxygenAggregates.avgDays < 2.5
                        ? '#ea580c'
                        : '#059669',
                  }}
                >
                  {oxygenAggregates.avgDays} Days
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Burn rate calibrated to current caseload
              </div>
            </div>

            {/* System Classification */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Masterplan §29 Oxygen Flag
                </span>
                <Info size={16} color="#64748b" />
              </div>
              <div style={{ marginTop: 4 }}>
                {(() => {
                  const badgeProps = getClassificationBadgeProps(oxygenAggregates.overallCls);
                  return (
                    <RiskBadge
                      level={badgeProps.level}
                      label={badgeProps.label}
                      pulse={badgeProps.pulse}
                      size="lg"
                    />
                  );
                })()}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                {oxygenAggregates.overallCls === 'CRITICAL_DEFICIT'
                  ? 'Critical oxygen buffer (<1.2 days). Immediate replenishment convoy required.'
                  : oxygenAggregates.overallCls === 'DEFICIT'
                  ? 'Deficit buffer (1.2–2.5 days). Re-filling prioritized.'
                  : oxygenAggregates.overallCls === 'BALANCED'
                  ? 'Balanced buffer (2.5–5.0 days). Normal replenishment cadence.'
                  : 'Surplus buffer (>5.0 days).'}
              </div>
            </div>
          </div>

          {/* Masterplan §29 Rule Banner */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 12,
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} color="#0284c7" />
              <span>
                <strong>Masterplan §29 Oxygen Thresholds:</strong> &gt;5.0 days (SURPLUS) | 2.5–5.0 days (BALANCED) | 1.2–2.5 days (DEFICIT) | &lt;1.2 days (CRITICAL DEFICIT).
              </span>
            </div>
          </div>

          {/* Oxygen Source Telemetry Table */}
          <div className="card" style={{ background: '#ffffff', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Oxygen Generation & Storage Telemetry
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Track cylinder stocks, onsite PSA plants, and cryogenic LMO bulk tanks
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Oxygen Source</th>
                    <th>Total Capacity</th>
                    <th>In Use</th>
                    <th>Available</th>
                    <th>Daily Burn</th>
                    <th>Est. Days Left</th>
                    <th>Purity %</th>
                    <th>Consumption Trend</th>
                    <th>Masterplan §29</th>
                  </tr>
                </thead>
                <tbody>
                  {oxygenData.map((item) => {
                    const badgeProps = getClassificationBadgeProps(item.classification);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.displayName}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.notes}</div>
                        </td>
                        <td>
                          {item.totalCapacity.toLocaleString()} {item.unit}
                        </td>
                        <td>
                          {item.inUse.toLocaleString()} {item.unit}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: item.daysRemaining < 1.2 ? '#dc2626' : '#059669',
                          }}
                        >
                          {item.currentlyAvailable.toLocaleString()} {item.unit}
                        </td>
                        <td>
                          {item.dailyConsumptionRate.toLocaleString()} {item.unit}/day
                        </td>
                        <td>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700,
                              fontSize: 12,
                              background:
                                item.daysRemaining < 1.2
                                  ? '#fee2e2'
                                  : item.daysRemaining < 2.5
                                  ? '#ffedd5'
                                  : '#ecfdf5',
                              color:
                                item.daysRemaining < 1.2
                                  ? '#b91c1c'
                                  : item.daysRemaining < 2.5
                                  ? '#c2410c'
                                  : '#047857',
                            }}
                          >
                            {item.daysRemaining} days
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 12 }}>{item.purityPct}%</span>
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: item.purityPct >= 93 ? '#10b981' : '#f59e0b',
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <TrendSparkline
                            data={item.consumptionTrend}
                            width={75}
                            height={24}
                            higherIsBetter={false}
                          />
                        </td>
                        <td>
                          <RiskBadge
                            level={badgeProps.level}
                            label={badgeProps.label}
                            pulse={badgeProps.pulse}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 3: CLINICAL EQUIPMENT
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'equipment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards for Equipment */}
          <div className="grid-4" style={{ gap: 16 }}>
            {/* Total Sanctioned */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Sanctioned Inventory
                </span>
                <Wrench size={16} color="#64748b" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                {equipmentAggregates.sanctioned.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Total mandated clinical apparatus
              </div>
            </div>

            {/* Working & Operability Rate */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Working & Operable
                </span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>
                  {equipmentAggregates.working.toLocaleString()}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                  ({equipmentAggregates.operabilityPct}%)
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Functional units deployed
              </div>
            </div>

            {/* Under Maintenance */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Under Maintenance
                </span>
                <AlertTriangle size={16} color="#f59e0b" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706' }}>
                {equipmentAggregates.maintenance.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Biomedical engineer servicing active
              </div>
            </div>

            {/* Masterplan §29 Classification */}
            <div className="card" style={{ padding: 18, background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Equipment Classification
                </span>
                <Info size={16} color="#64748b" />
              </div>
              <div style={{ marginTop: 4 }}>
                {(() => {
                  const badgeProps = getClassificationBadgeProps(equipmentAggregates.overallCls);
                  return (
                    <RiskBadge
                      level={badgeProps.level}
                      label={badgeProps.label}
                      pulse={badgeProps.pulse}
                      size="lg"
                    />
                  );
                })()}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                Deficit of {equipmentAggregates.deficit.toLocaleString()} units against sanctioned allocation
              </div>
            </div>
          </div>

          {/* Masterplan §29 Rule Banner */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 12,
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} color="#059669" />
              <span>
                <strong>Masterplan §29 Equipment Thresholds:</strong> 0 Deficit & 100% Working (SURPLUS) | &lt;10% Deficit (BALANCED) | 10%–25% Deficit (DEFICIT) | &gt;25% Deficit or 0 Working (CRITICAL DEFICIT).
              </span>
            </div>
          </div>

          {/* Search, Filter Bar & Equipment Inventory Table */}
          <div className="card" style={{ background: '#ffffff', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Clinical Equipment Status & Maintenance
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Sanctioned vs. Working vs. Deficit breakdown across Cold Chain, Diagnostics, and ICU apparatus
                </p>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 30px',
                      fontSize: 12,
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      outline: 'none',
                      width: 180,
                    }}
                  />
                </div>

                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    background: '#ffffff',
                    color: '#334155',
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="Cold Chain">Cold Chain</option>
                  <option value="Critical Care">Critical Care</option>
                  <option value="Emergency Transport">Emergency Transport</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Equipment Name</th>
                    <th>Category</th>
                    <th>Sanctioned</th>
                    <th>Working</th>
                    <th>Maintenance</th>
                    <th>Deficit</th>
                    <th>Operability %</th>
                    <th>Replacement Urgency</th>
                    <th>Masterplan §29</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item) => {
                    const badgeProps = getClassificationBadgeProps(item.classification);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.equipmentName}</div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 500,
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td>{item.totalSanctioned.toLocaleString()}</td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>{item.working.toLocaleString()}</td>
                        <td style={{ color: item.underMaintenance > 0 ? '#d97706' : '#64748b' }}>
                          {item.underMaintenance.toLocaleString()}
                        </td>
                        <td style={{ color: item.deficit > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                          {item.deficit.toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                width: 36,
                                color:
                                  item.operabilityRatePct < 75
                                    ? '#dc2626'
                                    : item.operabilityRatePct < 90
                                    ? '#ea580c'
                                    : '#059669',
                              }}
                            >
                              {item.operabilityRatePct}%
                            </span>
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                minWidth: 45,
                                borderRadius: 3,
                                background: '#e2e8f0',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, item.operabilityRatePct)}%`,
                                  background:
                                    item.operabilityRatePct < 75
                                      ? '#ef4444'
                                      : item.operabilityRatePct < 90
                                      ? '#f97316'
                                      : '#10b981',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background:
                                item.replacementUrgency === 'immediate'
                                  ? '#fee2e2'
                                  : item.replacementUrgency === 'scheduled'
                                  ? '#fef3c7'
                                  : '#f0fdf4',
                              color:
                                item.replacementUrgency === 'immediate'
                                  ? '#b91c1c'
                                  : item.replacementUrgency === 'scheduled'
                                  ? '#b45309'
                                  : '#15803d',
                            }}
                          >
                            {item.replacementUrgency}
                          </span>
                        </td>
                        <td>
                          <RiskBadge
                            level={badgeProps.level}
                            label={badgeProps.label}
                            pulse={badgeProps.pulse}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

