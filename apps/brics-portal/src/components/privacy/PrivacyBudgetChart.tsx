import React, { useState } from 'react';

export interface PrivacyTimeSeriesDataPoint {
  roundLabel: string;
  roundNumber: number;
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
  IN: '#f97316', // Orange
  BR: '#10b981', // Emerald
  RU: '#0ea5e9', // Sky blue
  CN: '#eab308', // Amber
  ZA: '#f43f5e', // Rose
};

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳 India',
  BR: '🇧🇷 Brazil',
  RU: '🇷🇺 Russia',
  CN: '🇨🇳 China',
  ZA: '🇿🇦 South Africa',
};

export const PrivacyBudgetChart: React.FC<PrivacyBudgetChartProps> = ({
  data,
  budgetLimit = 10.0,
  height = 280,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: PrivacyTimeSeriesDataPoint; index: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-slate-500 text-xs font-mono"
      >
        No privacy budget history available.
      </div>
    );
  }

  const padding = { top: 25, right: 40, bottom: 45, left: 50 };
  const width = 640;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxVal = budgetLimit;
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
  const warningEpsilon = budgetLimit * 0.9;
  const warningY = getY(warningEpsilon);
  const ceilingY = getY(budgetLimit);

  return (
    <div className="w-full flex flex-col gap-3 relative">
      {/* Legend & Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          {countries.map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COUNTRY_COLORS[c] }} />
              <span className="text-slate-700 dark:text-slate-300 font-medium">{COUNTRY_FLAGS[c]}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-3 h-0.5 bg-rose-500" />
          <span className="text-rose-600 dark:text-rose-400 font-bold">Hard Limit: ε = {budgetLimit.toFixed(1)}</span>
        </div>
      </div>

      {/* Hover Tooltip Card */}
      {hoveredPoint && (
        <div className="absolute top-10 right-4 z-20 bg-slate-900/95 text-white border border-slate-700 rounded-lg p-3 shadow-xl text-xs font-mono space-y-1.5 backdrop-blur-sm pointer-events-none">
          <div className="font-bold text-teal-400 border-b border-slate-700 pb-1 flex justify-between gap-4">
            <span>{hoveredPoint.point.roundLabel}</span>
            <span>Avg ε = {hoveredPoint.point.averageCumulative.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1">
            {countries.map((c) => (
              <div key={c} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COUNTRY_COLORS[c] }} />
                  <span>{c}:</span>
                </span>
                <span className="font-bold">{hoveredPoint.point[c].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ maxHeight: height }}
      >
        {/* Warning zone rect */}
        <rect
          x={padding.left}
          y={ceilingY}
          width={plotWidth}
          height={warningY - ceilingY}
          fill="rgba(244, 63, 94, 0.08)"
        />

        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10].map((eps) => {
          const y = getY(eps);
          return (
            <g key={eps}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-[#1e3a5f]"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500"
                fontSize="10"
                fontFamily="monospace"
              >
                ε={eps}
              </text>
            </g>
          );
        })}

        {/* Hard ceiling line */}
        <line
          x1={padding.left}
          y1={ceilingY}
          x2={width - padding.right}
          y2={ceilingY}
          stroke="#f43f5e"
          strokeDasharray="4 2"
          strokeWidth="1.5"
        />

        {/* Hover Crosshair vertical bar */}
        {hoveredPoint && (
          <line
            x1={getX(hoveredPoint.index)}
            y1={padding.top}
            x2={getX(hoveredPoint.index)}
            y2={height - padding.bottom}
            stroke="#14b8a6"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}

        {/* Plot curves for each nation */}
        {countries.map((country) => {
          const points = data.map((d, i) => `${getX(i)},${getY(d[country])}`).join(' ');
          const color = COUNTRY_COLORS[country];

          return (
            <g key={country}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(d[country])}
                  r={hoveredPoint?.index === i ? 5 : 3.5}
                  fill={color}
                  stroke="#0f1f38"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ point: d, index: i })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - 12}
            textAnchor="middle"
            className={`fill-slate-500 dark:fill-slate-400 text-[10px] font-mono cursor-pointer ${hoveredPoint?.index === i ? 'font-bold fill-teal-500' : ''}`}
            onMouseEnter={() => setHoveredPoint({ point: d, index: i })}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {d.roundLabel}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default PrivacyBudgetChart;
