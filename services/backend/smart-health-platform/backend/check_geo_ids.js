const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function check() {
  const ids = [
    '37713d1c-3821-4080-97a7-fafcf726bc4c', // Dharavi
    '3918e500-3b65-4922-ba7d-6d4982191d0c', // Junnar
    'c1826e7f-37a9-4fc1-8c2b-c9be30a54a00', // Shirur Rural
    '4557112a-03fa-43b2-a93e-a98e807256a5', // Kolhapur
    '26c9addb-485f-4ec6-8cf8-79569e260edc', // Bandra
    'e3357b8b-29f7-45f7-981e-7462af82b28c', // Andheri
    '33c316b1-6d36-494f-bd2f-3cbd6d4206c1', // Hadapsar 24x7
    '0aa980cf-5f31-4bc1-af4d-2f441c726e82', // Indiranagar
    'fbee6e14-34ad-44b1-a557-1c47c55e94b4', // Bidar
    '11994087-9598-4033-ae88-258dc74c6ee3', // Koramangala Comm
    '2598bc61-4a56-49de-b268-819027933612', // Kanyakumari
    '9633ccb0-4629-4699-befc-175484ddab72', // Lucknow Hazratganj
    '6f277948-9bda-4471-9af5-bc7a87ad766b', // Mansarovar
    'afdd2513-af8e-4af1-ad54-305336aa1eb1', // Jaipur Pink City
  ];

  const r = await pool.query('SELECT id, name FROM phc_facilities WHERE id = ANY($1)', [ids]);
  console.log(`Found in DB: ${r.rows.length} / ${ids.length}`);
  console.log(r.rows);
  await pool.end();
}
check().catch(console.error);
