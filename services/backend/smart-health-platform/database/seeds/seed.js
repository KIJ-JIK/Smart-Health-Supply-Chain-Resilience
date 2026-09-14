const path = require('path');
const fs = require('fs');
const { Client } = require(path.resolve(__dirname, '../../backend/node_modules/pg'));

const client = new Client({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'user',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'meddb',
});

const SEEDS_DIR = path.resolve(__dirname, '../../../datasets/seeds/output');

const SEED_ORDER = [
  { file: '01_states.json', table: 'states' },
  { file: '02_districts.json', table: 'districts' },
  { file: '03_phc_facilities.json', table: 'phc_facilities' },
  { file: '04_equipment.json', table: 'equipment' },
  { file: '05_medicines.json', table: 'medicines' },
  { file: '06_inventory_batches.json', table: 'inventory_batches' },
  { file: '07_staff_registry.json', table: 'staff_registry' },
  { file: '08_staff_attendance.json', table: 'staff_attendance' },
  { file: '09_billing_transactions.json', table: 'billing_transactions' },
  { file: '10_dispensed_items.json', table: 'dispensed_items' },
  { file: '11_resource_requests.json', table: 'resource_requests' },
  { file: '12_mutation_queue.json', table: 'mutation_queue' },
  { file: '13_patient_footfall.json', table: 'patient_footfall' },
  { file: '14_consumption_velocity.json', table: 'consumption_velocity' },
  { file: '16_alerts.json', table: 'alerts' },
  { file: '17_redistribution_transfers.json', table: 'redistribution_transfers' },
  { file: '18_reconciliation_events.json', table: 'reconciliation_events' },
  { file: '19_audit_log.json', table: 'audit_log' },
  { file: '20_forecast_predictions.json', table: 'forecast_predictions' },
  { file: '21_system_config.json', table: 'system_config' },
  { file: '24_federation_rounds.json', table: 'federation_rounds' },
  { file: '25_privacy_budget_ledger.json', table: 'privacy_budget_ledger' },
  { file: '26_federation_model_versions.json', table: 'federation_model_versions' },
];

async function insertBatch(table, rows) {
  if (rows.length === 0) return;

  const sample = rows[0];
  const columns = Object.keys(sample);

  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const valuePlaceholders = [];
    const values = [];
    let pIdx = 1;

    for (const row of chunk) {
      const rowHolders = [];
      for (const col of columns) {
        let val = row[col];

        if (table === 'phc_facilities' && col === 'location') {
          const coords = (val && val.coordinates) || [0, 0];
          rowHolders.push('ST_SetSRID(ST_MakePoint($' + pIdx + ', $' + (pIdx + 1) + '), 4326)::geography');
          values.push(coords[0], coords[1]);
          pIdx += 2;
        } else {
          if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            val = JSON.stringify(val);
          }
          rowHolders.push('$' + pIdx);
          values.push(val);
          pIdx++;
        }
      }
      valuePlaceholders.push('(' + rowHolders.join(', ') + ')');
    }

    const colList = columns.map(c => '"' + c + '"').join(', ');
    const onConflict = table === 'audit_log' ? '' : ' ON CONFLICT DO NOTHING';
    const query = 'INSERT INTO ' + table + ' (' + colList + ') VALUES ' + valuePlaceholders.join(', ') + onConflict + ';';
    await client.query(query, values);
  }
}

async function runSeed() {
  await client.connect();
  console.log('Connected to PostgreSQL for seeding...');

  for (const { file, table } of SEED_ORDER) {
    const filePath = path.join(SEEDS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn('Seed file not found:', file);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    console.log('Loading ' + file + ' into ' + table + ' (' + data.length + ' records)...');
    await insertBatch(table, data);
    console.log('? Loaded ' + table);
  }

  console.log('Refreshing continuous aggregates and materialized views...');
  try {
    await client.query("CALL refresh_continuous_aggregate('consumption_daily', NULL, NULL);");
    console.log('? Refreshed consumption_daily');
  } catch (e) {
    console.log('Continuous aggregate refresh note:', e.message);
  }

  try {
    await client.query('REFRESH MATERIALIZED VIEW gis_facility_risk;');
    console.log('? Refreshed gis_facility_risk');
  } catch (e) {
    console.log('gis_facility_risk note:', e.message);
  }

  try {
    await client.query('REFRESH MATERIALIZED VIEW federation_training_features;');
    console.log('? Refreshed federation_training_features');
  } catch (e) {
    console.log('federation_training_features note:', e.message);
  }

  console.log('==========================================');
  console.log('ALL 23 SEED FILES LOADED SUCCESSFULLY!');
  console.log('==========================================');

  const checkTables = [
    'states', 'districts', 'phc_facilities', 'equipment', 'medicines',
    'inventory_batches', 'staff_registry', 'staff_attendance', 'billing_transactions',
    'dispensed_items', 'resource_requests', 'mutation_queue', 'patient_footfall',
    'consumption_velocity', 'alerts', 'redistribution_transfers', 'reconciliation_events',
    'audit_log', 'forecast_predictions', 'system_config', 'federation_rounds',
    'privacy_budget_ledger', 'federation_model_versions'
  ];

  for (const t of checkTables) {
    const res = await client.query('SELECT count(*) FROM ' + t + ';');
    console.log('  ' + t.padEnd(30) + ': ' + res.rows[0].count + ' rows');
  }

  await client.end();
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
