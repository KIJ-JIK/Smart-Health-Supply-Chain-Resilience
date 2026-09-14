// ---------------------------------------------------------------------------
// Model Lineage Page — BRICS Federated Intelligence Portal
//
// Features (Prompt 4):
// - Vertical version history (v1.12 -> v1.13 -> ... -> v1.17 -> v1.18 candidate)
// - Each entry shows:
//     - Target model version & base version derived from
//     - Producing federated training round ID
//     - Participating countries (with flags)
//     - Approval / lifecycle status (active, validated, deprecated)
//     - S3 Object Storage URI & SHA-256 Aggregation Signature
// - Simple diff-style metric comparison (MAE, RMSE, backtest weeks):
//     - Compares performance delta between consecutive versions so operators
//       can audit whether cross-border federation is actually improving the model.
// ---------------------------------------------------------------------------

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_FEDERATED_MODEL_VERSIONS } from '@/graphql';
import {
  StatusBadge,
  DataFreshnessLabel,
  CardSkeleton,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@/components/common';
import { MetricDelta } from '@/components/lineage';
import { colors, typography } from '@/styles/theme';
import type { FederatedModelVersion } from '@/types/federated';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

export default function LineagePage() {
  const { data, loading, error, refetch } = useQuery<{
    federatedModelVersions: FederatedModelVersion[];
  }>(GET_FEDERATED_MODEL_VERSIONS);

  const modelVersions = data?.federatedModelVersions || [];

  // Sort chronological ascending for diff computation, then reverse for newest-first timeline
  const chronological = [...modelVersions].sort((a, b) => {
    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
  });

  // Map each model to its previous version's metrics
  const modelsWithDiff = chronological.map((model, idx) => {
    const prevModel = idx > 0 ? chronological[idx - 1] : null;
    return {
      current: model,
      previous: prevModel,
    };
  });

  // Display reverse chronological (newest model candidate at top)
  const timelineEntries = [...modelsWithDiff].reverse();

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '20px auto' }}>
        <ErrorState
          title="Failed to Load Model Lineage History"
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ ...typography.titleLarge, color: colors.text.primary, margin: 0 }}>
              Global Model Lineage &amp; Validation History
            </h2>
            <StatusBadge tone="green" label="FedAvg Global Models" size="sm" />
          </div>
          <p style={{ ...typography.body, color: colors.text.secondary, marginTop: 4, maxWidth: 750 }}>
            Surveillance of globally aggregated model weights, cross-border backtest benchmarks, and
            approval lineage across consecutive federation rounds.
          </p>
        </div>

        <div
          style={{
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.bg.border}`,
            borderRadius: 6,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: colors.text.muted }}>Active Global Model:</span>
          <strong style={{ color: colors.status.green.text, ...typography.mono }}>
            {modelVersions.find((m) => m.status === 'active')?.modelVersion || 'v1.17'}
          </strong>
        </div>
      </div>

      {/* Oversight Architecture Banner */}
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.bg.border}`,
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ ...typography.body, fontWeight: 600, color: colors.text.primary }}>
            Consensus-Driven Lineage Verification
          </div>
          <div style={{ ...typography.bodySmall, color: colors.text.muted, marginTop: 2 }}>
            Every global version is produced from masked weight deltas without central access to raw PHC
            records. Green metrics denote backtest error reduction over previous iterations.
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            color: colors.brand.primary,
            backgroundColor: colors.brand.primaryBg,
            padding: '4px 10px',
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          Architecture Ref: §5.7 &amp; Masterplan §65
        </span>
      </div>

      {/* Vertical Version History Timeline */}
      {loading ? (
        <CardSkeleton count={3} height={220} />
      ) : timelineEntries.length === 0 ? (
        <EmptyState
          title="No Federated Model Versions"
          description="No global model weights have been aggregated or verified yet."
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'relative',
          }}
        >
          {timelineEntries.map(({ current, previous }, index) => {
            const isLatest = index === 0;
            const isActive = current.status === 'active';
            const isCandidate = current.status === 'validated';

            return (
              <div
                key={current.id}
                style={{
                  backgroundColor: colors.bg.surface,
                  border: `1px solid ${isActive ? colors.brand.primary : colors.bg.border}`,
                  borderRadius: 8,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: isActive
                    ? `0 0 0 1px ${colors.brand.primary}, 0 4px 12px rgba(0,0,0,0.3)`
                    : '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Entry Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    borderBottom: `1px solid ${colors.bg.borderSubtle}`,
                    paddingBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        ...typography.titleMedium,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: colors.text.primary,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {current.modelVersion}
                    </span>

                    {current.baseModelVersion && (
                      <span
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.muted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        derived from <strong>{current.baseModelVersion}</strong>
                      </span>
                    )}

                    {isActive && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: colors.status.green.bg,
                          color: colors.status.green.text,
                          border: `1px solid ${colors.status.green.border}`,
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        Active in Production
                      </span>
                    )}

                    {isCandidate && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: colors.status.amber.bg,
                          color: colors.status.amber.text,
                          border: `1px solid ${colors.status.amber.border}`,
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        Candidate (Awaiting Review)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DataFreshnessLabel timestamp={current.receivedAt} prefix="Aggregated" />
                    <StatusBadge status={current.status} size="sm" />
                  </div>
                </div>

                {/* Metadata Row: Producing Round, Weights URI, Participating Countries */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    ...typography.bodySmall,
                  }}
                >
                  <div>
                    <span style={{ color: colors.text.muted, display: 'block' }}>Producing Round:</span>
                    <strong style={{ color: colors.text.primary, ...typography.mono }}>
                      {current.federationRoundId || 'Initial Genesis'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: colors.text.muted, display: 'block' }}>Weight Artifacts (S3):</span>
                    <span
                      style={{
                        color: colors.brand.primary,
                        ...typography.mono,
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                      }}
                      title={current.s3Uri}
                    >
                      {current.s3Uri}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: colors.text.muted, display: 'block' }}>
                      Contributing Sovereign Nodes:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {current.participatingCountries.map((c) => (
                        <span
                          key={c}
                          title={c}
                          style={{
                            fontSize: '1rem',
                            display: 'inline-flex',
                          }}
                        >
                          {COUNTRY_FLAGS[c] || c}
                        </span>
                      ))}
                      <span style={{ fontSize: '0.75rem', color: colors.text.muted }}>
                        ({current.participatingCountries.length}/5 Consensual Quorum)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Diff-Style Metric Comparison Grid */}
                <div>
                  <div
                    style={{
                      ...typography.bodySmall,
                      fontWeight: 600,
                      color: colors.text.secondary,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>Consecutive Metric Delta vs. Previous Model:</span>
                    {previous && (
                      <span style={{ color: colors.text.muted, fontWeight: 400 }}>
                        (baseline: {previous.modelVersion})
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <MetricDelta
                      label="Mean Absolute Error (MAE)"
                      currentValue={current.metrics?.mae || 0}
                      previousValue={previous?.metrics?.mae}
                      lowerIsBetter={true}
                    />

                    <MetricDelta
                      label="Root Mean Squared Error (RMSE)"
                      currentValue={current.metrics?.rmse || 0}
                      previousValue={previous?.metrics?.rmse}
                      lowerIsBetter={true}
                    />

                    <div
                      style={{
                        backgroundColor: colors.bg.surfaceHover,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: `1px solid ${colors.bg.borderSubtle}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        minWidth: 140,
                      }}
                    >
                      <div style={{ ...typography.bodySmall, color: colors.text.muted }}>
                        Backtest Horizon
                      </div>
                      <div
                        style={{
                          ...typography.kpiSmall,
                          color: colors.text.primary,
                        }}
                      >
                        {current.metrics?.backtestWeeks || 4} Weeks
                      </div>
                      <div
                        style={{
                          ...typography.bodySmall,
                          fontSize: '0.6875rem',
                          color: colors.status.green.text,
                        }}
                      >
                        Multi-Center Cross Validation
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aggregation Signature & Cryptographic Proof */}
                {current.aggregationSignature && (
                  <div
                    style={{
                      borderTop: `1px solid ${colors.bg.borderSubtle}`,
                      paddingTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.6875rem',
                      color: colors.text.muted,
                    }}
                  >
                    <span>Signature:</span>
                    <span
                      style={{
                        ...typography.mono,
                        color: colors.text.secondary,
                        wordBreak: 'break-all',
                      }}
                    >
                      {current.aggregationSignature}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

