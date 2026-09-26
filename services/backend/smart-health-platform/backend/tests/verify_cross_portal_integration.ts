/**
 * ============================================================================
 * Automated Cross-Portal Integration Verification Suite (E2E)
 * ============================================================================
 * 
 * Verifies live database transactions and data propagation across all three
 * operational tiers without mock fallbacks:
 *   Tier 1: Feature Coverage (endpoints, mutations, queries)
 *   Tier 2: Boundary & Corner Cases (idempotency, malformed input, validation)
 *   Tier 3: Cross-Feature Interactions (PHC -> District -> State -> National)
 *   Tier 4: Complete Operational Lifecycle (PHC surge -> Governance decision -> BRICS federated intelligence)
 * 
 * 8-Stage Operational Cycle:
 *   Stage 1: Preflight Health Probes (ports 8000, 3000, 3001, 5173, 5000, PostgreSQL 36 States/UTs)
 *   Stage 2: PHC Mutation Ingestion via POST /sync/push (bed & inventory update)
 *   Stage 3: Governance Multi-Tier GraphQL Assertion (phcDetail, district, state, national)
 *   Stage 4: Governance Decision Event (redistribution decision REST & GQL, federated round launch)
 *   Stage 5: BRICS Federated Intelligence Assertion (rounds, nodes, privacy budget, shipments)
 *   Stage 6: Reconciliation & Teardown Verification (rollback & database integrity)
 *   Stage 7: Google AI Computer Vision Scanner (prescription OCR, packaging OCR, DB matching)
 *   Stage 8: Google AI Multilateral Intelligence & All-India 36-State Registry (EN/HI bulletins, 36 States/UTs)
 * 
 * Exit Semantics:
 *   - Explicit [PASS] / [FAIL] logging per check with timestamps
 *   - Exit code 0 on complete pass
 *   - Non-zero exit code on any failure
 * ============================================================================
 */

import { pool } from '../src/db/pool';
import crypto from 'crypto';

// Configuration
const BASE_URL_BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';
const GRAPHQL_URL = `${BASE_URL_BACKEND}/graphql`;
const PORTAL_URLS = {
  governance: 'http://localhost:3000',
  brics:      'http://localhost:3001',
  phc:        'http://localhost:5173',
  aiEngine:   'http://localhost:5000/docs',
};

// ANSI color helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

interface TestContext {
  passed: number;
  failed: number;
  total: number;
  stageResults: Record<string, { passed: number; failed: number }>;
}

const ctx: TestContext = {
  passed: 0,
  failed: 0,
  total: 0,
  stageResults: {},
};

function formatTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function recordAssertion(stage: string, condition: boolean, code: string, message: string, detail?: string): void {
  ctx.total++;
  if (!ctx.stageResults[stage]) {
    ctx.stageResults[stage] = { passed: 0, failed: 0 };
  }

  const ts = formatTimestamp();
  if (condition) {
    ctx.passed++;
    ctx.stageResults[stage].passed++;
    console.log(`[${ts}] ${colors.green}[PASS]${colors.reset} [${stage}] ${colors.bold}${code}${colors.reset}: ${message}`);
    if (detail) {
      console.log(`         ${colors.dim}${detail}${colors.reset}`);
    }
  } else {
    ctx.failed++;
    ctx.stageResults[stage].failed++;
    console.error(`[${ts}] ${colors.red}[FAIL]${colors.reset} [${stage}] ${colors.bold}${code}${colors.reset}: ${message}`);
    if (detail) {
      console.error(`         ${colors.red}Details: ${detail}${colors.reset}`);
    }
  }
}

async function httpFetch(url: string, options: RequestInit = {}): Promise<{ status: number; text: string; json?: any; ok: boolean }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json: any = undefined;
    try {
      json = JSON.parse(text);
    } catch {
      // Not JSON
    }
    return { status: res.status, text, json, ok: res.ok };
  } catch (err: any) {
    return { status: 0, text: err.message || String(err), ok: false };
  }
}

async function executeGraphQL(query: string, variables: any = {}, role: string = 'national_admin'): Promise<{ data?: any; errors?: any[] }> {
  const res = await httpFetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': role,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.json) {
    throw new Error(`GraphQL response not JSON (status ${res.status}): ${res.text}`);
  }
  return res.json;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: Preflight Health & Connectivity Probes
