// ---------------------------------------------------------------------------
// TypeScript types for the BRICS Federated Intelligence Portal.
// These mirror the GraphQL schema and DB table structures from
// federation_rounds, federation_model_versions, privacy_budget_ledger.
// ---------------------------------------------------------------------------

export type NodeParticipationStatus = 'participating' | 'paused' | 'excluded';

export type RoundStatus =
  | 'announced'
  | 'in_progress'
  | 'collecting_updates'
  | 'aggregating'
  | 'awaiting_review'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'voided';

export type ModelStatus = 'received' | 'validated' | 'active' | 'deprecated';

export interface FederatedNode {
  countryCode: string;
  countryName: string;
  status: NodeParticipationStatus;
  nodeStatus?: string;
  activeModelVersion?: string;
  lastTrainedAt?: string | null;
  lastLocalTraining: string | null;
  lastModelUpload: string | null;
  healthIndicator: string;
  coordinatorEndpoint: string | null;
}

export interface FederatedRound {
  id: string;
  roundId: string;
  roundNumber?: number;
  modelId?: string;
  modelVersion: string;
  status: RoundStatus;
  participatingCountries: string[];
  submittedCountries: string[];
  quorumRequired: number;
  roundDeadline: string | null;
  aggregationSignature: string | null;
  globalLoss?: number | null;
  previousEntryHash?: string;
  thisHash?: string;
  startedAt: string;
  completedAt: string | null;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  backtestWeeks: number;
}

export interface FederatedModelVersion {
  id: string;
  modelVersion: string;
  baseModelVersion?: string | null;
  federationRoundId?: string | null;
  s3Uri?: string;
  aggregationSignature?: string | null;
  participatingCountries?: string[];
  metrics?: ModelMetrics | null;
  accuracyScore?: number;
  testAccuracyDelta?: number;
  status: ModelStatus;
  receivedAt: string;
  releasedAt?: string;
  activatedAt?: string | null;
  deprecatedAt?: string | null;
}

export interface PrivacyBudgetEntry {
  id: string;
  countryId: string;
  countryCode?: string;
  roundNumber?: number;
  epsilonConsumed?: number;
  federationRoundId?: string;
  epsilonThisRound: number;
  deltaThisRound: number;
  cumulativeEpsilon: number;
  budgetLimit: number;
  withinBudget?: boolean;
  clipNorm?: number | null;
  noiseMultiplier?: number | null;
  localSampleCount?: number | null;
  submitted?: boolean;
  recordedAt: string;
}

export interface StartRoundInput {
  targetModel: string;
  minimumNodes: number;
  roundTimeoutHours: number;
}

/** The user object returned by useCurrentUser(). */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'national_admin';
  countryCode?: string;
  countryName?: string;
  flag?: string;
}
