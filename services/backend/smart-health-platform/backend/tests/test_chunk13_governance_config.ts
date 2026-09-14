/**
 * test_chunk13_governance_config.ts
 *
 * Integration Test Suite — Chunk 13: Governance Read Layer & Configuration Management
 *
 * Mock Strategy: Patches pool.connect() and adminPool.query() on the INSTANCES
 * (not the module exports) so that withTenantContext and direct adminPool calls
 * both get mock data. This works because pool/adminPool are singletons created
 * at import time; mutating their prototype methods intercepts all calls.
 */

// ── Step 1: Patch pg Pool BEFORE any other imports ───────────────────────────
import { Pool } from 'pg';

let mockRows: Record<string, any[]> = {};

// Universal query handler shared by both pool client and adminPool
function handleQuery(sql: string, _params?: any[]): { rows: any[]; rowCount: number } {
  const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // CacheService / Redis — not in scope, no-op
  if (s.includes('set_config') || s.includes('get_config')) return { rows: [{ set_config: '' }], rowCount: 1 };

  // Transaction control
  if (s === 'begin' || s === 'commit' || s === 'rollback') return { rows: [], rowCount: 0 };

  // nationalOverview queries ──────────────────────────────────────────────────
  if (s.includes('count(*)') && s.includes('from phc_facilities') && s.includes('total_beds')) {
    return {
      rows: [{ total_phcs: 120, active_phcs: 118, total_beds: 2400, occupied_beds: 1680, oxygen_cylinders: 340 }],
      rowCount: 1,
    };
  }
  // alerts aggregate
  if (s.includes('from alerts') && s.includes('count(*)') && s.includes('where status')) {
    return { rows: [{ open_alerts: 12, critical_alerts: 3, critical_phcs: 2 }], rowCount: 1 };
  }
  // staff_shortage alerts
  if (s.includes('from alerts') && s.includes("alert_type = 'staff_shortage'")) {
    return { rows: [{ shortage_phcs: 5 }], rowCount: 1 };
  }
  // redistribution pending
  if (s.includes('from redistribution_transfers') && s.includes('pending_redist')) {
    return { rows: [{ pending_redist: 8 }], rowCount: 1 };
  }

  // stateOverview ─────────────────────────────────────────────────────────────
  if (s.includes('from states') && s.includes('where id')) {
    return { rows: [{ name: 'Madhya Pradesh' }], rowCount: 1 };
  }
  if (s.includes('from districts') && s.includes('left join phc_facilities') && s.includes('where d.state_id')) {
    return {
      rows: [
        { district_id: 'dist-001', district_name: 'Bhopal', total_phcs: 30, active_phcs: 29, total_beds: 600, occupied_beds: 420 },
        { district_id: 'dist-002', district_name: 'Indore', total_phcs: 25, active_phcs: 24, total_beds: 500, occupied_beds: 330 },
      ],
      rowCount: 2,
    };
  }

  // districtOverview ──────────────────────────────────────────────────────────
  if (s.includes('from districts') && s.includes('where id')) {
    return { rows: [{ name: 'Bhopal', state_id: 'state-001' }], rowCount: 1 };
  }
  if (s.includes('from phc_facilities') && s.includes('where f.district_id')) {
    return {
      rows: [
        { phc_id: 'phc-001', name: 'PHC Bhopal Central', total_beds: 20, occupied_beds: 14, oxygen_cylinders: 8, latitude: null, longitude: null },
      ],
      rowCount: 1,
    };
  }

  // phcDetail ─────────────────────────────────────────────────────────────────
  if (s.includes('from phc_facilities') && s.includes('where id')) {
    return {
      rows: [{ id: 'phc-001', name: 'PHC Bhopal', district_id: 'dist-001', state_id: 'state-001', total_beds: 20, occupied_beds: 15, oxygen_cylinders_available: 8 }],
      rowCount: 1,
    };
  }
  // phcDetail inventory count (simple count query, no joins)
  if (s.includes('from inventory_batches') && s.includes('count(*)') && !s.includes('join')) {
    return { rows: [{ count: 35 }], rowCount: 1 };
  }
  if (s.includes('from staff_registry') && s.includes('active = true')) {
    return { rows: [{ count: 12 }], rowCount: 1 };
  }
  if (s.includes('from resource_requests') && s.includes("status = 'pending'")) {
    return { rows: [], rowCount: 0 };
  }
  if (s.includes('from alerts') && s.includes("status = 'open'") && s.includes('phc_id')) {
    return { rows: [], rowCount: 0 };
  }

  // medicineIntelligence ──────────────────────────────────────────────────────
  // Near-expiry join query: inventory_batches JOIN medicines JOIN phc_facilities
  if (s.includes('inventory_batches') && s.includes('join medicines')) {
    // Return empty so ExpiryBatchItem list is empty (avoids null non-nullable fields)
    return { rows: [], rowCount: 0 };
  }
  // Count of medicines (totalStockItems)
  if (s.includes('from medicines')) {
    return { rows: [{ total: 248 }], rowCount: 1 };
  }

  // resourceIntelligence ──────────────────────────────────────────────────────
  if (s.includes('from equipment') && s.includes('ventilator')) {
    return { rows: [{ total_vents: 45, func_vents: 42, total_o2: 68, maintenance_count: 3 }], rowCount: 1 };
  }
  if (s.includes('from equipment')) {
    return { rows: [{ total_vents: 45, func_vents: 42, total_o2: 68, maintenance_count: 3 }], rowCount: 1 };
  }

  // workforceIntelligence ─────────────────────────────────────────────────────
  if (s.includes('from staff_registry') && s.includes('count(*)')) {
    return { rows: [{ total: 450, present: 430 }], rowCount: 1 };
  }
  if (s.includes('from attendance_records') || s.includes('attendance')) {
    return { rows: [{ present_count: 430 }], rowCount: 1 };
  }

  // patientIntelligence ───────────────────────────────────────────────────────
  if (s.includes('from patient_footfall') || s.includes('footfall')) {
    return {
      rows: [
        { category: 'opd', total: 128 },
        { category: 'ipd', total: 34 },
      ],
      rowCount: 2,
    };
  }

  // system_config ─────────────────────────────────────────────────────────────
  if (s.includes('from system_config') && s.includes('select')) {
    return { rows: mockRows['system_config'] || [], rowCount: mockRows['system_config']?.length || 0 };
  }
  if (s.includes('insert into system_config') || (s.includes('system_config') && s.includes('insert'))) {
    return {
      rows: [{
        config_key: 'min_stock_threshold_pct',
        config_value: '25',
        scope: 'global',
        scope_id: null,
        description: 'Test update',
        updated_by: 'national_admin',
        updated_at: new Date().toISOString(),
      }],
      rowCount: 1,
    };
  }
  if (s.includes('system_config') && s.includes('on conflict')) {
    return {
      rows: [{
        config_key: 'min_stock_threshold_pct',
        config_value: '25',
        scope: 'global',
        scope_id: null,
        description: 'Test update',
        updated_by: 'national_admin',
        updated_at: new Date().toISOString(),
      }],
      rowCount: 1,
    };
  }

  // audit_log insert
  if (s.includes('audit_log')) {
    return { rows: [], rowCount: 1 };
  }

  // federation_rounds
  if (s.includes('from federation_rounds')) {
    return { rows: mockRows['fed_rounds'] || [], rowCount: 0 };
  }

  // privacy_budget_ledger
  if (s.includes('from privacy_budget_ledger')) {
    return { rows: mockRows['budget'] || [], rowCount: 0 };
  }

  // Default
  return { rows: [], rowCount: 0 };
}

