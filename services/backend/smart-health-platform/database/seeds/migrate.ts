import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'user',
    password: process.env.PGPASSWORD || 'password',
    database: process.env.PGDATABASE || 'meddb',
  });

  await client.connect();
  console.log('Connected to PostgreSQL database');

  // Enable extensions first
  console.log('Ensuring extensions are enabled...');
  await client.query('CREATE EXTENSION IF NOT EXISTS uuid-ossp;');
  await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
  await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb;');
  console.log('Extensions verified: uuid-ossp, postgis, timescaledb');

  const migrationsDir = path.resolve(__dirname, '../migrations');
  const migrationFiles = [
    '01_geography_foundation.sql',
    '02_phc_operations.sql',
    '03_timeseries.sql',
    '04_governance_intelligence.sql',
    '05_brics_federated.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(Migration file not found: );
    }
    console.log(Executing migration: ...);
    const sql = fs.readFileSync(filePath, 'utf-8');
    await client.query(sql);
    console.log(✓ Migration  executed successfully);
  }

  await client.end();
  console.log('All migrations completed successfully.');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
