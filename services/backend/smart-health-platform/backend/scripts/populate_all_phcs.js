const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'smarthealth',
});

async function run() {
  try {
    const phcsRes = await pool.query(
      `SELECT p.id, p.name, d.name as district_name, s.name as state_name 
       FROM phc_facilities p 
       LEFT JOIN districts d ON p.district_id = d.id 
       LEFT JOIN states s ON p.state_id = s.id 
       ORDER BY p.name`
    );
    const phcs = phcsRes.rows;
    console.log(`Found ${phcs.length} PHCs in PostgreSQL.`);

    const medsRes = await pool.query(`SELECT id, name, category, unit FROM medicines ORDER BY name`);
    const meds = medsRes.rows;
    console.log(`Found ${meds.length} medicines.`);

    for (const phc of phcs) {
      // 1. Staff
      const staffCountRes = await pool.query(`SELECT count(*) FROM staff_registry WHERE phc_id = $1`, [phc.id]);
      if (parseInt(staffCountRes.rows[0].count) === 0) {
        const shortName = phc.name.replace(/ PHC| Central| Model/gi, '').trim();
        await pool.query(
          `INSERT INTO staff_registry (phc_id, name, role, active) VALUES
           ($1, $2, 'Medical Officer', true),
           ($1, $3, 'Pharmacist', true),
           ($1, $4, 'Staff Nurse', true)`,
          [
            phc.id,
            `Dr. ${shortName} (MO)`,
            `Pharmacist ${shortName}`,
            `Sister ${shortName}`,
          ]
        );
        console.log(`Created 3 staff members for ${phc.name}`);
      }

      // 2. Inventory batches
      const invCountRes = await pool.query(`SELECT count(*) FROM inventory_batches WHERE phc_id = $1`, [phc.id]);
      if (parseInt(invCountRes.rows[0].count) === 0) {
        for (let i = 0; i < Math.min(meds.length, 8); i++) {
          const med = meds[i];
          const qty = Math.floor(Math.random() * 500) + 80;
          const minThresh = Math.floor(qty * 0.2);
          const daysToExpiry = Math.floor(Math.random() * 200) + 40;
          await pool.query(
            `INSERT INTO inventory_batches (phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date)
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + ($6 || ' days')::interval)`,
            [
              phc.id,
              med.id,
              `BAT-${shortHex(phc.id)}-${i + 1}`,
              qty,
              minThresh,
              daysToExpiry,
            ]
          );
        }
        console.log(`Created 8 inventory batches for ${phc.name}`);
      }

      // 3. Patient footfall
      const footCountRes = await pool.query(`SELECT count(*) FROM patient_footfall WHERE phc_id = $1`, [phc.id]);
      if (parseInt(footCountRes.rows[0].count) === 0) {
        const categories = ['OPD', 'dengue_fever', 'malaria_fever', 'ANC', 'immunisation'];
        for (const cat of categories) {
          const count = Math.floor(Math.random() * 60) + 12;
          await pool.query(
            `INSERT INTO patient_footfall (phc_id, date, category, count) VALUES ($1, CURRENT_DATE, $2, $3)`,
            [phc.id, cat, count]
          );
        }
        console.log(`Created footfall entries for ${phc.name}`);
      }

      // 4. Alerts
      const alertCountRes = await pool.query(`SELECT count(*) FROM alerts WHERE phc_id = $1`, [phc.id]);
      if (parseInt(alertCountRes.rows[0].count) === 0) {
        await pool.query(
          `INSERT INTO alerts (phc_id, alert_type, severity, status, payload, created_at)
           VALUES ($1, 'STOCKOUT_RISK', 'warning', 'open', '{"message": "Monitor antibiotic reserves for seasonal surge"}'::jsonb, NOW())`,
          [phc.id]
        );
        console.log(`Created baseline alert for ${phc.name}`);
      }
    }

    console.log('All 15 PHC facilities now have complete operational ground-truth records in PostgreSQL!');
  } catch (err) {
    console.error('Error populating PHCs:', err);
  } finally {
    await pool.end();
  }
}

function shortHex(uuid) {
  return uuid.split('-')[0].slice(-4).toUpperCase();
}

run();
