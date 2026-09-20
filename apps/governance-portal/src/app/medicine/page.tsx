'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import {
  MEDICINE_CATALOG,
  MedicineDetailItem,
  getMedicineScopeMetrics,
} from '@/lib/medicineData';
import { MedicineDetailModal } from '@/components/medicine/MedicineDetailModal';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import { RiskBadge, RiskLevel } from '@/components/common/RiskBadge';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import { TrendSparkline } from '@/components/common/TrendSparkline';
import {
  Search,
  Filter,
  Pill,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpDown,
  RefreshCw,
  Truck,
  ExternalLink,
  SlidersHorizontal,
  Package,
  Layers,
  Info,
} from 'lucide-react';

export default function MedicinePage() {
  const { user } = useAuthStore();
  const { level, stateId, districtId, getScopeLabel } = useScopeStore();

  // Enforce: clamp to user's jurisdiction
  const scope = useMemo(
    () => getEnforcedScope(user, { level, stateId, districtId }),
    [user, level, stateId, districtId]
  );

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineDetailItem | null>(null);

  // Filter medicines by search query and filter chips
  const filteredMedicines = useMemo(() => {
    return MEDICINE_CATALOG.filter((item) => {
      // Scope metrics — use enforced scope level
      const metrics = getMedicineScopeMetrics(item, scope.level);

      // Search match
      const matchesSearch =
        item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Category match
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      // Status match
      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'stockout' && metrics.status === 'stockout') ||
        (selectedStatus === 'critical' && metrics.status === 'critical') ||
        (selectedStatus === 'low' && metrics.status === 'low') ||
        (selectedStatus === 'adequate' && metrics.status === 'adequate') ||
        (selectedStatus === 'expiring_soon' && metrics.status === 'expiring_soon');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, selectedStatus, scope.level]);

  // Aggregate metrics for top summary cards
  const summaryStats = useMemo(() => {
    let totalStockouts = 0;
    let totalCritical = 0;
    let totalLow = 0;
    let totalCoverageDays = 0;

    MEDICINE_CATALOG.forEach((item) => {
      const m = getMedicineScopeMetrics(item, scope.level);
      if (m.status === 'stockout') totalStockouts++;
      else if (m.status === 'critical') totalCritical++;
      else if (m.status === 'low') totalLow++;
      totalCoverageDays += m.coverageDays;
    });

    const avgCoverage = (totalCoverageDays / MEDICINE_CATALOG.length).toFixed(1);

    return {
      totalStockouts,
      totalCritical,
      totalLow,
      avgCoverage,
      totalTracked: MEDICINE_CATALOG.length,
    };
  }, [scope.level]);

  const categories = ['All', 'Essential', 'Maternal & Child', 'Chronic Disease', 'Infectious Disease', 'Emergency'];
  const statusFilters = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Stockouts (0d)', value: 'stockout' },
    { label: 'Critical (<3d)', value: 'critical' },
    { label: 'Low (3-7d)', value: 'low' },
    { label: 'Adequate (>7d)', value: 'adequate' },
  ];

  return (
    <div className="medicine-page-container" style={{ paddingBottom: '32px' }}>
      {/* ── Page Header ────────────────────────────────────────────────────── */}
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
            <Pill size={22} color="#1a56db" />
            <span>Medicine Intelligence</span>
          </h1>
          <p className="page-subtitle">
            Pharmaceutical inventory telemetry, shortage projections, and AI predictive consumption uncertainty bands
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DataFreshnessLabel source="e-Aushadhi Drug Warehouse Sync" compact />
        </div>
      </div>

      {/* ── Drill-down Breadcrumb & Scope Selector per Masterplan §26 ────────── */}
      <ScopeSelector showSummaryChip />

      {/* ── Top Metric Summary Cards ────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Card 1: Total Tracked */}
        <div className="kpi-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Tracked Formulations</span>
            <Pill size={16} color="#1a56db" />
          </div>
          <div className="kpi-card-value">{summaryStats.totalTracked}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Essential Drug List (EDL)</div>
        </div>

        {/* Card 2: Stockouts */}
        <div
          className="kpi-card severity-critical"
          style={{
            padding: '14px 16px',
            backgroundColor: summaryStats.totalStockouts > 0 ? '#fef2f2' : '#ffffff',
            border: `1px solid ${summaryStats.totalStockouts > 0 ? '#fecaca' : '#e2e8f0'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label" style={{ color: '#991b1b' }}>Stockouts (0 Days)</span>
            <AlertOctagon size={16} color="#dc2626" />
          </div>
          <div className="kpi-card-value" style={{ color: '#dc2626' }}>
            {summaryStats.totalStockouts}
          </div>
          <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 500 }}>
            Requires immediate redistribution
          </div>
        </div>

        {/* Card 3: Critical Shortage */}
        <div
          className="kpi-card severity-warn"
          style={{
            padding: '14px 16px',
            backgroundColor: summaryStats.totalCritical > 0 ? '#fffbeb' : '#ffffff',
            border: `1px solid ${summaryStats.totalCritical > 0 ? '#fde68a' : '#e2e8f0'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label" style={{ color: '#92400e' }}>Critical (&lt;3 Days)</span>
            <AlertTriangle size={16} color="#d97706" />
          </div>
          <div className="kpi-card-value" style={{ color: '#d97706' }}>
            {summaryStats.totalCritical}
          </div>
          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>
            Buffer breach within 72 hours
          </div>
        </div>

        {/* Card 4: Low Stock */}
        <div className="kpi-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Low Stock (3-7 Days)</span>
            <Clock size={16} color="#475569" />
          </div>
          <div className="kpi-card-value">{summaryStats.totalLow}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Reorder cycle initiated</div>
        </div>

        {/* Card 5: Avg Coverage */}
        <div className="kpi-card severity-ok" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-card-label">Average Coverage</span>
            <CheckCircle2 size={16} color="#0e9f6e" />
          </div>
          <div className="kpi-card-value" style={{ color: '#0e9f6e' }}>
            {summaryStats.avgCoverage} <span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>Days</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Jurisdiction aggregate</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              id="medicine-search-input"
              type="text"
              placeholder="Search by drug name, active generic formulation, or category…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 500,
                color: '#1e293b',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {statusFilters.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: 4 }}>
            Therapeutic Category:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}`,
                  backgroundColor: isSelected ? '#e8effd' : '#f8fafc',
                  color: isSelected ? '#1a56db' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Medicine Table ────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title" style={{ fontSize: '14px', fontWeight: 700 }}>
              Formulation Inventory & Shortage Radar
            </span>
            <span className="badge badge-info">{filteredMedicines.length} listed</span>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Click any row to open the <strong>AI Uncertainty Band Forecast (Masterplan §88.9)</strong>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Medicine & Generic</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Current Stock</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Shortage Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Projected Shortage</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Days Remaining</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>7-Day Consumption</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Expiry & Wastage</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Recent Movement</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No medicines match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const scope = getMedicineScopeMetrics(med, level);
                  const isStockout = scope.status === 'stockout';
                  const isCritical = scope.status === 'critical';
                  const isLow = scope.status === 'low';
                  const lastMovement = med.recentMovements[0];

                  return (
                    <tr
                      key={med.medicineId}
                      onClick={() => setSelectedMedicine(med)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      {/* 1. Medicine & Generic */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                          {med.medicineName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: 1 }}>
                          {med.genericName} • <span style={{ color: '#1a56db' }}>{med.category}</span>
                        </div>
                      </td>

                      {/* 2. Current Stock */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: isStockout ? '#dc2626' : '#0f172a' }}>
                          {scope.stock.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{med.unit}</div>
                      </td>

                      {/* 3. Shortage Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <RiskBadge
                          level={
                            isStockout
                              ? 'CRITICAL'
                              : isCritical
                              ? 'CRITICAL'
                              : isLow
                              ? 'HIGH'
                              : 'LOW'
                          }
                          size="sm"
                          label={
                            isStockout
                              ? 'STOCKOUT'
                              : isCritical
                              ? 'CRITICAL (<3d)'
                              : isLow
                              ? 'LOW (3-7d)'
                              : 'ADEQUATE'
                          }
                        />
                      </td>

                      {/* 4. Projected Shortage */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: isStockout ? '#dc2626' : scope.projectedDays < 5 ? '#d97706' : '#0e9f6e',
                          }}
                        >
                          {isStockout
                            ? 'Stockout Now'
                            : `In ${scope.projectedDays} days`}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>At current OPD burn</div>
                      </td>

                      {/* 5. Days Remaining & Progress Bar */}
                      <td style={{ padding: '12px 16px', minWidth: '130px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: isStockout || isCritical ? '#dc2626' : '#0f172a' }}>
                            {scope.coverageDays} Days
                          </span>
                          <span style={{ color: '#94a3b8' }}>Req: 15d</span>
                        </div>
                        <div style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (scope.coverageDays / 30) * 100)}%`,
                              height: '100%',
                              backgroundColor:
                                isStockout || isCritical
                                  ? '#dc2626'
                                  : isLow
                                  ? '#d97706'
                                  : '#0e9f6e',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </td>

                      {/* 6. Consumption Sparkline */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block' }}>
                          <TrendSparkline
                            data={med.consumptionSparkline}
                            width={65}
                            height={22}
                            higherIsBetter={false}
                          />
                        </div>
                      </td>

                      {/* 7. Expiry & Wastage */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                          {new Date(med.nearestExpiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '11px', color: med.wastageRatePct > 2 ? '#dc2626' : '#64748b' }}>
                          {med.wastageRatePct}% wastage ({med.wastageUnits}u)
                        </div>
                      </td>

                      {/* 8. Recent Movement */}
                      <td style={{ padding: '12px 14px' }}>
                        {lastMovement ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: lastMovement.type === 'INBOUND' ? '#059669' : lastMovement.type === 'REDISTRIBUTION' ? '#1a56db' : '#dc2626',
                                }}
                              >
                                {lastMovement.type === 'INBOUND' ? '▲ IN' : lastMovement.type === 'REDISTRIBUTION' ? '⇄ XFER' : '▼ OUT'}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                                {lastMovement.quantity.toLocaleString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lastMovement.sourceDestination}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* 9. Action Drilldown */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMedicine(med);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#eff6ff',
                            color: '#1a56db',
                            border: '1px solid #bfdbfe',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <span>Forecast</span>
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Medicine Detail View (Drilled Down on Click with Uncertainty Band) ── */}
      <MedicineDetailModal
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        scopeLevel={level}
        scopeLabel={getScopeLabel()}
      />
    </div>
  );
}
