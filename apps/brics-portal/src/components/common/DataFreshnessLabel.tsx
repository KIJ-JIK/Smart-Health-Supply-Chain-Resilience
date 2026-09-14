'use client';

import React, { useEffect, useState } from 'react';
import { colors, typography } from '@/styles/theme';

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
    return { text: '1 minute ago', minutesAgo: 1 };
  }

  if (minutesAgo < 60) {
    return { text: `${minutesAgo} minutes ago`, minutesAgo };
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo === 1) {
    return { text: '1 hour ago', minutesAgo };
  }
  if (hoursAgo < 24) {
    return { text: `${hoursAgo} hours ago`, minutesAgo };
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) {
    return { text: '1 day ago', minutesAgo };
  }
  return { text: `${daysAgo} days ago`, minutesAgo };
}

/**
 * DataFreshnessLabel
 *
 * Enforces Masterplan §59 requirement:
 * "Renders 'Last updated: X minutes ago' rather than a bare timestamp...
 * since node connectivity across five countries can never be assumed instantaneous."
 */
export const DataFreshnessLabel: React.FC<DataFreshnessLabelProps> = ({
  timestamp,
  prefix = 'Last updated',
  fallbackText = 'No data recorded',
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
      <span
        style={{
          ...typography.bodySmall,
          color: colors.text.muted,
          fontStyle: 'italic',
        }}
      >
        {fallbackText}
      </span>
    );
  }

  const { text, minutesAgo } = formatTimeAgo(timestamp, nowMs);
  const isStale = staleThresholdMinutes > 0 && minutesAgo >= staleThresholdMinutes;

  return (
    <span
      title={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()}
      style={{
        ...typography.bodySmall,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: isStale ? colors.status.amber.text : colors.text.secondary,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isStale ? colors.status.amber.dot : colors.status.green.dot,
          flexShrink: 0,
        }}
      />
      <span>
        {prefix}: {text}
      </span>
    </span>
  );
};
