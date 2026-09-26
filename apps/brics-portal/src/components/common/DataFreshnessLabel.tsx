import React, { useEffect, useState } from 'react';

export interface DataFreshnessLabelProps {
  /** ISO timestamp string or Date object */
  timestamp: string | Date | null | undefined;
  /** Optional custom prefix (defaults to 'Last updated') */
  prefix?: string;
  /** Fallback text when timestamp is missing or null */
  fallbackText?: string;
  /** Periodic update interval in milliseconds (defaults to 30000 = 30s) */
  refreshIntervalMs?: number;
  /** Optional warning threshold in minutes to alert operator about stale data */
  staleThresholdMinutes?: number;
}

export function formatTimeAgo(dateInput: string | Date, nowMs: number = Date.now()): {
  text: string;
  minutesAgo: number;
} {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const timeMs = d.getTime();

  if (isNaN(timeMs)) {
    return { text: 'unknown', minutesAgo: 0 };
  }

  const diffSeconds = Math.max(0, Math.floor((nowMs - timeMs) / 1000));
  const minutesAgo = Math.floor(diffSeconds / 60);

  if (diffSeconds < 60) {
    return { text: 'just now', minutesAgo: 0 };
  }

  if (minutesAgo === 1) {
    return { text: '1m ago', minutesAgo: 1 };
  }

  if (minutesAgo < 60) {
    return { text: `${minutesAgo}m ago`, minutesAgo };
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo === 1) {
    return { text: '1h ago', minutesAgo };
  }
  if (hoursAgo < 24) {
    return { text: `${hoursAgo}h ago`, minutesAgo };
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) {
    return { text: '1d ago', minutesAgo };
  }
  return { text: `${daysAgo}d ago`, minutesAgo };
}

export const DataFreshnessLabel: React.FC<DataFreshnessLabelProps> = ({
  timestamp,
  prefix = '',
  fallbackText = 'No data',
  refreshIntervalMs = 30000,
  staleThresholdMinutes = 120,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!timestamp) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [timestamp, refreshIntervalMs]);

  if (!timestamp) {
    return (
      <span className="text-slate-500 font-mono text-[11px] italic">
        {fallbackText}
      </span>
    );
  }

  const { text, minutesAgo } = formatTimeAgo(timestamp, nowMs);
  const isStale = staleThresholdMinutes > 0 && minutesAgo >= staleThresholdMinutes;

  return (
    <span
      className={`font-mono text-[11px] flex items-center gap-1 font-semibold ${
        isStale ? 'text-amber-400' : 'text-slate-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isStale ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
      />
      {prefix && <span>{prefix} </span>}
      <span>{text}</span>
    </span>
  );
};

export default DataFreshnessLabel;
