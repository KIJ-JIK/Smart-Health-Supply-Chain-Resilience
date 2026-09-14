// ---------------------------------------------------------------------------
// GraphQL type definitions for the BRICS Federated Intelligence Portal.
// Mirrors the `federated.*` namespace described in the backend contract:
//   - federatedNodes, federatedRounds, federatedModelVersions, federatedPrivacyBudget
//   - Mutations: startFederatedRound, approveAggregatedModel, rejectAggregatedModel,
//     toggleCountryParticipation
// Backed by DB tables: federation_rounds (Dataset 24), federation_model_versions
// (Dataset 26), privacy_budget_ledger (Dataset 25).
// ---------------------------------------------------------------------------

export const typeDefs = /* GraphQL */ `
  type Query {
    """Retrieve all five BRICS federation nodes and their current status."""
    federatedNodes: [FederatedNode!]!

    """List federation training rounds, optionally filtered by status."""
    federatedRounds(status: RoundStatus): [FederatedRound!]!

    """Retrieve a single round by its ID."""
    federatedRound(id: ID!): FederatedRound

    """List global model versions produced by federation."""
    federatedModelVersions: [FederatedModelVersion!]!

    """Privacy budget consumption per country across rounds."""
    federatedPrivacyBudget: [PrivacyBudgetEntry!]!
  }

  type Mutation {
    """Initiate a new federated training round. Requires national_admin role."""
    startFederatedRound(config: StartRoundInput!): FederatedRound!

    """Approve an aggregated model after human review. Requires national_admin role."""
    approveAggregatedModel(roundId: ID!): FederatedRound!

    """Reject an aggregated model with a mandatory reason. Requires national_admin role."""
    rejectAggregatedModel(roundId: ID!, reason: String!): FederatedRound!

    """Toggle a country's participation in federation. Requires national_admin role."""
    toggleCountryParticipation(countryCode: String!, enabled: Boolean!): FederatedNode!
  }

  # ---------------------------------------------------------------------------
  # Enums
  # ---------------------------------------------------------------------------

  enum RoundStatus {
    announced
    in_progress
    collecting_updates
    aggregating
    awaiting_review
    completed
    approved
    rejected
    voided
  }

  enum NodeParticipationStatus {
    participating
    paused
    excluded
  }

  enum ModelStatus {
    received
    validated
    active
    deprecated
  }

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  """A BRICS federation node — one per country."""
  type FederatedNode {
    countryCode: String!
    countryName: String!
    status: NodeParticipationStatus!
    lastLocalTraining: String
    lastModelUpload: String
    healthIndicator: String!
    coordinatorEndpoint: String
  }

  """A single federated training round."""
  type FederatedRound {
    id: ID!
    roundId: String!
    modelVersion: String!
    status: RoundStatus!
    participatingCountries: [String!]!
    submittedCountries: [String!]!
    quorumRequired: Int!
    roundDeadline: String
    aggregationSignature: String
    startedAt: String!
    completedAt: String
  }

  """A globally-aggregated model version produced by a round."""
  type FederatedModelVersion {
    id: ID!
    modelVersion: String!
    baseModelVersion: String
    federationRoundId: ID
    s3Uri: String!
    aggregationSignature: String
    participatingCountries: [String!]!
    metrics: ModelMetrics
    status: ModelStatus!
    receivedAt: String!
    activatedAt: String
    deprecatedAt: String
  }

  type ModelMetrics {
    mae: Float
    rmse: Float
    backtestWeeks: Int
  }

  """Privacy budget ledger entry — per country per round."""
  type PrivacyBudgetEntry {
    id: ID!
    countryId: String!
    federationRoundId: ID!
    epsilonThisRound: Float!
    deltaThisRound: Float!
    cumulativeEpsilon: Float!
    budgetLimit: Float!
    clipNorm: Float
    noiseMultiplier: Float
    localSampleCount: Int
    submitted: Boolean!
    recordedAt: String!
  }

  # ---------------------------------------------------------------------------
  # Inputs
  # ---------------------------------------------------------------------------

  input StartRoundInput {
    targetModel: String!
    minimumNodes: Int!
    roundTimeoutHours: Int!
  }
`;
