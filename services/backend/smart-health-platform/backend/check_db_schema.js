const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function inspect() {
  const fks = await pool.query(`
    SELECT
      tc.table_name, kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('phc_facilities', 'districts', 'inventory_batches', 'alerts', 'staff_registry', 'patient_footfall');
  `);
  console.log('FKs:', fks.rows);

  const phcCols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'phc_facilities'
  `);
  console.log('phc_facilities columns:', phcCols.rows.map(r => r.column_name + ' (' + r.data_type + ')'));
  await pool.end();
}
inspect().catch(console.error);
