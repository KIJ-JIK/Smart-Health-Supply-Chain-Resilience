const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const fks = await pool.query(`
    SELECT
      tc.table_name, kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule, rc.delete_rule
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'phc_facilities';
  `);
  console.log('FKs referencing phc_facilities:', fks.rows);

  // Also check columns named phc_id across all tables
  const phcCols = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE column_name = 'phc_id' AND table_schema = 'public'
  `);
  console.log('Tables with phc_id column:', phcCols.rows);

  await pool.end();
}
check().catch(console.error);
