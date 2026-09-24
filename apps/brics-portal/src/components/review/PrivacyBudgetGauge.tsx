import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export interface PrivacyBudgetGaugeProps {
  /** Cumulative epsilon consumed so far */
  consumedEpsilon: number;
  /** Total maximum allowed budget limit */
  budgetLimit?: number;
  /** Epsilon consumed in this current round */
  thisRoundEpsilon?: number;
  /** Height in pixels */
  height?: number;
}

export const PrivacyBudgetGauge: React.FC<PrivacyBudgetGaugeProps> = ({
  consumedEpsilon,
  budgetLimit = 10.0,
  thisRoundEpsilon = 0,
  height = 14,
}) => {
  const percentUsed = Math.min(100, Math.max(0, (consumedEpsilon / budgetLimit) * 100));
  const remainingPercent = Math.max(0, 100 - percentUsed);
  const remainingEpsilon = Math.max(0, budgetLimit - consumedEpsilon);

  const isCritical = remainingPercent <= 15;
  const isWarning = remainingPercent <= 30 && !isCritical;

  const barColor = isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-teal-400';
  const textColor = isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-teal-300';

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Top Header */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          {isCritical ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          ) : isWarning ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          )}
          Sovereign DP Privacy Budget Remaining
        </span>
        <div className="flex items-baseline gap-2 font-mono">
          <span className={`text-base font-black ${textColor}`}>
            {remainingPercent.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400">
            ({remainingEpsilon.toFixed(2)} / {budgetLimit.toFixed(1)} ε remaining)
          </span>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div
        className="w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5"
        style={{ height }}
        role="progressbar"
        aria-valuenow={remainingPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${remainingPercent}%` }}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Consumed (Total): ε = {consumedEpsilon.toFixed(2)}</span>
        {thisRoundEpsilon > 0 && (
          <span className="text-teal-400 font-semibold">
            +ε = {thisRoundEpsilon.toFixed(2)} in this round
          </span>
        )}
      </div>
    </div>
  );
};

export default PrivacyBudgetGauge;
