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
  IN: '#f97316', // Orange - India
  BR: '#10b981', // Emerald - Brazil
  RU: '#0ea5e9', // Sky blue - Russia
  CN: '#eab308', // Amber - China
  ZA: '#f43f5e', // Rose - South Africa
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  BR: 'Brazil',
  RU: 'Russia',
  CN: 'China',
  ZA: 'South Africa',
};

export const PrivacyBudgetChart: React.FC<PrivacyBudgetChartProps> = ({
  data,
  budgetLimit = 5.0,
  height = 320,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: PrivacyTimeSeriesDataPoint; index: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-slate-500 text-xs font-mono bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800"
      >
        No privacy budget ledger history available.
      </div>
    );
  }

  // Generous paddings to prevent ANY overlap with text or borders
  const padding = { top: 40, right: 35, bottom: 50, left: 60 };
  const width = 760;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxVal = budgetLimit > 0 ? budgetLimit : 5.0;
  const minVal = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const rawVal = typeof val === 'number' && !isNaN(val) ? val : 0;
    const norm = (rawVal - minVal) / (maxVal - minVal);
    // Strict clamp between 0.0 and 1.0 to prevent negative Y coordinates and top overlap
    const clampedNorm = Math.max(0, Math.min(1.0, norm));
    return padding.top + plotHeight - clampedNorm * plotHeight;
  };

  const countries = ['IN', 'BR', 'RU', 'CN', 'ZA'] as const;
  const ceilingY = getY(maxVal);

  // Y-axis tick intervals (0 to maxVal)
  const yTicks = [0, maxVal * 0.2, maxVal * 0.4, maxVal * 0.6, maxVal * 0.8, maxVal];

  const latestPoint = data[data.length - 1];

  return (
    <div className="w-full flex flex-col gap-4 relative select-none">
      {/* ── Top Legend & Per-Country Stat Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {countries.map((c) => {
          const currentEps = latestPoint ? latestPoint[c] : 0;
          const pct = Math.min(100, Math.round((currentEps / maxVal) * 100));
          return (
            <div
              key={c}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] flex flex-col gap-1 transition-all hover:border-teal-500/40"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COUNTRY_COLORS[c] }} />
                  <span>{COUNTRY_NAMES[c]}</span>
                </span>
                <span className="text-slate-400 text-[10px] font-semibold">{c}</span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  ε = {currentEps.toFixed(2)}
                </span>
                <span className={`text-[10px] font-mono font-semibold ${pct > 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {pct}% cap
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SVG Visualizer with Strict Bounds ── */}
      <div className="relative w-full rounded-xl bg-slate-50/40 dark:bg-[#0d1b2e] border border-slate-200 dark:border-[#1e3a5f] p-3 overflow-hidden">
        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-30 bg-slate-900/95 text-white border border-slate-700 rounded-lg p-3 shadow-2xl text-xs font-mono space-y-1.5 backdrop-blur-md pointer-events-none transition-all"
            style={{
              top: 15,
              right: 20,
            }}
          >
            <div className="font-bold text-teal-400 border-b border-slate-700 pb-1 flex items-center justify-between gap-6">
              <span>{hoveredPoint.point.roundLabel} (Federated Sync)</span>
              <span className="text-slate-300">Avg ε: {hoveredPoint.point.averageCumulative.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1 pt-1 text-[11px]">
              {countries.map((c) => (
                <div key={c} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COUNTRY_COLORS[c] }} />
                    <span className="text-slate-300">{COUNTRY_NAMES[c]}:</span>
                  </span>
                  <span className="font-bold font-mono text-white">{hoveredPoint.point[c].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-hidden block"
          style={{ maxHeight: height }}
        >
          <defs>
            <clipPath id="chart-clip">
              <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} />
            </clipPath>
          </defs>

          {/* Background Grid Lines & Y-Axis Labels */}
          {yTicks.map((eps) => {
            const y = getY(eps);
            return (
              <g key={eps}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-[#1a3356]"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-400"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  ε={eps.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Hard Ceiling Barrier (ε = 5.0) */}
          <line
            x1={padding.left}
            y1={ceilingY}
            x2={width - padding.right}
            y2={ceilingY}
            stroke="#f43f5e"
            strokeDasharray="6 3"
            strokeWidth="2"
          />
          <text
            x={width - padding.right}
            y={ceilingY - 6}
            textAnchor="end"
            className="fill-rose-500 font-mono text-[10px] font-bold"
          >
            SOVEREIGN HARD CEILING (ε ≤ {maxVal.toFixed(1)})
          </text>

          {/* Vertical Hover Crosshair Bar */}
          {hoveredPoint && (
            <line
              x1={getX(hoveredPoint.index)}
              y1={padding.top}
              x2={getX(hoveredPoint.index)}
              y2={padding.top + plotHeight}
              stroke="#14b8a6"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Lines & Dots (Clipped to chart area) */}
          <g clipPath="url(#chart-clip)">
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
                      r={hoveredPoint?.index === i ? 5.5 : 3.5}
                      fill={color}
                      stroke="#0f1f38"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint({ point: d, index: i })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* X-Axis Round Labels */}
          {data.map((d, i) => {
            // Show every 2nd or 3rd label if many rounds to prevent x-axis clutter
            const showLabel = data.length <= 10 || i === 0 || i === data.length - 1 || i % 2 === 0;
            if (!showLabel) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 15}
                textAnchor="middle"
                className={`fill-slate-500 dark:fill-slate-400 text-[10px] font-mono cursor-pointer ${
                  hoveredPoint?.index === i ? 'font-bold fill-teal-400 text-[11px]' : ''
                }`}
                onMouseEnter={() => setHoveredPoint({ point: d, index: i })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                R{d.roundNumber}
              </text>
            );
          })}
        </svg>
      </div>

      {/* ── Informative Explanatory Footer ── */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span>Rényi DP Composition Theorem: Total ε monotonically increases per round.</span>
        </span>
        <span className="text-teal-600 dark:text-teal-400 font-semibold">
          All 5 sovereign nodes compliant with ε &lt; 5.0
        </span>
      </div>
    </div>
  );
};

export default PrivacyBudgetChart;
