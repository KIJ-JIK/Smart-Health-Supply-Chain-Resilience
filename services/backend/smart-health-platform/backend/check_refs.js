const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const tables = ['inventory_batches', 'staff_registry', 'patient_footfall', 'alerts', 'resource_requests', 'equipment', 'supply_chain_shipments', 'redistribution_transfers'];
  for (const t of tables) {
    try {
      const r = await pool.query(`SELECT count(*) FROM ${t} WHERE phc_id = 'c0000003-0000-0000-0000-000000000001'`);
      console.log(`${t}:`, r.rows[0].count);
    } catch (e) {
      // maybe different column name
    }
  }
  await pool.end();
}
check().catch(console.error);
