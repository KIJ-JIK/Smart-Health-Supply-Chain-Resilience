const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const content = fs.readFileSync('C:/Users/anshv/OneDrive/Desktop/Smart_governance/apps/governance-portal/src/lib/geography.ts', 'utf8');
  const start = content.indexOf('export const STATES: StateNode[] = [');
  const end = content.indexOf('];\n\nexport function');
  const arrayStr = content.substring(start + 'export const STATES: StateNode[] = '.length, end + 1);
  const geoStates = JSON.parse(arrayStr);

  const dbDistricts = await pool.query('SELECT id, name, state_id FROM districts');
  const dbDistById = new Map(dbDistricts.rows.map(d => [d.id.toLowerCase(), d]));
  const dbDistByName = new Map(dbDistricts.rows.map(d => [`${d.state_id}:${d.name.toLowerCase().trim()}`, d]));

  let matchedId = 0;
  let matchedName = 0;
  let missingDist = [];

  for (const s of geoStates) {
    for (const d of s.districts) {
      if (dbDistById.has(d.id.toLowerCase())) {
        matchedId++;
      } else if (dbDistByName.has(`${s.id}:${d.name.toLowerCase().trim()}`)) {
        matchedName++;
      } else {
        missingDist.push({ id: d.id, name: d.name, stateId: s.id, stateName: s.name });
      }
    }
  }

  console.log(`Matched by ID: ${matchedId}, Matched by Name: ${matchedName}, Missing: ${missingDist.length}`);
  console.log('Sample missing districts:', missingDist.slice(0, 10));

  await pool.end();
}
check().catch(console.error);
