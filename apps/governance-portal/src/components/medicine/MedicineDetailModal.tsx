'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MedicineDetailItem,
  getMedicineScopeMetrics,
} from '@/lib/medicineData';
import { RiskBadge } from '@/components/common/RiskBadge';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import {
  X,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Truck,
  Package,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
  Layers,
  Thermometer,
  FileText,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface MedicineDetailModalProps {
  medicine: MedicineDetailItem | null;
  onClose: () => void;
  scopeLevel: 'national' | 'state' | 'district' | 'phc';
  scopeLabel: string;
}

export function MedicineDetailModal({
  medicine,
  onClose,
  scopeLevel,
  scopeLabel,
}: MedicineDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'forecast' | 'history' | 'batches' | 'movements'>('forecast');

  if (!medicine) return null;

  const scopeMetrics = getMedicineScopeMetrics(medicine, scopeLevel);

  // Combine 12-week history with 6-week forecast into a unified trend chart
  const unifiedChartData = [
    ...medicine.consumptionHistory12Weeks.map((h) => ({
      period: h.week,
      historicalActual: h.actualDispensed,
      wastage: h.wastage,
      predictedValue: undefined as number | undefined,
      lowerBound: undefined as number | undefined,
      upperBound: undefined as number | undefined,
    })),
    ...medicine.forecastPoints.map((f) => ({
      period: f.period,
      historicalActual: undefined as number | undefined,
      wastage: undefined as number | undefined,
      predictedValue: f.predictedValue,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
    })),
  ];

  // Custom tooltip explaining the uncertainty corridor
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      const isForecast = dataPoint?.predictedValue !== undefined;

      return (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '12px 14px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            minWidth: '220px',
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>
            {label} ({isForecast ? 'AI Predictive Forecast' : 'Historical Consumption'})
          </div>

          {isForecast ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#1a56db', fontWeight: 600 }}>Predicted Dispensation:</span>
                <strong>{dataPoint.predictedValue.toLocaleString()} {medicine.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                <span>90% Upper Bound (Peak):</span>
                <span>{dataPoint.upperBound.toLocaleString()} {medicine.unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
                <span>90% Lower Bound:</span>
                <span>{dataPoint.lowerBound.toLocaleString()} {medicine.unit}</span>
              </div>
              <div
                style={{
                  marginTop: 6,
                  padding: '4px 6px',
                  borderRadius: 4,
                  backgroundColor: '#eff6ff',
                  fontSize: '10px',
                  color: '#1e40af',
                }}
              >
                <strong>Uncertainty Spread:</strong> ±{Math.round(((dataPoint.upperBound - dataPoint.lowerBound) / (2 * dataPoint.predictedValue)) * 100)}%
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Actual Dispensed:</span>
                <strong>{dataPoint.historicalActual?.toLocaleString()} {medicine.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginTop: 2 }}>
                <span>Wastage/Loss:</span>
                <span>{dataPoint.wastage} {medicine.unit}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                }}
              >
                {medicine.category}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Scope: <strong>{scopeLabel}</strong>
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {medicine.medicineName}
            </h2>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: 2 }}>
              Generic: <strong>{medicine.genericName}</strong> ({medicine.dosageForm})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RiskBadge
              level={
                scopeMetrics.status === 'stockout'
                  ? 'CRITICAL'
                  : scopeMetrics.status === 'critical'
                  ? 'CRITICAL'
                  : scopeMetrics.status === 'low'
                  ? 'HIGH'
                  : 'LOW'
              }
              size="md"
            />
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: 4,
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Metric Snapshot Banner ───────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            padding: '14px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Current Stock</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: scopeMetrics.stock === 0 ? '#dc2626' : '#0f172a' }}>
              {scopeMetrics.stock.toLocaleString()} {medicine.unit}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Coverage Remaining</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: scopeMetrics.coverageDays < 3 ? '#dc2626' : '#0e9f6e' }}>
              {scopeMetrics.coverageDays} Days
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Projected Stockout</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: scopeMetrics.projectedDays <= 3 ? '#dc2626' : '#d97706' }}>
              {scopeMetrics.projectedDays === 0 ? 'Zero Stock Today' : `In ${scopeMetrics.projectedDays} Days`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Nearest Batch Expiry</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginTop: 2 }}>
              {new Date(medicine.nearestExpiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Wastage Rate</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: medicine.wastageRatePct > 2 ? '#dc2626' : '#0e9f6e', marginTop: 2 }}>
              {medicine.wastageRatePct}% ({medicine.wastageUnits} units)
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0 24px',
            gap: 24,
          }}
        >
          <button
            onClick={() => setActiveTab('forecast')}
            style={{
              padding: '12px 4px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: activeTab === 'forecast' ? '#1a56db' : '#64748b',
              borderBottom: `2px solid ${activeTab === 'forecast' ? '#1a56db' : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <TrendingUp size={15} />
            <span>AI Predictive Forecast Band (Masterplan §88.9)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 4px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: activeTab === 'history' ? '#1a56db' : '#64748b',
              borderBottom: `2px solid ${activeTab === 'history' ? '#1a56db' : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <BarChart3 size={15} />
            <span>12-Week Consumption History</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            style={{
              padding: '12px 4px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: activeTab === 'batches' ? '#1a56db' : '#64748b',
              borderBottom: `2px solid ${activeTab === 'batches' ? '#1a56db' : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Package size={15} />
            <span>Batch & Expiry Ledger ({medicine.batches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            style={{
              padding: '12px 4px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: activeTab === 'movements' ? '#1a56db' : '#64748b',
              borderBottom: `2px solid ${activeTab === 'movements' ? '#1a56db' : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Truck size={15} />
            <span>Stock Movements ({medicine.recentMovements.length})</span>
          </button>
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: AI PREDICTIVE FORECAST BAND (MASTERPLAN §88.9 MANDATORY UNCERTAINTY BAND) */}
          {activeTab === 'forecast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Masterplan §88.9 Explicit Compliance Callout */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <ShieldAlert size={20} color="#1d4ed8" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: 1.4 }}>
                  <strong>Masterplan §88.9 Compliance Requirement:</strong>
                  <br />
                  AI predictive models MUST render uncertainty bands (90% Confidence Corridor: Lower Bound to Upper Bound) rather than presenting a single deterministic line as fact. Decision-makers must plan buffers according to the uncertainty spread.
                </div>
              </div>

              {/* Chart: Historical + Uncertainty Corridor */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      Consumption Trajectory & 6-Week Predictive Uncertainty Corridor
                    </span>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Model: <strong>{medicine.forecastModel}</strong> ({medicine.forecastConfidencePct}% Statistical Fit)
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, backgroundColor: '#93c5fd', opacity: 0.5, borderRadius: 2 }} />
                      <span>90% Uncertainty Band</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 3, backgroundColor: '#1d4ed8' }} />
                      <span>Predicted Trajectory</span>
                    </span>
                  </div>
                </div>

                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={unifiedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.08} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit={` ${medicine.unit}`} />
                      <Tooltip content={<CustomForecastTooltip />} />

                      {/* Historical Consumption Bar */}
                      <Bar dataKey="historicalActual" fill="#cbd5e1" name="Historical Dispensed" radius={[2, 2, 0, 0]} />

                      {/* Uncertainty Corridor: Upper Bound Fill */}
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stroke="#60a5fa"
                        strokeDasharray="4 4"
                        fill="url(#uncertaintyGrad)"
                        name="90% Upper Bound"
                      />

                      {/* Uncertainty Corridor: Lower Bound Cutout */}
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stroke="#93c5fd"
                        strokeDasharray="4 4"
                        fill="#ffffff"
                        name="90% Lower Bound"
                      />

                      {/* Central Forecast Point Line */}
                      <Line
                        type="monotone"
                        dataKey="predictedValue"
                        stroke="#1d4ed8"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#1d4ed8' }}
                        name="Predicted Value"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Forecast Planning Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Forecast Horizon</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Conservative (Lower)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#1a56db' }}>Expected Forecast</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#dc2626' }}>Peak Surge (Upper)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Recommended Safe Buffer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicine.forecastPoints.map((pt, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{pt.period}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {new Date(pt.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>
                          {pt.lowerBound.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1a56db' }}>
                          {pt.predictedValue.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                          {pt.upperBound.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0e9f6e', fontWeight: 600 }}>
                          +{Math.round(pt.upperBound - pt.predictedValue).toLocaleString()} {medicine.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: 12-WEEK CONSUMPTION HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ height: 260, backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={medicine.consumptionHistory12Weeks} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit={` ${medicine.unit}`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="actualDispensed" fill="#1a56db" name="Dispensed to Patients" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="wastage" stroke="#dc2626" strokeWidth={2} name="Reported Loss/Wastage" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div style={{ fontSize: 12, color: '#64748b' }}>
                Showing verified 12-week consumption telemetry aggregated from Ground Level PHC dispensed logs.
              </div>
            </div>
          )}

          {/* TAB 3: BATCHES & EXPIRY LEDGER */}
          {activeTab === 'batches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Batch Number</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Current Quantity</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Mfg Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Expiry Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Storage Temp</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Batch Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicine.batches.map((b) => (
                    <tr key={b.batchNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{b.batchNumber}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                        {b.quantity.toLocaleString()} {medicine.unit}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {new Date(b.manufacturingDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>
                        {new Date(b.expiryDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {b.temperatureRequired}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          className={`badge ${
                            b.status === 'valid'
                              ? 'badge-ok'
                              : b.status === 'expiring_soon'
                              ? 'badge-warn'
                              : 'badge-critical'
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: RECENT MOVEMENTS */}
          {activeTab === 'movements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {medicine.recentMovements.map((mov) => (
                <div
                  key={mov.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          mov.type === 'INBOUND'
                            ? '#ecfdf5'
                            : mov.type === 'REDISTRIBUTION'
                            ? '#eff6ff'
                            : '#fef2f2',
                        color:
                          mov.type === 'INBOUND'
                            ? '#059669'
                            : mov.type === 'REDISTRIBUTION'
                            ? '#1a56db'
                            : '#dc2626',
                      }}
                    >
                      <Truck size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                        {mov.type}: {mov.quantity.toLocaleString()} {mov.unit}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {mov.sourceDestination} • Batch {mov.batchNumber}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${mov.status === 'completed' ? 'badge-ok' : 'badge-warn'}`}>
                      {mov.status.replace('_', ' ')}
                    </span>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                      {new Date(mov.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Modal Footer with Quick Redistribution Action ────────────────── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DataFreshnessLabel source="Drug Registry Telemetry" compact />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 500,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <Link
              href={`/redistribution?medicine=${medicine.medicineId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                backgroundColor: '#1a56db',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Truck size={14} />
              <span>Initiate Stock Redistribution</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
