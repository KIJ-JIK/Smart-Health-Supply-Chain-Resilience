import React from 'react';
import { StatusBadge, StatusTone } from './StatusBadge';

export interface KpiCardProps {
  /** Metric or card headline title */
  title: string;
  /** Primary metric value (formatted string or number) */
  value: string | number;
  /** Optional secondary subtitle or description */
  subtitle?: React.ReactNode;
  /** Optional trend or context text */
  trendText?: string;
  /** Tone for the trend or status */
  statusTone?: StatusTone;
  /** Status string to show a badge on the card */
  statusBadge?: string;
  /** Optional icon or symbol displayed top-right */
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trendText,
  statusTone = 'green',
  statusBadge,
  icon,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between group">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 text-teal-400 flex items-center justify-center border border-slate-700/50 group-hover:scale-105 transition-transform">
            {icon}
          </div>
        )}
        {statusBadge && !icon && (
          <StatusBadge status={statusBadge} tone={statusTone} size="sm" />
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">
          {value}
        </span>
        {statusBadge && icon && (
          <StatusBadge status={statusBadge} tone={statusTone} size="sm" />
        )}
      </div>

      {(subtitle || trendText) && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/60 text-xs">
          {trendText && (
            <span
              className={`font-semibold font-mono ${
                statusTone === 'green'
                  ? 'text-emerald-400'
                  : statusTone === 'amber'
                  ? 'text-amber-400'
                  : statusTone === 'red'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {trendText}
            </span>
          )}
          {subtitle && <span className="text-slate-400 text-[11px]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
