/**
 * REST API Contracts & Interfaces
 * Matches OpenAPI specification: openapi/openapi.yaml
 */

export interface Facility {
  id: string;
  name: string;
  district_id: string;
  state_id: string;
  total_beds: number;
  occupied_beds: number;
  oxygen_cylinders: number;
  status?: string;
}

export interface FacilityUpdateInput {
  total_beds?: number;
  occupied_beds?: number;
  oxygen_cylinders?: number;
}

export interface InventoryBatch {
  id: string;
  phc_id: string;
  medicine_id: string;
  medicine_name?: string;
  batch_no: string;
  remaining_qty: number;
  minimum_threshold?: number;
  expiry_date: string;
}

export interface CreateInventoryBatchInput {
  medicine_id: string;
  batch_no: string;
  remaining_qty: number;
  minimum_threshold?: number;
  expiry_date: string;
}

export interface BillingCheckoutItem {
  medicine_id: string;
  quantity: number;
}

export interface BillingCheckoutInput {
  client_txn_id: string;
  patient_ref?: string;
  items: BillingCheckoutItem[];
}

export interface DispensedItemRecord {
  batch_id: string;
  medicine_id: string;
  qty_dispensed: number;
}

export interface BillingCheckoutResult {
  transaction_id: string;
  client_txn_id: string;
  dispensed_items: DispensedItemRecord[];
}

export interface EquipmentItem {
  id: string;
  phc_id: string;
  equipment_type: string;
  serial_no?: string;
  status: 'functional' | 'requires_maintenance' | 'inoperable' | 'decommissioned';
  last_inspected_at?: string;
}

export interface StaffMember {
  id: string;
  phc_id: string;
  name: string;
  role: string;
  active: boolean;
}

export interface StaffAttendanceInput {
  staff_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'on_leave';
}

export interface FootfallRecord {
  time: string;
  phc_id: string;
  category: string;
  count: number;
}

export interface FootfallInput {
  category: 'general_opd' | 'maternal_child' | 'emergency' | 'chronic_followup' | 'infectious';
  count: number;
  time?: string;
}

export interface ResourceRequest {
  id: string;
  phc_id: string;
  request_type: 'replenishment' | 'emergency' | 'equipment_repair';
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'dispatched' | 'in_transit' | 'delivered' | 'rejected';
  created_at: string;
  decided_at?: string;
}

export interface ResourceRequestItemInput {
  medicine_id: string;
  requested_qty: number;
}

export interface ResourceRequestInput {
  request_type: 'replenishment' | 'emergency' | 'equipment_repair';
  priority: 'low' | 'normal' | 'high' | 'critical';
  items: ResourceRequestItemInput[];
}

export interface EmergencyReportInput {
  alert_type: 'mass_casualty' | 'disease_outbreak' | 'oxygen_failure' | 'extreme_weather';
  title: string;
  description: string;
}

export interface AlertItem {
  id: string;
  phc_id?: string;
  district_id?: string;
  state_id?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface AuthLoginInput {
  username: string;
  role?: 'national_admin' | 'state_admin' | 'district_admin' | 'phc_user';
  phcId?: string;
  districtId?: string;
  stateId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: {
    userId: string;
    role: string;
    phcId?: string;
    districtId?: string;
    stateId?: string;
  };
}

export interface DeviceRegistrationInput {
  phcId: string;
  deviceName: string;
  publicKey?: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceRegistrationResult {
  deviceId: string;
  phcId: string;
  deviceName: string;
  publicKey: string;
  privateKey?: string;
  deviceFingerprint: string;
  status: 'active' | 'revoked' | 'pending';
  registeredAt: string;
}
