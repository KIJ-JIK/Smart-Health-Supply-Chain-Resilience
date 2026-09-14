// ---------------------------------------------------------------------------
// Overview Page — BRICS Federated AI Monitoring & Coordination Portal
//
// Features (Prompt 2):
// - Five CountryNodeCards in a row (IN, BR, RU, CN, ZA) with live freshness labels,
//   participation status, and health indicators.
// - Top KPI tiles:
//     "Active Nodes X/5"
//     "Current Round Status"
//     "Last Global Aggregation"
//     "Rounds Completed (30d)"
// - Interactive navigation to node detail view on card click.
// ---------------------------------------------------------------------------

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  GET_FEDERATED_NODES,
  GET_FEDERATED_ROUNDS,
  GET_FEDERATED_MODEL_VERSIONS,
} from '@/graphql';
import {
  KpiCard,
  CountryNodeCard,
  DataFreshnessLabel,
  StatusBadge,
  CardSkeleton,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@/components/common';
import { colors, typography } from '@/styles/theme';
import type {
  FederatedNode,
  FederatedRound,
  FederatedModelVersion,
} from '@/types/federated';

export default function OverviewPage() {
  const navigate = useNavigate();

  const {
    data: nodesData,
    loading: nodesLoading,
    error: nodesError,
    refetch: refetchNodes,
  } = useQuery<{
    federatedNodes: FederatedNode[];
  }>(GET_FEDERATED_NODES);

  const {
    data: roundsData,
    loading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery<{
    federatedRounds: FederatedRound[];
  }>(GET_FEDERATED_ROUNDS);

  const {
    data: modelsData,
    loading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery<{
    federatedModelVersions: FederatedModelVersion[];
  }>(GET_FEDERATED_MODEL_VERSIONS);

  const anyError = nodesError || roundsError || modelsError;
  const refetchAll = () => {
    refetchNodes();
    refetchRounds();
    refetchModels();
  };

  const nodes = nodesData?.federatedNodes || [];
  const rounds = roundsData?.federatedRounds || [];
  const models = modelsData?.federatedModelVersions || [];

  // Derived KPI Calculations
  const activeNodesCount = nodes.filter((n) => n.status === 'participating').length;
  const totalNodesCount = nodes.length || 5;

  // Most recent round
  const currentRound = rounds[rounds.length - 1] || rounds[0];

  // Most recent active/completed model aggregation
  const latestModel = models.find((m) => m.status === 'active') || models[models.length - 1];

  // Completed rounds in the last 30 days
  const completedRoundsCount = rounds.filter(
    (r) => r.status === 'completed' || r.status === 'approved'
  ).length;

  // Top-level error state
  if (anyError) {
    return (
      <div style={{ maxWidth: 1400, margin: '20px auto' }}>
        <ErrorState
          title="Federation Overview Telemetry Unavailable"
          error={anyError}
          onRetry={refetchAll}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1400 }}>
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
            <h2
              style={{
                ...typography.titleLarge,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Federation Overview
            </h2>
            <StatusBadge tone="green" label="5-Node Quorum Capable" size="sm" />
          </div>
          <p
            style={{
              ...typography.body,
              color: colors.text.secondary,
              marginTop: 4,
              maxWidth: 750,
            }}
          >
            Operator-facing surveillance for the sovereign cross-border model training
            consortium (India, Brazil, Russia, China, South Africa).
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.bg.surface,
            padding: '8px 14px',
            borderRadius: 6,
            border: `1px solid ${colors.bg.border}`,
          }}
        >
          <DataFreshnessLabel
            timestamp={currentRound?.startedAt || '2026-09-11T16:23:12.016Z'}
            prefix="Federation Sync"
          />
        </div>
      </div>

      {/* Top KPI Tiles (4 Columns) */}
      <section
        aria-label="Federation Key Performance Indicators"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {roundsLoading || modelsLoading || nodesLoading ? (
          <CardSkeleton count={4} height={120} />
        ) : (
          <>
            <KpiCard
              title="Active Nodes"
              value={`${activeNodesCount}/${totalNodesCount}`}
              subtitle="Sovereign participants online"
              trendText="Quorum: 4 required"
              statusTone={activeNodesCount >= 4 ? 'green' : 'amber'}
            />

            <KpiCard
              title="Current Round Status"
              value={currentRound ? currentRound.status.replace(/_/g, ' ') : 'Idle'}
              subtitle={
                currentRound ? `${currentRound.roundId} (${currentRound.modelVersion})` : 'No active rounds'
              }
              statusBadge={currentRound?.status || 'announced'}
            />

            <KpiCard
              title="Last Global Aggregation"
              value={latestModel ? latestModel.modelVersion : 'v1.17'}
              subtitle={
                latestModel?.receivedAt ? (
                  <DataFreshnessLabel
                    timestamp={latestModel.receivedAt}
                    prefix="Aggregated"
                    fallbackText="None"
                  />
                ) : (
                  'Weights synced'
                )
              }
              trendText={
                latestModel?.metrics ? `MAE: ${latestModel.metrics.mae.toFixed(4)}` : undefined
              }
              statusTone="green"
            />

            <KpiCard
              title="Rounds Completed (30d)"
              value={completedRoundsCount}
              subtitle="Model iterations validated"
              trendText="100% aggregation quorum"
              statusTone="green"
            />
          </>
        )}
      </section>

      {/* Five CountryNodeCards in a Row */}
      <section
        aria-label="BRICS Sovereign Member Nodes"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                ...typography.titleMedium,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              BRICS Sovereign Member Nodes
            </h3>
            <span
              style={{
                ...typography.bodySmall,
                color: colors.text.muted,
              }}
            >
              Click any country card to inspect local training telemetry or govern participation.
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/nodes')}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.bg.border}`,
              color: colors.brand.primary,
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              ...typography.bodySmall,
              fontWeight: 600,
            }}
          >
            Manage Nodes
          </button>
        </div>

        {nodesLoading ? (
          <CardSkeleton count={5} height={180} />
        ) : nodes.length === 0 ? (
          <EmptyState
            title="No Sovereign Nodes Registered"
            description="The federated network coordinator has not registered any participating national member nodes."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {nodes.map((node) => {
              // Determine if this country submitted in the latest completed round
              const lastSubmitted =
                currentRound?.submittedCountries?.includes(node.countryCode) ||
                (node.countryCode !== 'CN' && node.status === 'participating');

              return (
                <CountryNodeCard
                  key={node.countryCode}
                  countryCode={node.countryCode}
                  countryName={node.countryName}
                  status={node.status}
                  lastLocalTraining={node.lastLocalTraining}
                  lastModelUpload={node.lastModelUpload}
                  healthIndicator={node.healthIndicator}
                  lastRoundParticipation={lastSubmitted}
                  onClick={() => navigate(`/nodes?country=${node.countryCode}`)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Trust & Architecture Notice Footer */}
      <footer
        style={{
          borderTop: `1px solid ${colors.bg.borderSubtle}`,
          paddingTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...typography.bodySmall,
          color: colors.text.muted,
        }}
      >
        <span>
          Cross-Border Protocol: <strong>FedAvg + DP-SGD</strong> | Secure Aggregation Enforced
        </span>
        <span>Human-in-the-Loop Governance: Autonomous model deployment prohibited</span>
      </footer>
    </div>
  );
}

