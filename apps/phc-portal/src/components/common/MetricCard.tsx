import React, { useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  alert?: boolean;
  alertText?: string;
  onClick?: () => void;
  progress?: number;       // 0–100 for bar fill
  progressMax?: number;
  trend?: React.ReactNode;
  animateValue?: boolean;
  accentColor?: string;    // custom icon accent class e.g. 'text-sky-400'
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  alert,
  alertText,
  onClick,
  progress,
  progressMax = 100,
  trend,
  animateValue = true,
  accentColor,
}) => {
  const numericValue = typeof value === 'number' ? value : NaN;
  const isNumeric = !isNaN(numericValue);
  const animatedNum = useCountUp(isNumeric && animateValue ? numericValue : 0, 900);
  const displayValue = isNumeric && animateValue ? animatedNum : value;

  const pct = progress !== undefined
    ? Math.min(100, Math.max(0, (progress / progressMax) * 100))
    : undefined;

  const barColor =
    pct !== undefined
      ? pct >= 85 ? '#f43f5e'
        : pct >= 65 ? '#f59e0b'
        : '#0d9488'
      : '#0d9488';

  const iconAccent = alert ? 'text-rose-400' : (accentColor || 'text-primary-400');
  const iconBg     = alert ? 'bg-rose-500/10 dark:bg-rose-500/10' : 'bg-primary-500/10 dark:bg-primary-500/10';

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl border transition-all duration-200 group overflow-hidden
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0' : ''}
        ${alert
          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.3)]'
          : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#1e2d3d] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] glow-border'
        }
      `}
    >
      {/* Subtle shimmer on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent" />

      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-none tabular-nums">
              {displayValue}
            </h3>
            {badge}
            {trend}
          </div>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500 line-clamp-1">
              {subtitle}
            </p>
          )}

          {/* Animated progress bar */}
          {pct !== undefined && (
            <div className="mt-3">
              <div className="w-full h-1 bg-slate-200 dark:bg-[#1e2d3d] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar-fill transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`shrink-0 p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconAccent}`} />
        </div>
      </div>

      {/* Alert footer */}
      {alert && alertText && (
        <div className="mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-900/60 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block shrink-0" />
          {alertText}
        </div>
      )}
    </div>
  );
};
