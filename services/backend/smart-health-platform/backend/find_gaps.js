const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function analyzeGaps() {
  const content = fs.readFileSync('C:/Users/anshv/OneDrive/Desktop/Smart_governance/apps/governance-portal/src/lib/geography.ts', 'utf8');
  const start = content.indexOf('export const STATES: StateNode[] = [');
  const end = content.indexOf('];\n\nexport function');
  const arrayStr = content.substring(start + 'export const STATES: StateNode[] = '.length, end + 1);
  const geoStates = JSON.parse(arrayStr);

  const dbPhcs = await pool.query('SELECT id, name, district_id, state_id FROM phc_facilities');
  const dbPhcIds = new Set(dbPhcs.rows.map(r => r.id.toLowerCase()));
  const dbPhcNames = new Set(dbPhcs.rows.map(r => r.name.toLowerCase()));

  const dbDistricts = await pool.query('SELECT id, name, state_id FROM districts');
  const dbDistIds = new Set(dbDistricts.rows.map(r => r.id.toLowerCase()));

  const dbStates = await pool.query('SELECT id, name, code FROM states');
  const dbStateIds = new Set(dbStates.rows.map(r => r.id.toLowerCase()));

  console.log(`DB Counts: States=${dbStates.rows.length}, Districts=${dbDistricts.rows.length}, PHCs=${dbPhcs.rows.length}`);

  const missingDistricts = [];
  const missingPhcs = [];

  for (const s of geoStates) {
    if (!dbStateIds.has(s.id.toLowerCase())) {
      console.log(`Missing State: ${s.name} (${s.id})`);
    }
    for (const d of s.districts) {
      if (!dbDistIds.has(d.id.toLowerCase())) {
        missingDistricts.push({ ...d, stateId: s.id, stateName: s.name });
      }
      for (const p of d.phcs) {
        if (!dbPhcIds.has(p.id.toLowerCase())) {
          missingPhcs.push({ ...p, districtId: d.id, districtName: d.name, stateId: s.id, stateName: s.name });
        }
      }
    }
  }

  console.log(`Missing Districts: ${missingDistricts.length}`);
  console.log(`Missing PHCs: ${missingPhcs.length}`);
  console.log('Sample missing PHCs:', JSON.stringify(missingPhcs.slice(0, 5), null, 2));

  // Check if any missing PHCs have their district missing
  const missingPhcsWithMissingDist = missingPhcs.filter(p => !dbDistIds.has(p.districtId.toLowerCase()));
  console.log(`Missing PHCs whose district is also missing: ${missingPhcsWithMissingDist.length}`);

  await pool.end();
}

analyzeGaps().catch(console.error);
