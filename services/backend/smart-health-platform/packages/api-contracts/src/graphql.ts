/**
 * GraphQL Types & Input Definitions
 * Matches schema in graphql/schema.graphql
 */

export type ScopeLevel = 'NATIONAL' | 'STATE' | 'DISTRICT' | 'PHC';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ScopeInput {
  level: ScopeLevel;
  stateId?: string;
  districtId?: string;
  phcId?: string;
}

export interface ShipmentFilter {
  status?: string;
  sourcePhcId?: string;
  destPhcId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditFilter {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface NationalOverview {
  totalPhcs: number;
  activePhcs: number;
  criticalPhcs: number;
  totalBeds: number;
  occupiedBeds: number;
  bedOccupancyRate: number;
  oxygenCylindersAvailable: number;
  openAlertsCount: number;
  criticalAlertsCount: number;
  staffShortagePhcCount: number;
  pendingRedistributionsCount: number;
  lastUpdated: string;
}

export interface DistrictSummary {
  districtId: string;
  districtName: string;
  totalPhcs: number;
  criticalPhcs: number;
  stockoutRiskCount: number;
  bedOccupancyRate: number;
}

export interface StateOverview {
  stateId: string;
  stateName: string;
  totalDistricts: number;
  totalPhcs: number;
  activePhcs: number;
  bedOccupancyRate: number;
  criticalAlertsCount: number;
  districts: DistrictSummary[];
  lastUpdated: string;
}

export interface PhcSummary {
  phcId: string;
  name: string;
  totalBeds: number;
  occupiedBeds: number;
  oxygenCylinders: number;
  riskLevel: RiskLevel;
  openAlerts: number;
  latitude?: number;
  longitude?: number;
}

export interface DistrictOverview {
  districtId: string;
  districtName: string;
  stateId: string;
  totalPhcs: number;
  phcList: PhcSummary[];
  pendingRequestsCount: number;
  openAlertsCount: number;
  lastUpdated: string;
}

export interface ResourceRequestSummary {
  id: string;
  requestType: string;
  priority: string;
  status: string;
  createdAt: string;
}

export interface AlertSummary {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface PhcDetail {
  phcId: string;
  name: string;
  districtId: string;
  stateId: string;
  totalBeds: number;
  occupiedBeds: number;
  oxygenCylinders: number;
  riskScore: number;
  riskLevel: RiskLevel;
  inventoryCount: number;
  activeStaffCount: number;
  openRequests: ResourceRequestSummary[];
  activeAlerts: AlertSummary[];
  lastSyncedAt?: string;
}

export interface StockoutItem {
  medicineId: string;
  medicineName: string;
  category: string;
  affectedPhcCount: number;
  recommendedAction: string;
}

export interface ExpiryBatchItem {
  batchId: string;
  medicineName: string;
  phcName: string;
  remainingQty: number;
  expiryDate: string;
  daysToExpiry: number;
}

export interface MedicineIntelligence {
  scope: ScopeInput;
  totalStockItems: number;
  criticalStockouts: StockoutItem[];
  nearExpiryBatches: ExpiryBatchItem[];
  consumptionVelocityDaily: number;
  daysOfSupplyAverage: number;
}

export interface ResourceIntelligence {
  scope: ScopeInput;
  totalVentilators: number;
  functionalVentilators: number;
  totalOxygenConcentrators: number;
  coldChainUnitsOptimal: number;
  maintenanceRequiredCount: number;
}

export interface StaffShortageDetail {
  phcId: string;
  phcName: string;
  missingRole: string;
  consecutiveDays: number;
}

export interface WorkforceIntelligence {
  scope: ScopeInput;
  totalRegisteredStaff: number;
  presentToday: number;
  attendanceRate: number;
  doctorToPatientRatio: number;
  criticalStaffShortages: StaffShortageDetail[];
}

export interface DailyFootfallPoint {
  date: string;
  count: number;
}

export interface SyndromicCategoryCount {
  category: string;
  count: number;
  weekOverWeekDeltaPercent: number;
}

export interface PatientIntelligence {
  scope: ScopeInput;
  totalFootfallToday: number;
  footfallTrendWeekly: DailyFootfallPoint[];
  syndromicCategories: SyndromicCategoryCount[];
}

export interface ForecastPrediction {
  id: string;
  phcId: string;
  medicineId: string;
  medicineName?: string;
  forecastType: string;
  predictedValue: number;
  confidenceLower: number;
  confidenceUpper: number;
  modelUsed: string;
  modelVersion: string;
  generatedAt: string;
}

export interface RedistributionRecommendation {
  transferId: string;
  sourcePhcId: string;
  sourcePhcName: string;
  destPhcId: string;
  destPhcName: string;
  medicineId: string;
  medicineName: string;
  recommendedQuantity: number;
  status: string;
  aiExplanation?: string;
  urgencyLevel: RiskLevel;
  createdDate: string;
}

export interface SupplyChainShipment {
  id: string;
  transferId: string;
  sourcePhcName: string;
  destPhcName: string;
  medicineName: string;
  quantity: number;
  status: string;
  trackingNumber?: string;
  dispatchedAt?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  phcId?: string;
  districtId?: string;
  stateId?: string;
  sourceIp?: string;
  deviceId?: string;
  correlationId?: string;
  createdAt: string;
}

export interface FederatedNode {
  countryCode: string;
  countryName: string;
  nodeStatus: string;
  activeModelVersion: string;
  lastTrainedAt?: string;
}

export interface FederatedRound {
  id: string;
  roundNumber: number;
  modelId: string;
  status: string;
  participatingCountries: string[];
  globalLoss?: number;
  previousEntryHash: string;
  thisHash: string;
  startedAt: string;
  completedAt?: string;
}

export interface FederatedModelVersion {
  id: string;
  modelVersion: string;
  accuracyScore: number;
  testAccuracyDelta: number;
  status: string;
  releasedAt: string;
}

export interface PrivacyBudgetEntry {
  id: string;
  countryId: string;
  roundNumber: number;
  epsilonConsumed: number;
  cumulativeEpsilon: number;
  budgetLimit: number;
  withinBudget: boolean;
}
