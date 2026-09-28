import { pool } from '../src/db/pool';

async function inspect() {
  const client = await pool.connect();
  try {
    const tables = ['phc_facilities', 'districts', 'equipment', 'staff_registry', 'patient_footfall', 'inventory_batches', 'alerts'];
    for (const t of tables) {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [t]);
      console.log(`=== Table: ${t} ===`);
      console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(console.error);
