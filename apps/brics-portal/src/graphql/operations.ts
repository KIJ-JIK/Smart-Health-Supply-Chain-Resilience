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
      lastLocalTraining
      lastModelUpload
      healthIndicator
      coordinatorEndpoint
    }
  }
`;

export const GET_FEDERATED_ROUNDS = gql`
  query GetFederatedRounds($status: RoundStatus) {
    federatedRounds(status: $status) {
      id
      roundId
      modelVersion
      status
      participatingCountries
      submittedCountries
      quorumRequired
      roundDeadline
      aggregationSignature
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
      modelVersion
      status
      participatingCountries
      submittedCountries
      quorumRequired
      roundDeadline
      aggregationSignature
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
    federatedPrivacyBudget {
      id
      countryId
      federationRoundId
      epsilonThisRound
      deltaThisRound
      cumulativeEpsilon
      budgetLimit
      clipNorm
      noiseMultiplier
      localSampleCount
      submitted
      recordedAt
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

export const START_FEDERATED_ROUND = gql`
  mutation StartFederatedRound($config: StartRoundInput!) {
    startFederatedRound(config: $config) {
      id
      roundId
      modelVersion
      status
      startedAt
    }
  }
`;

export const APPROVE_AGGREGATED_MODEL = gql`
  mutation ApproveAggregatedModel($roundId: ID!) {
    approveAggregatedModel(roundId: $roundId) {
      id
      roundId
      status
      completedAt
    }
  }
`;

export const REJECT_AGGREGATED_MODEL = gql`
  mutation RejectAggregatedModel($roundId: ID!, $reason: String!) {
    rejectAggregatedModel(roundId: $roundId, reason: $reason) {
      id
      roundId
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
