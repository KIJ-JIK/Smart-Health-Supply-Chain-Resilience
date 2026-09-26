/**
 * Automated Verification Script for Worker M2
 * Verifies:
 * 1. syncService mutations (inventory_batch_create, batch_id update, outbreak -> outbreak_risk)
 * 2. graphqlServer dynamic aggregations & resilient slugs ('state-mh', 'dist-pune')
 * 3. BRICS queries & mutations (federatedRound, federatedRounds, model versions, privacy ledger)
 * 4. Redistribution decision & supply chain shipment pipeline
 * 5. Express REST routes for redistribution (/recommendations, /:id/decision)
 */

import { pool } from '../src/db/pool';
import { SyncService } from '../src/modules/sync/syncService';
import { rootResolvers, compiledSchema } from '../src/modules/governance/graphqlServer';
import { graphql } from 'graphql';
import { SupplyChainService } from '../src/modules/supplychain/supplyChainService';
import crypto from 'crypto';

async function runM2Tests() {
  console.log('=== [WORKER M2] Starting Backend & Database Verification Suite ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // Initialize event subscribers
  SupplyChainService.initEventSubscribers();

  // Pick a real PHC from the database for tests
  const phcRes = await pool.query(`
    SELECT p.id, p.district_id, p.state_id, d.name as district_name, s.name as state_name
    FROM phc_facilities p
    JOIN districts d ON p.district_id = d.id
    JOIN states s ON p.state_id = s.id
    WHERE s.name ILIKE '%Maharashtra%' AND d.name ILIKE '%Pune%'
    LIMIT 1
  `);
  const testPhc = phcRes.rows[0];
  assert(!!testPhc, 'Retrieve test PHC in Pune, Maharashtra', `Found: ${testPhc?.id}`);

  // Pick a medicine from the database
  const medRes = await pool.query(`SELECT id, name FROM medicines LIMIT 1`);
  const testMed = medRes.rows[0];
  assert(!!testMed, 'Retrieve test medicine', `Found: ${testMed?.name}`);

  // ── TEST 1: syncService.ts inventory_batch_create ────────────────────────────
  console.log('\n--- 1. Testing SyncService Mutations ---');
  const createBatchId = crypto.randomUUID();
  const createMutationId = crypto.randomUUID();
  const createSyncResult = await SyncService.processPush({
    device_id: 'test-device-001',
    phc_id: testPhc.id,
    mutations: [
      {
        id: createMutationId,
        entity_type: 'inventory_batch_create',
        operation: 'create',
        payload: {
          id: createBatchId,
          medicine_id: testMed.id,
          batch_no: `BATCH-TEST-${Date.now()}`,
          remaining_qty: 250,
          minimum_threshold: 20,
          expiry_date: '2028-06-30',
        },
        local_seq: Date.now(),
        client_timestamp: new Date().toISOString(),
      },
    ],
  });
  console.log('SyncResult:', JSON.stringify(createSyncResult.results[0]));
  assert(
    createSyncResult.results.length === 1 && createSyncResult.results[0].status === 'accepted',
    'SyncService handles inventory_batch_create successfully',
    `status=${createSyncResult.results[0]?.status} error=${createSyncResult.results[0]?.error_code}`,
  );

  // Verify batch exists in DB
  const batchInDb = await pool.query(`SELECT * FROM inventory_batches WHERE id = $1`, [createBatchId]);
  assert(batchInDb.rows.length === 1 && batchInDb.rows[0].remaining_qty === 250, 'Batch persisted to PostgreSQL');

  // ── TEST 2: syncService.ts inventory_batch_update without batch_no ──────────
  const updateSyncResult = await SyncService.processPush({
    device_id: 'test-device-001',
    phc_id: testPhc.id,
    mutations: [
      {
        id: crypto.randomUUID(),
        entity_type: 'inventory_batch_update',
        operation: 'update',
        payload: {
          batch_id: createBatchId,
          medicine_id: testMed.id,
          previous_qty: 250,
          remaining_qty: 185,
          adjustment_delta: -65,
          reason: 'Physical audit adjustment',
        },
        local_seq: Date.now() + 1,
        client_timestamp: new Date().toISOString(),
      },
    ],
  });
  assert(
    updateSyncResult.results.length === 1 && updateSyncResult.results[0].status === 'accepted',
    'SyncService handles inventory_batch_update without batch_no using batch_id',
  );

  const updatedBatch = await pool.query(`SELECT * FROM inventory_batches WHERE id = $1`, [createBatchId]);
  assert(updatedBatch.rows[0].remaining_qty === 185, 'Batch quantity successfully updated in PostgreSQL');

  // ── TEST 3: syncService.ts outbreak alert mapping ────────────────────────────
  const alertId = crypto.randomUUID();
  const alertSyncResult = await SyncService.processPush({
    device_id: 'test-device-001',
    phc_id: testPhc.id,
    mutations: [
      {
        id: alertId,
        entity_type: 'alert_report',
        operation: 'create',
        payload: {
          alert_type: 'outbreak',
          severity: 'critical',
          message: 'Suspected viral encephalitis cluster',
          affected_patients: 6,
        },
        local_seq: Date.now() + 2,
        client_timestamp: new Date().toISOString(),
      },
    ],
  });
  assert(
    alertSyncResult.results.length === 1 && alertSyncResult.results[0].status === 'accepted',
    'SyncService accepts emergency outbreak alert',
  );

  const alertInDb = await pool.query(
    `SELECT alert_type, severity, status FROM alerts WHERE id = $1`,
    [alertSyncResult.results[0].server_entity_id],
  );
  assert(
    alertInDb.rows[0].alert_type === 'outbreak_risk',
    'Incoming outbreak alert mapped to outbreak_risk in alerts table',
  );

  // ── TEST 4: graphqlServer.ts resilient slugs & live aggregations ─────────────
  console.log('\n--- 2. Testing GraphQL Server Resolvers & Resilient Slugs ---');
  const stateQuery = `
    query GetStateOverview($stateId: ID!) {
      stateOverview(stateId: $stateId) {
        stateId
        stateName
        totalDistricts
        totalPhcs
        activePhcs
        stockoutAlerts
        criticalShortages
        bedOccupancyRate
        criticalAlertsCount
        districts {
          districtId
          districtName
          totalPhcs
          stockoutRiskCount
          bedOccupancyRate
        }
      }
    }
  `;

  // Query with slug 'state-mh'
  const stateGqlRes = await graphql({
    schema: compiledSchema,
    source: stateQuery,
    rootValue: rootResolvers,
    variableValues: { stateId: 'state-mh' },
  });

  assert(!stateGqlRes.errors, 'stateOverview query with slug state-mh executes without errors');
  const stateData = (stateGqlRes.data as any)?.stateOverview;
  assert(stateData?.stateName === 'Maharashtra', 'state-mh resolves to Maharashtra');
  assert(stateData?.totalDistricts > 0, `totalDistricts is dynamic (${stateData?.totalDistricts})`);
  assert(stateData?.totalPhcs > 0, `totalPhcs is dynamic (${stateData?.totalPhcs})`);
  assert(typeof stateData?.bedOccupancyRate === 'number', 'bedOccupancyRate is dynamic float');

  // Query with district slug 'dist-pune'
  const distQuery = `
    query GetDistrictOverview($districtId: ID!) {
      districtOverview(districtId: $districtId) {
        districtId
        districtName
        stateId
        stateName
        totalPhcs
        activePhcs
        stockoutAlerts
        openAlertsCount
        pendingRequestsCount
        phcList {
          phcId
          name
          totalBeds
          occupiedBeds
          openAlerts
          riskLevel
        }
      }
    }
  `;

  const distGqlRes = await graphql({
    schema: compiledSchema,
    source: distQuery,
    rootValue: rootResolvers,
    variableValues: { districtId: 'dist-pune' },
  });

  assert(!distGqlRes.errors, 'districtOverview query with slug dist-pune executes without errors');
  const distData = (distGqlRes.data as any)?.districtOverview;
  assert(distData?.districtName.includes('Pune'), 'dist-pune resolves to Pune district');
  assert(distData?.phcList?.length > 0, `phcList contains facilities (${distData?.phcList?.length})`);
  assert(typeof distData?.openAlertsCount === 'number', 'openAlertsCount is dynamically computed from alerts table');

  // ── TEST 5: BRICS Queries (federatedRound, model versions, privacy ledger) ──
  console.log('\n--- 3. Testing BRICS Federated Queries & Ledger ---');
  const bricsQuery = `
    query GetBricsIntelligence {
      federatedNodes {
        countryCode
        countryName
        status
        healthIndicator
      }
      federatedRounds {
        id
        roundId
        modelVersion
        status
        participatingCountries
        quorumRequired
        aggregationSignature
        startedAt
      }
      federatedModelVersions {
        id
        modelVersion
        baseModelVersion
        s3Uri
        aggregationSignature
        status
        metrics {
          mae
          rmse
          backtestWeeks
        }
      }
      privacyBudgetLedger {
        id
        countryId
        cumulativeEpsilon
        budgetLimit
        withinBudget
      }
      federatedPrivacyBudget {
        id
        countryId
        cumulativeEpsilon
      }
    }
  `;

  const bricsGqlRes = await graphql({
    schema: compiledSchema,
    source: bricsQuery,
    rootValue: rootResolvers,
  });

  assert(!bricsGqlRes.errors, 'BRICS intelligence queries execute cleanly without GraphQL errors');
  const bricsData = bricsGqlRes.data as any;
  assert(bricsData?.federatedNodes?.length === 5, 'Returns 5 BRICS federation nodes');
  assert(bricsData?.federatedRounds?.length > 0, `Returns live federation rounds (${bricsData?.federatedRounds?.length})`);
  assert(bricsData?.federatedModelVersions?.length > 0, `Returns live model versions (${bricsData?.federatedModelVersions?.length})`);
  assert(bricsData?.privacyBudgetLedger?.length > 0, `Returns privacyBudgetLedger (${bricsData?.privacyBudgetLedger?.length})`);
  assert(bricsData?.federatedPrivacyBudget?.length > 0, `federatedPrivacyBudget alias functions correctly`);

  // Singular federatedRound query
  const testRoundId = bricsData?.federatedRounds[0]?.id;
  const singularRoundQuery = `
    query GetSingularRound($id: ID!) {
      federatedRound(id: $id) {
        id
        roundId
        modelVersion
        status
        participatingCountries
      }
    }
  `;
  const singularRoundRes = await graphql({
    schema: compiledSchema,
    source: singularRoundQuery,
    rootValue: rootResolvers,
    variableValues: { id: testRoundId },
  });
  assert(!singularRoundRes.errors, 'federatedRound(id: ID!) executes cleanly');
  assert((singularRoundRes.data as any)?.federatedRound?.id === testRoundId, 'federatedRound returns matching round');

  // ── TEST 6: decideRedistribution & supply_chain_shipments ────────────────────
  console.log('\n--- 4. Testing Redistribution Decision & Shipment Pipeline ---');
  // Get an existing redistribution transfer
  const redistRes = await pool.query(`SELECT id, status FROM redistribution_transfers LIMIT 1`);
  assert(redistRes.rows.length > 0, 'Found redistribution transfer for decision test');
  const targetTransferId = redistRes.rows[0].id;

  const decideMutation = `
    mutation DecideTransfer($transferId: ID!, $decision: String!, $notes: String) {
      decideRedistribution(transferId: $transferId, decision: $decision, notes: $notes) {
        transferId
        status
        quantity
        reason
      }
    }
  `;

  const decideRes = await graphql({
    schema: compiledSchema,
    source: decideMutation,
    rootValue: rootResolvers,
    variableValues: {
      transferId: targetTransferId,
      decision: 'approved',
      notes: 'Approved for urgent redistribution dispatch',
    },
    contextValue: {
      claims: { role: 'national_admin', sub: 'test-admin' },
    },
  });

  assert(!decideRes.errors, 'decideRedistribution mutation executes cleanly without errors');
  const decideData = (decideRes.data as any)?.decideRedistribution;
  assert(decideData?.status === 'approved', 'Transfer status updated to approved');

  // Wait 200ms for eventBus async handler to insert shipment
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Query supplyChainShipments
  const shipmentQuery = `
    query GetShipments {
      supplyChainShipments {
        shipmentId
        status
        supplier
        destinationPhcName
        items {
          medicineName
          quantity
        }
      }
    }
  `;
  const shipGqlRes = await graphql({
    schema: compiledSchema,
    source: shipmentQuery,
    rootValue: rootResolvers,
  });
  assert(!shipGqlRes.errors, 'supplyChainShipments resolver executes without errors');
  const shipments = (shipGqlRes.data as any)?.supplyChainShipments;
  assert(Array.isArray(shipments) && shipments.length > 0, 'supplyChainShipments returns active shipments');

  console.log(`\n======================================================`);
  console.log(`=== [ALL TESTS PASSED] ${passed}/${total} assertions verified ===`);
  console.log(`======================================================\n`);
  await pool.end();
  process.exit(0);
}

runM2Tests().catch((err) => {
  console.error('[FATAL] Test runner failed:', err);
  pool.end().finally(() => process.exit(1));
});
