const { Pool } = require('pg');
const p = new Pool({host:'localhost',port:5432,user:'postgres',password:'postgres',database:'smarthealth'});

(async()=>{
  // Read the full coverage file
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('phc_coverage_full.json','utf8'));

  // PHCs missing equipment AND attendance (the 15 legacy ones)
  const gapPHCs = data.filter(r => r.equipment === 0 && r.attendance === 0);
  console.log(`\n=== ${gapPHCs.length} PHCs with ZERO equipment AND zero attendance ===`);
  gapPHCs.forEach(r => {
    console.log(`  ID: ${r.id} | ${r.name} | Inv:${r.inventory} Staff:${r.staff} FF:${r.footfall}`);
  });

  // Check Rampur specifically
  const rampurRes = await p.query("SELECT f.id, f.name FROM phc_facilities f WHERE f.name ILIKE '%rampur%'");
  if (rampurRes.rows.length > 0) {
    const fid = rampurRes.rows[0].id;
    const eq = await p.query('SELECT COUNT(*) FROM equipment WHERE phc_id=$1', [fid]);
    const sa = await p.query('SELECT COUNT(*) FROM staff_attendance WHERE phc_id=$1', [fid]);
    const rr = await p.query('SELECT COUNT(*) FROM resource_requests WHERE phc_id=$1', [fid]);
    console.log(`\nRampur (${fid}): eq=${eq.rows[0].count} attendance=${sa.rows[0].count} requests=${rr.rows[0].count}`);
  }

  // Check one sample PHC with all data (UUID-based)
  const goodPHC = data.find(r => r.equipment > 0 && r.attendance > 0 && r.requests > 0);
  if (goodPHC) {
    console.log(`\nSample COMPLETE PHC: ${goodPHC.name} | eq=${goodPHC.equipment} att=${goodPHC.attendance} req=${goodPHC.requests}`);
  }

  // Summary stats
  const totalWithAllData = data.filter(r =>
    r.equipment > 0 && r.attendance > 0 && r.requests > 0 &&
    r.inventory > 0 && r.staff > 0 && r.footfall > 0 && r.alerts > 0
  ).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total PHCs: ${data.length}`);
  console.log(`PHCs with ALL 7 modules populated: ${totalWithAllData}`);
  console.log(`PHCs missing equipment: ${data.filter(r => r.equipment === 0).length}`);
  console.log(`PHCs missing attendance: ${data.filter(r => r.attendance === 0).length}`);
  console.log(`PHCs missing requests: ${data.filter(r => r.requests === 0).length}`);
  console.log(`PHCs missing alerts: ${data.filter(r => r.alerts === 0).length}`);

  p.end();
})().catch(e => { console.error('ERR:', e.message); p.end(); });
