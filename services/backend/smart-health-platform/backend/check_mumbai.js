const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const d = await pool.query("SELECT id, name, state_id FROM districts WHERE name ILIKE '%Mumbai%'");
  console.log('Mumbai districts in DB:', d.rows);
  await pool.end();
}
check().catch(console.error);
