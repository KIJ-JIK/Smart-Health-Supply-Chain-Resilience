import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'subtle' | 'solid' | 'outline';
  size?: 'sm' | 'md';
}

// Map status → semantic color group
const getColorGroup = (s: string): 'green' | 'amber' | 'red' | 'blue' | 'gray' => {
  const n = s.toUpperCase().replace(/-/g, '_');
  if (['NORMAL', 'ACTIVE', 'OPERATIONAL', 'SYNCED', 'DELIVERED', 'FULL', 'LIVE_OPERATIONAL', 'LIVE OPERATIONAL', 'PRESENT', 'APPROVED'].includes(n)) return 'green';
  if (['WARNING', 'NEAR_EXPIRY', 'PARTIAL', 'PENDING', 'IN_TRANSIT', 'SHORTAGE', 'LEAVE'].includes(n)) return 'amber';
  if (['CRITICAL', 'EXPIRED', 'CONFLICT', 'FAILED', 'BROKEN', 'REJECTED', 'ABSENT', 'OFFLINE'].includes(n)) return 'red';
  if (['DISPATCHED', 'IN_FLIGHT', 'INFO', 'SYNCING'].includes(n)) return 'blue';
  return 'gray';
};

const colorMap = {
  green: {
    subtle: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    solid:  'bg-emerald-600 text-white border-emerald-600',
    dot:    'bg-emerald-500',
    pulse:  false,
  },
  amber: {
    subtle: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    solid:  'bg-amber-500 text-white border-amber-500',
    dot:    'bg-amber-500',
    pulse:  true,
  },
  red: {
    subtle: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    solid:  'bg-rose-600 text-white border-rose-600',
    dot:    'bg-rose-500',
    pulse:  true,
  },
  blue: {
    subtle: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    solid:  'bg-sky-600 text-white border-sky-600',
    dot:    'bg-sky-500',
    pulse:  false,
  },
  gray: {
    subtle: 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    solid:  'bg-slate-600 text-white border-slate-600',
    dot:    'bg-slate-400',
    pulse:  false,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'subtle',
  size = 'md',
}) => {
  const group = getColorGroup(status);
  const c = colorMap[group];
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[10px]';

  const colorClass = c[variant as 'subtle' | 'solid'] ?? c.subtle;

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-md border
      font-bold uppercase tracking-wider whitespace-nowrap
      ${sizeClass} ${colorClass}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
