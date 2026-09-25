import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export interface MetricDeltaProps {
  label: string;
  currentValue: number;
  previousValue?: number;
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

  const isImproved = lowerIsBetter ? delta < -0.00001 : delta > 0.00001;
  const isRegressed = lowerIsBetter ? delta > 0.00001 : delta < -0.00001;

  const toneColor = isImproved
    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
    : isRegressed
    ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0a1628] border-slate-200 dark:border-[#1e3a5f]';

  return (
    <div className="p-4 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] space-y-2">
      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider block font-mono">
        {label}
      </span>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
          {currentValue.toFixed(formatDecimals)}
        </span>
        {unit && <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{unit}</span>}
      </div>

      {hasDiff ? (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono font-bold ${toneColor}`}>
          {isImproved ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : isRegressed ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          <span>
            {delta > 0 ? '+' : ''}
            {delta.toFixed(formatDecimals)} ({percentDelta > 0 ? '+' : ''}
            {percentDelta.toFixed(1)}%)
          </span>
        </div>
      ) : (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono italic">Baseline Model</span>
      )}
    </div>
  );
};

export default MetricDelta;
