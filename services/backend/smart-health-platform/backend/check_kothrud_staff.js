const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const staff = await pool.query("SELECT * FROM staff_registry WHERE phc_id = 'c0000003-0000-0000-0000-000000000001'");
  console.log('Staff in c0000003-...0001:', staff.rows);
  const inv = await pool.query("SELECT * FROM inventory_batches WHERE phc_id = 'c0000003-0000-0000-0000-000000000001'");
  console.log('Batches in c0000003-...0001:', inv.rows);
  await pool.end();
}
check().catch(console.error);
