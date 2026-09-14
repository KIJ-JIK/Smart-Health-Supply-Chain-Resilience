/**
 * Offline-First Delta Sync Protocol Types
 * Matches Architecture §8.2 verbatim.
 */

export type SyncEntityType =
  | 'billing_transaction'
  | 'inventory_batch_update'
  | 'resource_request'
  | 'footfall_entry'
  | 'facility_update'
  | 'staff_attendance'
  | 'alert_report';

export type SyncOperation = 'create' | 'update';

export interface Mutation<T = Record<string, unknown>> {
  id: string; // UUID idempotency key
  entity_type: SyncEntityType;
  operation: SyncOperation;
  payload: T;
  local_seq: number;
  client_timestamp: string;
}

export interface SyncPushRequest {
  device_id: string;
  phc_id: string;
  client_clock?: string;
  mutations: Mutation[];
}

export type MutationStatus = 'accepted' | 'duplicate' | 'rejected' | 'conflict';

export type ConflictType = 'stock_oversold' | 'concurrent_absolute_edit' | 'stale_reference';

export type SuggestedResolution =
  | 'requeue_with_reduced_quantity'
  | 'discard_local_edit'
  | 'manual_reconciliation_required';

export interface ConflictDetail {
  conflict_type: ConflictType;
  server_state: Record<string, unknown>;
  suggested_resolution?: SuggestedResolution;
  reconciliation_ref?: string;
}

export interface MutationResult {
  mutation_id: string;
  status: MutationStatus;
  server_entity_id?: string;
  error_code?: string;
  conflict?: ConflictDetail;
}

export interface SyncPushResponse {
  server_seq: number;
  results: MutationResult[];
}

export type DeltaEntityType =
  | 'redistribution_approval'
  | 'request_status_change'
  | 'alert'
  | 'threshold_config_update'
  | 'facility_config_update';

export type DeltaOperation = 'upsert' | 'delete';

export interface Delta<T = Record<string, unknown>> {
  server_seq: number;
  entity_type: DeltaEntityType;
  operation: DeltaOperation;
  entity_id: string;
  payload: T;
  server_timestamp?: string;
}

export interface SyncPullResponse {
  server_seq: number;
  has_more: boolean;
  deltas: Delta[];
}

export interface ErrorResponse {
  error_code: string;
  message: string;
  request_id?: string;
}
