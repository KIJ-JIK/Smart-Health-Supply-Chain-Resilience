'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface MetricDeltaProps {
  label: string;
  currentValue: number;
  previousValue?: number;
  /**
   * If true, a lower value is better (e.g. Loss, MAE, RMSE).
   * If false, a higher value is better (e.g. Accuracy).
   */
  lowerIsBetter?: boolean;
  unit?: string;
  formatDecimals?: number;
}

export const MetricDelta: React.FC<MetricDeltaProps> = ({
  label,
  currentValue,
  previousValue,
  lowerIsBetter = true,
  unit = '',
  formatDecimals = 4,
}) => {
  const hasDiff = previousValue !== undefined;
  const delta = hasDiff ? currentValue - previousValue : 0;
  const percentDelta = hasDiff && previousValue !== 0 ? (delta / previousValue) * 100 : 0;

  // An improvement occurs if:
  // - lowerIsBetter && delta < 0 (e.g. MAE dropped from 0.10 to 0.08)
  // - !lowerIsBetter && delta > 0 (e.g. Accuracy rose from 0.85 to 0.89)
  const isImproved = lowerIsBetter ? delta < -0.00001 : delta > 0.00001;
  const isRegressed = lowerIsBetter ? delta > 0.00001 : delta < -0.00001;

  const toneColor = isImproved
    ? colors.status.green.text
    : isRegressed
    ? colors.status.red.text
    : colors.text.secondary;

  const arrow = isImproved ? 'Improvement' : isRegressed ? 'Regression' : 'Neutral';

  return (
    <div
      style={{
        backgroundColor: colors.bg.surfaceHover,
        padding: '10px 14px',
        borderRadius: 6,
        border: `1px solid ${colors.bg.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 140,
      }}
    >
      <div style={{ ...typography.bodySmall, color: colors.text.muted }}>{label}</div>

      <div
        style={{
          ...typography.kpiSmall,
          color: colors.text.primary,
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span>{currentValue.toFixed(formatDecimals)}</span>
        {unit && <span style={{ fontSize: '0.75rem', color: colors.text.muted }}>{unit}</span>}
      </div>

      {hasDiff ? (
        <div
          style={{
            ...typography.bodySmall,
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: toneColor,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>
            {delta > 0 ? '+' : ''}
            {delta.toFixed(formatDecimals)} ({percentDelta > 0 ? '+' : ''}
            {percentDelta.toFixed(1)}%)
          </span>
          <span style={{ fontSize: '0.625rem', opacity: 0.85 }}>({arrow})</span>
        </div>
      ) : (
        <div
          style={{
            ...typography.bodySmall,
            fontSize: '0.6875rem',
            color: colors.text.muted,
            fontStyle: 'italic',
          }}
        >
          Baseline Model
        </div>
      )}
    </div>
  );
};