// Patch Pool prototype so ALL Pool instances get mock behaviour
const origConnect = Pool.prototype.connect;
(Pool.prototype as any).connect = async function () {
  return {
    query: async (sql: string, params?: any[]) => handleQuery(sql, params),
    release: () => {},
  };
};
(Pool.prototype as any).query = async function (sql: string, params?: any[]) {
  return handleQuery(sql, params);
};

// ── Step 2: Now import services (after pool is patched) ────────────────────────
import { graphql } from 'graphql';
import { compiledSchema, rootResolvers } from '../src/modules/governance/graphqlServer';
import { ConfigService } from '../src/modules/config/configService';
import { CacheService } from '../src/db/redis';
import { TenantClaims } from '../src/db/pool';

// ── Test Harness ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string): void {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else { console.error(`  ❌ ${label}`); failed++; failures.push(label); }
}

async function run(label: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n▶ ${label}`);
  try { await fn(); }
  catch (err: any) {
    console.error(`  💥 Threw: ${err.message}`);
    failed++;
    failures.push(`${label} — threw: ${err.message}`);
  }
}

const nationalAdminClaims: TenantClaims = { role: 'national_admin', sub: 'user-001' };
const phcUserClaims: TenantClaims = { role: 'phc_user', sub: 'user-phc-01', phcId: 'phc-001' };

async function gql(query: string, claims: TenantClaims = nationalAdminClaims, variables: any = {}): Promise<any> {
  return graphql({
    schema: compiledSchema,
    source: query,
    rootValue: rootResolvers,
    contextValue: { claims },
    variableValues: variables,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(' Chunk 13 Integration Test Suite: Governance Read Layer & Config');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  CacheService.clear();

  // 1. Schema compiled
  await run('1. GraphQL schema compiled and all resolvers registered', async () => {
    assert(compiledSchema !== null, 'compiledSchema is non-null');
    assert(typeof rootResolvers.nationalOverview === 'function', 'nationalOverview registered');
    assert(typeof rootResolvers.stateOverview === 'function', 'stateOverview registered');
    assert(typeof rootResolvers.federatedNodes === 'function', 'federatedNodes registered');
    assert(typeof rootResolvers.privacyBudgetLedger === 'function', 'privacyBudgetLedger registered');
  });

  // 2. nationalOverview
  await run('2. nationalOverview returns governance metrics', async () => {
    CacheService.clear();
    const result = await gql(`query { nationalOverview { totalPhcs activePhcs criticalPhcs totalBeds occupiedBeds bedOccupancyRate oxygenCylindersAvailable openAlertsCount criticalAlertsCount staffShortagePhcCount pendingRedistributionsCount lastUpdated } }`);
    assert(!result.errors, `no GraphQL errors (got: ${JSON.stringify(result.errors)})`);
    const o = result.data?.nationalOverview;
    assert(o !== null && o !== undefined, 'nationalOverview data returned');
    assert(typeof o?.totalPhcs === 'number', `totalPhcs is number (got: ${typeof o?.totalPhcs})`);
    assert(typeof o?.bedOccupancyRate === 'number', 'bedOccupancyRate is number');
    assert(typeof o?.lastUpdated === 'string', 'lastUpdated present');
  });

  // 3. Redis caching
  await run('3. nationalOverview is cached — second call returns same lastUpdated', async () => {
    CacheService.clear();
    const r1 = await gql(`query { nationalOverview { lastUpdated totalPhcs } }`);
    const r2 = await gql(`query { nationalOverview { lastUpdated totalPhcs } }`);
    assert(!r1.errors, 'first call no errors');
    assert(!r2.errors, 'second call no errors');
    assert(r1.data?.nationalOverview?.lastUpdated === r2.data?.nationalOverview?.lastUpdated,
      'cache hit: same lastUpdated on second call');
  });

  // 4. stateOverview
  await run('4. stateOverview returns state rollup with districts', async () => {
    CacheService.clear();
    const result = await gql(`query { stateOverview(stateId: "state-001") { stateId stateName totalDistricts totalPhcs bedOccupancyRate lastUpdated districts { districtId districtName totalPhcs bedOccupancyRate } } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.stateOverview;
    assert(o?.stateId === 'state-001', 'stateId returned');
    assert(typeof o?.totalPhcs === 'number', 'totalPhcs is number');
    assert(Array.isArray(o?.districts), 'districts is array');
    assert(o.districts.length >= 1, 'at least 1 district');
  });

  // 5. districtOverview
  await run('5. districtOverview returns PHC list', async () => {
    const result = await gql(`query { districtOverview(districtId: "dist-001") { districtId districtName totalPhcs phcList { phcId name totalBeds riskLevel } lastUpdated } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.districtOverview;
    assert(o?.districtId === 'dist-001', 'districtId returned');
    assert(typeof o?.totalPhcs === 'number', 'totalPhcs is number');
    assert(Array.isArray(o?.phcList), 'phcList is array');
  });

  // 6. phcDetail
  await run('6. phcDetail returns complete PHC profile', async () => {
    const result = await gql(`query { phcDetail(phcId: "phc-001") { phcId name districtId stateId totalBeds occupiedBeds oxygenCylinders riskScore riskLevel inventoryCount activeStaffCount openRequests { id requestType status } activeAlerts { id alertType severity } lastSyncedAt } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.phcDetail;
    assert(o?.phcId === 'phc-001', 'phcId returned');
    assert(typeof o?.riskScore === 'number', 'riskScore is number');
    assert(Array.isArray(o?.openRequests), 'openRequests is array');
    assert(Array.isArray(o?.activeAlerts), 'activeAlerts is array');
  });

  // 7. medicineIntelligence
  await run('7. medicineIntelligence returns stock intelligence', async () => {
    const result = await gql(`query { medicineIntelligence { totalStockItems criticalStockouts { medicineId medicineName } nearExpiryBatches { batchId medicineName daysToExpiry } consumptionVelocityDaily daysOfSupplyAverage } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.medicineIntelligence;
    assert(typeof o?.totalStockItems === 'number', 'totalStockItems is number');
    assert(Array.isArray(o?.criticalStockouts), 'criticalStockouts is array');
    assert(Array.isArray(o?.nearExpiryBatches), 'nearExpiryBatches is array');
    assert(typeof o?.daysOfSupplyAverage === 'number', 'daysOfSupplyAverage is number');
  });

  // 8. resourceIntelligence
  await run('8. resourceIntelligence returns equipment metrics', async () => {
    const result = await gql(`query { resourceIntelligence { totalVentilators functionalVentilators totalOxygenConcentrators coldChainUnitsOptimal maintenanceRequiredCount } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.resourceIntelligence;
    assert(typeof o?.totalVentilators === 'number', 'totalVentilators is number');
    assert(typeof o?.maintenanceRequiredCount === 'number', 'maintenanceRequiredCount is number');
  });

  // 9. workforceIntelligence
  await run('9. workforceIntelligence returns staffing metrics', async () => {
    const result = await gql(`query { workforceIntelligence { totalRegisteredStaff presentToday attendanceRate doctorToPatientRatio criticalStaffShortages { phcId missingRole } } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.workforceIntelligence;
    assert(typeof o?.totalRegisteredStaff === 'number', 'totalRegisteredStaff is number');
    assert(typeof o?.attendanceRate === 'number', 'attendanceRate is number');
    assert(Array.isArray(o?.criticalStaffShortages), 'criticalStaffShortages is array');
  });

  // 10. patientIntelligence
  await run('10. patientIntelligence returns footfall trends', async () => {
    const result = await gql(`query { patientIntelligence { totalFootfallToday footfallTrendWeekly { date count } syndromicCategories { category count weekOverWeekDeltaPercent } } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const o = result.data?.patientIntelligence;
    assert(typeof o?.totalFootfallToday === 'number', 'totalFootfallToday is number');
    assert(Array.isArray(o?.footfallTrendWeekly), 'footfallTrendWeekly is array');
    assert(o?.footfallTrendWeekly.length >= 1, 'at least 1 trend entry');
    assert(Array.isArray(o?.syndromicCategories), 'syndromicCategories is array');
  });

  // 11. Config: global default
  await run('11. ConfigService returns global default when no DB record exists', async () => {
    mockRows['system_config'] = [];
    const val = await ConfigService.getConfig('min_stock_threshold_pct');
    assert(val === '20', `global default returned: ${val}`);
    const horizon = await ConfigService.getConfig('forecast_horizon_days');
    assert(horizon === '30', `forecast_horizon default: ${horizon}`);
  });

  // 12. Config: PHC override
  await run('12. ConfigService PHC scope overrides global default', async () => {
    mockRows['system_config'] = [
      { config_key: 'min_stock_threshold_pct', config_value: '30', scope: 'phc', scope_id: 'phc-001' },
    ];
    const val = await ConfigService.getConfig('min_stock_threshold_pct', { phcId: 'phc-001' });
    assert(val === '30', `PHC override returned: ${val}`);
  });

  // 13. Config: authority enforcement
  await run('13. ConfigService rejects phc_user updating global config', async () => {
    let caught = false;
    try {
      await ConfigService.setConfig(phcUserClaims, 'min_stock_threshold_pct', '50', 'global', null);
    } catch (err: any) {
      caught = true;
      assert(err.statusCode === 403 || err.message.includes('FORBIDDEN'), 'error is FORBIDDEN');
    }
    assert(caught, 'exception thrown for unauthorized config update');
  });

  // 14. Config: national_admin can update global config
  await run('14. ConfigService allows national_admin to update global config', async () => {
    mockRows['system_config'] = [];
    const updated = await ConfigService.setConfig(nationalAdminClaims, 'min_stock_threshold_pct', '25', 'global', null, 'Updated by test');
    assert(updated !== null && updated !== undefined, 'updated row returned');
    assert(updated.config_key === 'min_stock_threshold_pct', 'key matches');
    assert(updated.config_value === '25', `value matches: ${updated.config_value}`);
  });

  // 15. Config sync deltas
  await run('15. ConfigService getConfigDeltasSince returns array', async () => {
    const deltas = await ConfigService.getConfigDeltasSince('phc-001', new Date(0).toISOString());
    assert(Array.isArray(deltas), 'getConfigDeltasSince returns array');
  });

  // 16. BRICS federatedNodes
  await run('16. federatedNodes returns 5 BRICS nations', async () => {
    const result = await gql(`query { federatedNodes { countryCode countryName nodeStatus activeModelVersion lastTrainedAt } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const nodes = result.data?.federatedNodes;
    assert(Array.isArray(nodes), 'federatedNodes is array');
    assert(nodes.length === 5, `exactly 5 BRICS nodes (got ${nodes?.length})`);
    const codes = nodes.map((n: any) => n.countryCode);
    assert(codes.includes('IN'), 'India present');
    assert(codes.includes('BR'), 'Brazil present');
    assert(codes.includes('ZA'), 'South Africa present');
  });

  // 17. federatedRounds
  await run('17. federatedRounds returns hash-chained round(s)', async () => {
    mockRows['fed_rounds'] = [];
    const result = await gql(`query { federatedRounds { id roundNumber modelId status previousEntryHash thisHash startedAt } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const rounds = result.data?.federatedRounds;
    assert(Array.isArray(rounds) && rounds.length > 0, `at least 1 federated round (got ${rounds?.length})`);
    const round = rounds[0];
    assert(typeof round.previousEntryHash === 'string' && round.previousEntryHash.length === 64,
      'previousEntryHash is 64-char hex');
    assert(typeof round.thisHash === 'string' && round.thisHash.length === 64,
      'thisHash is 64-char SHA-256 hex');
  });

  // 18. privacyBudgetLedger
  await run('18. privacyBudgetLedger returns epsilon entries per country', async () => {
    mockRows['budget'] = [];
    const result = await gql(`query { privacyBudgetLedger { id countryId roundNumber epsilonConsumed cumulativeEpsilon budgetLimit withinBudget } }`);
    assert(!result.errors, `no errors: ${JSON.stringify(result.errors)}`);
    const ledger = result.data?.privacyBudgetLedger;
    assert(Array.isArray(ledger) && ledger.length > 0, `ledger entries returned (got ${ledger?.length})`);
    for (const entry of ledger) {
      assert(entry.withinBudget === (entry.cumulativeEpsilon <= entry.budgetLimit),
        `withinBudget correct for ${entry.countryId}`);
    }
  });

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`Chunk 13 Tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.error('\nFailed assertions:');
    failures.forEach((f) => console.error(`  • ${f}`));
    process.exit(1);
  } else {
    console.log('All Chunk 13 tests passed ✅');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
