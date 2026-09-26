// ---------------------------------------------------------------------------
// GraphQL operation documents (queries + mutations) for the BRICS Portal.
// These match the `federated.*` namespace in the backend contract.
// ---------------------------------------------------------------------------

import { gql } from '@apollo/client';

// ── Queries ──────────────────────────────────────────────────────────────────

export const GET_FEDERATED_NODES = gql`
  query GetFederatedNodes {
    federatedNodes {
      countryCode
      countryName
      status
      nodeStatus
      activeModelVersion
      lastTrainedAt
      lastLocalTraining
      lastModelUpload
      healthIndicator
      coordinatorEndpoint
    }
  }
`;

export const GET_FEDERATED_ROUNDS = gql`
  query GetFederatedRounds($status: String) {
    federatedRounds(status: $status) {
      id
      roundId
      roundNumber
      modelId
      modelVersion
      status
      participatingCountries
      submittedCountries
      quorumRequired
      roundDeadline
      aggregationSignature
      globalLoss
      previousEntryHash
      thisHash
      startedAt
      completedAt
    }
  }
`;

export const GET_FEDERATED_ROUND = gql`
  query GetFederatedRound($id: ID!) {
    federatedRound(id: $id) {
      id
      roundId
      roundNumber
      modelId
      modelVersion
      status
      participatingCountries
      submittedCountries
      quorumRequired
      roundDeadline
      aggregationSignature
      globalLoss
      previousEntryHash
      thisHash
      startedAt
      completedAt
    }
  }
`;

export const GET_FEDERATED_MODEL_VERSIONS = gql`
  query GetFederatedModelVersions {
    federatedModelVersions {
      id
      modelVersion
      baseModelVersion
      federationRoundId
      s3Uri
      aggregationSignature
      participatingCountries
      metrics {
        mae
        rmse
        backtestWeeks
      }
      status
      receivedAt
      activatedAt
      deprecatedAt
    }
  }
`;

export const GET_FEDERATED_PRIVACY_BUDGET = gql`
  query GetFederatedPrivacyBudget {
    privacyBudgetLedger {
      id
      countryId
      countryCode
      federationRoundId
      roundNumber
      epsilonThisRound
      deltaThisRound
      cumulativeEpsilon
      budgetLimit
      clipNorm
      noiseMultiplier
      localSampleCount
      submitted
      withinBudget
      recordedAt
      epsilonConsumed
    }
    federatedPrivacyBudget {
      id
      countryId
      countryCode
      federationRoundId
      roundNumber
      epsilonThisRound
      deltaThisRound
      cumulativeEpsilon
      budgetLimit
      clipNorm
      noiseMultiplier
      localSampleCount
      submitted
      withinBudget
      recordedAt
      epsilonConsumed
    }
  }
`;

export const GET_PRIVACY_BUDGET_LEDGER = GET_FEDERATED_PRIVACY_BUDGET;

// ── Mutations ────────────────────────────────────────────────────────────────

export const START_FEDERATED_ROUND = gql`
  mutation StartFederatedRound($modelId: String, $targetEpsilon: Float, $config: StartRoundInput) {
    startFederatedRound(modelId: $modelId, targetEpsilon: $targetEpsilon, config: $config) {
      id
      roundId
      roundNumber
      modelId
      modelVersion
      status
      startedAt
    }
  }
`;

export const APPROVE_AGGREGATED_MODEL = gql`
  mutation ApproveAggregatedModel($roundId: ID!, $targetVersion: String) {
    approveAggregatedModel(roundId: $roundId, targetVersion: $targetVersion) {
      id
      roundId
      modelVersion
      status
      completedAt
    }
  }
`;

export const REJECT_AGGREGATED_MODEL = gql`
  mutation RejectAggregatedModel($roundId: ID!, $reason: String) {
    rejectAggregatedModel(roundId: $roundId, reason: $reason) {
      id
      roundId
      modelVersion
      status
      completedAt
    }
  }
`;

export const TOGGLE_COUNTRY_PARTICIPATION = gql`
  mutation ToggleCountryParticipation($countryCode: String!, $enabled: Boolean!) {
    toggleCountryParticipation(countryCode: $countryCode, enabled: $enabled) {
      countryCode
      countryName
      status
    }
  }
`;

export const CREATE_NATION = gql`
  mutation CreateNation($code: String!, $name: String!, $status: String) {
    createNation(code: $code, name: $name, status: $status) {
      countryCode
      countryName
      status
      nodeStatus
      activeModelVersion
      coordinatorEndpoint
    }
  }
`;

