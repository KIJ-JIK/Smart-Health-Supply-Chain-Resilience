import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { buildSchema, graphql } from 'graphql';
import { GovernanceService } from './governanceService';
import { FederationService } from '../federation/federationService';
import { TenantClaims } from '../../db/pool';

// Load schema string from packages/api-contracts/graphql/schema.graphql
let schemaText = '';
const schemaPath = path.resolve(__dirname, '../../../../packages/api-contracts/graphql/schema.graphql');

if (fs.existsSync(schemaPath)) {
  schemaText = fs.readFileSync(schemaPath, 'utf-8');
} else {
  // Fallback embedded schema definition
  schemaText = `
    scalar DateTime
    scalar JSON

    enum ScopeLevel { NATIONAL STATE DISTRICT PHC }
    enum RiskLevel { LOW MODERATE HIGH CRITICAL }

    input ScopeInput { level: ScopeLevel! stateId: ID districtId: ID phcId: ID }
    type ScopeOutput { level: String! stateId: ID districtId: ID phcId: ID }
    input ShipmentFilter { status: String sourcePhcId: ID destPhcId: ID limit: Int = 50 offset: Int = 0 }
    input AuditFilter { entityType: String entityId: ID actorId: ID action: String limit: Int = 50 offset: Int = 0 }

    type NationalOverview { totalPhcs: Int! activePhcs: Int! criticalPhcs: Int! totalBeds: Int! occupiedBeds: Int! bedOccupancyRate: Float! oxygenCylindersAvailable: Int! openAlertsCount: Int! criticalAlertsCount: Int! staffShortagePhcCount: Int! pendingRedistributionsCount: Int! lastUpdated: DateTime! }
    type DistrictSummary { districtId: ID! districtName: String! totalPhcs: Int! criticalPhcs: Int! stockoutRiskCount: Int! bedOccupancyRate: Float! }
    type StateOverview { stateId: ID! stateName: String! totalDistricts: Int! totalPhcs: Int! activePhcs: Int! bedOccupancyRate: Float! criticalAlertsCount: Int! districts: [DistrictSummary!]! lastUpdated: DateTime! }
    type PhcSummary { phcId: ID! name: String! totalBeds: Int! occupiedBeds: Int! oxygenCylinders: Int! riskLevel: RiskLevel! openAlerts: Int! latitude: Float longitude: Float }
    type DistrictOverview { districtId: ID! districtName: String! stateId: ID! totalPhcs: Int! phcList: [PhcSummary!]! pendingRequestsCount: Int! openAlertsCount: Int! lastUpdated: DateTime! }
    type ResourceRequestSummary { id: ID! requestType: String! priority: String! status: String! createdAt: DateTime! }
    type AlertSummary { id: ID! alertType: String! severity: String! status: String! createdAt: DateTime! }
    type PhcDetail { phcId: ID! name: String! districtId: ID! stateId: ID! totalBeds: Int! occupiedBeds: Int! oxygenCylinders: Int! riskScore: Float! riskLevel: RiskLevel! inventoryCount: Int! activeStaffCount: Int! openRequests: [ResourceRequestSummary!]! activeAlerts: [AlertSummary!]! lastSyncedAt: DateTime }
    type StockoutItem { medicineId: ID! medicineName: String! category: String! affectedPhcCount: Int! recommendedAction: String! }
    type ExpiryBatchItem { batchId: ID! medicineName: String! phcName: String! remainingQty: Int! expiryDate: String! daysToExpiry: Int! }
    type MedicineIntelligence { scope: ScopeOutput totalStockItems: Int! criticalStockouts: [StockoutItem!]! nearExpiryBatches: [ExpiryBatchItem!]! consumptionVelocityDaily: Float! daysOfSupplyAverage: Float! }
    type ResourceIntelligence { scope: ScopeOutput totalVentilators: Int! functionalVentilators: Int! totalOxygenConcentrators: Int! coldChainUnitsOptimal: Int! maintenanceRequiredCount: Int! }
    type StaffShortageDetail { phcId: ID! phcName: String! missingRole: String! consecutiveDays: Int! }
    type WorkforceIntelligence { scope: ScopeOutput totalRegisteredStaff: Int! presentToday: Int! attendanceRate: Float! doctorToPatientRatio: Float! criticalStaffShortages: [StaffShortageDetail!]! }
    type DailyFootfallPoint { date: String! count: Int! }
    type SyndromicCategoryCount { category: String! count: Int! weekOverWeekDeltaPercent: Float! }
    type PatientIntelligence { scope: ScopeOutput totalFootfallToday: Int! footfallTrendWeekly: [DailyFootfallPoint!]! syndromicCategories: [SyndromicCategoryCount!]! }
    type ForecastPrediction { id: ID! phcId: ID! medicineId: ID! medicineName: String forecastType: String! predictedValue: Float! confidenceLower: Float! confidenceUpper: Float! modelUsed: String! modelVersion: String! generatedAt: DateTime! }
    type RedistributionRecommendation { transferId: ID! sourcePhcId: ID! sourcePhcName: String! destPhcId: ID! destPhcName: String! medicineId: ID! medicineName: String! recommendedQuantity: Int! status: String! aiExplanation: String urgencyLevel: RiskLevel! createdDate: DateTime! }
    type SupplyChainShipment { id: ID! transferId: ID! sourcePhcName: String! destPhcName: String! medicineName: String! quantity: Int! status: String! trackingNumber: String dispatchedAt: DateTime estimatedDeliveryAt: DateTime deliveredAt: DateTime }
    type AuditLogEntry { id: ID! actorId: ID! actorRole: String! action: String! entityType: String! entityId: ID! beforeState: JSON afterState: JSON phcId: ID districtId: ID stateId: ID sourceIp: String deviceId: ID correlationId: String createdAt: DateTime! }
    type FederatedNode { countryCode: String! countryName: String! nodeStatus: String! activeModelVersion: String! lastTrainedAt: DateTime }
    type FederatedRound { id: ID! roundNumber: Int! modelId: String! status: String! participatingCountries: [String!]! globalLoss: Float previousEntryHash: String! thisHash: String! startedAt: DateTime! completedAt: DateTime }
    type FederatedModelVersion { id: ID! modelVersion: String! accuracyScore: Float! testAccuracyDelta: Float! status: String! releasedAt: DateTime! }
    type PrivacyBudgetEntry { id: ID! countryId: String! roundNumber: Int! epsilonConsumed: Float! cumulativeEpsilon: Float! budgetLimit: Float! withinBudget: Boolean! }

    type Query {
      nationalOverview: NationalOverview!
      stateOverview(stateId: ID!): StateOverview!
      districtOverview(districtId: ID!): DistrictOverview!
      phcDetail(phcId: ID!): PhcDetail!
      medicineIntelligence(scope: ScopeInput): MedicineIntelligence!
      resourceIntelligence(scope: ScopeInput): ResourceIntelligence!
      workforceIntelligence(scope: ScopeInput): WorkforceIntelligence!
      patientIntelligence(scope: ScopeInput): PatientIntelligence!
      forecasts(entityId: ID, metric: String): [ForecastPrediction!]!
      redistributionRecommendations(districtId: ID): [RedistributionRecommendation!]!
      supplyChainShipments(filter: ShipmentFilter): [SupplyChainShipment!]!
      auditLog(filter: AuditFilter): [AuditLogEntry!]!
      federatedNodes: [FederatedNode!]!
      federatedRounds: [FederatedRound!]!
      federatedModelVersions: [FederatedModelVersion!]!
      privacyBudgetLedger: [PrivacyBudgetEntry!]!
    }

    type Mutation {
      decideRedistribution(transferId: ID!, decision: String!, modifiedQuantity: Int, notes: String): RedistributionRecommendation!
      startFederatedRound(modelId: String!, targetEpsilon: Float!): FederatedRound!
      approveAggregatedModel(roundId: ID!, targetVersion: String!): FederatedModelVersion!
    }
  `;
}

