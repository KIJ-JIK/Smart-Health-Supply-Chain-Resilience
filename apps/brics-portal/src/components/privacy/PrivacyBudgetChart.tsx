'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface PrivacyTimeSeriesDataPoint {
  roundLabel: string;
  roundNumber: number;
  // Epsilon values for the 5 nations
  IN: number;
  BR: number;
  RU: number;
  CN: number;
  ZA: number;
  averageCumulative: number;
}

export interface PrivacyBudgetChartProps {
  data: PrivacyTimeSeriesDataPoint[];
  budgetLimit?: number;
  height?: number;
}

const COUNTRY_COLORS: Record<string, string> = {
  IN: '#f0883e', // Orange tone (India)
  BR: '#3fb950', // Green tone (Brazil)
  RU: '#58a6ff', // Blue tone (Russia)
  CN: '#d29922', // Amber/Yellow tone (China)
  ZA: '#f85149', // Red tone (South Africa - near exhaustion)
};

export const PrivacyBudgetChart: React.FC<PrivacyBudgetChartProps> = ({
  data,
  budgetLimit = 10.0,
  height = 280,
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.muted,
          ...typography.bodySmall,
        }}
      >
        No privacy budget ledger history available.
      </div>
    );
  }

  const padding = { top: 25, right: 35, bottom: 45, left: 45 };
  const width = 640;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxVal = budgetLimit; // Hard ceiling at 10.0
  const minVal = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / (maxVal - minVal);
    return padding.top + plotHeight - norm * plotHeight;
  };

  const countries = ['IN', 'BR', 'RU', 'CN', 'ZA'] as const;

  // 10% exhaustion threshold line (9.0 epsilon)
  const warningEpsilon = budgetLimit * 0.9;
  const warningY = getY(warningEpsilon);
  const ceilingY = getY(budgetLimit);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend & Threshold Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {countries.map((c) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, ...typography.bodySmall }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: COUNTRY_COLORS[c],
                }}
              />
              <span style={{ color: colors.text.secondary, fontWeight: 600 }}>{c}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...typography.bodySmall }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 2,
                backgroundColor: colors.status.red.dot,
                borderTop: `2px dashed ${colors.status.red.dot}`,
              }}
            />
            <span style={{ color: colors.status.red.text, fontSize: '0.6875rem' }}>
              Hard Limit ({budgetLimit.toFixed(1)} ε)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 2,
                backgroundColor: colors.status.amber.dot,
                borderTop: `2px dashed ${colors.status.amber.dot}`,
              }}
            />
            <span style={{ color: colors.status.amber.text, fontSize: '0.6875rem' }}>
              Warning Zone ({warningEpsilon.toFixed(1)} ε)
            </span>
          </div>
        </div>
      </div>

      {/* SVG Multi-Line Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height, overflow: 'visible' }}
        >
          {/* Warning Zone Shading (> 9.0 epsilon) */}
          <rect
            x={padding.left}
            y={ceilingY}
            width={plotWidth}
            height={warningY - ceilingY}
            fill={`${colors.status.red.bg}80`}
          />

          {/* Grid lines */}
          {[0, 2.5, 5.0, 7.5, 9.0, 10.0].map((eps) => {
            const y = getY(eps);
            const isHardLimit = eps === 10.0;
            const isWarningLimit = eps === 9.0;

            return (
              <g key={eps}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke={
                    isHardLimit
                      ? colors.status.red.dot
                      : isWarningLimit
                      ? colors.status.amber.dot
                      : colors.bg.borderSubtle
                  }
                  strokeDasharray={isHardLimit || isWarningLimit ? '4 3' : undefined}
                  strokeWidth={isHardLimit ? 1.5 : 1}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={
                    isHardLimit
                      ? colors.status.red.text
                      : isWarningLimit
                      ? colors.status.amber.text
                      : colors.text.muted
                  }
                  fontSize={10}
                  fontFamily="sans-serif"
                >
                  {eps.toFixed(1)} ε
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={padding.top + plotHeight + 20}
              textAnchor="middle"
              fill={colors.text.muted}
              fontSize={11}
              fontFamily="sans-serif"
            >
              {d.roundLabel}
            </text>
          ))}

          {/* Render Lines for each Country */}
          {countries.map((c) => {
            const points = data.map((d, i) => `${getX(i)},${getY(d[c])}`).join(' ');
            const strokeColor = COUNTRY_COLORS[c];

            return (
              <g key={c}>
                <polyline
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={c === 'ZA' ? '3' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {data.map((d, i) => (
                  <circle
                    key={`${c}-dot-${i}`}
                    cx={getX(i)}
                    cy={getY(d[c])}
                    r={c === 'ZA' ? 4.5 : 3.5}
                    fill={colors.bg.surface}
                    stroke={strokeColor}
                    strokeWidth="2"
                  >
                    <title>{`${d.roundLabel} - ${c}: ${d[c].toFixed(3)} ε`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
