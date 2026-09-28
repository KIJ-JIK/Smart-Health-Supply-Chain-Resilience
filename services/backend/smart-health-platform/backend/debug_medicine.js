const {Pool} = require('pg');
const p = new Pool({connectionString: process.env.DATABASE_URL});

async function run() {
  try {
    const r1 = await p.query("SELECT COUNT(*) as cnt FROM phc_facilities WHERE state_id = 'a0000001-0000-0000-0000-000000000001'");
    console.log('MH PHCs by direct state_id:', r1.rows[0].cnt);

    const r2 = await p.query("SELECT COUNT(*) as cnt FROM phc_facilities pf JOIN districts d ON pf.district_id = d.id WHERE d.state_id = 'a0000001-0000-0000-0000-000000000001'");
    console.log('MH PHCs via district join:', r2.rows[0].cnt);

    const r3 = await p.query("SELECT COUNT(*) as cnt FROM inventory_batches ib WHERE ib.phc_id IN (SELECT id FROM phc_facilities WHERE state_id = 'a0000001-0000-0000-0000-000000000001' OR district_id IN (SELECT id FROM districts WHERE state_id = 'a0000001-0000-0000-0000-000000000001'))");
    console.log('MH inventory_batches count:', r3.rows[0].cnt);

    const r4 = await p.query("SELECT COUNT(*) as total FROM inventory_batches");
    console.log('Total inventory_batches:', r4.rows[0].total);

    const r5 = await p.query("SELECT COUNT(*) as total FROM phc_facilities");
    console.log('Total PHCs:', r5.rows[0].total);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    p.end();
  }
}

run();
