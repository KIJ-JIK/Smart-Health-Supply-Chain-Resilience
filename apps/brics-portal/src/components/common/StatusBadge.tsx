import React from 'react';
import { colors } from '@/styles/theme';

export type StatusTone = 'green' | 'amber' | 'red' | 'gray';

export interface StatusBadgeProps {
  /** Explicit tone or infer from status string */
  tone?: StatusTone;
  /** Status string to resolve automatically if tone is omitted */
  status?: string;
  /** Custom display text (defaults to capitalized status/tone) */
  label?: string;
  /** Whether to show a pulse animation dot */
  pulse?: boolean;
  /** Compact sizing option */
  size?: 'sm' | 'md';
}

/**
 * Maps status strings used across the BRICS Federation data layers to tones:
 * - green: healthy, participating, completed, approved, active, submitted
 * - amber: degraded, paused, collecting_updates, aggregating, awaiting_review, in_progress, announced
 * - red: failed, excluded, rejected, voided, deprecated
 * - gray: opted-out, inactive, unknown
 */
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
  const palette = colors.status[resolvedTone];
  const displayLabel = label || (status ? formatStatusLabel(status) : resolvedTone);

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 5 : 6,
        padding: isSmall ? '2px 8px' : '3px 10px',
        borderRadius: 9999,
        fontSize: isSmall ? '0.6875rem' : '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? 6 : 7,
          height: isSmall ? 6 : 7,
          borderRadius: '50%',
          backgroundColor: palette.dot,
          flexShrink: 0,
        }}
      />
      <span>{displayLabel}</span>
    </span>
  );
};
