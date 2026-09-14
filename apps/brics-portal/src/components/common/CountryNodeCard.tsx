'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';
import { StatusBadge } from './StatusBadge';
import { DataFreshnessLabel } from './DataFreshnessLabel';
import type { NodeParticipationStatus } from '@/types/federated';

export interface CountryNodeCardProps {
  /** Country code (ISO 2-letter: IN, BR, RU, CN, ZA) */
  countryCode: string;
  /** Full country name */
  countryName: string;
  /** Node participation status: participating | paused | excluded */
  status: NodeParticipationStatus;
  /** ISO timestamp of last successful local training */
  lastLocalTraining?: string | null;
  /** ISO timestamp of last successful model upload */
  lastModelUpload?: string | null;
  /** Single line health indicator or status note */
  healthIndicator?: string;
  /** Participation indicator for the last federated round */
  lastRoundParticipation?: boolean | string;
  /** Optional click handler for navigating to node detail view */
  onClick?: () => void;
  /** Compact card variation */
  compact?: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

export const CountryNodeCard: React.FC<CountryNodeCardProps> = ({
  countryCode,
  countryName,
  status,
  lastLocalTraining,
  lastModelUpload,
  healthIndicator,
  lastRoundParticipation,
  onClick,
  compact = false,
}) => {
  const flag = COUNTRY_FLAGS[countryCode.toUpperCase()] || '';

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.bg.border}`,
        borderRadius: 8,
        padding: compact ? '14px 16px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.brand.primary;
          e.currentTarget.style.backgroundColor = colors.bg.surfaceHover;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.bg.border;
          e.currentTarget.style.backgroundColor = colors.bg.surface;
        }
      }}
    >
      {/* Header: Flag, Name, Code, and Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {flag && <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{flag}</span>}
          <div>
            <div
              style={{
                ...typography.titleMedium,
                color: colors.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{countryName}</span>
              <span
                style={{
                  ...typography.bodySmall,
                  color: colors.text.muted,
                  fontWeight: 500,
                }}
              >
                ({countryCode})
              </span>
            </div>
            {healthIndicator && (
              <div
                style={{
                  ...typography.bodySmall,
                  color:
                    status === 'participating'
                      ? colors.status.green.text
                      : colors.status.amber.text,
                  marginTop: 2,
                }}
              >
                {healthIndicator}
              </div>
            )}
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {/* Metrics & Activity Details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderTop: `1px solid ${colors.bg.borderSubtle}`,
          paddingTop: 12,
        }}
      >
        {lastRoundParticipation !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              ...typography.bodySmall,
            }}
          >
            <span style={{ color: colors.text.muted }}>Last Round:</span>
            <span>
              {typeof lastRoundParticipation === 'boolean' ? (
                <StatusBadge
                  status={lastRoundParticipation ? 'submitted' : 'missed'}
                  label={lastRoundParticipation ? 'Submitted' : 'Missed Quorum'}
                  size="sm"
                />
              ) : (
                <span style={{ color: colors.text.primary, fontWeight: 500 }}>
                  {lastRoundParticipation}
                </span>
              )}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...typography.bodySmall,
          }}
        >
          <span style={{ color: colors.text.muted }}>Training Freshness:</span>
          <DataFreshnessLabel
            timestamp={lastLocalTraining}
            prefix="Trained"
            fallbackText="No training recorded"
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...typography.bodySmall,
          }}
        >
          <span style={{ color: colors.text.muted }}>Upload Freshness:</span>
          <DataFreshnessLabel
            timestamp={lastModelUpload}
            prefix="Uploaded"
            fallbackText="No upload recorded"
          />
        </div>
      </div>
    </div>
  );
};
