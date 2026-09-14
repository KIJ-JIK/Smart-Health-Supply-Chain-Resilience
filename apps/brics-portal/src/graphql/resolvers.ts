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
import type { FederatedNode, FederatedRound } from '@/types/federated';

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
      const newRound: FederatedRound = {
        id: `mock-${Date.now()}`,
        roundId: `round-${new Date().toISOString().slice(0, 10)}-${String(mockRounds.length + 1).padStart(3, '0')}`,
        modelVersion: args.config.targetModel,
        status: 'collecting_updates',
        participatingCountries: ['IN', 'BR', 'RU', 'CN', 'ZA'],
        submittedCountries: [],
        quorumRequired: args.config.minimumNodes,
        roundDeadline: new Date(
          Date.now() + args.config.roundTimeoutHours * 3600000
        ).toISOString(),
        aggregationSignature: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      };
      mockRounds.push(newRound);
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
