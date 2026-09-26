import React from 'react';

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
  line1Color = '#f43f5e', // rose-500
  line2Color = '#2dd4bf', // teal-400
  height = 240,
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-slate-500 text-xs font-mono"
      >
        No training history available
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 600;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minVal1 = 0;
  const maxVal1 = Math.max(0.4, ...data.map((d) => d.value1 * 1.15));

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
    <div className="w-full flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center gap-4 justify-end text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: line1Color }} />
          <span className="text-slate-400">{line1Label}</span>
        </div>
        {hasLine2 && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: line2Color }} />
            <span className="text-slate-400">{line2Label}</span>
          </div>
        )}
      </div>

      {/* SVG Plot */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="gradientLine1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={line1Color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={line1Color} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradientLine2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={line2Color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={line2Color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + plotHeight * ratio;
          return (
            <line
              key={idx}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#1e293b"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Line 1 (Loss) */}
        <polyline
          fill="none"
          stroke={line1Color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points1}
        />

        {/* Line 2 (Accuracy) */}
        {hasLine2 && (
          <polyline
            fill="none"
            stroke={line2Color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points2}
          />
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY1(d.value1)}
              r="3.5"
              fill={line1Color}
              stroke="#0a0f1a"
              strokeWidth="2"
            />
            {d.value2 !== undefined && (
              <circle
                cx={getX(i)}
                cy={getY2(d.value2)}
                r="3.5"
                fill={line2Color}
                stroke="#0a0f1a"
                strokeWidth="2"
              />
            )}
            {/* X-axis labels */}
            <text
              x={getX(i)}
              y={height - 12}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default SimpleLineChart;
