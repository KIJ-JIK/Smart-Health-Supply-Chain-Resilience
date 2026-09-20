'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { RiskBadge, RiskLevel } from './RiskBadge';
import { TrendSparkline } from './TrendSparkline';
import { DataFreshnessLabel } from './DataFreshnessLabel';

export interface KpiTileProps {
  /** Metric display name */
  label: string;
  /** Primary metric value */
  value: string | number;
  /** Unit of measurement (e.g. '%', 'days', 'PHCs') */
  unit?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'flat';
  /** Numeric delta from previous cycle (e.g. +2.4 or -1.5) */
  delta?: number;
  /** Label for comparative baseline (default 'vs last period') */
  deltaPeriod?: string;
  /** Whether an upward trend represents an improvement (default true) */
  higherIsBetter?: boolean;
  /** 7-point or 12-point trend historical numbers for sparkline */
  sparklineData?: number[];
  /** Risk tier per Masterplan §35 */
  riskLevel?: RiskLevel;
  /** Border & accent severity */
  severity?: 'ok' | 'warn' | 'critical';
  /** Timestamp when this KPI metric was last synced */
  lastUpdated?: string | number | Date;
  /** Data source node description */
  source?: string;
  /** Optional icon displayed next to title */
  icon?: React.ReactNode;
  /** Loading skeleton state */
  loading?: boolean;
  /** Optional click handler for drilldown */
  onClick?: () => void;
  /** Optional subtitle or descriptive note */
  description?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function KpiTile({
  label,
  value,
  unit,
  trend,
  delta,
  deltaPeriod = 'vs last period',
  higherIsBetter = true,
  sparklineData,
  riskLevel,
  severity = 'ok',
  lastUpdated,
  source = 'Field Telemetry Sync',
  icon,
  loading = false,
  onClick,
  description,
  className = '',
  style,
}: KpiTileProps) {
  if (loading) {
    return (
      <div
        className={`kpi-card ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: '145px',
          ...style,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 12 }} />
        </div>
        <div className="skeleton" style={{ height: 36, width: '45%', borderRadius: 6, margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 16, width: 70, borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  // Derive trend color
  const isPositive =
    trend === 'up'
      ? higherIsBetter
      : trend === 'down'
      ? !higherIsBetter
      : true;

  const trendClass =
    trend === 'flat' || !trend
      ? 'trend-flat'
      : isPositive
      ? 'trend-up'
      : 'trend-down';

  // Fallback sparkline if none provided
  const defaultSparkline =
    trend === 'up'
      ? [30, 32, 38, 41, 46, 50, 58]
      : trend === 'down'
      ? [62, 59, 54, 48, 45, 41, 36]
      : [45, 46, 44, 47, 45, 46, 45];

  const effectiveSparkline = sparklineData ?? defaultSparkline;

  return (
    <div
      className={`kpi-card severity-${severity} ${onClick ? 'kpi-card-clickable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: 'var(--shadow-xs, 0 1px 2px 0 rgba(0,0,0,0.05))',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        minHeight: '145px',
        ...style,
      }}
    >
      {/* Top row: Label + Icon + RiskBadge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #1a56db)',
              }}
            >
              {icon}
            </span>
          )}
          <span
            className="kpi-card-label"
            title={description ?? label}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-text-muted, #64748b)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
        </div>

        {riskLevel && <RiskBadge level={riskLevel} size="sm" />}
      </div>

      {/* Middle row: Primary Value + Sparkline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          margin: '10px 0 6px',
        }}
      >
        <div className="kpi-card-value" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-brand, sans-serif)', color: 'var(--color-text-primary, #0f172a)' }}>
            {value}
          </span>
          {unit && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-text-secondary, #475569)',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Inline Trend Sparkline */}
        <div style={{ paddingBottom: 2 }}>
          <TrendSparkline
            data={effectiveSparkline}
            width={72}
            height={26}
            trend={trend}
            higherIsBetter={higherIsBetter}
          />
        </div>
      </div>

      {/* Bottom row: Trend Delta + Masterplan §59 DataFreshnessLabel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          paddingTop: '6px',
          borderTop: '1px solid var(--color-border-light, #f1f5f9)',
          fontSize: '11px',
        }}
      >
        {/* Trend delta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            className={`kpi-card-trend ${trendClass}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontWeight: 600,
              gap: 2,
            }}
          >
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {(!trend || trend === 'flat') && <Minus size={12} />}
            {delta !== undefined && (
              <span>
                {delta > 0 ? '+' : ''}
                {delta}
                {unit === '%' ? '%' : ''}
              </span>
            )}
          </span>
          <span style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '10px' }}>
            {deltaPeriod}
          </span>
        </div>

        {/* Masterplan §59 Data Freshness Label */}
        <DataFreshnessLabel
          timestamp={lastUpdated}
          source={source}
          compact
        />
      </div>
    </div>
  );
}
