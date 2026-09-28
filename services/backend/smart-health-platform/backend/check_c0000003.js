const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const p = await pool.query("SELECT id, name, district_id, state_id FROM phc_facilities WHERE id::text LIKE 'c0000003%' ORDER BY id");
  console.log('PHCs with c0000003 IDs count:', p.rows.length);
  console.log(p.rows);
  await pool.end();
}
check().catch(console.error);
