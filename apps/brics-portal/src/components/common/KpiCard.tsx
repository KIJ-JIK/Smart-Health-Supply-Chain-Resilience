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
    <div className="bg-white dark:bg-[#0f1f38] border border-slate-200 dark:border-[#1e3a5f] rounded-lg shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-[#2e5584] transition-colors group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-[#152b4d] text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-[#1e3a5f] shrink-0">
            {icon}
          </div>
        )}
        {statusBadge && !icon && (
          <StatusBadge status={statusBadge} tone={statusTone} size="sm" />
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
          {value}
        </span>
        {statusBadge && icon && (
          <StatusBadge status={statusBadge} tone={statusTone} size="sm" />
        )}
      </div>

      {(subtitle || trendText) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#1e3a5f]/60 flex items-center gap-2 flex-wrap text-xs">
          {trendText && (
            <span
              className={`font-semibold font-mono ${
                statusTone === 'green'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : statusTone === 'amber'
                  ? 'text-amber-600 dark:text-amber-400'
                  : statusTone === 'red'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trendText}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
