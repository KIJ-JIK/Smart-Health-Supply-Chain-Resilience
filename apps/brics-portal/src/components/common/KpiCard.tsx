import React from 'react';
import { colors, typography } from '@/styles/theme';
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
  statusTone,
  statusBadge,
  icon,
}) => {
  return (
    <div
      style={{
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.bg.border}`,
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 200,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        {icon && (
          <span style={{ color: colors.text.muted, display: 'flex' }}>
            {icon}
          </span>
        )}
        {statusBadge && (
          <StatusBadge status={statusBadge} tone={statusTone} size="sm" />
        )}
      </div>

      <div
        style={{
          ...typography.kpi,
          color: colors.text.primary,
          marginTop: 2,
        }}
      >
        {value}
      </div>

      {(subtitle || trendText) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
          }}
        >
          {trendText && (
            <span
              style={{
                ...typography.bodySmall,
                color: statusTone
                  ? colors.status[statusTone].text
                  : colors.text.secondary,
                fontWeight: 600,
              }}
            >
              {trendText}
            </span>
          )}
          {subtitle && (
            <span
              style={{
                ...typography.bodySmall,
                color: colors.text.muted,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
