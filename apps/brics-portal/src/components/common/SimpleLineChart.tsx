'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface SimpleLineChartDataPoint {
  label: string;
  value1: number; // e.g. Loss (0.0 to 0.5)
  value2?: number; // e.g. Accuracy (0.0 to 1.0)
}

export interface SimpleLineChartProps {
  data: SimpleLineChartDataPoint[];
  line1Label?: string;
  line2Label?: string;
  line1Color?: string;
  line2Color?: string;
  height?: number;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  line1Label = 'Loss',
  line2Label = 'Accuracy',
  line1Color = '#f85149', // red tone
  line2Color = '#3fb950', // green tone
  height = 240,
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
        No training history available
      </div>
    );
  }

  // Calculate coordinates for SVG rendering
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 600; // viewBox relative width
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Scales for line 1 (Loss, e.g. 0 to 0.4)
  const minVal1 = 0;
  const maxVal1 = Math.max(0.4, ...data.map((d) => d.value1 * 1.15));

  // Scales for line 2 (Accuracy, e.g. 0.7 to 1.0)
  const hasLine2 = data.some((d) => d.value2 !== undefined);
  const minVal2 = 0.7;
  const maxVal2 = 1.0;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY1 = (val: number) => {
    const norm = (val - minVal1) / (maxVal1 - minVal1);
    return padding.top + plotHeight - norm * plotHeight;
  };

  const getY2 = (val: number) => {
    const norm = (val - minVal2) / (maxVal2 - minVal2);
    return padding.top + plotHeight - norm * plotHeight;
  };

  const points1 = data.map((d, i) => `${getX(i)},${getY1(d.value1)}`).join(' ');
  const points2 = hasLine2
    ? data
        .filter((d) => d.value2 !== undefined)
        .map((d, i) => `${getX(i)},${getY2(d.value2!)}`)
        .join(' ')
    : '';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...typography.bodySmall }}>
          <span
            style={{
              width: 12,
              height: 3,
              backgroundColor: line1Color,
              borderRadius: 2,
            }}
          />
          <span style={{ color: colors.text.secondary }}>{line1Label}</span>
        </div>
        {hasLine2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...typography.bodySmall }}>
            <span
              style={{
                width: 12,
                height: 3,
                backgroundColor: line2Color,
                borderRadius: 2,
              }}
            />
            <span style={{ color: colors.text.secondary }}>{line2Label}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height, overflow: 'visible' }}
        >
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const y = padding.top + plotHeight * p;
            const lossVal = (maxVal1 - (maxVal1 - minVal1) * p).toFixed(2);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke={colors.bg.borderSubtle}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={colors.text.muted}
                  fontSize={10}
                  fontFamily="sans-serif"
                >
                  {lossVal}
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
              {d.label}
            </text>
          ))}

          {/* Line 1 (Loss) */}
          <polyline
            fill="none"
            stroke={line1Color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points1}
          />
          {data.map((d, i) => (
            <circle
              key={`dot1-${i}`}
              cx={getX(i)}
              cy={getY1(d.value1)}
              r="4"
              fill={colors.bg.surface}
              stroke={line1Color}
              strokeWidth="2"
            >
              <title>{`${d.label} - ${line1Label}: ${d.value1.toFixed(3)}`}</title>
            </circle>
          ))}

          {/* Line 2 (Accuracy) */}
          {hasLine2 && (
            <>
              <polyline
                fill="none"
                stroke={line2Color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points2}
              />
              {data.map((d, i) =>
                d.value2 !== undefined ? (
                  <circle
                    key={`dot2-${i}`}
                    cx={getX(i)}
                    cy={getY2(d.value2)}
                    r="4"
                    fill={colors.bg.surface}
                    stroke={line2Color}
                    strokeWidth="2"
                  >
                    <title>{`${d.label} - ${line2Label}: ${(d.value2 * 100).toFixed(1)}%`}</title>
                  </circle>
                ) : null
              )}
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
