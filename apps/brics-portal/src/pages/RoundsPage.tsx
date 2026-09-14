// ---------------------------------------------------------------------------
// Training Rounds Page — BRICS Federated Intelligence Portal
//
// Features (Prompt 3):
// - Table / timeline of federated learning rounds:
//     - Round number / ID
//     - Start time (DataFreshnessLabel / timestamp)
//     - Participating node count (X/5)
//     - Status badge (collecting_updates / aggregating / awaiting_review / approved / rejected)
//     - Duration (e.g. 48h 0m, or "Active")
// - Interactive round selection opening RoundDetailDrawer:
//     - Per-node contribution status (submitted / pending / failed)
// - "Start New Round" action calling `startFederatedRound(config)`
//     - Gated behind configuration modal and mandatory confirmation summary.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_FEDERATED_ROUNDS,
  START_FEDERATED_ROUND,
} from '@/graphql';
import {
  StatusBadge,
  DataFreshnessLabel,
  TableSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/common';
import {
  RoundDetailDrawer,
  StartRoundModal,
} from '@/components/rounds';
import { colors, typography } from '@/styles/theme';
import type { FederatedRound, StartRoundInput } from '@/types/federated';

function calculateDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (!completedAt) {
    return `${hours}h ${minutes}m (Active)`;
  }
  return `${hours}h ${minutes}m`;
}

export default function RoundsPage() {
  const [selectedRound, setSelectedRound] = useState<FederatedRound | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{
    federatedRounds: FederatedRound[];
  }>(GET_FEDERATED_ROUNDS);

  const [startRound, { loading: startingRound }] = useMutation(
    START_FEDERATED_ROUND,
    {
      onCompleted: (result) => {
        refetch();
        const newRound = result.startFederatedRound;
        setSuccessBanner(
          `Successfully initiated ${newRound.roundId} for model ${newRound.modelVersion}.`
        );
        setTimeout(() => setSuccessBanner(null), 6000);
      },
    }
  );

  const rounds = [...(data?.federatedRounds || [])].reverse(); // newest first

  const handleRowClick = (round: FederatedRound) => {
    setSelectedRound(round);
    setIsDrawerOpen(true);
  };

  const handleStartRoundSubmit = async (config: StartRoundInput) => {
    await startRound({
      variables: {
        config,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
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
              Training Round Lifecycle View
            </h2>
            <StatusBadge tone="green" label="Synchronous FedAvg" size="sm" />
          </div>
          <p style={{ ...typography.body, color: colors.text.secondary, marginTop: 4 }}>
            Timeline surveillance and contribution tracking of cross-border federated learning iterations.
          </p>
        </div>

        {/* Start New Round Button */}
        <button
          type="button"
          onClick={() => setIsStartModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.brand.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 18px',
            ...typography.bodySmall,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>＋</span>
          <span>Start New Round</span>
        </button>
      </div>

      {successBanner && (
        <div
          style={{
            backgroundColor: colors.status.green.bg,
            border: `1px solid ${colors.status.green.border}`,
            color: colors.status.green.text,
            padding: '12px 16px',
            borderRadius: 6,
            ...typography.body,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>✓</span>
          <span>{successBanner}</span>
        </div>
      )}

      {/* Rounds Table / Timeline */}
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.bg.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.bg.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ ...typography.titleMedium, color: colors.text.primary, margin: 0 }}>
              Federated Training Rounds Ledger
            </h3>
            <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
              ({rounds.length} recorded rounds)
            </span>
          </div>

          <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
            Click any row to open the per-node contribution drawer
          </span>
        </div>

        {error ? (
          <div style={{ padding: 20 }}>
            <ErrorState
              title="Failed to Load Training Rounds"
              error={error}
              onRetry={() => refetch()}
            />
          </div>
        ) : loading ? (
          <div style={{ padding: 20 }}>
            <TableSkeleton rows={6} columns={7} />
          </div>
        ) : rounds.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              title="No rounds yet — start your first federated round"
              description="No federated learning iterations have been executed yet. Initiate the inaugural round across the 5 sovereign member nodes."
              actionLabel="Start First Round"
              onAction={() => setIsStartModalOpen(true)}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...typography.body }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.bg.surfaceHover,
                    borderBottom: `1px solid ${colors.bg.border}`,
                    color: colors.text.secondary,
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 20px' }}>Round ID</th>
                  <th style={{ padding: '12px 16px' }}>Target Model</th>
                  <th style={{ padding: '12px 16px' }}>Start Time</th>
                  <th style={{ padding: '12px 16px' }}>Participating Nodes</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Duration</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round) => {
                  const submittedCount = round.submittedCountries.length;
                  const totalCount = round.participatingCountries.length;

                  return (
                    <tr
                      key={round.id}
                      onClick={() => handleRowClick(round)}
                      style={{
                        borderBottom: `1px solid ${colors.bg.borderSubtle}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: colors.text.primary }}>
                          {round.roundId}
                        </div>
                        <div style={{ ...typography.mono, color: colors.text.muted, fontSize: '0.6875rem' }}>
                          ID: {round.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            ...typography.mono,
                            color: colors.brand.primary,
                            backgroundColor: colors.brand.primaryBg,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                          }}
                        >
                          {round.modelVersion}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <DataFreshnessLabel timestamp={round.startedAt} prefix="Started" />
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 600,
                              color:
                                submittedCount >= round.quorumRequired
                                  ? colors.status.green.text
                                  : colors.text.primary,
                            }}
                          >
                            {submittedCount} / {totalCount}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: colors.text.muted }}>
                            (Quorum: {round.quorumRequired})
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={round.status} size="sm" />
                      </td>

                      <td
                        style={{
                          padding: '14px 16px',
                          color: colors.text.secondary,
                          fontVariantNumeric: 'tabular-nums',
                          ...typography.bodySmall,
                        }}
                      >
                        {calculateDuration(round.startedAt, round.completedAt)}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span
                          style={{
                            color: colors.brand.primary,
                            ...typography.bodySmall,
                            fontWeight: 600,
                          }}
                        >
                          Inspect Drawer &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer for Selected Round Details */}
      <RoundDetailDrawer
        round={selectedRound}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Modal for Starting a New Round */}
      <StartRoundModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onSubmit={handleStartRoundSubmit}
        isSubmitting={startingRound}
      />
    </div>
  );
}

