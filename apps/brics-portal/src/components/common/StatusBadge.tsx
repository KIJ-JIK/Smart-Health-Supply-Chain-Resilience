import React from 'react';

export type StatusTone = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'teal';

export interface StatusBadgeProps {
  tone?: StatusTone;
  status?: string;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export function resolveStatusTone(status?: string): StatusTone {
  if (!status) return 'gray';
  const s = status.toLowerCase();

  if (
    [
      'healthy',
      'participating',
      'completed',
      'approved',
      'active',
      'submitted',
      'online',
      'valid',
      'verified',
    ].includes(s)
  ) {
    return 'green';
  }

  if (
    [
      'degraded',
      'paused',
      'collecting_updates',
      'aggregating',
      'awaiting_review',
      'in_progress',
      'announced',
      'pending',
      'warning',
    ].includes(s)
  ) {
    return 'amber';
  }

  if (['failed', 'excluded', 'rejected', 'voided', 'deprecated', 'error'].includes(s)) {
    return 'red';
  }

  return 'gray';
}

function formatStatusLabel(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone,
  status,
  label,
  pulse = false,
  size = 'md',
}) => {
  const resolvedTone = tone || resolveStatusTone(status);
  const displayLabel = label || (status ? formatStatusLabel(status) : resolvedTone);

  const toneClasses: Record<StatusTone, { badge: string; dot: string }> = {
    green: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
      dot: 'bg-emerald-600 dark:bg-emerald-400',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    red: {
      badge: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
      dot: 'bg-rose-600 dark:bg-rose-400',
    },
    blue: {
      badge: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800',
      dot: 'bg-blue-600 dark:bg-blue-400',
    },
    teal: {
      badge: 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-800',
      dot: 'bg-teal-600 dark:bg-teal-400',
    },
    gray: {
      badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400',
    },
  };

  const style = toneClasses[resolvedTone] || toneClasses.gray;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-wide border rounded uppercase ${
        isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      } ${style.badge}`}
    >
      <span
        className={`rounded-full shrink-0 ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${style.dot} ${
          pulse ? 'animate-pulse' : ''
        }`}
      />
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