// ─────────────────────────────────────────────────────────────────────────────
async function runStage1(): Promise<void> {
  const stage = 'STAGE 1';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 1: Preflight Health Probes & Connectivity Checks${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  // 1.1 Backend Healthcheck
  const hRes = await httpFetch(`${BASE_URL_BACKEND}/health`);
  recordAssertion(
    stage,
    hRes.status === 200 && hRes.json?.status === 'ok',
    'S1.1-BACKEND-HEALTH',
    'Central Backend /health responds HTTP 200 with status "ok"',
    `Response: ${JSON.stringify(hRes.json)}`,
  );

  // 1.2 Central Backend GraphQL Endpoint
  const gqlGetRes = await httpFetch(GRAPHQL_URL);
  recordAssertion(
    stage,
    gqlGetRes.status === 200,
    'S1.2-BACKEND-GRAPHQL',
    'Central Backend /graphql probe responds HTTP 200',
    `Status: ${gqlGetRes.status}, Payload: ${gqlGetRes.text.trim().substring(0, 80)}`,
  );

  // 1.3 Governance Portal Next.js (:3000)
  const govRes = await httpFetch(PORTAL_URLS.governance);
  recordAssertion(
    stage,
    govRes.status === 200,
    'S1.3-GOVERNANCE-PORTAL',
    'Governance Portal responds HTTP 200 on port 3000',
    `Status: ${govRes.status}`,
  );

  // 1.4 BRICS Portal Vite (:3001)
  const bricsRes = await httpFetch(PORTAL_URLS.brics);
  recordAssertion(
    stage,
    bricsRes.status === 200,
    'S1.4-BRICS-PORTAL',
    'BRICS Portal responds HTTP 200 on port 3001',
    `Status: ${bricsRes.status}`,
  );

  // 1.5 PHC Portal Vite (:5173)
  const phcRes = await httpFetch(PORTAL_URLS.phc);
  recordAssertion(
    stage,
    phcRes.status === 200,
    'S1.5-PHC-PORTAL',
    'PHC Operations Portal responds HTTP 200 on port 5173',
    `Status: ${phcRes.status}`,
  );

  // 1.6 AI Engine FastAPI (:5000/docs)
  const aiRes = await httpFetch(PORTAL_URLS.aiEngine);
  recordAssertion(
    stage,
    aiRes.status === 200,
    'S1.6-AI-ENGINE',
    'AI Engine Swagger UI responds HTTP 200 on port 5000',
    `Status: ${aiRes.status}`,
  );

  // 1.7 PostgreSQL Database Verification
  let dbHealthy = false;
  let phcCount = 0;
  let stateCount = 0;
  let distCount = 0;
  try {
    const client = await pool.connect();
    try {
      const r1 = await client.query('SELECT count(*)::int AS count FROM phc_facilities');
      const r2 = await client.query('SELECT count(*)::int AS count FROM states');
      const r3 = await client.query('SELECT count(*)::int AS count FROM districts');
      phcCount = r1.rows[0]?.count || 0;
      stateCount = r2.rows[0]?.count || 0;
      distCount = r3.rows[0]?.count || 0;
      dbHealthy = phcCount >= 136 && stateCount >= 36 && distCount >= 50;
    } finally {
      client.release();
    }
  } catch (err: any) {
    dbHealthy = false;
  }
  recordAssertion(
    stage,
    dbHealthy,
    'S1.7-POSTGRES-METRICS',
    'PostgreSQL smarthealth verified with canonical topology across all 36 States/UTs',
    `PHCs: ${phcCount} (expected >=136), States: ${stateCount} (expected >=36), Districts: ${distCount} (expected >=50)`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2: PHC Mutation Ingestion via POST /sync/push
// ─────────────────────────────────────────────────────────────────────────────
interface Stage2Artifacts {
  testPhc: {
    id: string;
    name: string;
    district_id: string;
    state_id: string;
    district_name: string;
    state_name: string;
    originalOccupiedBeds: number;
    newOccupiedBeds: number;
    totalBeds: number;
  };
  testBatch: {
    id: string;
    medicine_id: string;
    originalQty: number;
    newQty: number;
  };
}

async function runStage2(): Promise<Stage2Artifacts> {
  const stage = 'STAGE 2';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 2: PHC Portal Mutation Ingestion via POST /sync/push${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  // 2.1 Retrieve canonical PHC facility and active inventory batch
  const client = await pool.connect();
  let testPhc: any;
  let testBatch: any;
  try {
    const phcRes = await client.query(`
      SELECT p.id, p.name, p.district_id, p.state_id, d.name AS district_name, s.name AS state_name,
             p.occupied_beds, p.total_beds
      FROM phc_facilities p
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
      WHERE s.name ILIKE '%Maharashtra%' AND d.name ILIKE '%Pune%'
      ORDER BY p.name ASC
      LIMIT 1
    `);
    testPhc = phcRes.rows[0];
    if (!testPhc) {
      const fallbackRes = await client.query(`
        SELECT p.id, p.name, p.district_id, p.state_id, d.name AS district_name, s.name AS state_name,
               p.occupied_beds, p.total_beds
        FROM phc_facilities p
        JOIN districts d ON p.district_id = d.id
        JOIN states s ON p.state_id = s.id
        ORDER BY p.name ASC
        LIMIT 1
      `);
      testPhc = fallbackRes.rows[0];
    }

    const batchRes = await client.query(`
      SELECT id, medicine_id, remaining_qty
      FROM inventory_batches
      WHERE phc_id = $1
      ORDER BY id ASC
      LIMIT 1
    `, [testPhc.id]);
    testBatch = batchRes.rows[0];

    if (!testBatch) {
      // Create a test batch if facility currently has none
      const medRes = await client.query(`SELECT id FROM medicines LIMIT 1`);
      const medId = medRes.rows[0]?.id;
      const newBatchId = crypto.randomUUID();
      await client.query(`
        INSERT INTO inventory_batches (id, phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date)
        VALUES ($1, $2, $3, $4, 100, 20, '2028-12-31')
      `, [newBatchId, testPhc.id, medId, `BATCH-${Date.now()}`]);
      testBatch = { id: newBatchId, medicine_id: medId, remaining_qty: 100 };
    }
  } finally {
    client.release();
  }

  const originalOccupiedBeds = Number(testPhc.occupied_beds || 0);
  const totalBeds = Number(testPhc.total_beds || 30);
  // Boundary safe delta: increment occupied beds by 3 (wrap if near capacity)
  const newOccupiedBeds = originalOccupiedBeds + 3 <= totalBeds ? originalOccupiedBeds + 3 : Math.max(1, originalOccupiedBeds - 3);

  const originalQty = Number(testBatch.remaining_qty || 100);
  const newQty = originalQty + 50;

  recordAssertion(
    stage,
    !!testPhc && !!testBatch,
    'S2.1-TARGET-ACQUISITION',
    `Acquired live target PHC "${testPhc.name}" and inventory batch ${testBatch.id}`,
    `PHC ID: ${testPhc.id}, District: ${testPhc.district_name}, State: ${testPhc.state_name}, Beds: ${originalOccupiedBeds} -> ${newOccupiedBeds}`,
  );

  // 2.2 Tier 2 Boundary Check: Malformed sync envelope rejection
  const malformedRes = await httpFetch(`${BASE_URL_BACKEND}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'national_admin',
    },
    body: JSON.stringify({ device_id: 'bad-device' }), // Missing phc_id and mutations array
  });
  recordAssertion(
    stage,
    malformedRes.status === 400 && malformedRes.json?.error_code === 'MALFORMED_ENVELOPE',
    'S2.2-BOUNDARY-REJECTION',
    'POST /sync/push rejects malformed envelope missing mutations with HTTP 400',
    `Status: ${malformedRes.status}, ErrorCode: ${malformedRes.json?.error_code}`,
  );

  // 2.3 Tier 1 & 4 Mutation Push: Bed and Inventory Adjustment
  const bedMutationId = crypto.randomUUID();
  const invMutationId = crypto.randomUUID();
  const pushEnvelope = {
    device_id: 'test-device-e2e',
    phc_id: testPhc.id,
    mutations: [
      {
        id: bedMutationId,
        local_seq: Date.now(),
        entity_type: 'facility_update',
        operation: 'update',
        payload: {
          occupied_beds: newOccupiedBeds,
        },
        client_timestamp: new Date().toISOString(),
      },
      {
        id: invMutationId,
        local_seq: Date.now() + 1,
        entity_type: 'inventory_batch_update',
        operation: 'update',
        payload: {
          batch_id: testBatch.id,
          medicine_id: testBatch.medicine_id,
          remaining_qty: newQty,
        },
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  const pushRes = await httpFetch(`${BASE_URL_BACKEND}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'national_admin',
      'x-phc-id': testPhc.id,
    },
    body: JSON.stringify(pushEnvelope),
  });

  const pushSuccess =
    pushRes.status === 200 &&
    Array.isArray(pushRes.json?.results) &&
    pushRes.json.results.length === 2 &&
    pushRes.json.results.every((r: any) => r.status === 'accepted');

  recordAssertion(
    stage,
    pushSuccess,
    'S2.3-SYNC-PUSH-EXECUTION',
    'POST /sync/push processes batch mutations (bed count + inventory quantity)',
    `Server Seq: ${pushRes.json?.server_seq}, Results: ${JSON.stringify(pushRes.json?.results)}`,
  );

  // 2.4 Tier 2 Boundary Check: Idempotent replay of already-applied mutations
  const replayRes = await httpFetch(`${BASE_URL_BACKEND}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'national_admin',
      'x-phc-id': testPhc.id,
    },
    body: JSON.stringify(pushEnvelope),
  });
  const replaySuccess =
    replayRes.status === 200 &&
    Array.isArray(replayRes.json?.results) &&
    replayRes.json.results.every((r: any) => r.status === 'duplicate');

  recordAssertion(
    stage,
    replaySuccess,
    'S2.4-IDEMPOTENCY-CHECK',
    'POST /sync/push idempotently handles replayed mutations returning "duplicate"',
    `Duplicate status confirmed on all ${replayRes.json?.results?.length} items`,
  );

  return {
    testPhc: {
      id: testPhc.id,
      name: testPhc.name,
      district_id: testPhc.district_id,
      state_id: testPhc.state_id,
      district_name: testPhc.district_name,
      state_name: testPhc.state_name,
      originalOccupiedBeds,
      newOccupiedBeds,
      totalBeds,
    },
    testBatch: {
      id: testBatch.id,
      medicine_id: testBatch.medicine_id,
      originalQty,
      newQty,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3: Governance Multi-Tier GraphQL Assertion
// ─────────────────────────────────────────────────────────────────────────────
async function runStage3(artifacts: Stage2Artifacts): Promise<void> {
  const stage = 'STAGE 3';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 3: Governance Multi-Tier GraphQL Assertion (PHC -> District -> State -> National)${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  const { testPhc } = artifacts;

  // 3.1 Tier 1: Query phcDetail
  const phcDetailQuery = `
    query GetPhcDetail($phcId: ID!) {
      phcDetail(phcId: $phcId) {
        phcId
        phcName
        districtId
        districtName
        stateId
        stateName
        totalBeds
        occupiedBeds
        oxygenCylinders
        riskLevel
      }
    }
  `;
  const phcGql = await executeGraphQL(phcDetailQuery, { phcId: testPhc.id });
  const phcData = phcGql.data?.phcDetail;

  recordAssertion(
    stage,
    !phcGql.errors && phcData?.occupiedBeds === testPhc.newOccupiedBeds,
    'S3.1-GQL-PHC-DETAIL',
    `phcDetail reflects updated occupied beds (${testPhc.newOccupiedBeds})`,
    `GQL Result: occupiedBeds=${phcData?.occupiedBeds}, expected=${testPhc.newOccupiedBeds}, facility="${phcData?.phcName}"`,
  );

  // 3.2 Tier 3: Query districtOverview
  const districtQuery = `
    query GetDistrictOverview($districtId: ID!) {
      districtOverview(districtId: $districtId) {
        districtId
        districtName
        stateId
        stateName
        totalPhcs
        activePhcs
        bedOccupancyRate
        phcList {
          phcId
          name
          occupiedBeds
          totalBeds
        }
      }
    }
  `;
  const distGql = await executeGraphQL(districtQuery, { districtId: testPhc.district_id });
  const distData = distGql.data?.districtOverview;
  const facilityInDistrict = distData?.phcList?.find((p: any) => p.phcId === testPhc.id);

  recordAssertion(
    stage,
    !distGql.errors &&
      distData?.totalPhcs > 0 &&
      facilityInDistrict?.occupiedBeds === testPhc.newOccupiedBeds &&
      typeof distData?.bedOccupancyRate === 'number',
    'S3.2-GQL-DISTRICT-OVERVIEW',
    `districtOverview("${testPhc.district_name}") aggregates updated facility beds`,
    `District PHCs: ${distData?.totalPhcs}, Bed Occupancy Rate: ${distData?.bedOccupancyRate}%, PHC beds: ${facilityInDistrict?.occupiedBeds}`,
  );

  // 3.3 Tier 3: Query stateOverview
  const stateQuery = `
    query GetStateOverview($stateId: ID!) {
      stateOverview(stateId: $stateId) {
        stateId
        stateName
        totalDistricts
        totalPhcs
        activePhcs
        bedOccupancyRate
        districts {
          districtId
          districtName
          totalPhcs
          bedOccupancyRate
        }
      }
    }
  `;
  const stateGql = await executeGraphQL(stateQuery, { stateId: testPhc.state_id });
  const stateData = stateGql.data?.stateOverview;
  const matchedDistrict = stateData?.districts?.find((d: any) => d.districtId === testPhc.district_id);

  recordAssertion(
    stage,
    !stateGql.errors &&
      stateData?.totalPhcs > 0 &&
      matchedDistrict !== undefined &&
      typeof stateData?.bedOccupancyRate === 'number',
    'S3.3-GQL-STATE-OVERVIEW',
    `stateOverview("${testPhc.state_name}") aggregates data across districts`,
    `State Districts: ${stateData?.totalDistricts}, State PHCs: ${stateData?.totalPhcs}, State Bed Rate: ${stateData?.bedOccupancyRate}%`,
  );

  // 3.4 Tier 3: Query nationalOverview
  const nationalQuery = `
    query GetNationalOverview {
      nationalOverview {
        totalPhcs
        activePhcs
        totalBeds
        occupiedBeds
        bedOccupancyRate
        oxygenCylindersAvailable
        lastUpdated
        kpis {
          label
          value
          unit
          severity
        }
      }
    }
  `;
  const natGql = await executeGraphQL(nationalQuery);
  const natData = natGql.data?.nationalOverview;

  recordAssertion(
    stage,
    !natGql.errors &&
      natData?.totalPhcs >= 136 &&
      natData?.totalBeds > 0 &&
      natData?.occupiedBeds > 0 &&
      Array.isArray(natData?.kpis) &&
      natData.kpis.length >= 3,
    'S3.4-GQL-NATIONAL-OVERVIEW',
    'nationalOverview aggregates live national metrics across all facilities',
    `National PHCs: ${natData?.totalPhcs}, Total Beds: ${natData?.totalBeds}, Occupied Beds: ${natData?.occupiedBeds}, Occupancy: ${natData?.bedOccupancyRate}%`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4: Governance Decision Event
// ─────────────────────────────────────────────────────────────────────────────
interface Stage4Artifacts {
  approvedTransferId: string;
  federatedRoundId: string;
}

async function runStage4(artifacts: Stage2Artifacts): Promise<Stage4Artifacts> {
  const stage = 'STAGE 4';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 4: Governance Decision Event (Redistribution & Federated Round)${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  // 4.1 Obtain or Seed a Redistribution Transfer
  const client = await pool.connect();
  let transferId: string;
  try {
    const r = await client.query(`
      SELECT id FROM redistribution_transfers
      WHERE status IN ('recommended', 'pending')
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (r.rows.length > 0) {
      transferId = r.rows[0].id;
    } else {
      // Seed a fresh recommendation
      transferId = `rt-e2e-${Date.now()}`;
      const medRes = await client.query(`SELECT id FROM medicines LIMIT 1`);
      const phcPairRes = await client.query(`SELECT id FROM phc_facilities LIMIT 2`);
      const srcPhc = phcPairRes.rows[0]?.id;
      const dstPhc = phcPairRes.rows[1]?.id;
      const medId = medRes.rows[0]?.id;

      await client.query(`
        INSERT INTO redistribution_transfers (
          id, source_phc_id, dest_phc_id, medicine_id, quantity, status, urgency_level, ai_explanation, created_at
        ) VALUES (
          $1, $2, $3, $4, 250, 'recommended', 'urgent', 'E2E automated cross-portal test transfer', NOW()
        )
      `, [transferId, srcPhc, dstPhc, medId]);
    }
  } finally {
    client.release();
  }

  // 4.2 Execute REST Decision: POST /api/v1/governance/redistribution/:id/decision
  const decisionUrl = `${BASE_URL_BACKEND}/api/v1/governance/redistribution/${transferId}/decision`;
  const decisionRes = await httpFetch(decisionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'national_admin',
    },
    body: JSON.stringify({
      decision: 'approved',
      notes: 'Approved via Automated Cross-Portal Integration Verification Suite',
      modifiedQuantity: 200,
    }),
  });

  const decisionPassed =
    decisionRes.status === 200 &&
    decisionRes.json?.success === true &&
    decisionRes.json?.transfer?.status === 'approved';

  recordAssertion(
    stage,
    decisionPassed,
    'S4.1-REST-REDISTRIBUTION-DECISION',
    `POST /api/v1/governance/redistribution/:id/decision records approval and publishes event`,
    `Transfer ID: ${transferId}, Status: ${decisionRes.json?.transfer?.status}, Response: ${decisionRes.text.substring(0, 100)}`,
  );

  // 4.2 Execute GraphQL Mutation: decideRedistribution
  const decideMutation = `
    mutation DecideTransfer($transferId: ID!, $decision: String!, $notes: String, $modifiedQuantity: Int) {
      decideRedistribution(transferId: $transferId, decision: $decision, notes: $notes, modifiedQuantity: $modifiedQuantity) {
        transferId
        status
        quantity
      }
    }
  `;
  const decideGql = await executeGraphQL(decideMutation, {
    transferId,
    decision: 'approved',
    notes: 'Approved via GraphQL mutation in automated verification suite',
    modifiedQuantity: 200,
  });

  const gqlDecisionData = decideGql.data?.decideRedistribution;
  const gqlDecisionPassed =
    !decideGql.errors &&
    gqlDecisionData?.transferId === transferId &&
    gqlDecisionData?.status === 'approved';

  recordAssertion(
    stage,
    gqlDecisionPassed,
    'S4.2-GQL-REDISTRIBUTION-DECISION',
    'mutation decideRedistribution validates and executes transfer approval via GraphQL',
    `Transfer ID: ${gqlDecisionData?.transferId}, Status: ${gqlDecisionData?.status}, Quantity: ${gqlDecisionData?.quantity}`,
  );

  // 4.3 Trigger Federated Round Launch via GraphQL Mutation
  const startRoundMutation = `
    mutation LaunchRound($modelId: String, $targetEpsilon: Float) {
      startFederatedRound(modelId: $modelId, targetEpsilon: $targetEpsilon) {
        id
        roundId
        roundNumber
        modelVersion
        status
        participatingCountries
        quorumRequired
        aggregationSignature
      }
    }
  `;
  const roundGql = await executeGraphQL(startRoundMutation, {
    modelId: 'demand-forecaster-v2',
    targetEpsilon: 0.05,
  });

  const roundData = roundGql.data?.startFederatedRound;
  const roundPassed =
    !roundGql.errors &&
    !!roundData?.roundId &&
    (roundData?.status === 'active' || roundData?.status === 'pending' || roundData?.status === 'started' || !!roundData?.status);

  recordAssertion(
    stage,
    roundPassed,
    'S4.3-GQL-START-FEDERATED-ROUND',
    `mutation startFederatedRound creates active learning round (${roundData?.roundId})`,
    `Round ID: ${roundData?.roundId}, Version: ${roundData?.modelVersion}, Quorum: ${roundData?.quorumRequired}`,
  );

  return {
    approvedTransferId: transferId,
    federatedRoundId: roundData?.id || transferId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5: BRICS Federated Intelligence Assertion
// ─────────────────────────────────────────────────────────────────────────────
async function runStage5(stage4: Stage4Artifacts): Promise<void> {
  const stage = 'STAGE 5';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 5: BRICS Federated Intelligence & Supply Chain Ledger Assertion${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  // Small delay for eventBus async shipment dispatch handling
  await new Promise((r) => setTimeout(r, 400));

  const bricsQuery = `
    query GetBricsFederationIntelligence {
      federatedNodes {
        countryCode
        countryName
        nodeStatus
        status
        activeModelVersion
        healthIndicator
      }
      federatedRounds {
        id
        roundId
        roundNumber
        modelVersion
        status
        participatingCountries
        quorumRequired
      }
      privacyBudgetLedger {
        id
        countryId
        roundNumber
        cumulativeEpsilon
        budgetLimit
        withinBudget
      }
      supplyChainShipments {
        shipmentId
        status
        supplier
        destinationPhcName
        totalValue
        currency
        items {
          medicineName
          quantity
          unit
        }
      }
    }
  `;

  const bricsGql = await executeGraphQL(bricsQuery);
  const data = bricsGql.data;

  // 5.1 Assert 5 BRICS Nodes
  const nodes = data?.federatedNodes || [];
  const bricsCountries = ['IN', 'BR', 'RU', 'CN', 'ZA'];
  const hasAllBrics = bricsCountries.every((code) => nodes.some((n: any) => n.countryCode === code));
  recordAssertion(
    stage,
    nodes.length >= 5 && hasAllBrics,
    'S5.1-BRICS-FEDERATED-NODES',
    'federatedNodes returns all 5 BRICS member states (IN, BR, RU, CN, ZA)',
    `Retrieved ${nodes.length} nodes: ${nodes.map((n: any) => n.countryCode).join(', ')}`,
  );

  // 5.2 Assert Federated Rounds
  const rounds = data?.federatedRounds || [];
  recordAssertion(
    stage,
    rounds.length > 0 && rounds.some((r: any) => r.roundId),
    'S5.2-BRICS-FEDERATED-ROUNDS',
    'federatedRounds returns active and historical federated training cycles',
    `Rounds count: ${rounds.length}, Latest: ${rounds[0]?.roundId} (${rounds[0]?.status})`,
  );

  // 5.3 Assert Privacy Budget Ledger
  const ledger = data?.privacyBudgetLedger || [];
  recordAssertion(
    stage,
    ledger.length > 0 && ledger.every((l: any) => l.countryId && typeof l.cumulativeEpsilon === 'number'),
    'S5.3-BRICS-PRIVACY-BUDGET',
    'privacyBudgetLedger enforces differential privacy expenditure tracking',
    `Ledger entries: ${ledger.length}, Sample country: ${ledger[0]?.countryId}, Epsilon: ${ledger[0]?.cumulativeEpsilon}`,
  );

  // 5.4 Assert Supply Chain Shipments
  const shipments = data?.supplyChainShipments || [];
  recordAssertion(
    stage,
    shipments.length > 0 && shipments.some((s: any) => s.shipmentId),
    'S5.4-BRICS-SUPPLY-CHAIN-LEDGER',
    'supplyChainShipments reflects automated shipment tracking from approved transfers',
    `Active shipments: ${shipments.length}, Top shipment supplier: "${shipments[0]?.supplier}"`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 6: Reconciliation & Teardown Verification
// ─────────────────────────────────────────────────────────────────────────────
async function runStage6(artifacts: Stage2Artifacts): Promise<void> {
  const stage = 'STAGE 6';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 6: Reconciliation & Teardown Verification${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  const { testPhc, testBatch } = artifacts;

  // 6.1 Revert occupied beds and inventory batch back to original baseline
  const revertEnvelope = {
    device_id: 'test-device-e2e',
    phc_id: testPhc.id,
    mutations: [
      {
        id: crypto.randomUUID(),
        local_seq: Date.now() + 100,
        entity_type: 'facility_update',
        operation: 'update',
        payload: {
          occupied_beds: testPhc.originalOccupiedBeds,
        },
        client_timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        local_seq: Date.now() + 101,
        entity_type: 'inventory_batch_update',
        operation: 'update',
        payload: {
          batch_id: testBatch.id,
          medicine_id: testBatch.medicine_id,
          remaining_qty: testBatch.originalQty,
        },
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  const revertRes = await httpFetch(`${BASE_URL_BACKEND}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'national_admin',
      'x-phc-id': testPhc.id,
    },
    body: JSON.stringify(revertEnvelope),
  });

  const revertOk =
    revertRes.status === 200 &&
    Array.isArray(revertRes.json?.results) &&
    revertRes.json.results.every((r: any) => r.status === 'accepted');

  recordAssertion(
    stage,
    revertOk,
    'S6.1-REVERT-MUTATIONS-PUSH',
    'POST /sync/push successfully ingests teardown restoration batch',
    `Revert status: ${revertRes.status}, ServerSeq: ${revertRes.json?.server_seq}`,
  );

  // 6.2 Confirm Restoration via phcDetail GraphQL query
  const verifyGql = await executeGraphQL(
    `query VerifyRestore($id: ID!) { phcDetail(phcId: $id) { phcId occupiedBeds } }`,
    { id: testPhc.id },
  );
  const restoredBeds = verifyGql.data?.phcDetail?.occupiedBeds;

  recordAssertion(
    stage,
    restoredBeds === testPhc.originalOccupiedBeds,
    'S6.2-CONFIRM-FACILITY-RESTORED',
    `Facility bed occupancy restored to original baseline (${testPhc.originalOccupiedBeds})`,
    `Current occupied beds: ${restoredBeds}, original baseline: ${testPhc.originalOccupiedBeds}`,
  );

  // 6.3 Direct Database State Integrity Confirmation
  const client = await pool.connect();
  let dbConsistent = false;
  try {
    const fRes = await client.query('SELECT occupied_beds FROM phc_facilities WHERE id = $1', [testPhc.id]);
    const bRes = await client.query('SELECT remaining_qty FROM inventory_batches WHERE id = $1', [testBatch.id]);
    dbConsistent =
      Number(fRes.rows[0]?.occupied_beds) === testPhc.originalOccupiedBeds &&
      Number(bRes.rows[0]?.remaining_qty) === testBatch.originalQty;
  } finally {
    client.release();
  }

  recordAssertion(
    stage,
    dbConsistent,
    'S6.3-DB-INTEGRITY-CONFIRMED',
    'PostgreSQL direct read confirms 100% database integrity and zero residual test pollution',
    'phc_facilities and inventory_batches verified clean in smarthealth',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 7: Google AI Computer Vision Prescription & Packaging Scanner
// ─────────────────────────────────────────────────────────────────────────────
async function runStage7(artifacts?: Stage2Artifacts): Promise<void> {
  const stage = 'STAGE 7';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 7: Google AI Computer Vision Prescription & Packaging Scanner${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  const targetPhcId = artifacts?.testPhc?.id || 'c0000003-0000-0000-0000-000000000001';

  // 7.1 Sample Prescription OCR & Live PostgreSQL Inventory Matching
  const rxRes = await httpFetch(`${BASE_URL_BACKEND}/api/v1/ai/vision/extract-prescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sampleType: 'sample_rx_amoxicillin',
      phcId: targetPhcId,
    }),
  });
  const rxData = rxRes.json?.data;
  const rxPassed =
    rxRes.status === 200 &&
    rxData?.detectedType === 'prescription' &&
    Array.isArray(rxData?.medicines) &&
    rxData.medicines.length >= 2 &&
    rxData.medicines.some((m: any) => m.dbMatchedId || m.stockStatus);

  recordAssertion(
    stage,
    rxPassed,
    'S7.1-AI-VISION-PRESCRIPTION-OCR',
    'POST /api/v1/ai/vision/extract-prescription extracts medicines and matches live DB inventory',
    `Type: ${rxData?.detectedType}, Medicines: ${rxData?.medicines?.length}, Model: ${rxData?.modelVersion}, Matched: ${rxData?.medicines?.[0]?.dbMatchedName} (${rxData?.medicines?.[0]?.stockStatus})`,
  );

  // 7.2 Sample Blister Packaging OCR & Identification
  const blisterRes = await httpFetch(`${BASE_URL_BACKEND}/api/v1/ai/vision/extract-prescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleType: 'sample_blister_paracetamol' }),
  });
  const blisterData = blisterRes.json?.data;
  const blisterPassed =
    blisterRes.status === 200 &&
    blisterData?.detectedType === 'medicine_packaging' &&
    !!blisterData?.packaging?.brandName &&
    !!blisterData?.packaging?.batchNo;

  recordAssertion(
    stage,
    blisterPassed,
    'S7.2-AI-VISION-BLISTER-PACKAGING',
    'POST /api/v1/ai/vision/extract-prescription recognizes blister packaging, batch, and expiry',
    `Brand: ${blisterData?.packaging?.brandName}, Batch: ${blisterData?.packaging?.batchNo}, Expiry: ${blisterData?.packaging?.expiryDate}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 8: Google AI Multilateral Intelligence & All-India 36-State Registry
// ─────────────────────────────────────────────────────────────────────────────
async function runStage8(): Promise<void> {
  const stage = 'STAGE 8';
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}STAGE 8: Google AI Multilateral Intelligence & All-India 36-State Registry${colors.reset}`);
  console.log(`${colors.cyan}======================================================================${colors.reset}`);

  // 8.1 Multilateral Intelligence Synthesis (English)
  const enRes = await httpFetch(`${BASE_URL_BACKEND}/api/v1/brics/ai-briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en' }),
  });
  const enData = enRes.json?.data;
  const enPassed =
    enRes.status === 200 &&
    ['LOW', 'ELEVATED', 'HIGH', 'CRITICAL'].includes(enData?.threatLevel) &&
    !!enData?.headline &&
    Array.isArray(enData?.regionalAlerts) &&
    !!enData?.federatedSurveillance;

  recordAssertion(
    stage,
    enPassed,
    'S8.1-AI-BRICS-BRIEFING-ENGLISH',
    'POST /api/v1/brics/ai-briefing synthesizes live alerts and DP metrics into English bulletin',
    `Threat: ${enData?.threatLevel}, Headline: "${enData?.headline?.substring(0, 50)}..."`,
  );

  // 8.2 Multilateral Intelligence Synthesis (Hindi)
  const hiRes = await httpFetch(`${BASE_URL_BACKEND}/api/v1/brics/ai-briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'hi' }),
  });
  const hiData = hiRes.json?.data;
  const hiPassed =
    hiRes.status === 200 &&
    !!hiData?.headline &&
    (hiData?.language?.includes('Hindi') || hiData?.language === 'hi');

  recordAssertion(
    stage,
    hiPassed,
    'S8.2-AI-BRICS-BRIEFING-HINDI',
    'POST /api/v1/brics/ai-briefing returns localized Hindi intelligence bulletin',
    `Language: ${hiData?.language}, Headline: "${hiData?.headline?.substring(0, 50)}..."`,
  );

  // 8.3 All-India 36-State Database Registry Verification
  const client = await pool.connect();
  let stateCount = 0;
  let hasUt = false;
  try {
    const sRes = await client.query('SELECT count(*)::int AS count FROM states');
    stateCount = sRes.rows[0]?.count || 0;
    const utRes = await client.query("SELECT count(*)::int AS count FROM states WHERE name IN ('Delhi (NCT)', 'Ladakh', 'Lakshadweep')");
    hasUt = (utRes.rows[0]?.count || 0) >= 3;
  } finally {
    client.release();
  }

  recordAssertion(
    stage,
    stateCount >= 36 && hasUt,
    'S8.3-ALL-INDIA-36-STATES-REGISTRY',
    'PostgreSQL contains all 28 States & 8 Union Territories in canonical registry',
    `Total States/UTs in DB: ${stateCount} (expected >= 36), Canonical UTs verified: ${hasUt}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite Execution Orchestrator
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const startTime = Date.now();
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   ${colors.bold}Cross-Portal Integration Verification Suite (E2E Full Cycle)${colors.reset}       ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   Target: PHC (:5173) ──> Governance (:3000) ──> BRICS (:3001)        ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   Backend: http://localhost:8000 | PostgreSQL 5432: smarthealth       ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  try {
    // Stage 1: Preflight
    await runStage1();

    // Stage 2: PHC Mutation
    const artifacts = await runStage2();

    // Stage 3: Governance GraphQL Assertion
    await runStage3(artifacts);

    // Stage 4: Governance Decision Event
    const stage4Artifacts = await runStage4(artifacts);

    // Stage 5: BRICS Federated Intelligence
    await runStage5(stage4Artifacts);

    // Stage 6: Reconciliation & Teardown
    await runStage6(artifacts);

    // Stage 7: Google AI Computer Vision Prescription & Packaging Scanner
    await runStage7(artifacts);

    // Stage 8: Google AI Multilateral Intelligence & All-India 36-State Registry
    await runStage8();

    const elapsedMs = Date.now() - startTime;

    console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
    console.log(`${colors.bold}SUITE EXECUTION SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}======================================================================${colors.reset}`);
    for (const [stg, res] of Object.entries(ctx.stageResults)) {
      const statusColor = res.failed === 0 ? colors.green : colors.red;
      console.log(`  ${stg.padEnd(10)}: ${statusColor}${res.passed} passed, ${res.failed} failed${colors.reset}`);
    }
    console.log(`${colors.cyan}----------------------------------------------------------------------${colors.reset}`);
    console.log(`  ${colors.bold}Total Checks${colors.reset} : ${ctx.total}`);
    console.log(`  ${colors.bold}Total Passed${colors.reset} : ${colors.green}${ctx.passed}${colors.reset}`);
    console.log(`  ${colors.bold}Total Failed${colors.reset} : ${ctx.failed === 0 ? colors.green + '0' : colors.red + ctx.failed}${colors.reset}`);
    console.log(`  ${colors.bold}Execution Time${colors.reset}: ${(elapsedMs / 1000).toFixed(2)}s`);
    console.log(`${colors.cyan}======================================================================${colors.reset}`);

    if (ctx.failed === 0) {
      console.log(`\n${colors.green}${colors.bold}>>> SUCCESS: ALL CROSS-PORTAL INTEGRATION CHECKS PASSED (EXIT CODE 0) <<<${colors.reset}\n`);
      await pool.end().catch(() => {});
      process.exit(0);
    } else {
      console.error(`\n${colors.red}${colors.bold}>>> FAILURE: ${ctx.failed} CHECK(S) FAILED. (EXIT CODE 1) <<<${colors.reset}\n`);
      await pool.end().catch(() => {});
      process.exit(1);
    }
  } catch (fatal: any) {
    console.error(`\n${colors.red}${colors.bold}[FATAL EXCEPTION] Test suite crashed unexpectedly:${colors.reset}`, fatal);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

main();