export const compiledSchema = buildSchema(schemaText);

// Root Resolvers
export const rootResolvers = {
  // Governance Queries
  nationalOverview: async (_args: any, context: { claims: TenantClaims }) => {
    return GovernanceService.getNationalOverview(context.claims);
  },
  stateOverview: async (args: { stateId: string }, context: { claims: TenantClaims }) => {
    return GovernanceService.getStateOverview(context.claims, args.stateId);
  },
  districtOverview: async (args: { districtId: string }, context: { claims: TenantClaims }) => {
    return GovernanceService.getDistrictOverview(context.claims, args.districtId);
  },
  phcDetail: async (args: { phcId: string }, context: { claims: TenantClaims }) => {
    return GovernanceService.getPhcDetail(context.claims, args.phcId);
  },
  medicineIntelligence: async (args: { scope: any }, context: { claims: TenantClaims }) => {
    return GovernanceService.getMedicineIntelligence(context.claims, args.scope);
  },
  resourceIntelligence: async (args: { scope: any }, context: { claims: TenantClaims }) => {
    return GovernanceService.getResourceIntelligence(context.claims, args.scope);
  },
  workforceIntelligence: async (args: { scope: any }, context: { claims: TenantClaims }) => {
    return GovernanceService.getWorkforceIntelligence(context.claims, args.scope);
  },
  patientIntelligence: async (args: { scope: any }, context: { claims: TenantClaims }) => {
    return GovernanceService.getPatientIntelligence(context.claims, args.scope);
  },
  forecasts: async (args: { entityId?: string; metric?: string }, context: { claims: TenantClaims }) => {
    return GovernanceService.getForecasts(context.claims, args.entityId, args.metric);
  },
  redistributionRecommendations: async (args: { districtId?: string }, context: { claims: TenantClaims }) => {
    return GovernanceService.getRedistributionRecommendations(context.claims, args.districtId);
  },
  supplyChainShipments: async (args: { filter?: any }, context: { claims: TenantClaims }) => {
    return GovernanceService.getSupplyChainShipments(context.claims, args.filter);
  },
  auditLog: async (args: { filter?: any }, context: { claims: TenantClaims }) => {
    return GovernanceService.getAuditLog(context.claims, args.filter);
  },

  // BRICS Queries
  federatedNodes: async () => {
    return FederationService.getFederatedNodes();
  },
  federatedRounds: async () => {
    return FederationService.getFederatedRounds();
  },
  federatedModelVersions: async () => {
    return FederationService.getFederatedModelVersions();
  },
  privacyBudgetLedger: async () => {
    return FederationService.getPrivacyBudgetLedger();
  },

  // Governance Mutations
  decideRedistribution: async (
    args: { transferId: string; decision: string; modifiedQuantity?: number; notes?: string },
    context: { claims: TenantClaims },
  ) => {
    return GovernanceService.decideRedistribution(
      context.claims,
      args.transferId,
      args.decision,
      args.modifiedQuantity,
      args.notes,
    );
  },

  // BRICS Mutations
  startFederatedRound: async (
    args: { modelId: string; targetEpsilon: number },
    context: { claims: TenantClaims },
  ) => {
    return FederationService.startFederatedRound(context.claims, args.modelId, args.targetEpsilon);
  },
  approveAggregatedModel: async (
    args: { roundId: string; targetVersion: string },
    context: { claims: TenantClaims },
  ) => {
    return FederationService.approveAggregatedModel(context.claims, args.roundId, args.targetVersion);
  },
};

export const graphqlRouter = Router();

// POST /graphql
graphqlRouter.post('/graphql', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims || {
      role: 'phc_user',
      sub: 'anonymous',
    };

    const { query, variables, operationName } = req.body;
    if (!query) {
      return res.status(400).json({ errors: [{ message: 'Must provide query string.' }] });
    }

    const result = await graphql({
      schema: compiledSchema,
      source: query,
      rootValue: rootResolvers,
      contextValue: { claims, req },
      variableValues: variables,
      operationName,
    });

    const statusCode = result.errors && !result.data ? 400 : 200;
    return res.status(statusCode).json(result);
  } catch (err: any) {
    return res.status(500).json({ errors: [{ message: err.message }] });
  }
});

// GET /graphql (for health / basic testing)
graphqlRouter.get('/graphql', async (req: Request, res: Response) => {
  const query = req.query.query as string;
  if (!query) {
    return res.status(200).json({ status: 'GraphQL endpoint ready. Use POST /graphql with query payload.' });
  }
  const claims = (req as any).claims || { role: 'phc_user', sub: 'anonymous' };
  const result = await graphql({
    schema: compiledSchema,
    source: query,
    rootValue: rootResolvers,
    contextValue: { claims, req },
  });
  return res.status(200).json(result);
});
