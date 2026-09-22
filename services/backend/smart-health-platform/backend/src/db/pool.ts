import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config(); // load .env from the current working directory

// ---------------------------------------------------------------------------
// Singleton connection pool — shared across all requests.
// RLS enforcement relies on SET LOCAL within a per-request transaction;
// never use this pool directly for tenant queries — use withTenantContext().
// ---------------------------------------------------------------------------
export const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT     || 5432),
  user:     process.env.DB_USER    || process.env.APP_PGUSER || process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'smarthealth',
  max:      20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[pool] unexpected client error', err);
});

// Admin pool: strictly for auth infrastructure (device certificate lookup) & migrations
export const adminPool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT     || 5432),
  user:     process.env.PGUSER     || 'user',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'meddb',
  max:      5,
  idleTimeoutMillis: 30_000,
});

// ---------------------------------------------------------------------------
// TenantClaims — extracted from a validated JWT or trusted request headers.
// ---------------------------------------------------------------------------
export interface TenantClaims {
  sub?:        string;
  role:        'national_admin' | 'state_admin' | 'district_admin' | 'phc_user';
  phcId?:      string;
  districtId?: string;
  stateId?:    string;
}

// ---------------------------------------------------------------------------
// withTenantContext
//
// Acquires a dedicated pool client, wraps the query block in a transaction,
// and sets the four session-local GUCs that all RLS policies read.
// These are SET LOCAL — they apply only for the duration of this transaction
// and are automatically cleared when the transaction ends, so reuse is safe.
//
// Usage:
//   const rows = await withTenantContext(claims, async (client) => {
//     const r = await client.query('SELECT * FROM phc_facilities');
//     return r.rows;
//   });
// ---------------------------------------------------------------------------
export async function withTenantContext<T>(
  claims: TenantClaims,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Inject JWT claims as Postgres session variables (scope: this transaction only)
    await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
    await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId ?? '']);
    await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId ?? '']);
    await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId ?? '']);

    const result = await fn(client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
