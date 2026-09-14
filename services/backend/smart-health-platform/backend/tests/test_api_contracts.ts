/**
 * API Contracts & Schema Validation Test Suite (Prompt 5)
 *
 * Verifies:
 *  1. OpenAPI 3.0.3 YAML existence and structure (PHC REST + Offline Sync + Auth)
 *  2. GraphQL Schema existence and query definitions (Governance + BRICS)
 *  3. Exported TypeScript type definitions from @smart-health/api-contracts
 */

import fs from 'fs';
import path from 'path';

function assert(label: string, condition: boolean, detail?: string) {
  const icon = condition ? '✓' : '✗';
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`  ${icon} [${status}] ${label}${detail ? ` (${detail})` : ''}`);
  if (!condition) {
    process.exitCode = 1;
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' API Contracts & Shared Types Validation (Prompt 5)');
  console.log('══════════════════════════════════════════════════════\n');

  const contractsRoot = path.resolve(__dirname, '../../packages/api-contracts');
  const openApiPath = path.join(contractsRoot, 'openapi/openapi.yaml');
  const graphQlPath = path.join(contractsRoot, 'graphql/schema.graphql');

  // ---------------------------------------------------------------------------
  // 1. OpenAPI Specification Validation
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 1: OpenAPI 3.0.3 Specification');
  assert('openapi.yaml file exists', fs.existsSync(openApiPath));

  const openApiContent = fs.readFileSync(openApiPath, 'utf8');
  assert('OpenAPI version is 3.0.3', openApiContent.includes('openapi: 3.0.3'));

  // Assert essential sync endpoints per §8.2
  assert('Sync push endpoint defined (/sync/push)', openApiContent.includes('/sync/push:'));
  assert('Sync pull endpoint defined (/sync/pull)', openApiContent.includes('/sync/pull:'));
  assert('SyncPushRequest schema defined', openApiContent.includes('SyncPushRequest:'));
  assert('MutationResult schema defined', openApiContent.includes('MutationResult:'));
  assert('ConflictDetail schema defined', openApiContent.includes('ConflictDetail:'));
  assert('stock_oversold conflict type defined', openApiContent.includes('stock_oversold'));

  // Assert essential PHC REST endpoints
  assert('Facility endpoint defined (/api/v1/phc/{phcId}/facility)', openApiContent.includes('/api/v1/phc/{phcId}/facility:'));
  assert('Inventory endpoint defined (/api/v1/phc/{phcId}/inventory)', openApiContent.includes('/api/v1/phc/{phcId}/inventory:'));
  assert('Billing checkout defined (/api/v1/phc/{phcId}/billing/checkout)', openApiContent.includes('/api/v1/phc/{phcId}/billing/checkout:'));
  assert('Equipment endpoint defined (/api/v1/phc/{phcId}/equipment)', openApiContent.includes('/api/v1/phc/{phcId}/equipment:'));
  assert('Staff attendance defined (/api/v1/phc/{phcId}/staff/attendance)', openApiContent.includes('/api/v1/phc/{phcId}/staff/attendance:'));
  assert('Footfall endpoint defined (/api/v1/phc/{phcId}/footfall)', openApiContent.includes('/api/v1/phc/{phcId}/footfall:'));
  assert('Requests endpoint defined (/api/v1/phc/{phcId}/requests)', openApiContent.includes('/api/v1/phc/{phcId}/requests:'));
  assert('Emergency endpoint defined (/api/v1/phc/{phcId}/emergency)', openApiContent.includes('/api/v1/phc/{phcId}/emergency:'));
  assert('Alerts endpoint defined (/api/v1/phc/{phcId}/alerts)', openApiContent.includes('/api/v1/phc/{phcId}/alerts:'));
  console.log('└─ OpenAPI Specification OK\n');

  // ---------------------------------------------------------------------------
  // 2. GraphQL Schema Validation
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 2: GraphQL Schema Specification');
  assert('schema.graphql file exists', fs.existsSync(graphQlPath));

  const graphQlContent = fs.readFileSync(graphQlPath, 'utf8');

  // Governance root query fields
  assert('Query.nationalOverview defined', graphQlContent.includes('nationalOverview: NationalOverview!'));
  assert('Query.stateOverview defined', graphQlContent.includes('stateOverview(stateId: ID!): StateOverview!'));
  assert('Query.districtOverview defined', graphQlContent.includes('districtOverview(districtId: ID!): DistrictOverview!'));
  assert('Query.phcDetail defined', graphQlContent.includes('phcDetail(phcId: ID!): PhcDetail!'));
  assert('Query.medicineIntelligence defined', graphQlContent.includes('medicineIntelligence(scope: ScopeInput): MedicineIntelligence!'));
  assert('Query.resourceIntelligence defined', graphQlContent.includes('resourceIntelligence(scope: ScopeInput): ResourceIntelligence!'));
  assert('Query.workforceIntelligence defined', graphQlContent.includes('workforceIntelligence(scope: ScopeInput): WorkforceIntelligence!'));
  assert('Query.patientIntelligence defined', graphQlContent.includes('patientIntelligence(scope: ScopeInput): PatientIntelligence!'));
  assert('Query.forecasts defined', graphQlContent.includes('forecasts(entityId: ID, metric: String): [ForecastPrediction!]!'));
  assert('Query.redistributionRecommendations defined', graphQlContent.includes('redistributionRecommendations(districtId: ID): [RedistributionRecommendation!]!'));
  assert('Query.supplyChainShipments defined', graphQlContent.includes('supplyChainShipments(filter: ShipmentFilter): [SupplyChainShipment!]!'));
  assert('Query.auditLog defined', graphQlContent.includes('auditLog(filter: AuditFilter): [AuditLogEntry!]!'));

  // BRICS federation query fields
  assert('Query.federatedNodes defined', graphQlContent.includes('federatedNodes: [FederatedNode!]!'));
  assert('Query.federatedRounds defined', graphQlContent.includes('federatedRounds: [FederatedRound!]!'));
  assert('Query.federatedModelVersions defined', graphQlContent.includes('federatedModelVersions: [FederatedModelVersion!]!'));
  assert('Query.privacyBudgetLedger defined', graphQlContent.includes('privacyBudgetLedger: [PrivacyBudgetEntry!]!'));

  // Mutations
  assert('Mutation.decideRedistribution defined', graphQlContent.includes('decideRedistribution('));
  assert('Mutation.startFederatedRound defined', graphQlContent.includes('startFederatedRound('));
  console.log('└─ GraphQL Schema OK\n');

  // ---------------------------------------------------------------------------
  // 3. Generated TypeScript Declarations Validation
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 3: Generated TypeScript Types (dist/*.d.ts)');
  const distDir = path.join(contractsRoot, 'dist');
  assert('dist/ directory exists', fs.existsSync(distDir));
  assert('dist/index.d.ts exists', fs.existsSync(path.join(distDir, 'index.d.ts')));
  assert('dist/rest.d.ts exists', fs.existsSync(path.join(distDir, 'rest.d.ts')));
  assert('dist/sync.d.ts exists', fs.existsSync(path.join(distDir, 'sync.d.ts')));
  assert('dist/graphql.d.ts exists', fs.existsSync(path.join(distDir, 'graphql.d.ts')));

  // Test runtime require of the compiled package
  const compiledPackage = require(path.join(distDir, 'index.js'));
  assert('Compiled package exports CONTRACT_PATHS', !!compiledPackage.CONTRACT_PATHS);
  assert('CONTRACT_PATHS.openApiYaml points to openapi.yaml', compiledPackage.CONTRACT_PATHS.openApiYaml.includes('openapi.yaml'));
  assert('CONTRACT_PATHS.graphQlSchema points to schema.graphql', compiledPackage.CONTRACT_PATHS.graphQlSchema.includes('schema.graphql'));
  console.log('└─ Generated TypeScript Types OK\n');

  console.log('══════════════════════════════════════════════════════');
  if (process.exitCode === 1) {
    console.log(' ✗  API Contracts validation FAILED');
  } else {
    console.log(' ✓  All API Contracts & Shared Types PASSED');
  }
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
