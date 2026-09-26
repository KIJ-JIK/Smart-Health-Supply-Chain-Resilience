const { Pool } = require('pg');
const fs = require('fs');
const p = new Pool({host:'localhost',port:5432,user:'postgres',password:'postgres',database:'smarthealth'});

(async()=>{
  const facilities = await p.query(`
    SELECT f.id, f.name, d.name as district, s.name as state,
           f.total_beds, f.occupied_beds, f.oxygen_cylinders_available, f.operational_status
    FROM phc_facilities f
    LEFT JOIN districts d ON f.district_id=d.id
    LEFT JOIN states s ON f.state_id=s.id
    ORDER BY s.name, f.name
  `);

  const results = [];
  for (const fac of facilities.rows) {
    const fid = fac.id;
    const [eq, inv, sr, sa, pf, rr, al] = await Promise.all([
      p.query('SELECT COUNT(*) FROM equipment WHERE phc_id=$1', [fid]),
      p.query('SELECT COUNT(*) FROM inventory_batches WHERE phc_id=$1', [fid]),
      p.query('SELECT COUNT(*) FROM staff_registry WHERE phc_id=$1', [fid]),
      p.query('SELECT COUNT(*) FROM staff_attendance WHERE phc_id=$1', [fid]),
      p.query('SELECT COUNT(*) FROM patient_footfall WHERE phc_id=$1', [fid]),
      p.query('SELECT COUNT(*) FROM resource_requests WHERE phc_id=$1', [fid]),
      p.query('SELECT COUNT(*) FROM alerts WHERE phc_id=$1', [fid])
    ]);
    results.push({
      id: fac.id,
      name: fac.name,
      district: fac.district,
      state: fac.state,
      total_beds: fac.total_beds,
      occupied_beds: fac.occupied_beds,
      oxygen: fac.oxygen_cylinders_available,
      status: fac.operational_status,
      equipment: parseInt(eq.rows[0].count),
      inventory: parseInt(inv.rows[0].count),
      staff: parseInt(sr.rows[0].count),
      attendance: parseInt(sa.rows[0].count),
      footfall: parseInt(pf.rows[0].count),
      requests: parseInt(rr.rows[0].count),
      alerts: parseInt(al.rows[0].count)
    });
  }

  fs.writeFileSync('phc_coverage_full.json', JSON.stringify(results, null, 2));

  // Summary: PHCs with gaps
  const gaps = {
    no_equipment: results.filter(r => r.equipment === 0).map(r => r.name),
    no_attendance: results.filter(r => r.attendance === 0).map(r => r.name),
    no_requests: results.filter(r => r.requests === 0).map(r => r.name),
    no_alerts: results.filter(r => r.alerts === 0).map(r => r.name),
    no_footfall: results.filter(r => r.footfall === 0).map(r => r.name),
    no_inventory: results.filter(r => r.inventory === 0).map(r => r.name),
    no_staff: results.filter(r => r.staff === 0).map(r => r.name),
  };

  console.log('=== PHC COVERAGE GAPS ===');
  for (const [key, list] of Object.entries(gaps)) {
    console.log(`\n${key} (${list.length} PHCs):`);
    list.forEach(n => console.log('  -', n));
  }
  console.log('\n=== FULL MATRIX written to phc_coverage_full.json ===');
  p.end();
})().catch(e=>{console.error('ERROR:', e.message, e.stack); p.end()});
