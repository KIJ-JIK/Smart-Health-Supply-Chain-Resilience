#!/usr/bin/env node
/**
 * Setup Script — creates the smarthealth database and loads the seed data.
 * Run AFTER PostgreSQL 17 is installed and the service is running:
 *   node setup_db.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// PostgreSQL 17 default bin path on Windows (winget install)
const PG_BIN = 'C:\\Program Files\\PostgreSQL\\17\\bin';
const PSQL = `"${PG_BIN}\\psql.exe"`;
const CREATEDB = `"${PG_BIN}\\createdb.exe"`;

const SEED_FILE = path.join(__dirname, 'services', 'backend', 'smart-health-platform', 'database', 'seeds', 'full_seed.sql');

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', env: { ...process.env, PGPASSWORD: 'postgres' }, ...opts });
    if (out) console.log(out);
    return out;
  } catch (e) {
    console.error(e.stderr || e.message);
    return null;
  }
}

console.log('=== Smart Health DB Setup ===\n');

// 1. Check psql is available
if (!fs.existsSync(`${PG_BIN}\\psql.exe`)) {
  console.error(`ERROR: psql not found at ${PG_BIN}\\psql.exe`);
  console.error('PostgreSQL 17 may still be installing. Wait for it to complete and try again.');
  process.exit(1);
}

// 2. Create database (ignore error if exists)
console.log('Creating database "smarthealth"...');
run(`${CREATEDB} -U postgres -h localhost smarthealth`);

// 3. Run full seed SQL
console.log('\nLoading schema + seed data...');
run(`${PSQL} -U postgres -h localhost -d smarthealth -f "${SEED_FILE}" -v ON_ERROR_STOP=0`);

console.log('\n=== Setup Complete! ===');
console.log('Next steps:');
console.log('  1. Paste your Gemini API key in: services/backend/smart-health-platform/backend/.env');
console.log('  2. Start the backend: cd services/backend/smart-health-platform/backend && npx ts-node -r dotenv/config src/index.ts');
console.log('  3. Start governance portal: cd apps/governance-portal && npm run dev');
console.log('  4. Open http://localhost:3000');
