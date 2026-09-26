export type PHCNavTab =
  | 'dashboard'
  | 'facility'
  | 'inventory'
  | 'billing'
  | 'beds'
  | 'oxygen'
  | 'equipment'
  | 'staff'
  | 'footfall'
  | 'requests'
  | 'alerts'
  | 'emergency'
  | 'sync'
  | 'testing'
  | 'settings';

export type InventorySubTab =
  | 'current_stock'
  | 'batches'
  | 'expiry'
  | 'consumption'
  | 'movements';

export type SyncStatus = 'pending' | 'in_flight' | 'synced' | 'conflict' | 'failed';

export type EntityType =
  | 'billing_transaction'
  | 'inventory_batch_update'
  | 'inventory_batch_create'
  | 'resource_request'
  | 'footfall_entry'
  | 'facility_update'
  | 'staff_attendance'
  | 'alert_report'
  | 'equipment_update'
  | 'equipment_create'
  | 'system_config';

export interface State {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  state_id: string;
  name: string;
}

export interface PHCFacility {
  id: string;
  name: string;
  district_id: string;
  state_id: string;
  district_name?: string;
  state_name?: string;
  latitude: number;
  longitude: number;
  address: string;
  contact_phone: string;
  contact_email: string;
  total_beds: number;
  emergency_beds: number;
  isolation_beds: number;
  occupied_beds: number;
  oxygen_cylinders: number;
  oxygen_concentrators: number;
  status: 'active' | 'inactive';
  operational_status: 'operational' | 'partial' | 'closed';
  emergency_capability: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  phc_id: string;
  equipment_type: string;
  quantity: number;
  working_qty: number;
  non_working_qty: number;
  maintenance_status: 'operational' | 'maintenance' | 'broken' | 'critical';
  last_serviced_at: string;
  next_service_date: string;
  created_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  min_threshold: number;
  critical_threshold: number;
  description?: string;
}

export interface InventoryBatch {
  id: string;
  phc_id: string;
  medicine_id: string;
  batch_no: string;
  received_qty: number;
  remaining_qty: number;
  minimum_threshold: number;
  expiry_date: string;
  received_at: string;
  source?: string;
}

export interface StockMovement {
  id: string;
  phc_id: string;
  medicine_id: string;
  batch_id?: string;
  batch_no?: string;
  type: 'receive' | 'dispense' | 'adjust' | 'transfer';
  quantity: number;
  previous_qty: number;
  new_qty: number;
  reason?: string;
  user_name: string;
  device_id: string;
  timestamp: string;
}

export interface BillingTransaction {
  id: string;
  phc_id: string;
  client_txn_id: string; // Idempotency key (UUID)
  patient_ref: string;   // "walk_in" or anonymous patient reference, NO PII
  dispensed_by_staff_id: string;
  dispensed_by_staff_name?: string;
  total_amount: number;
  client_timestamp: string;
  server_timestamp?: string;
  status: 'completed' | 'pending_sync' | 'conflict' | 'cancelled';
  sync_status: SyncStatus;
}

export interface DispensedItem {
  id: string;
  billing_transaction_id: string;
  batch_id: string;
  medicine_id: string;
  medicine_name?: string;
  batch_no?: string;
  quantity: number;
  unit_price: number;
}

export interface StaffRegistry {
  id: string;
  phc_id: string;
  role: 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'other';
  name: string;
  active: boolean;
  phone: string;
  email?: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  phc_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'leave';
  notes?: string;
}

export type FootfallCategory =
  | 'opd'
  | 'emergency'
  | 'admission'
  | 'referral'
  | 'disease_infectious'
  | 'disease_chronic'
  | 'disease_maternal'
  | 'other';

export interface PatientFootfall {
  id: string;
  phc_id: string;
  category: FootfallCategory;
  count: number;
  date: string; // YYYY-MM-DD
  created_at: string;
  correction_ref_id?: string;
}

export type ResourceRequestType = 'medicine' | 'oxygen' | 'bed' | 'staff' | 'equipment';
export type RequestPriority = 'routine' | 'urgent' | 'critical';
export type RequestReason = 'manual' | 'auto_draft' | 'threshold_breach';
export type RequestSource = 'manual' | 'auto_draft';
export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'rejected';

export interface ResourceRequest {
  id: string;
  phc_id: string;
  request_type: ResourceRequestType;
  item_ref?: string;
  item_name?: string;
  quantity: number;
  priority: RequestPriority;
  reason: RequestReason;
  source: RequestSource;
  status: RequestStatus;
  notes?: string;
  created_at: string;
  decided_at?: string;
  decided_by?: string;
  estimated_delivery?: string;
}

export interface Alert {
  id: string;
  phc_id: string;
  alert_type:
    | 'stockout'
    | 'bed_shortage'
    | 'staff_shortage'
    | 'outbreak'
    | 'oxygen'
    | 'equipment_maintenance'
    | 'near_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source_module: 'inventory' | 'beds' | 'oxygen' | 'staff' | 'equipment' | 'emergency' | 'requests';
  payload?: Record<string, any>;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface SystemConfig {
  key: string;
  value: string | number | boolean | Record<string, any>;
  description?: string;
  updated_at: string;
}

export interface MutationQueueEntry {
  id: string; // UUID, also idempotency key
  entity_type: EntityType;
  payload: any;
  device_id: string;
  local_seq: number;
  created_at: string;
  sync_status: SyncStatus;
  retry_count: number;
  last_error: string | null;
  conflict_detail?: {
    server_state?: any;
    client_state?: any;
    conflict_type?: 'stock_oversold' | 'version_mismatch' | 'validation_error';
    message?: string;
    suggested_action?: 'partial_dispense' | 'cancel';
    available_qty?: number;
    requested_qty?: number;
  };
}

export interface SyncPushMutation {
  id: string;
  entity_type: EntityType;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  local_seq: number;
  client_timestamp: string;
}

export interface SyncPushRequest {
  device_id: string;
  phc_id: string;
  client_clock: string;
  mutations: SyncPushMutation[];
}

export interface SyncMutationResult {
  mutation_id: string;
  status: 'accepted' | 'duplicate' | 'rejected' | 'conflict';
  server_entity_id?: string;
  error_code?: string;
  conflict?: {
    conflict_type: 'stock_oversold' | 'version_mismatch' | 'validation_error';
    server_state?: any;
    message?: string;
    available_qty?: number;
    requested_qty?: number;
  };
}

export interface SyncPushResponse {
  server_seq: number;
  results: SyncMutationResult[];
}

export interface SyncPullDelta {
  server_seq: number;
  entity_type: string;
  operation: 'create' | 'update' | 'delete';
  entity_id: string;
  payload: any;
  server_timestamp: string;
}

export interface SyncPullResponse {
  server_seq: number;
  has_more: boolean;
  deltas: SyncPullDelta[];
}
