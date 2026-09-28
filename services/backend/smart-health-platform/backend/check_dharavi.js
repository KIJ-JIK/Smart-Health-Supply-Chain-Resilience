const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const content = fs.readFileSync('C:/Users/anshv/OneDrive/Desktop/Smart_governance/apps/governance-portal/src/lib/geography.ts', 'utf8');
  const start = content.indexOf('export const STATES: StateNode[] = [');
  const end = content.indexOf('];\n\nexport function');
  const arrayStr = content.substring(start + 'export const STATES: StateNode[] = '.length, end + 1);
  const geoStates = JSON.parse(arrayStr);

  const geoPhcsById = new Map();
  const geoPhcsByName = new Map();
  for (const s of geoStates) {
    for (const d of s.districts) {
      for (const p of d.phcs) {
        geoPhcsById.set(p.id.toLowerCase(), { ...p, districtName: d.name, stateName: s.name });
        geoPhcsByName.set(p.name.toLowerCase().trim(), { ...p, districtName: d.name, stateName: s.name });
      }
    }
  }

  const dbPhcs = await pool.query("SELECT id, name, district_id, state_id FROM phc_facilities WHERE id::text LIKE 'c0000003%' ORDER BY id");
  console.log('--- DB PHCs with c0000003 IDs ---');
  for (const row of dbPhcs.rows) {
    const geoWithThisId = geoPhcsById.get(row.id.toLowerCase());
    const geoWithThisName = geoPhcsByName.get(row.name.toLowerCase().trim());
    console.log(`DB row: id=${row.id}, name="${row.name}"`);
    console.log(`  -> In geography.ts with this ID: "${geoWithThisId?.name}" (dist: ${geoWithThisId?.districtName}, state: ${geoWithThisId?.stateName})`);
    console.log(`  -> In geography.ts with this Name: id=${geoWithThisName?.id} (dist: ${geoWithThisName?.districtName}, state: ${geoWithThisName?.stateName})`);
  }

  await pool.end();
}
check().catch(console.error);
