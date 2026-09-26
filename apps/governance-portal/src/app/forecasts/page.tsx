'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { FORECASTS } from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import { RiskBadge } from '@/components/common/RiskBadge';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import {
  getForecastCardsByScope,
  getQualityBadgeProps,
  type MasterplanForecastContract,
  type ForecastDomainCategory,
} from '@/lib/forecastData';
import {
  BrainCircuit,
  Pill,
  Bed,
  Wind,
  Users,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Cpu,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function ForecastsPage() {
  const { user } = useAuthStore();
  const { level, getScopeLabel } = useScopeStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | ForecastDomainCategory>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const { data: forecastData, loading: forecastLoading, refetch } = useQuery(FORECASTS, {
    variables: {
      entity: {
        entityType: level,
        entityId: level === 'phc' ? 'phc-01' : undefined,
      },
    },
    fetchPolicy: 'cache-first',
  });

  // Scope-reactive forecast cards dataset augmented with live backend AI predictions
  const forecastCards: MasterplanForecastContract[] = useMemo(() => {
    const baseCards = getForecastCardsByScope(level, selectedCategory);
    if (!forecastData?.forecasts || forecastData.forecasts.length === 0) {
      return baseCards;
    }
    return baseCards.map((card) => {
      const match = forecastData.forecasts.find((f: any) =>
        f.metric?.toLowerCase().includes(card.category) ||
        card.metricKey?.toLowerCase().includes(f.metric?.toLowerCase())
      );
      if (match) {
        return {
          ...card,
          modelName: match.model || card.modelName,
          confidenceScorePct: Math.round((match.confidence || 0.92) * 100),
          generatedAt: match.generatedAt || card.generatedAt,
          points: match.points && match.points.length > 0 ? match.points.map((p: any, idx: number) => ({
            date: p.date,
            dayLabel: `Day ${idx + 1}`,
            predictedValue: p.value,
            lowerBound: p.lowerBound,
            upperBound: p.upperBound,
          })) : card.points,
        };
      }
      return card;
    });
  }, [level, selectedCategory, forecastData]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
              Unified AI Forecasts Engine
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
              Masterplan §33 Contract
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Multi-domain predictive modeling: Medicine Consumption, Bed Occupancy, Oxygen Burn Rate, Staffing Shifts, and Patient Influx
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <DataFreshnessLabel
            timestamp={lastRefreshed}
            onRefresh={() => setLastRefreshed(new Date())}
            source="LSTM / NeuralProphet Pipeline"
          />
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Current Jurisdiction: <strong style={{ color: '#0f172a' }}>{getScopeLabel()}</strong>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb Scope Selector ── */}
      <ScopeSelector showFreshness={false} showSummaryChip={true} />

      {/* ── Masterplan §33 Contract Explanation Banner ── */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 8,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
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
          <strong>Masterplan §33 Forecast Output Contract:</strong> Every prediction card renders all 8 mandated contract fields:{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>entity</code>,{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>metric</code>,{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>forecast_start/end</code>,{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>predicted_value [lower..upper]</code>,{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>model_version</code>,{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>training_window</code>,{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>generated_at</code>, and{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>confidence</code>. Model version captions are permanently displayed for human auditing.
        </div>
      </div>

      {/* ── Domain Filter Tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginRight: 4 }}>Domain Filter:</span>

        {[
          { key: 'all', label: 'All 5 Domains', icon: Layers },
          { key: 'medicine', label: 'Medicine Demand', icon: Pill },
          { key: 'bed', label: 'Bed Demand', icon: Bed },
          { key: 'oxygen', label: 'Oxygen Demand', icon: Wind },
          { key: 'staff', label: 'Staff Requirement', icon: Users },
          { key: 'patient', label: 'Patient Footfall', icon: Activity },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isSelected = selectedCategory === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#1d4ed8' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              <IconComp size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid of Masterplan §33 Forecast Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {forecastCards.map((card) => {
          const badge = getQualityBadgeProps(card.qualityIndicator);
          const DomainIcon =
            card.category === 'medicine'
              ? Pill
              : card.category === 'bed'
              ? Bed
              : card.category === 'oxygen'
              ? Wind
              : card.category === 'staff'
              ? Users
              : Activity;

          return (
            <div
              key={card.id}
              className="card"
              style={{
                background: '#ffffff',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              {/* Card Header & Permanent Mandatory Model Caption */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  marginBottom: 16,
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                      }}
                    >
                      <DomainIcon size={18} />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748b',
                        }}
                      >
                        {card.categoryLabel}
                      </span>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                        {card.metricDisplayName}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Right side: Quality Badge & MANDATORY PERMANENT MODEL CAPTION */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RiskBadge level={badge.level} label={badge.label} size="sm" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      {card.confidenceScorePct}% Confidence
                    </span>
                  </div>

                  {/* MANDATORY PERMANENT CAPTION REQUIREMENT: Model: <name> v<version> */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Permanent Model Versioning Caption (Masterplan §33 Requirement)"
                  >
                    <Cpu size={12} color="#2563eb" />
                    <span>
                      Model: <strong>{card.modelName} v{card.modelVersion}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Masterplan §33 Contract Fields Grid */}
              <div className="grid-4" style={{ gap: 12, marginBottom: 20, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                {/* 1. Entity */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Entity (Contract §33.1)
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {card.entityName}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Scope: {card.entityType.toUpperCase()}</div>
                </div>

                {/* 2. Forecast Window (Start to End) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Forecast Window (§33.2)
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{card.forecastStart}</span>
                    <ArrowRight size={12} color="#64748b" />
                    <span>{card.forecastEnd}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>14-Day Forward Horizon</div>
                </div>

                {/* 3. Predicted Value & Band */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Predicted Value & Band (§33.3)
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                    {card.predictedValue.toLocaleString()} {card.unit}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                    Band: [{card.lowerBound.toLocaleString()} – {card.upperBound.toLocaleString()}]
                  </div>
                </div>

                {/* 4. Training Window & Timestamp */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Training Window & Generated (§33.4)
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                    {card.trainingWindow}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Generated: {card.generatedAt}</div>
                </div>
              </div>



                {/* Uncertainty Band Chart (Recharts ComposedChart) */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      Forward Trajectory with Lower / Upper Confidence Bounds (Uncertainty Band)
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Visualized Band: {card.lowerBound.toLocaleString()} to {card.upperBound.toLocaleString()} {card.unit}
                    </span>
                  </div>

                  <div style={{ height: 220, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={card.points} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`ciGrad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                        <Tooltip
                          formatter={(val: number, name: string) => [
                            `${val.toLocaleString()} ${card.unit}`,
                            name === 'predictedValue'
                              ? 'Predicted Value'
                              : name === 'upperBound'
                              ? 'Upper Bound'
                              : 'Lower Bound',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="upperBound"
                          stroke="none"
                          fill={`url(#ciGrad-${card.id})`}
                          name="Upper Bound"
                        />
                        <Area
                          type="monotone"
                          dataKey="lowerBound"
                          stroke="none"
                          fill="#ffffff"
                          name="Lower Bound"
                        />
                        <Line
                          type="monotone"
                          dataKey="predictedValue"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#2563eb' }}
                          name="Predicted Value"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Actionable Insight Box */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    fontSize: 12,
                    color: '#1e3a8a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Sparkles size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Operational Insight:</strong> {card.actionableInsight}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
