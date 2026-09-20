'use client';

import React from 'react';

export interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  trend?: 'up' | 'down' | 'flat';
  higherIsBetter?: boolean;
  strokeWidth?: number;
  showArea?: boolean;
  showEndDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

export function TrendSparkline({
  data = [40, 45, 42, 55, 52, 60, 58],
  width = 80,
  height = 28,
  trend,
  higherIsBetter = true,
  strokeWidth = 1.8,
  showArea = true,
  showEndDot = true,
  className = '',
  style,
  color,
}: TrendSparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height, ...style }} />;
  }

  // Determine trend if not explicitly provided
  const first = data[0];
  const last = data[data.length - 1];
  const computedTrend = trend ?? (last > first ? 'up' : last < first ? 'down' : 'flat');

  // Compute color based on trend and direction favorability
  let strokeColor = color;
  if (!strokeColor) {
    if (computedTrend === 'flat') {
      strokeColor = '#94a3b8'; // Neutral slate
    } else {
      const isPositive =
        (computedTrend === 'up' && higherIsBetter) ||
        (computedTrend === 'down' && !higherIsBetter);
      strokeColor = isPositive ? '#0e9f6e' : '#dc2626'; // Green vs Red
    }
  }

  // Calculate scales with padding to avoid clipping
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;
  const usableHeight = height - padding * 2;
  const usableWidth = width - padding * 2;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // For area fill under sparkline
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath = `M ${firstPoint.x.toFixed(1)},${(height - padding).toFixed(1)} L ${polylinePoints} L ${lastPoint.x.toFixed(1)},${(height - padding).toFixed(1)} Z`;

  // Unique gradient ID for SVG
  const gradientId = `spark-grad-${strokeColor.replace('#', '')}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg
      width={width}
      height={height}
      className={`trend-sparkline ${className}`}
      style={{ overflow: 'visible', display: 'block', ...style }}
      aria-label={`Trend sparkline: ${computedTrend} (${first} to ${last})`}
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Area fill under curve */}
      {showArea && (
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      )}

      {/* Line */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />

      {/* End point dot */}
      {showEndDot && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={strokeColor}
          stroke="#ffffff"
          strokeWidth={1}
        />
      )}
    </svg>
  );
}
