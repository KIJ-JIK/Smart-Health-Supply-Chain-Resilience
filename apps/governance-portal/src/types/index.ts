// ─────────────────────────────────────────────────────────────────────────────
// Core domain types shared across the governance portal
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'national_admin' | 'state_admin' | 'district_admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  /** For state_admin: the state they govern; null for national_admin */
  stateId: string | null;
  /** For district_admin: the district they govern; null otherwise */
  districtId: string | null;
  email: string;
}

// ── KPI / Metric types ────────────────────────────────────────────────────────

export interface KpiTick {
  metric: string;
  value: number;
  unit: string;
  delta: number;        // change vs previous period
  severity: 'ok' | 'warn' | 'critical';
  timestamp: string;   // ISO-8601
}

// ── Alert types ───────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory =
  | 'stockout'
  | 'outbreak'
  | 'workforce'
  | 'supply_chain'
  | 'redistribution'
  | 'system';

export type AlertClass = 'deterministic' | 'statistical' | 'emergency';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  alertType?: string;
  alertClass?: AlertClass;
  title: string;
  message: string;
  entityId?: string;
  entityName?: string;
  entityType?: 'phc' | 'district' | 'state' | 'national' | 'medicine';
  copilotQuery?: string;
  timestamp: string;
  acknowledged: boolean;
  districtId?: string;
  stateId?: string;
}

// ── Overview types ────────────────────────────────────────────────────────────

export interface OverviewKpi {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  delta?: number;
  severity?: 'ok' | 'warn' | 'critical';
}

export interface DistrictSummary {
  districtId: string;
  districtName: string;
  totalPhcs: number;
  criticalPhcs: number;
  stockoutRiskCount: number;
  bedOccupancyRate: number;
}

export interface PhcSummary {
  phcId: string;
  name: string;
  totalBeds: number;
  occupiedBeds: number;
  oxygenCylinders: number;
  riskLevel: string;
  openAlerts: number;
  latitude?: number;
  longitude?: number;
}

export interface NationalOverview {
  totalPhcs: number;
  activePhcs: number;
  criticalPhcs?: number;
  totalBeds?: number;
  occupiedBeds?: number;
  bedOccupancyRate?: number;
  oxygenCylindersAvailable?: number;
  openAlertsCount?: number;
  criticalAlertsCount?: number;
  staffShortagePhcCount?: number;
  pendingRedistributionsCount?: number;
  stockoutAlerts: number;
  criticalShortages: number;
  pendingRedistributions: number;
  outbreakAlerts: number;
  kpis: OverviewKpi[];
  lastUpdated?: string;
}

export interface StateOverview {
  stateId: string;
  stateName: string;
  totalDistricts?: number;
  totalPhcs: number;
  activePhcs: number;
  stockoutAlerts: number;
  criticalShortages: number;
  bedOccupancyRate?: number;
  criticalAlertsCount?: number;
  districts?: DistrictSummary[];
  kpis: OverviewKpi[];
  lastUpdated?: string;
}

export interface DistrictOverview {
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  totalPhcs: number;
  activePhcs: number;
  stockoutAlerts: number;
  phcList?: PhcSummary[];
  pendingRequestsCount?: number;
  openAlertsCount?: number;
  kpis: OverviewKpi[];
  lastUpdated?: string;
}

// ── Medicine Intelligence ─────────────────────────────────────────────────────

export interface MedicineStock {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  currentStock: number;
  unit: string;
  coverageDays: number;
  reorderLevel: number;
  criticalLevel: number;
  expiryDate?: string;
  status: 'adequate' | 'low' | 'critical' | 'stockout' | 'expiring_soon';
  phcId?: string;
  districtId?: string;
  stateId?: string;
}

// ── Resource Intelligence ─────────────────────────────────────────────────────

export interface ResourceItem {
  resourceId: string;
  resourceName: string;
  category: string;
  available: number;
  required: number;
  utilization: number;
  unit: string;
  status: 'adequate' | 'constrained' | 'critical';
}

// ── Workforce Intelligence ────────────────────────────────────────────────────

export interface WorkforceRecord {
  roleId: string;
  roleName: string;
  sanctioned: number;
  inPosition: number;
  vacancies: number;
  onLeave: number;
  trainingDue: number;
  vacancyRate: number;
}

// ── Patient Intelligence ──────────────────────────────────────────────────────

export interface PatientMetrics {
  totalVisits: number;
  avgWaitTimeMinutes: number;
  referralRate: number;
  ncdCoverage: number;
  immunizationCoverage: number;
  maternalCareEnrollment: number;
  period: string;
}

// ── Forecasts ─────────────────────────────────────────────────────────────────

export interface ForecastPoint {
  date: string;
  value: number;
  lowerBound: number;
  upperBound: number;
}

export interface Forecast {
  entityId: string;
  entityType: string;
  metric: string;
  horizon: string;
  model: string;
  confidence: number;
  points: ForecastPoint[];
  generatedAt: string;
}

// ── Redistribution ────────────────────────────────────────────────────────────

export type RecommendationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'modified'
  | 'in_transit'
  | 'completed';

export type TransferLifecycleStatus =
  | 'recommended'
  | 'approved'
  | 'dispatched'
  | 'in_transit'
  | 'delivered';

export interface RedistributionRecommendation {
  recommendationId: string;
  medicineId: string;
  medicineName: string;
  fromPhcId: string;
  fromPhcName: string;
  toPhcId: string;
  toPhcName: string;
  districtId: string;
  quantity: number;
  unit: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  expectedBenefit?: string;
  distanceKm?: number;
  transitTimeMinutes?: number;
  sourceSurplus?: number;
  destinationDeficit?: number;
  transferStatus?: TransferLifecycleStatus;
  aiConfidence: number;
  status: RecommendationStatus;
  createdAt: string;
  decisionAt?: string;
  decisionBy?: string;
  notes?: string;
}

export interface RedistributionDecisionPayload {
  decision: 'approved' | 'rejected' | 'modified';
  modified_quantity?: number | null;
  decided_by: string;
  notes?: string;
}

// ── Supply Chain Shipments ────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'ordered'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'cancelled';

export type ChainStage = 'manufacturer' | 'warehouse' | 'state' | 'district' | 'phc';

export interface Shipment {
  shipmentId: string;
  orderDate: string;
  dispatchTime?: string;
  expectedDelivery: string;
  actualDelivery?: string;
  status: ShipmentStatus;
  supplier: string;
  sourceLocation?: string;
  destinationPhcId: string;
  destinationPhcName: string;
  districtId: string;
  stateId: string;
  stage?: ChainStage;
  isDelayed?: boolean;
  delayHours?: number;
  delayReason?: string;
  redistributionId?: string;
  items: Array<{
    medicineId: string;
    medicineName: string;
    quantity: number;
    unit: string;
  }>;
  totalValue: number;
  currency: string;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditEntry {
  auditId: string;
  action: string;
  entityType: string;
  entityId: string;
  // Masterplan §69 core audit fields
  actorId?: string;
  actorRole?: UserRole;
  createdAt?: string;
  sourceIp?: string;
  deviceId?: string;
  correlationId?: string;
  aiRecPayload?: Record<string, unknown> | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  phcId?: string | null;
  districtId?: string | null;
  stateId?: string | null;

  // Backward compatibility aliases
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

// ── PHC Detail ────────────────────────────────────────────────────────────────

export interface PhcDetail {
  phcId: string;
  phcName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  lat: number;
  lng: number;
  catchmentPopulation: number;
  activeStaff: number;
  stockStatus: 'adequate' | 'low' | 'critical';
  lastUpdated: string;
}
