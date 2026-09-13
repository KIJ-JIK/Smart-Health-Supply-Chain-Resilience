import React from 'react';

interface ProgressBarProps {
  value: number;       // 0–100
  max?: number;        // defaults to 100
  colorClass?: string; // e.g. 'bg-emerald-500'
  trackClass?: string;
  height?: 'xs' | 'sm' | 'md';
  animated?: boolean;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  colorClass,
  trackClass,
  height = 'sm',
  animated = true,
  showLabel = false,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  // Auto color based on percentage
  const autoColor =
    pct >= 85
      ? 'bg-rose-500'
      : pct >= 60
      ? 'bg-amber-500'
      : 'bg-primary-500';

  const fillColor = colorClass || autoColor;

  const heightClass = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
  }[height];

  return (
    <div className="w-full">
      <div
        className={`w-full rounded-full overflow-hidden ${heightClass} ${
          trackClass || 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <div
          className={`${heightClass} rounded-full ${fillColor} ${
            animated ? 'transition-all duration-700 ease-out' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};
