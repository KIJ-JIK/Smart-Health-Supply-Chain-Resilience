const fs = require('fs');
const content = fs.readFileSync('C:/Users/anshv/OneDrive/Desktop/Smart_governance/apps/governance-portal/src/lib/geography.ts', 'utf8');
const start = content.indexOf('export const STATES: StateNode[] = [');
const end = content.indexOf('];\n\nexport function');
const arrayStr = content.substring(start + 'export const STATES: StateNode[] = '.length, end + 1);
const geoStates = JSON.parse(arrayStr);

const names = [
  'Koramangala PHC',
  'Whitefield PHC',
  'Mysuru North PHC',
  'Malegaon PHC',
  'Nashik Rural PHC',
  'Chakan PHC',
  'Hadapsar PHC',
  'Kothrud PHC',
  'Shirur PHC',
  'Alwar PHC',
  'Jaipur Central PHC',
  'T. Nagar PHC',
  'Aminabad PHC'
];

for (const s of geoStates) {
  for (const d of s.districts) {
    for (const p of d.phcs) {
      if (names.includes(p.name)) {
        console.log(JSON.stringify({
          geoPhcId: p.id,
          geoPhcName: p.name,
          geoPhcCode: p.code,
          geoDistrictId: d.id,
          geoDistrictName: d.name,
          geoStateId: s.id,
          geoStateName: s.name,
          lat: p.lat,
          lng: p.lng
        }, null, 2));
      }
    }
  }
}
