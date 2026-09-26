const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'smarthealth' });

async function seedMissingData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Make sure column types in resource_requests are flexible (TEXT or VARCHAR(255))
    await client.query(`
      ALTER TABLE resource_requests 
      ALTER COLUMN item_name TYPE VARCHAR(255),
      ALTER COLUMN reason TYPE TEXT;
    `);

    // 1. Add oxygen_concentrators column if not exists
    await client.query(`
      ALTER TABLE phc_facilities 
      ADD COLUMN IF NOT EXISTS oxygen_concentrators INTEGER DEFAULT 4;
    `);

    // Update oxygen_concentrators scaled to facility beds
    await client.query(`
      UPDATE phc_facilities
      SET oxygen_concentrators = GREATEST(2, ROUND(total_beds / 8))
      WHERE oxygen_concentrators IS NULL OR oxygen_concentrators = 0;
    `);

    // 2. Identify PHCs missing equipment and seed canonical equipment
    const missingEq = await client.query(`
      SELECT f.id, f.name FROM phc_facilities f
      LEFT JOIN equipment e ON f.id = e.phc_id
      WHERE e.id IS NULL
      GROUP BY f.id, f.name
    `);
    console.log(`Found ${missingEq.rows.length} PHCs missing equipment. Seeding...`);

    const standardEquipment = [
      { type: 'ECG Machine', qty: 2, working: 2, status: 'operational' },
      { type: 'Autoclave', qty: 3, working: 3, status: 'operational' },
      { type: 'Pulse Oximeter', qty: 4, working: 4, status: 'operational' },
      { type: 'Centrifuge', qty: 1, working: 1, status: 'operational' },
      { type: 'Baby Warmer', qty: 2, working: 2, status: 'operational' },
      { type: 'Oxygen Concentrator Unit', qty: 3, working: 3, status: 'operational' },
    ];

    for (const fac of missingEq.rows) {
      for (const eq of standardEquipment) {
        await client.query(`
          INSERT INTO equipment (id, phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW() - INTERVAL '15 days', NOW() - INTERVAL '30 days')
        `, [fac.id, eq.type, eq.qty, eq.working, eq.status]);
      }
    }

    // 3. Identify PHCs missing attendance records and seed 14 days of attendance
    const missingAtt = await client.query(`
      SELECT f.id, f.name FROM phc_facilities f
      LEFT JOIN staff_attendance sa ON f.id = sa.phc_id
      WHERE sa.id IS NULL
      GROUP BY f.id, f.name
    `);
    console.log(`Found ${missingAtt.rows.length} PHCs missing staff attendance. Seeding...`);

    for (const fac of missingAtt.rows) {
      const staffList = await client.query(`
        SELECT id, name, role FROM staff_registry WHERE phc_id = $1
      `, [fac.id]);

      // If facility has no staff, add 4 core staff members
      let staffIds = staffList.rows.map(s => s.id);
      if (staffIds.length === 0) {
        const defaultRoles = [
          { role: 'Medical Officer', name: 'Dr. Primary MO' },
          { role: 'Staff Nurse', name: 'Sister Nurse Lead' },
          { role: 'Pharmacist', name: 'Clinical Pharmacist' },
          { role: 'Lab Technician', name: 'Lab Tech Officer' },
        ];
        for (const st of defaultRoles) {
          const ins = await client.query(`
            INSERT INTO staff_registry (id, phc_id, name, role, active, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
            RETURNING id
          `, [fac.id, st.name, st.role]);
          staffIds.push(ins.rows[0].id);
        }
      }

      // Seed 14 days of attendance for each staff member
      for (let day = 0; day < 14; day++) {
        for (const sId of staffIds) {
          const status = (day % 7 === 0) ? 'present' : (day === 4 ? 'on_leave' : 'present');
          await client.query(`
            INSERT INTO staff_attendance (id, staff_id, phc_id, attendance_date, status, created_at)
            VALUES (gen_random_uuid(), $1, $2, (CURRENT_DATE - ${day}), $3, NOW() - (${day} || ' days')::interval)
            ON CONFLICT (staff_id, attendance_date) DO NOTHING
          `, [sId, fac.id, status]);
        }
      }
    }

    // 4. Identify PHCs missing resource requests
    const missingReq = await client.query(`
      SELECT f.id, f.name, f.district_id, f.state_id FROM phc_facilities f
      LEFT JOIN resource_requests rr ON f.id = rr.phc_id
      WHERE rr.id IS NULL
      GROUP BY f.id, f.name, f.district_id, f.state_id
    `);
    console.log(`Found ${missingReq.rows.length} PHCs missing resource requests. Seeding...`);

    const standardRequests = [
      { type: 'medicine', name: 'Paracetamol 500mg', qty: 500, priority: 'routine', status: 'pending', reason: 'Anticipated OPD demand surge' },
      { type: 'oxygen', name: 'Oxygen D-Cylinders', qty: 10, priority: 'urgent', status: 'pending', reason: 'Reserve replenishment' },
      { type: 'equipment', name: 'Digital NIBP Monitor', qty: 2, priority: 'routine', status: 'approved', reason: 'Replacement' },
    ];

    for (const fac of missingReq.rows) {
      for (const req of standardRequests) {
        await client.query(`
          INSERT INTO resource_requests (
            id, phc_id, district_id, state_id, request_type, item_name, quantity, 
            priority, status, reason, source, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, 
            $7, $8, $9, 'manual', NOW() - INTERVAL '2 days'
          )
        `, [fac.id, fac.district_id, fac.state_id, req.type, req.name, req.qty, req.priority, req.status, req.reason]);
      }
    }

    // 5. Identify PHCs missing alerts
    const missingAlerts = await client.query(`
      SELECT f.id, f.name, f.district_id, f.state_id FROM phc_facilities f
      LEFT JOIN alerts a ON f.id = a.phc_id
      WHERE a.id IS NULL
      GROUP BY f.id, f.name, f.district_id, f.state_id
    `);
    console.log(`Found ${missingAlerts.rows.length} PHCs missing alerts. Seeding...`);

    for (const fac of missingAlerts.rows) {
      await client.query(`
        INSERT INTO alerts (id, phc_id, district_id, state_id, alert_type, severity, status, payload, created_at)
        VALUES (
          gen_random_uuid(), $1, $2, $3, 'near_stockout', 'medium', 'open',
          $4, NOW() - INTERVAL '1 day'
        )
      `, [fac.id, fac.district_id, fac.state_id, JSON.stringify({ message: "Buffer stock below 20% for essential antibiotics", phc_name: fac.name })]);
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding data:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedMissingData();
