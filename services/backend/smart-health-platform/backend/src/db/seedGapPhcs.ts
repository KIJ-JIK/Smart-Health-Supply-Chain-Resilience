import fs from 'fs';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from './pool';

interface PhcNode {
  id: string;
  name: string;
  code: string;
  districtId: string;
  type: string;
  population: number;
  lat: number;
  lng: number;
}

interface DistrictNode {
  id: string;
  name: string;
  code: string;
  stateId: string;
  totalPhcs: number;
  activePhcs: number;
  phcs: PhcNode[];
}

interface StateNode {
  id: string;
  name: string;
  code: string;
  totalDistricts: number;
  totalPhcs: number;
  districts: DistrictNode[];
}

export function loadGeographyStates(): StateNode[] {
  // Resolve geography.ts from apps/governance-portal
  const possiblePaths = [
    path.resolve(__dirname, '../../../../../../apps/governance-portal/src/lib/geography.ts'),
    path.resolve(process.cwd(), 'apps/governance-portal/src/lib/geography.ts'),
    path.resolve(process.cwd(), '../../../apps/governance-portal/src/lib/geography.ts'),
    path.resolve('C:/Users/anshv/OneDrive/Desktop/Smart_governance/apps/governance-portal/src/lib/geography.ts'),
  ];

  let rawContent = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      rawContent = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!rawContent) {
    throw new Error('Could not locate geography.ts in any expected path');
  }

  const match = rawContent.match(/export const STATES:\s*StateNode\[\]\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  if (!match || !match[1]) {
    throw new Error('Failed to extract STATES JSON from geography.ts');
  }

  return JSON.parse(match[1]) as StateNode[];
}

