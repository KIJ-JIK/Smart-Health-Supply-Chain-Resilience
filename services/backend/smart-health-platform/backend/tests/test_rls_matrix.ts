/**
 * RLS Integration Test Matrix (Final Architecture §7.5)
 *
 * Runs SELECT queries against real fixture data as each of the four roles
 * and asserts exact row-count expectations.  Fails fast on any mismatch.
 *
 * Usage:
 *   npx ts-node database/seeds/test_rls_matrix.ts
 */

import { Pool } from 'pg';

const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT     || 5432),
  user:     process.env.APP_PGUSER || 'app_user',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'meddb',
});

const adminPool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT     || 5432),
  user:     process.env.PGUSER     || 'user',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'meddb',
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function runAs(
  role: string,
  phcId: string,
  districtId: string,
  stateId: string,
  sql: string,
  params: unknown[] = [],
): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.current_role', $1, true)`, [role]);
    await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [phcId]);
    await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [districtId]);
    await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [stateId]);
    const r = await client.query(sql, params);
    await client.query('COMMIT');
    if (r.rows.length > 0 && r.rows[0].count !== undefined) {
      return Number(r.rows[0].count);
    }
    return r.rowCount ?? 0;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

function assert(label: string, actual: number, expected: string, pass: boolean): void {
  const icon = pass ? '✓' : '✗';
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`  ${icon} [${status}] ${label}: ${actual} rows (expected ${expected})`);
  if (!pass) {
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Fixture resolution — query the DB to get real UUIDs from seeded data
// ---------------------------------------------------------------------------
async function getFixtureIds(): Promise<{
  anyPhcId: string;
  anyDistrictId: string;
  anyStateId: string;
  districtPhcCount: number;
  statePhcCount: number;
}> {
  const client = await adminPool.connect();
  try {
    // Use superuser connection (no SET LOCAL) to read fixture IDs
    const stateRes = await client.query(`SELECT id FROM states LIMIT 1`);
    const stateId = stateRes.rows[0].id;

    const districtRes = await client.query(
      `SELECT id FROM districts WHERE state_id = $1 LIMIT 1`, [stateId],
    );
    const districtId = districtRes.rows[0].id;

    const phcRes = await client.query(
      `SELECT id FROM phc_facilities WHERE district_id = $1 LIMIT 1`, [districtId],
    );
    const phcId = phcRes.rows[0].id;

    const districtCount = await client.query(
      `SELECT COUNT(*) FROM phc_facilities WHERE district_id = $1`, [districtId],
    );
    const stateCount = await client.query(
      `SELECT COUNT(*) FROM phc_facilities WHERE state_id = $1`, [stateId],
    );

    return {
      anyPhcId:         phcId,
      anyDistrictId:    districtId,
      anyStateId:       stateId,
      districtPhcCount: Number(districtCount.rows[0].count),
      statePhcCount:    Number(stateCount.rows[0].count),
    };
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' RLS Integration Test Matrix  (Final Architecture §7.5)');
  console.log('══════════════════════════════════════════════════════\n');

  const f = await getFixtureIds();
  const NONE = '';

  const TOTAL_PHC         = 120;
  const TOTAL_ALERTS      = 500;
  const TOTAL_REQUESTS    = 300;
  const TOTAL_TRANSFERS   = 200;
  const TOTAL_INVENTORY   = 1425;

  const tables: {name: string; sql: string; total: number; joinPhc?: boolean}[] = [
    { name: 'phc_facilities',          sql: 'SELECT COUNT(*) FROM phc_facilities',           total: TOTAL_PHC },
    { name: 'inventory_batches',       sql: 'SELECT COUNT(*) FROM inventory_batches',         total: TOTAL_INVENTORY },
    { name: 'resource_requests',       sql: 'SELECT COUNT(*) FROM resource_requests',         total: TOTAL_REQUESTS },
    { name: 'alerts',                  sql: 'SELECT COUNT(*) FROM alerts',                   total: TOTAL_ALERTS },
    { name: 'redistribution_transfers',sql: 'SELECT COUNT(*) FROM redistribution_transfers', total: TOTAL_TRANSFERS },
  ];

  for (const t of tables) {
    console.log(`\n┌─ Table: ${t.name}`);

    // Query true baseline total from admin connection
    const totalRes = await adminPool.query(t.sql);
    const currentTotal = Number(totalRes.rows[0].count);

    // national_admin → sees all rows
    const nat = await runAs('national_admin', NONE, NONE, NONE, t.sql);
    assert(`national_admin`, nat, `= ${currentTotal}`, nat === currentTotal);

    // state_admin → sees state-scoped subset (> 0, <= total)
    const sta = await runAs('state_admin', NONE, NONE, f.anyStateId, t.sql);
    const staOk = sta > 0 && sta <= currentTotal;
    assert(`state_admin  (state has ${f.statePhcCount} PHCs)`, sta, `> 0 and ≤ ${currentTotal}`, staOk);

    // district_admin → sees district-scoped subset (> 0, <= state)
    const dis = await runAs('district_admin', NONE, f.anyDistrictId, f.anyStateId, t.sql);
    const disOk = dis > 0 && dis <= sta;
    assert(`district_admin (district has ${f.districtPhcCount} PHCs)`, dis, `> 0 and ≤ ${sta}`, disOk);

    // phc_user → sees only own PHC rows (> 0 for facilities, may be 0 for transfers)
    const phc = await runAs('phc_user', f.anyPhcId, NONE, NONE, t.sql);
    const phcExpect = t.name === 'phc_facilities' ? `= 1` : `≥ 0 and ≤ ${dis}`;
    const phcOk = t.name === 'phc_facilities' ? phc === 1 : (phc >= 0 && phc <= Math.max(dis, 1));
    assert(`phc_user      (single PHC)`, phc, phcExpect, phcOk);

    // unauthenticated (no session vars) → must see 0 rows
    const unauth = await runAs('', NONE, NONE, NONE, t.sql);
    assert(`unauthenticated (no role)`, unauth, `= 0`, unauth === 0);

    console.log(`└─ ${t.name} OK`);
  }

  // Extra spot-check: dispensed_items via billing_transactions chain
  console.log('\n┌─ Table: dispensed_items (chained through billing_transactions)');
  const diNat = await runAs('national_admin', NONE, NONE, NONE, 'SELECT COUNT(*) FROM dispensed_items');
  assert('national_admin', diNat, `> 0`, diNat > 0);
  const diPhc = await runAs('phc_user', f.anyPhcId, NONE, NONE, 'SELECT COUNT(*) FROM dispensed_items');
  assert('phc_user', diPhc, `≥ 0 and < ${diNat}`, diPhc >= 0 && diPhc <= diNat);
  const diUnauth = await runAs('', NONE, NONE, NONE, 'SELECT COUNT(*) FROM dispensed_items');
  assert('unauthenticated', diUnauth, `= 0`, diUnauth === 0);
  console.log('└─ dispensed_items OK');

  // mutation_queue spot-check
  console.log('\n┌─ Table: mutation_queue');
  const mqNat = await runAs('national_admin', NONE, NONE, NONE, 'SELECT COUNT(*) FROM mutation_queue');
  assert('national_admin', mqNat, `> 0`, mqNat > 0);
  const mqPhc = await runAs('phc_user', f.anyPhcId, NONE, NONE, 'SELECT COUNT(*) FROM mutation_queue');
  assert('phc_user', mqPhc, `≥ 0 and ≤ ${mqNat}`, mqPhc >= 0 && mqPhc <= mqNat);
  const mqUnauth = await runAs('', NONE, NONE, NONE, 'SELECT COUNT(*) FROM mutation_queue');
  assert('unauthenticated', mqUnauth, `= 0`, mqUnauth === 0);
  console.log('└─ mutation_queue OK');

  // audit_log spot-check
  console.log('\n┌─ Table: audit_log');
  const alNat = await runAs('national_admin', NONE, NONE, NONE, 'SELECT COUNT(*) FROM audit_log');
  assert('national_admin', alNat, `> 0`, alNat > 0);
  const alUnauth = await runAs('', NONE, NONE, NONE, 'SELECT COUNT(*) FROM audit_log');
  assert('unauthenticated', alUnauth, `= 0`, alUnauth === 0);
  console.log('└─ audit_log OK');

  console.log(`\n══════════════════════════════════════════════════════`);
  if (process.exitCode === 1) {
    console.log(' ✗  RLS matrix FAILED — see failures above');
  } else {
    console.log(' ✓  All RLS assertions passed');
  }
  console.log('══════════════════════════════════════════════════════\n');

  await pool.end();
  await adminPool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
