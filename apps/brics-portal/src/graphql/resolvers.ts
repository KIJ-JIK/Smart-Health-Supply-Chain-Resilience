// ---------------------------------------------------------------------------
// Local mock GraphQL resolvers for standalone development.
// Returns data from mock-data.ts. No live backend required.
// ---------------------------------------------------------------------------

import {
  mockNodes,
  mockRounds,
  mockModelVersions,
  mockPrivacyBudget,
} from './mock-data';
import type {
  FederatedNode,
  FederatedRound,
  FederatedModelVersion,
  PrivacyBudgetEntry,
} from '@/types/federated';

interface FederatedRoundsArgs {
  status?: string;
}

interface FederatedRoundArgs {
  id: string;
}

interface StartRoundArgs {
  config: {
    targetModel: string;
    minimumNodes: number;
    roundTimeoutHours: number;
  };
}

interface ApproveModelArgs {
  roundId: string;
}

interface RejectModelArgs {
  roundId: string;
  reason: string;
}

interface ToggleCountryArgs {
  countryCode: string;
  enabled: boolean;
}

export const resolvers = {
  Query: {
    federatedNodes: (): FederatedNode[] => mockNodes,

    federatedRounds: (_: unknown, args?: FederatedRoundsArgs): FederatedRound[] => {
      if (args?.status) {
        return mockRounds.filter((r) => r.status === args.status);
      }
      return mockRounds;
    },

    federatedRound: (_: unknown, args: FederatedRoundArgs): FederatedRound | undefined => {
      return mockRounds.find((r) => r.id === args.id);
    },

    federatedModelVersions: () => mockModelVersions,

    federatedPrivacyBudget: () => mockPrivacyBudget,
  },

  Mutation: {
    startFederatedRound: (_: unknown, args: StartRoundArgs): FederatedRound => {
      const roundDbId = `round-${Date.now()}`;
      const roundDisplayId = `round-${new Date().toISOString().slice(0, 10)}-${String(mockRounds.length + 1).padStart(3, '0')}`;
      
      const newRound: FederatedRound = {
        id: roundDbId,
        roundId: roundDisplayId,
        modelVersion: args.config.targetModel,
        status: 'awaiting_review',
        participatingCountries: ['IN', 'BR', 'RU', 'CN', 'ZA'],
        submittedCountries: ['IN', 'BR', 'RU', 'CN', 'ZA'],
        quorumRequired: args.config.minimumNodes,
        roundDeadline: new Date(
          Date.now() + args.config.roundTimeoutHours * 3600000
        ).toISOString(),
        aggregationSignature: '7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
        startedAt: new Date().toISOString(),
        completedAt: null,
      };
      mockRounds.push(newRound);

      // Create matching Candidate Model Version
      const newModel: FederatedModelVersion = {
        id: `model-${Date.now()}`,
        modelVersion: args.config.targetModel,
        baseModelVersion: 'v1.17',
        federationRoundId: roundDbId,
        s3Uri: `s3://smart-health-models/federation/${args.config.targetModel}/weights.bin`,
        aggregationSignature: '7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
        participatingCountries: ['IN', 'BR', 'RU', 'CN', 'ZA'],
        metrics: { mae: 0.0542, rmse: 0.0894, backtestWeeks: 8 },
        status: 'received',
        receivedAt: new Date().toISOString(),
        activatedAt: null,
        deprecatedAt: null,
      };
      mockModelVersions.push(newModel);

      // Add privacy ledger entry
      const lastBudget = mockPrivacyBudget[mockPrivacyBudget.length - 1];
      const newCumEps = (lastBudget?.cumulativeEpsilon || 1.42) + 0.18;
      mockPrivacyBudget.push({
        id: `pbe-${Date.now()}`,
        countryId: 'ZA',
        federationRoundId: roundDbId,
        countryCode: 'ZA',
        epsilonThisRound: 0.18,
        deltaThisRound: 0.00001,
        cumulativeEpsilon: Number(newCumEps.toFixed(2)),
        budgetLimit: 5.0,
        recordedAt: new Date().toISOString(),
      });

      return newRound;
    },

    approveAggregatedModel: (_: unknown, args: ApproveModelArgs): FederatedRound => {
      const round = mockRounds.find((r) => r.id === args.roundId);
      if (!round) throw new Error(`Round ${args.roundId} not found`);
      round.status = 'approved' as FederatedRound['status'];
      round.completedAt = new Date().toISOString();

      // Also update the corresponding model version in mockModelVersions
      const model = mockModelVersions.find((m) => m.federationRoundId === args.roundId);
      if (model) {
        // Deprecate previous active model
        mockModelVersions.forEach((m) => {
          if (m.status === 'active') {
            m.status = 'deprecated';
            m.deprecatedAt = new Date().toISOString();
          }
        });
        model.status = 'active';
        model.activatedAt = new Date().toISOString();
      }

      return round;
    },

    rejectAggregatedModel: (_: unknown, args: RejectModelArgs): FederatedRound => {
      const round = mockRounds.find((r) => r.id === args.roundId);
      if (!round) throw new Error(`Round ${args.roundId} not found (reason: ${args.reason})`);
      round.status = 'rejected' as FederatedRound['status'];
      round.completedAt = new Date().toISOString();

      // Also deprecate the candidate model version
      const model = mockModelVersions.find((m) => m.federationRoundId === args.roundId);
      if (model) {
        model.status = 'deprecated';
        model.deprecatedAt = new Date().toISOString();
      }

      return round;
    },

    toggleCountryParticipation: (_: unknown, args: ToggleCountryArgs): FederatedNode => {
      const node = mockNodes.find((n) => n.countryCode === args.countryCode);
      if (!node) throw new Error(`Country ${args.countryCode} not found`);
      node.status = args.enabled ? 'participating' : 'paused';
      return node;
    },
  },
};
