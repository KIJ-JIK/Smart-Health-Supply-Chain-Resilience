'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface PrivacyBudgetGaugeProps {
  /** Cumulative epsilon consumed so far (e.g. 2.45) */
  consumedEpsilon: number;
  /** Total maximum allowed budget limit (e.g. 10.0 from CHECK constraint) */
  budgetLimit?: number;
  /** Epsilon consumed in this current round (e.g. 0.35) */
  thisRoundEpsilon?: number;
  /** Height in pixels */
  height?: number;
}

export const PrivacyBudgetGauge: React.FC<PrivacyBudgetGaugeProps> = ({
  consumedEpsilon,
  budgetLimit = 10.0,
  thisRoundEpsilon = 0,
  height = 16,
}) => {
  const percentUsed = Math.min(100, Math.max(0, (consumedEpsilon / budgetLimit) * 100));
  const remainingPercent = Math.max(0, 100 - percentUsed);
  const remainingEpsilon = Math.max(0, budgetLimit - consumedEpsilon);

  // Status tone based on remaining percentage
  const isCritical = remainingPercent <= 15; // less than 15% left
  const isWarning = remainingPercent <= 30 && !isCritical;

  const barColor = isCritical
    ? colors.status.red.dot
    : isWarning
    ? colors.status.amber.dot
    : colors.status.green.dot;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Top Header: Plain-language summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ ...typography.body, fontWeight: 600, color: colors.text.primary }}>
          Privacy Budget Remaining
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              ...typography.kpiSmall,
              color: barColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {remainingPercent.toFixed(1)}%
          </span>
          <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
            ({remainingEpsilon.toFixed(2)} / {budgetLimit.toFixed(1)} ε units remaining)
          </span>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: colors.bg.surfaceHover,
          borderRadius: height / 2,
          overflow: 'hidden',
          border: `1px solid ${colors.bg.borderSubtle}`,
          position: 'relative',
        }}
        role="progressbar"
        aria-valuenow={remainingPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            height: '100%',
            width: `${remainingPercent}%`,
            backgroundColor: barColor,
            borderRadius: height / 2,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Context caption */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...typography.bodySmall,
          fontSize: '0.6875rem',
          color: colors.text.muted,
        }}
      >
        <span>
          Current round consumption:{' '}
          <strong style={{ color: colors.text.secondary }}>
            ~{thisRoundEpsilon.toFixed(3)} ε
          </strong>
        </span>
        <span>
          Safety Ceiling:{' '}
          <strong style={{ color: colors.text.secondary }}>
            {budgetLimit.toFixed(1)} ε limit
          </strong>
        </span>
      </div>
    </div>
  );
};
