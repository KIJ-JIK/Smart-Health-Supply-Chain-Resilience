#!/usr/bin/env node
/**
 * Automated Cloud PostgreSQL Schema & Seed Runner
 * Connects directly using the `pg` client over SSL and seeds all tables.
 *
 * Usage:
 *   DATABASE_URL="postgres://user:pass@host:port/dbname?sslmode=require" node scripts/seed_cloud_db.js
 *   or:
 *   node scripts/seed_cloud_db.js "postgres://user:pass@host:port/dbname?sslmode=require"
 */

const fs = require('fs');
const path = require('path');
let Client;
try {
  Client = require('pg').Client;
} catch {
  const backendPgPath = path.join(__dirname, '..', 'services', 'backend', 'smart-health-platform', 'backend', 'node_modules', 'pg');
  Client = require(backendPgPath).Client;
}

const rawUrl = process.argv[2] || process.env.DATABASE_URL;

if (!rawUrl) {
  console.error('\x1b[31m[ERROR] Missing DATABASE_URL!\x1b[0m');
  console.log('Usage: node scripts/seed_cloud_db.js "<DATABASE_URL>"');
  console.log('Example: node scripts/seed_cloud_db.js "postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/smarthealth?sslmode=require"');
  process.exit(1);
}

const SEED_FILE = path.join(__dirname, '..', 'services', 'backend', 'smart-health-platform', 'database', 'seeds', 'full_seed.sql');
const STATES_FILE = path.join(__dirname, '..', 'services', 'backend', 'smart-health-platform', 'database', 'seeds', 'all_india_36_states.sql');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'services', 'backend', 'smart-health-platform', 'database', 'migrations');

