/**
 * test_chunk14_ai_brics.ts
 *
 * Integration Test Suite — Chunk 14: AI Integration Seams & BRICS Federated Learning
 *
 * Mock Strategy: Patches Pool.prototype.connect() and Pool.prototype.query() BEFORE
 * importing any services, so all pg Pool instances (pool, adminPool) receive mock
 * data. This is the correct interception point for TypeScript modules using CommonJS
 * singleton imports.
 */

// ── Step 1: Patch pg Pool BEFORE any service imports ─────────────────────────
import { Pool } from 'pg';
import crypto from 'crypto';

let mockRows: Record<string, any[]> = {};
let lastInsertedRound: any = null;
let lastInsertedBudget: any = null;
let insertedTransfer: any = null;

function handleQuery(sql: string, params?: any[]): { rows: any[]; rowCount: number } {
  const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // Transaction control
  if (s === 'begin' || s === 'commit' || s === 'rollback') return { rows: [], rowCount: 0 };
  if (s.includes('set_config') || s.includes('get_config')) return { rows: [{ set_config: '' }], rowCount: 1 };

  // ── forecast_predictions ──────────────────────────────────────────────────
  if (s.includes('forecast_predictions') && s.includes('insert')) {
    const row = { id: 'fp-001' };
    return { rows: [row], rowCount: 1 };
  }
  if (s.includes('forecast_predictions') && s.includes('select')) {
    return { rows: mockRows['forecasts'] || [], rowCount: mockRows['forecasts']?.length || 0 };
  }
  if (s.includes('phc_facilities') && s.includes('select')) {
    return { rows: [{ district_id: 'dist-001' }], rowCount: 1 };
  }

  // ── redistribution_transfers ──────────────────────────────────────────────
  if (s.includes('redistribution_transfers') && s.includes('insert')) {
    insertedTransfer = {
      id: 'rt-001',
      source_phc_id: params?.[0] || 'phc-001',
      dest_phc_id: params?.[1] || 'phc-002',
      medicine_id: params?.[2] || 'medicine-001',
      quantity: params?.[3] || 50,
      status: 'approved',
    };
    return { rows: [insertedTransfer], rowCount: 1 };
  }
  if (s.includes('redistribution_transfers') && s.includes('select')) {
    return { rows: mockRows['transfers'] || [], rowCount: 0 };
  }

  // ── copilot_suggestions ───────────────────────────────────────────────────
  if (s.includes('copilot_suggestions') && s.includes('insert')) {
    return { rows: [{ id: 'cs-001' }], rowCount: 1 };
  }
  if (s.includes('alerts')) {
    return { rows: [], rowCount: 0 };
  }
  if (s.includes('phc_facilities')) {
    return { rows: [{ id: 'phc-001', name: 'PHC Test' }], rowCount: 1 };
  }

  // ── simulation_scenarios ──────────────────────────────────────────────────
  if (s.includes('simulation_scenarios') && s.includes('insert')) {
    return { rows: [{ id: 'ss-001' }], rowCount: 1 };
  }
  if (s.includes('simulation_scenarios') && s.includes('select')) {
    return { rows: mockRows['scenarios'] || [], rowCount: 0 };
  }

  // ── federation_rounds ─────────────────────────────────────────────────────
  if (s.includes('federation_rounds') && s.includes('insert')) {
    lastInsertedRound = {
      id: 'fr-001',
      round_number: params?.[1] ?? 1,
      model_id: params?.[2] || 'demand_forecast_v1',
      status: 'started',
      previous_entry_hash: params?.[4] || '0'.repeat(64),
      this_hash: params?.[5] || 'a'.repeat(64),
      started_at: params?.[6] || new Date().toISOString(),
      completed_at: null,
      participating_countries: ['IN', 'BR', 'CN', 'RU', 'ZA'],
      model_weights_hash: null,
      epsilon_consumed: params?.[3] || 1.0,
    };
    return { rows: [lastInsertedRound], rowCount: 1 };
  }
  if (s.includes('federation_rounds') && s.includes('update')) {
    if (lastInsertedRound) {
      lastInsertedRound.status = 'completed';
      lastInsertedRound.model_weights_hash = params?.[0];
      lastInsertedRound.completed_at = params?.[1] || new Date().toISOString();
    }
    return { rows: [lastInsertedRound || {}], rowCount: 1 };
  }
  if (s.includes('federation_rounds') && s.includes('select')) {
    return { rows: mockRows['fed_rounds'] || [], rowCount: mockRows['fed_rounds']?.length || 0 };
  }

  // ── privacy_budget_ledger ─────────────────────────────────────────────────
  if (s.includes('privacy_budget_ledger') && s.includes('insert')) {
    lastInsertedBudget = {
      id: 'pb-001',
      round_id: params?.[0],
      country_id: params?.[1],
      epsilon_consumed: params?.[2],
      delta_consumed: params?.[3],
      cumulative_epsilon: params?.[2],
      budget_limit: params?.[4] || 10.0,
      recorded_at: new Date().toISOString(),
    };
    return { rows: [lastInsertedBudget], rowCount: 1 };
  }
  if (s.includes('privacy_budget_ledger') && s.includes('select')) {
    return { rows: mockRows['budget'] || [], rowCount: 0 };
  }
  if (s.includes('max(cumulative_epsilon)')) {
    return { rows: [{ max_eps: '1.25' }], rowCount: 1 };
  }

  // audit_log / medicines / phc_facilities
  if (s.includes('audit_log') || s.includes('federation_model_versions')) {
    return { rows: [], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

(Pool.prototype as any).connect = async function () {
  return {
    query: async (sql: string, params?: any[]) => handleQuery(sql, params),
    release: () => {},
  };
};
(Pool.prototype as any).query = async function (sql: string, params?: any[]) {
  return handleQuery(sql, params);
};

// ── Step 2: Import services AFTER Pool is patched ─────────────────────────────
import { ForecastingService } from '../src/modules/ai/forecastingService';
import { OptimizationService } from '../src/modules/ai/optimizationService';
import { CopilotService } from '../src/modules/ai/copilotService';
import { SimulatorService } from '../src/modules/ai/simulatorService';
import { FederationService } from '../src/modules/federation/federationService';
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

// ── Tests ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(' Chunk 14 Integration Test Suite: AI Integration Seams & BRICS FL');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // ── 1. ForecastingService ────────────────────────────────────────────────
  await run('1. ForecastingService.forecastDemand returns a well-shaped prediction', async () => {
    const result = await ForecastingService.forecastDemand(phcUserClaims, 'phc-001', 'medicine_demand', 30);
    assert(result !== null, 'result is non-null');
    assert(typeof result.id === 'string' && result.id.length > 0, 'prediction id returned');
    assert(result.phcId === 'phc-001', 'phcId matches');
    assert(result.predictionType === 'medicine_demand', 'type matches');
    assert(Array.isArray(result.forecastPoints) && result.forecastPoints.length > 0, 'forecast points populated');
    assert(typeof result.confidenceScore === 'number', 'confidenceScore is number');
    assert(result.confidenceScore >= 0 && result.confidenceScore <= 1, 'confidenceScore in [0,1]');
    assert(typeof result.modelVersion === 'string', 'modelVersion present');
  });

  await run('2. ForecastingService.forecastDemand: disease_outbreak prediction type', async () => {
    const result = await ForecastingService.forecastDemand(phcUserClaims, 'phc-001', 'disease_outbreak', 14);
    assert(result.predictionType === 'disease_outbreak', 'disease_outbreak type returned');
    assert(typeof result.metadata === 'object' && result.metadata !== null, 'metadata object present');
    assert(result.metadata?.horizon === 14, 'horizon in metadata');
    assert(Array.isArray(result.metadata?.topRiskDiseases), 'topRiskDiseases present');
  });

  await run('3. ForecastingService.getForecasts returns array (may be empty)', async () => {
    mockRows['forecasts'] = [
      {
        id: 'fp-001', phc_id: 'phc-001', forecast_type: 'medicine_demand', horizon_days: 30,
        predicted_value: 25.0, confidence_lower: 21.25, confidence_upper: 28.75,
        confidence_score: 0.88, model_version: 'v2.4.1',
        generated_at: new Date().toISOString(),
      },
    ];
    const results = await ForecastingService.getForecasts(phcUserClaims, 'phc-001');
    assert(Array.isArray(results), 'getForecasts returns array');
    assert(results.length >= 1, 'at least one forecast returned');
    if (results.length > 0) {
      assert(results[0].phcId === 'phc-001', 'phcId matches');
    }
  });

  // ── 2. OptimizationService ───────────────────────────────────────────────
  await run('4. OptimizationService.optimizeRedistribution returns a plan', async () => {
    const result = await OptimizationService.optimizeRedistribution(nationalAdminClaims, 'medicine-001');
    assert(result !== null, 'result returned');
    assert(Array.isArray(result.transfers), 'transfers array present');
    assert(typeof result.totalOptimizationScore === 'number', 'totalOptimizationScore is number');
    assert(typeof result.estimatedSavingsPercent === 'number', 'estimatedSavingsPercent is number');
    assert(typeof result.executionReadiness === 'string', 'executionReadiness is string');
  });

  await run('5. OptimizationService.executeRedistribution creates a transfer record', async () => {
    const record = await OptimizationService.executeRedistribution(nationalAdminClaims, {
      sourcePHC: 'phc-001',
      targetPHC: 'phc-002',
      medicineId: 'medicine-001',
      quantity: 50,
    });
    assert(record !== null, 'transfer record created');
    assert(typeof record.id === 'string' && record.id.length > 0, 'record id returned');
  });

  await run('6. OptimizationService.getRedistributionHistory returns an array', async () => {
    mockRows['transfers'] = [];
    const history = await OptimizationService.getRedistributionHistory(nationalAdminClaims);
    assert(Array.isArray(history), 'history is array');
  });

  // ── 3. CopilotService ─────────────────────────────────────────────────────
  await run('7. CopilotService.generateSuggestion — inventory_reorder type', async () => {
    const result = await CopilotService.generateSuggestion(phcUserClaims, 'phc-001', 'inventory_reorder');
    assert(result !== null, 'result returned');
    assert(typeof result.title === 'string' && result.title.length > 0, 'title present');
    assert(typeof result.description === 'string', 'description present');
    assert(['low', 'medium', 'high', 'critical'].includes(result.priority), `priority valid (got: ${result.priority})`);
    assert(Array.isArray(result.actions), 'actions array present');
    assert(result.actions.length > 0, 'at least 1 action');
    assert(typeof result.confidenceScore === 'number', 'confidenceScore is number');
  });

  await run('8. CopilotService.generateSuggestion — patient_triage type', async () => {
    const result = await CopilotService.generateSuggestion(phcUserClaims, 'phc-001', 'patient_triage');
    assert(result !== null, 'result returned');
    assert(result.suggestionType === 'patient_triage', 'type matches');
    assert(typeof result.metadata === 'object' && result.metadata !== null, 'metadata present');
  });

  await run('9. CopilotService.chat returns a grounded response', async () => {
    const result = await CopilotService.chat(phcUserClaims, 'phc-001', 'What medicines are expiring soon?');
    assert(result !== null, 'chat response returned');
    assert(typeof result.message === 'string' && result.message.length > 0, 'message text present');
    assert(typeof result.sessionId === 'string', 'sessionId present');
    assert(Array.isArray(result.citations), 'citations array present');
    assert(Array.isArray(result.suggestedFollowUps), 'suggestedFollowUps present');
    assert(result.suggestedFollowUps.length > 0, 'at least 1 follow-up suggestion');
  });

  // ── 4. SimulatorService ───────────────────────────────────────────────────
  await run('10. SimulatorService.runSimulation — disease_outbreak_surge scenario', async () => {
    const result = await SimulatorService.runSimulation(nationalAdminClaims, 'phc-001', {
      scenarioType: 'disease_outbreak_surge',
      parameters: { surge_factor: 2.5, disease: 'dengue', population_at_risk: 5000 },
    });
    assert(result !== null, 'scenario returned');
    assert(typeof result.id === 'string', 'id present');
    assert(result.scenarioType === 'disease_outbreak_surge', 'scenarioType matches');
    assert(Array.isArray(result.projections), 'projections array present');
    assert(result.projections.length > 0, 'at least one projection point');
    assert(typeof result.projections[0].day === 'number', 'projection has day field');
    assert(typeof result.projections[0].predictedCases === 'number', 'projection has predictedCases');
    assert(Array.isArray(result.resourceRequirements), 'resourceRequirements present');
    assert(typeof result.riskRating === 'string', 'riskRating present');
  });

  await run('11. SimulatorService.runSimulation — supply_chain_disruption scenario', async () => {
    const result = await SimulatorService.runSimulation(nationalAdminClaims, 'phc-001', {
      scenarioType: 'supply_chain_disruption',
      parameters: { disruption_days: 14, affected_medicines: ['medicine-001', 'medicine-002'] },
    });
    assert(result !== null, 'result returned');
    assert(result.scenarioType === 'supply_chain_disruption', 'type matches');
    assert(Array.isArray(result.impactAssessment), 'impactAssessment present');
    assert(typeof result.mitigationScore === 'number', 'mitigationScore present');
  });

  await run('12. SimulatorService.getScenarios returns array', async () => {
    mockRows['scenarios'] = [];
    const list = await SimulatorService.getScenarios(nationalAdminClaims, 'phc-001');
    assert(Array.isArray(list), 'getScenarios returns array');
  });

  // ── 5. FederationService — Hash Chaining ──────────────────────────────────
  await run('13. FederationService.startFederatedRound — genesis round (no prior rounds)', async () => {
    mockRows['fed_rounds'] = [];
    lastInsertedRound = null;
    const GENESIS_HASH = '0'.repeat(64);

    const round = await FederationService.startFederatedRound(nationalAdminClaims, 'demand_forecast_v1', 1.0);
    assert(round !== null, 'round created');
    assert(typeof round.id === 'string', 'id returned');
    assert(round.roundNumber === 1, `round number is 1 for genesis (got: ${round.roundNumber})`);
    assert(round.previousEntryHash === GENESIS_HASH, 'genesis prev hash is all-zeroes');
    assert(typeof round.thisHash === 'string' && round.thisHash.length === 64, 'thisHash is 64-char hex SHA-256');
    assert(round.status === 'started', `status is 'started' (got: ${round.status})`);
  });

  await run('14. FederationService.startFederatedRound chains from previous round', async () => {
    const prevHash = 'a'.repeat(64);
    mockRows['fed_rounds'] = [{
      id: 'fr-000', round_number: 1, model_id: 'demand_forecast_v1',
      status: 'completed', this_hash: prevHash,
      previous_entry_hash: '0'.repeat(64),
      epsilon_consumed: '0.5',
    }];

    const round = await FederationService.startFederatedRound(nationalAdminClaims, 'demand_forecast_v1', 0.8);
    assert(round.previousEntryHash === prevHash, 'previousEntryHash links to previous round');
    assert(round.thisHash !== prevHash, 'thisHash is unique from prevHash');
    assert(round.roundNumber === 2, `roundNumber increments to 2 (got: ${round.roundNumber})`);

    // Verify SHA-256 determinism
    const expectedHash = crypto.createHash('sha256')
      .update(prevHash + round.roundNumber + 'demand_forecast_v1' + round.startedAt)
      .digest('hex');
    assert(round.thisHash === expectedHash, `thisHash matches expected SHA-256: ${round.thisHash.substring(0, 12)}...`);
  });

  await run('15. FederationService.completeFederatedRound marks round as completed', async () => {
    lastInsertedRound = {
      id: 'fr-001', round_number: 1, model_id: 'demand_forecast_v1', status: 'started',
      previous_entry_hash: '0'.repeat(64), this_hash: 'b'.repeat(64),
      epsilon_consumed: '1.0', started_at: new Date().toISOString(),
      completed_at: null, model_weights_hash: null,
    };
    const completed = await FederationService.completeFederatedRound(nationalAdminClaims, 'fr-001', 'modelweighthash'.padEnd(64, '0'));
    assert(completed.status === 'completed', `status is 'completed' (got: ${completed.status})`);
    assert(typeof completed.completedAt === 'string', 'completedAt set');
    assert(typeof completed.modelWeightsHash === 'string', 'modelWeightsHash set');
  });

  // ── 6. FederationService — Privacy Budget ─────────────────────────────────
  await run('16. FederationService.recordPrivacyBudget logs epsilon/delta usage', async () => {
    const budget = await FederationService.recordPrivacyBudget(nationalAdminClaims, {
      roundId: 'fr-001',
      countryId: 'IN',
      epsilonConsumed: 1.0,
      deltaConsumed: 1e-5,
    });
    assert(budget !== null, 'budget record created');
    assert(budget.roundId === 'fr-001', 'roundId matches');
    assert(budget.countryId === 'IN', 'countryId matches');
    assert(budget.epsilonConsumed === 1.0, 'epsilonConsumed matches');
    assert(typeof budget.budgetLimit === 'number', 'budgetLimit is number');
    assert(budget.withinBudget === (budget.cumulativeEpsilon <= budget.budgetLimit), 'withinBudget logic correct');
  });

  await run('17. FederationService.getPrivacyBudgetStatus returns per-country summary', async () => {
    mockRows['budget'] = [
      { country_id: 'IN', cumulative_epsilon: '3.5', budget_limit: '10.0' },
      { country_id: 'BR', cumulative_epsilon: '2.1', budget_limit: '10.0' },
    ];
    const status = await FederationService.getPrivacyBudgetStatus(nationalAdminClaims);
    assert(Array.isArray(status), 'returns array');
    assert(status.length >= 2, `at least 2 country entries (got ${status.length})`);
    const india = status.find((s: any) => s.countryId === 'IN');
    assert(india !== undefined, 'India entry found');
    assert(india?.cumulativeEpsilon === 3.5, `India cumulativeEpsilon = 3.5 (got ${india?.cumulativeEpsilon})`);
    assert(india?.withinBudget === true, 'India within budget (3.5 < 10.0)');
  });

  // ── 7. Role Enforcement ───────────────────────────────────────────────────
  await run('18. FederationService.startFederatedRound rejects non-national_admin', async () => {
    let caught = false;
    try {
      await FederationService.startFederatedRound(phcUserClaims, 'demand_forecast_v1', 1.0);
    } catch (err: any) {
      caught = true;
      assert(err.statusCode === 403 || err.message.includes('FORBIDDEN') || err.message.includes('national_admin'),
        'error is FORBIDDEN');
    }
    assert(caught, 'exception thrown for phc_user attempting to start federated round');
  });

  await run('19. FederationService.completeFederatedRound rejects non-national_admin', async () => {
    let caught = false;
    try {
      await FederationService.completeFederatedRound(phcUserClaims, 'fr-001', 'fakehash'.padEnd(64, '0'));
    } catch (err: any) {
      caught = true;
      assert(err.statusCode === 403 || err.message.includes('FORBIDDEN') || err.message.includes('national_admin'),
        'error is FORBIDDEN');
    }
    assert(caught, 'exception thrown for phc_user completing federated round');
  });

  await run('20. FederationService.recordPrivacyBudget rejects non-national_admin', async () => {
    let caught = false;
    try {
      await FederationService.recordPrivacyBudget(phcUserClaims, {
        roundId: 'fr-001', countryId: 'IN', epsilonConsumed: 0.5, deltaConsumed: 1e-5,
      });
    } catch (err: any) {
      caught = true;
      assert(err.statusCode === 403 || err.message.includes('FORBIDDEN') || err.message.includes('national_admin'),
        'error is FORBIDDEN');
    }
    assert(caught, 'exception thrown for unauthorized recordPrivacyBudget');
  });

  // ── 8. Hash-chain integrity ───────────────────────────────────────────────
  await run('21. FederationService.GENESIS_HASH is 64 zero characters', async () => {
    assert(FederationService.GENESIS_HASH === '0'.repeat(64), 'GENESIS_HASH is 64 zeroes');
  });

  await run('22. FederationService.computeRoundHash is deterministic', async () => {
    const prevHash = 'c'.repeat(64);
    const roundNumber = 5;
    const modelId = 'resource_optimizer_v2';
    const startedAt = '2026-01-15T10:00:00.000Z';
    const expected = crypto.createHash('sha256')
      .update(prevHash + roundNumber + modelId + startedAt)
      .digest('hex');
    const actual = FederationService.computeRoundHash(prevHash, roundNumber, modelId, startedAt);
    assert(actual === expected, `hash is deterministic: ${actual.substring(0, 16)}...`);
  });

  await run('23. FederationService.computeRoundHash: different inputs → different hashes', async () => {
    const base = '0'.repeat(64);
    const h1 = FederationService.computeRoundHash(base, 1, 'model_v1', '2026-01-01T00:00:00.000Z');
    const h2 = FederationService.computeRoundHash(base, 2, 'model_v1', '2026-01-01T00:00:00.000Z');
    assert(h1 !== h2, 'different round numbers → different hashes');
    const h3 = FederationService.computeRoundHash(base, 1, 'model_v2', '2026-01-01T00:00:00.000Z');
    assert(h1 !== h3, 'different model IDs → different hashes');
    const h4 = FederationService.computeRoundHash('d'.repeat(64), 1, 'model_v1', '2026-01-01T00:00:00.000Z');
    assert(h1 !== h4, 'different prevHash → different hashes');
  });

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`Chunk 14 Tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.error('\nFailed assertions:');
    failures.forEach((f) => console.error(`  • ${f}`));
    process.exit(1);
  } else {
    console.log('All Chunk 14 tests passed ✅');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
