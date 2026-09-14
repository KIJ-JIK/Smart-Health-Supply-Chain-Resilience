'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import type { FederatedRound } from '@/types/federated';

export interface RoundDetailDrawerProps {
  round: FederatedRound | null;
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  BR: 'Brazil',
  RU: 'Russia',
  CN: 'China',
  ZA: 'South Africa',
};

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

export const RoundDetailDrawer: React.FC<RoundDetailDrawerProps> = ({
  round,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !round) return null;

  const allCountries = round.participatingCountries || ['IN', 'BR', 'RU', 'CN', 'ZA'];
  const submittedSet = new Set(round.submittedCountries || []);

  const getNodeStatus = (countryCode: string): 'submitted' | 'pending' | 'failed' => {
    if (submittedSet.has(countryCode)) {
      return 'submitted';
    }
    // If the round is finished (approved/rejected/completed) and not submitted -> failed
    if (['approved', 'rejected', 'completed', 'voided'].includes(round.status)) {
      return 'failed';
    }
    // If round is still collecting/aggregating -> pending
    return 'pending';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          height: '100%',
          backgroundColor: colors.bg.surface,
          borderLeft: `1px solid ${colors.bg.border}`,
          padding: 28,
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.bg.borderSubtle}`,
            paddingBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ ...typography.titleMedium, color: colors.text.primary, margin: 0 }}>
                {round.roundId}
              </h3>
              <StatusBadge status={round.status} size="sm" />
            </div>
            <div style={{ ...typography.bodySmall, color: colors.text.muted, marginTop: 4 }}>
              Target Model: <strong>{round.modelVersion}</strong> | Quorum Required: {round.quorumRequired}/5
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.muted,
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Round Parameters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            backgroundColor: colors.bg.surfaceHover,
            padding: 14,
            borderRadius: 6,
            border: `1px solid ${colors.bg.borderSubtle}`,
          }}
        >
          <div>
            <div style={{ ...typography.bodySmall, color: colors.text.muted }}>Started At</div>
            <div style={{ ...typography.bodySmall, color: colors.text.primary, marginTop: 2 }}>
              <DataFreshnessLabel timestamp={round.startedAt} prefix="Started" />
            </div>
          </div>

          <div>
            <div style={{ ...typography.bodySmall, color: colors.text.muted }}>Round Deadline</div>
            <div style={{ ...typography.bodySmall, color: colors.text.primary, marginTop: 2 }}>
              {round.roundDeadline ? new Date(round.roundDeadline).toLocaleTimeString() : 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ ...typography.bodySmall, color: colors.text.muted }}>Completed At</div>
            <div style={{ ...typography.bodySmall, color: colors.text.primary, marginTop: 2 }}>
              {round.completedAt ? (
                <DataFreshnessLabel timestamp={round.completedAt} prefix="Completed" />
              ) : (
                'In Flight'
              )}
            </div>
          </div>

          <div>
            <div style={{ ...typography.bodySmall, color: colors.text.muted }}>Quorum Progress</div>
            <div
              style={{
                ...typography.bodySmall,
                fontWeight: 600,
                color:
                  round.submittedCountries.length >= round.quorumRequired
                    ? colors.status.green.text
                    : colors.status.amber.text,
                marginTop: 2,
              }}
            >
              {round.submittedCountries.length} of {round.quorumRequired} submitted
            </div>
          </div>
        </div>

        {/* Cryptographic Hash Verification Notice */}
        {round.aggregationSignature && (
          <div
            style={{
              backgroundColor: colors.bg.surfaceHover,
              padding: 12,
              borderRadius: 6,
              border: `1px solid ${colors.bg.borderSubtle}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
              Aggregation Signature (SHA-256):
            </span>
            <span
              style={{
                ...typography.mono,
                color: colors.status.green.text,
                fontSize: '0.75rem',
                wordBreak: 'break-all',
              }}
            >
              {round.aggregationSignature}
            </span>
          </div>
        )}

        {/* Per-Node Contribution Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ ...typography.body, fontWeight: 600, color: colors.text.primary, margin: 0 }}>
              Per-Node Contribution Status
            </h4>
            <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
              {round.submittedCountries.length}/5 Submitted
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allCountries.map((countryCode) => {
              const nodeStatus = getNodeStatus(countryCode);
              const flag = COUNTRY_FLAGS[countryCode] || '';
              const name = COUNTRY_NAMES[countryCode] || countryCode;

              return (
                <div
                  key={countryCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 6,
                    backgroundColor: colors.bg.surfaceHover,
                    border: `1px solid ${colors.bg.borderSubtle}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {flag && <span style={{ fontSize: '1.25rem' }}>{flag}</span>}
                    <div>
                      <div style={{ ...typography.bodySmall, fontWeight: 600, color: colors.text.primary }}>
                        {name} ({countryCode})
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                        {nodeStatus === 'submitted' && 'Encrypted weight update received'}
                        {nodeStatus === 'pending' && 'Awaiting local gradient submission'}
                        {nodeStatus === 'failed' && 'Missed submission deadline'}
                      </div>
                    </div>
                  </div>

                  <StatusBadge
                    status={nodeStatus}
                    label={
                      nodeStatus === 'submitted'
                        ? 'Submitted'
                        : nodeStatus === 'pending'
                        ? 'Pending'
                        : 'Failed'
                    }
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Awaiting Review Action Banner */}
        {round.status === 'awaiting_review' && (
          <div
            style={{
              padding: 14,
              borderRadius: 6,
              backgroundColor: colors.status.amber.bg,
              border: `1px solid ${colors.status.amber.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ ...typography.bodySmall, fontWeight: 600, color: colors.status.amber.text }}>
              Human-in-the-Loop Review Required
            </div>
            <p style={{ ...typography.bodySmall, color: colors.text.secondary, margin: 0 }}>
              Aggregation is complete. An authorized national admin must review accuracy deltas and
              differential privacy consumption before publication.
            </p>
            <a
              href={`/rounds/review?roundId=${round.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 14px',
                borderRadius: 6,
                backgroundColor: colors.brand.primary,
                color: '#ffffff',
                ...typography.bodySmall,
                textDecoration: 'none',
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              Open Aggregation Review Screen
            </a>
          </div>
        )}

        {/* DP-SGD Privacy Boundary Notice */}
        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            borderRadius: 6,
            backgroundColor: colors.brand.primaryBg,
            border: `1px solid ${colors.brand.primary}30`,
            fontSize: '0.75rem',
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          <strong>Differential Privacy Guarantee:</strong> The central coordinator only aggregates masked
          weight vectors. Individual participant PHC records and local gradient matrices never leave national
          jurisdiction.
        </div>
      </div>
    </div>
  );
};