async function seedCloudDb() {
  console.log('\n\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m  Smart Health Cloud PostgreSQL Migration & Seed   \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m\n');

  // Strip unsupported channel_binding if present to ensure clean TLS handshake in node-postgres
  const cleanUrl = rawUrl.replace('&channel_binding=require', '').replace('channel_binding=require&', '');
  const isRemote = !cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1');

  const client = new Client({
    connectionString: cleanUrl,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('[1/6] Connecting to cloud PostgreSQL database...');
    await client.connect();
    console.log('  -> \x1b[32mConnected successfully!\x1b[0m');

    console.log('[2/6] Ensuring pgcrypto extension, app_user role & RLS helper functions are active...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
          CREATE ROLE app_user WITH LOGIN PASSWORD 'Aura#Health_Secure_2026!App' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
        END IF;
      END
      $$;

      CREATE OR REPLACE FUNCTION app_current_role() RETURNS text AS $$
          SELECT current_setting('app.current_role', true)
      $$ LANGUAGE sql STABLE;

      CREATE OR REPLACE FUNCTION app_current_phc_id() RETURNS uuid AS $$
          SELECT NULLIF(current_setting('app.current_phc_id', true), '')::uuid
      $$ LANGUAGE sql STABLE;

      CREATE OR REPLACE FUNCTION app_current_district_id() RETURNS uuid AS $$
          SELECT NULLIF(current_setting('app.current_district_id', true), '')::uuid
      $$ LANGUAGE sql STABLE;

      CREATE OR REPLACE FUNCTION app_current_state_id() RETURNS uuid AS $$
          SELECT NULLIF(current_setting('app.current_state_id', true), '')::uuid
      $$ LANGUAGE sql STABLE;
    `);
    console.log('  -> \x1b[32mpgcrypto, app_user & RLS session functions verified.\x1b[0m');

    console.log('[3/6] Applying core transactional schema & seed data (full_seed.sql)...');
    if (!fs.existsSync(SEED_FILE)) {
      throw new Error(`File not found: ${SEED_FILE}`);
    }
    const fullSeedSql = fs.readFileSync(SEED_FILE, 'utf8').replace(/^\uFEFF/, '');
    await client.query(fullSeedSql);
    console.log('  -> \x1b[32mCore schema & initial seed applied.\x1b[0m');

    console.log('[4/6] Creating specialized tables (mutation_queue, phc_device_registry, stock_adjustments, supply_chain_shipments)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment (
          id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          phc_id             UUID         NOT NULL REFERENCES phc_facilities(id),
          equipment_type     VARCHAR(100) NOT NULL,
          quantity           INT          NOT NULL DEFAULT 1,
          working_qty        INT          NOT NULL DEFAULT 1,
          maintenance_status VARCHAR(20)  NOT NULL DEFAULT 'operational',
          last_serviced_at   DATE,
          created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS mutation_queue (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          phc_id           UUID        NOT NULL REFERENCES phc_facilities(id),
          device_id        UUID        NOT NULL,
          local_seq        BIGINT      NOT NULL,
          entity_type      VARCHAR(50) NOT NULL,
          operation        VARCHAR(10) NOT NULL,
          payload          JSONB       NOT NULL,
          sync_status      VARCHAR(20) NOT NULL DEFAULT 'accepted',
          client_timestamp TIMESTAMPTZ NOT NULL,
          server_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
          error_code       TEXT,
          server_seq       BIGINT,
          mutation_id      UUID,
          UNIQUE (phc_id, device_id, local_seq)
      );

      CREATE SEQUENCE IF NOT EXISTS sync_server_seq START WITH 1;
      ALTER TABLE mutation_queue ALTER COLUMN server_seq SET DEFAULT nextval('sync_server_seq');
      CREATE INDEX IF NOT EXISTS idx_mutation_queue_phc ON mutation_queue (phc_id, server_timestamp DESC);

      CREATE TABLE IF NOT EXISTS phc_device_registry (
          id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id        VARCHAR(64) NOT NULL UNIQUE,
          phc_id           UUID NOT NULL REFERENCES phc_facilities(id),
          public_key       TEXT NOT NULL,
          certificate_pem  TEXT NOT NULL,
          cert_fingerprint VARCHAR(64) NOT NULL UNIQUE,
          status           VARCHAR(20) NOT NULL DEFAULT 'active',
          registered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at       TIMESTAMPTZ NOT NULL,
          last_sync_at     TIMESTAMPTZ,
          revoked_at       TIMESTAMPTZ,
          metadata         JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS stock_adjustments (
          id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          phc_id         UUID         NOT NULL REFERENCES phc_facilities(id),
          batch_id       UUID         NOT NULL REFERENCES inventory_batches(id),
          medicine_id    UUID         NOT NULL REFERENCES medicines(id),
          previous_qty   INT          NOT NULL,
          new_qty        INT          NOT NULL,
          adjustment_qty INT          NOT NULL,
          reason         TEXT         NOT NULL,
          user_id        UUID,
          device_id      VARCHAR(64),
          created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS supply_chain_shipments (
          id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_phc_id         UUID REFERENCES phc_facilities(id),
          dest_phc_id           UUID NOT NULL REFERENCES phc_facilities(id),
          redistribution_id     UUID REFERENCES redistribution_transfers(id),
          medicine_id           UUID REFERENCES medicines(id),
          item_type             VARCHAR(30) NOT NULL DEFAULT 'medicine',
          quantity              INT NOT NULL CHECK (quantity > 0),
          carrier               VARCHAR(100),
          tracking_number       VARCHAR(100) UNIQUE,
          status                VARCHAR(30) NOT NULL DEFAULT 'pending',
          dispatched_at         TIMESTAMPTZ,
          estimated_delivery_at TIMESTAMPTZ,
          delivered_at          TIMESTAMPTZ,
          is_delayed            BOOLEAN NOT NULL DEFAULT false,
          delay_reason          TEXT,
          notes                 TEXT,
          created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('  -> \x1b[32mSpecialized feature tables verified.\x1b[0m');

    if (fs.existsSync(STATES_FILE)) {
      console.log('[5/6] Applying canonical All-India 36 States & Union Territories...');
      const statesSql = fs.readFileSync(STATES_FILE, 'utf8').replace(/^\uFEFF/, '');
      await client.query(statesSql);
      console.log('  -> \x1b[32mAll India canonical geography applied.\x1b[0m');
    }

    console.log('[6/6] Ensuring realistic supply chain shipments & performance indexes...');
    await client.query(`
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS recommended_by VARCHAR(20) DEFAULT 'ai';
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS item_ref VARCHAR(100);
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS item_type VARCHAR(30) DEFAULT 'medicine';
      CREATE INDEX IF NOT EXISTS idx_alerts_state_status_created ON alerts(state_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_inventory_batches_med ON inventory_batches(medicine_id);
      CREATE INDEX IF NOT EXISTS idx_phc_dist_status ON phc_facilities(district_id, operational_status);
      CREATE INDEX IF NOT EXISTS idx_sc_shipments_dest_status ON supply_chain_shipments(dest_phc_id, status);
      CREATE INDEX IF NOT EXISTS idx_redist_transfers_status ON redistribution_transfers(status);
    `);

    // Verification queries
    console.log('\n--- Verifying Cloud Database Records ---');
    const stateCount = await client.query('SELECT COUNT(*) FROM states;');
    const distCount = await client.query('SELECT COUNT(*) FROM districts;');
    const phcCount = await client.query('SELECT COUNT(*) FROM phc_facilities;');
    const medCount = await client.query('SELECT COUNT(*) FROM medicines;');
    const batchCount = await client.query('SELECT COUNT(*) FROM inventory_batches;');
    const staffCount = await client.query('SELECT COUNT(*) FROM staff_registry;');
    const alertCount = await client.query('SELECT COUNT(*) FROM alerts;');
    const fedCount = await client.query('SELECT COUNT(*) FROM federation_rounds;');

    console.log(`  ✓ States:            ${stateCount.rows[0].count}`);
    console.log(`  ✓ Districts:         ${distCount.rows[0].count}`);
    console.log(`  ✓ PHC Facilities:    ${phcCount.rows[0].count}`);
    console.log(`  ✓ Medicines:         ${medCount.rows[0].count}`);
    console.log(`  ✓ Inventory Batches: ${batchCount.rows[0].count}`);
    console.log(`  ✓ Staff & Doctors:   ${staffCount.rows[0].count}`);
    console.log(`  ✓ Active Alerts:     ${alertCount.rows[0].count}`);
    console.log(`  ✓ Federated Rounds:  ${fedCount.rows[0].count}`);

    console.log('\n\x1b[32m✔ Cloud PostgreSQL database successfully initialized, migrated, and verified!\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m[ERROR] Database seeding failed:\x1b[0m', err.message);
    if (err.position) {
      console.error('Error position:', err.position);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedCloudDb();