export async function seedGapPhcs(existingClient?: PoolClient): Promise<{ insertedCount: number; totalPhcs: number }> {
  const client = existingClient || await pool.connect();
  const shouldRelease = !existingClient;

  try {
    const states = loadGeographyStates();

    // 1. Collect all 192 canonical PHCs from geography.ts
    const allCanonicalPhcs: {
      phc: PhcNode;
      district: DistrictNode;
      state: StateNode;
    }[] = [];

    for (const state of states) {
      for (const dist of state.districts) {
        for (const phc of dist.phcs) {
          allCanonicalPhcs.push({ phc, district: dist, state });
        }
      }
    }

    // Check inventory_batches columns
    const invColRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory_batches'");
    console.log('inventory_batches columns:', invColRes.rows.map(r => r.column_name).join(', '));

    // Check kothrud facility
    const kRes = await client.query("SELECT id, name, district_id, state_id, total_beds FROM phc_facilities WHERE name ILIKE '%kothrud%'");
    console.log('Kothrud records in DB:', kRes.rows);


    // 2. Query existing PHCs in PostgreSQL
    const existingPhcRes = await client.query('SELECT id, name FROM phc_facilities');
    const existingIds = new Set(existingPhcRes.rows.map((r: any) => r.id));
    const existingNames = new Set(existingPhcRes.rows.map((r: any) => r.name.toLowerCase().trim()));



    // 3. Identify missing PHCs (the 13 gap facilities)
    const missing = allCanonicalPhcs.filter((item) => !existingNames.has(item.phc.name.toLowerCase().trim()));
    console.log(`[Seed Gap PHCs] Canonical: ${allCanonicalPhcs.length}, Existing in DB: ${existingIds.size}, Missing: ${missing.length}`);
    console.log('The 13 Missing PHCs:', missing.map(m => ({ id: m.phc.id, name: m.phc.name, state: m.state.name, dist: m.district.name })));


    if (missing.length === 0) {
      const finalCountRes = await client.query('SELECT count(*)::int as count FROM phc_facilities');
      return { insertedCount: 0, totalPhcs: finalCountRes.rows[0].count };
    }

    // Query standard medicines to attach inventory batches
    const medRes = await client.query('SELECT id, name FROM medicines ORDER BY id LIMIT 8');
    const medicines = medRes.rows;

    let inserted = 0;
    await client.query('BEGIN');

    for (const item of missing) {
      const { phc, district, state } = item;
      // 1. Resolve State
      let targetStateId = state.id;
      const stRes = await client.query('SELECT id FROM states WHERE id = $1 OR code = $2 OR name ILIKE $3', [state.id, state.code, state.name]);
      if (stRes.rows.length > 0) {
        targetStateId = stRes.rows[0].id;
      } else {
        await client.query(`INSERT INTO states (id, name, code) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [state.id, state.name, state.code]);
      }

      // 2. Resolve District
      let targetDistrictId = district.id;
      const distRes = await client.query('SELECT id FROM districts WHERE id = $1', [district.id]);
      if (distRes.rows.length > 0) {
        targetDistrictId = distRes.rows[0].id;
      } else {
        const distNameRes = await client.query('SELECT id FROM districts WHERE name ILIKE $1 OR name ILIKE $2', [district.name, `%${district.name.split(' ')[0]}%`]);
        if (distNameRes.rows.length > 0) {
          targetDistrictId = distNameRes.rows[0].id;
        } else {
          await client.query(
            `INSERT INTO districts (id, name, state_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
            [district.id, district.name, targetStateId]
          );
          targetDistrictId = district.id;
        }
      }

      // Determine bed numbers in specified ranges: total_beds (20-35), occupied_beds (10-25), oxygen (8-20)
      const totalBeds = 28;
      const occupiedBeds = 18;
      const oxygenCylinders = 14;
      const emergencyBeds = 8;
      const isolationBeds = 4;

      // Assign unique facilityId (if canonical id already taken by another facility in DB, generate new uuid)
      let facilityId = phc.id;
      if (existingIds.has(phc.id)) {
        const uuidRes = await client.query('SELECT gen_random_uuid() AS id');
        facilityId = uuidRes.rows[0].id;
      }
      existingIds.add(facilityId);

      // Insert PHC facility
      await client.query(
        `INSERT INTO phc_facilities (
           id, name, district_id, state_id, latitude, longitude,
           total_beds, occupied_beds, emergency_beds, isolation_beds,
           oxygen_cylinders_available, operational_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
         ON CONFLICT (id) DO NOTHING`,
        [
          facilityId,
          phc.name,
          targetDistrictId,
          targetStateId,
          phc.lat,
          phc.lng,
          totalBeds,
          occupiedBeds,
          emergencyBeds,
          isolationBeds,
          oxygenCylinders,
        ]
      );

      // Insert standard equipment
      const standardEquipment = [
        { type: 'ECG Machine', qty: 2, working: 2 },
        { type: 'Autoclave', qty: 3, working: 3 },
        { type: 'Pulse Oximeter', qty: 5, working: 5 },
        { type: 'Centrifuge', qty: 1, working: 1 },
        { type: 'Baby Warmer', qty: 2, working: 2 },
        { type: 'Oxygen Concentrator Unit', qty: 3, working: 3 },
      ];
      for (const eq of standardEquipment) {
        await client.query(
          `INSERT INTO equipment (id, phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'operational', NOW() - INTERVAL '15 days', NOW() - INTERVAL '30 days')`,
          [facilityId, eq.type, eq.qty, eq.working]
        );
      }

      // Insert staff registry (4 core roles)
      const staffMembers = [
        { role: 'Medical Officer', name: `Dr. Lead MO (${phc.name})` },
        { role: 'Staff Nurse', name: `Nurse In-Charge (${phc.name})` },
        { role: 'Pharmacist', name: `Clinical Pharmacist (${phc.name})` },
        { role: 'Lab Technician', name: `Senior Lab Officer (${phc.name})` },
      ];
      for (const sm of staffMembers) {
        await client.query(
          `INSERT INTO staff_registry (id, phc_id, name, role, active, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())`,
          [facilityId, sm.name, sm.role]
        );
      }

      // Insert patient footfalls (7 days)
      const categories = ['opd', 'general_opd', 'maternal_care', 'immunization', 'disease_chronic', 'referral'];
      for (let day = 0; day < 7; day++) {
        for (const cat of categories) {
          const count = cat === 'opd' || cat === 'general_opd' ? 45 : 12;
          await client.query(
            `INSERT INTO patient_footfall (date, phc_id, category, count)
             VALUES (CURRENT_DATE - ${day}, $1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [facilityId, cat, count]
          );
        }
      }

      // Insert inventory batches
      for (let mIdx = 0; mIdx < medicines.length; mIdx++) {
        const med = medicines[mIdx];
        const batchNo = `BAT-${facilityId.substring(0, 6)}-${mIdx + 1}`;
        await client.query(
          `INSERT INTO inventory_batches (
             id, phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date
           ) VALUES (gen_random_uuid(), $1, $2, $3, 200, 20, CURRENT_DATE + INTERVAL '365 days')
           ON CONFLICT DO NOTHING`,
          [facilityId, med.id, batchNo]
        );
      }

      // Insert routine open alert
      await client.query(
        `INSERT INTO alerts (id, phc_id, district_id, state_id, alert_type, severity, status, payload, created_at)
         VALUES (
           gen_random_uuid(), $1, $2, $3, 'near_stockout', 'medium', 'open',
           $4, NOW() - INTERVAL '12 hours'
         )`,
        [
          facilityId,
          targetDistrictId,
          targetStateId,
          JSON.stringify({ message: `Buffer replenishment scheduled for ${phc.name}`, phc_name: phc.name }),
        ]
      );

      inserted++;
    }

    await client.query('COMMIT');
    console.log(`[Seed Gap PHCs] Successfully seeded ${inserted} missing PHCs.`);

    const countRes = await client.query('SELECT count(*)::int as count FROM phc_facilities');
    const totalPhcs = countRes.rows[0].count;
    console.log(`[Seed Gap PHCs] PostgreSQL total PHC facilities now: ${totalPhcs}`);

    return { insertedCount: inserted, totalPhcs };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Gap PHCs] Error seeding gap PHCs:', err);
    throw err;
  } finally {
    if (shouldRelease) {
      client.release();
    }
  }
}
