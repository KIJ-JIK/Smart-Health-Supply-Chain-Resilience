import { Router, Request, Response } from 'express';
import { pool } from '../../db/pool';

export const jurisdictionRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/v1/jurisdiction/hierarchy
// Returns complete geographic hierarchy based on caller's role & jurisdiction
// ---------------------------------------------------------------------------
jurisdictionRouter.get('/hierarchy', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { stateId, districtId } = req.query;

    let phcQuery = `
      SELECT p.id, p.name, p.district_id, d.name AS district_name,
             p.state_id, s.name AS state_name, p.latitude, p.longitude,
             p.total_beds, p.occupied_beds, p.emergency_beds,
             p.oxygen_cylinders_available, p.operational_status, p.created_at
      FROM phc_facilities p
      LEFT JOIN districts d ON d.id = p.district_id
      LEFT JOIN states s ON s.id = p.state_id
    `;
    const phcParams: any[] = [];
    const conditions: string[] = [];

    if (stateId) {
      phcParams.push(stateId);
      conditions.push(`p.state_id = $${phcParams.length}`);
    }
    if (districtId) {
      phcParams.push(districtId);
      conditions.push(`p.district_id = $${phcParams.length}`);
    }
    if (conditions.length > 0) {
      phcQuery += ` WHERE ` + conditions.join(' AND ');
    }
    phcQuery += ` ORDER BY p.name ASC`;

    const [nationsRes, statesRes, districtsRes, phcsRes] = await Promise.all([
      client.query(`SELECT id, code, name, status, active_model_version FROM nations ORDER BY name ASC`),
      client.query(`SELECT id, code, name, country FROM states ORDER BY name ASC`),
      client.query(`SELECT id, name, state_id FROM districts ORDER BY name ASC`),
      client.query(phcQuery, phcParams),
    ]);

    return res.json({
      success: true,
      data: {
        nations: nationsRes.rows,
        states: statesRes.rows,
        districts: districtsRes.rows,
        phcs: phcsRes.rows,
        counts: {
          totalNations: nationsRes.rows.length,
          totalStates: statesRes.rows.length,
          totalDistricts: districtsRes.rows.length,
          totalPhcs: phcsRes.rows.length,
        },
      },
    });
  } catch (err: any) {
    console.error('[Jurisdiction Error]', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch hierarchy' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/jurisdiction/nation
// ---------------------------------------------------------------------------
jurisdictionRouter.post('/nation', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { code, name, status = 'ONLINE', activeModelVersion = 'demand-forecaster-v1.20' } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Both code and name are required' });
    }

    const trimmedCode = code.toUpperCase().trim();
    const r = await client.query(
      `INSERT INTO nations (code, name, status, active_model_version)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, status = EXCLUDED.status, active_model_version = EXCLUDED.active_model_version
       RETURNING id, code, name, status`,
      [trimmedCode, name.trim(), status, activeModelVersion]
    );

    return res.json({ success: true, data: r.rows[0], message: `Nation ${name} (${trimmedCode}) saved successfully.` });
  } catch (err: any) {
    console.error('[Save Nation Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/jurisdiction/state
// ---------------------------------------------------------------------------
jurisdictionRouter.post('/state', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, code, country = 'India' } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Both state name and code are required' });
    }

    const trimmedCode = code.toUpperCase().trim();
    const r = await client.query(
      `INSERT INTO states (id, name, code, country)
       VALUES (gen_random_uuid(), $1, $2, $3)
       RETURNING id, name, code, country`,
      [name.trim(), trimmedCode, country]
    );

    return res.json({ success: true, data: r.rows[0], message: `State ${name} registered successfully.` });
  } catch (err: any) {
    console.error('[Save State Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/jurisdiction/district
// ---------------------------------------------------------------------------
jurisdictionRouter.post('/district', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, stateId } = req.body;
    if (!name || !stateId) {
      return res.status(400).json({ success: false, error: 'Both district name and stateId are required' });
    }

    const r = await client.query(
      `INSERT INTO districts (id, name, state_id)
       VALUES (gen_random_uuid(), $1, $2)
       RETURNING id, name, state_id`,
      [name.trim(), stateId]
    );

    return res.json({ success: true, data: r.rows[0], message: `District ${name} created successfully.` });
  } catch (err: any) {
    console.error('[Save District Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/jurisdiction/phc
// ---------------------------------------------------------------------------
jurisdictionRouter.post('/phc', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      name,
      districtId,
      stateId,
      latitude = 18.5204,
      longitude = 73.8567,
      totalBeds = 30,
      emergencyBeds = 5,
      isolationBeds = 4,
      oxygenCylindersAvailable = 15,
      operationalStatus = 'active',
    } = req.body;

    if (!name || !districtId || !stateId) {
      return res.status(400).json({ success: false, error: 'PHC name, districtId, and stateId are required.' });
    }

    const r = await client.query(
      `INSERT INTO phc_facilities (
         id, name, district_id, state_id, latitude, longitude,
         total_beds, emergency_beds, isolation_beds, occupied_beds,
         oxygen_cylinders_available, operational_status
       )
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
       RETURNING id, name, district_id, state_id, total_beds, occupied_beds, oxygen_cylinders_available, operational_status`,
      [
        name.trim(),
        districtId,
        stateId,
        Number(latitude),
        Number(longitude),
        Number(totalBeds),
        Number(emergencyBeds),
        Number(isolationBeds),
        Number(oxygenCylindersAvailable),
        operationalStatus,
      ]
    );

    return res.json({
      success: true,
      data: r.rows[0],
      message: `Primary Health Centre ${name} created and connected to backend.`,
    });
  } catch (err: any) {
    console.error('[Save PHC Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/jurisdiction/batch-import
// Bulk dataset ingestion supporting CSV or JSON array of entities
// ---------------------------------------------------------------------------
jurisdictionRouter.post('/batch-import', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { entityType, data } = req.body;
    if (!entityType || !data) {
      return res.status(400).json({ success: false, error: 'entityType and data are required.' });
    }

    let items: any[] = [];
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Simple CSV parser
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map((v) => v.trim());
            const row: any = {};
            headers.forEach((h, idx) => (row[h] = vals[idx]));
            items.push(row);
          }
        }
      }
    } else if (Array.isArray(data)) {
      items = data;
    }

    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid entity rows found in dataset.' });
    }

    const inserted: any[] = [];
    await client.query('BEGIN');

    for (const item of items) {
      if (entityType === 'phc') {
        const phcName = item.name || item.phc_name || item.facility_name;
        const dId = item.district_id || item.districtid;
        const sId = item.state_id || item.stateid;
        if (phcName && dId && sId) {
          const r = await client.query(
            `INSERT INTO phc_facilities (
               id, name, district_id, state_id, latitude, longitude,
               total_beds, emergency_beds, isolation_beds, occupied_beds,
               oxygen_cylinders_available, operational_status
             ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 0, $9, 'active')
             RETURNING id, name`,
            [
              phcName,
              dId,
              sId,
              Number(item.latitude || item.lat || 19.0),
              Number(item.longitude || item.lng || 74.0),
              Number(item.total_beds || item.beds || 30),
              Number(item.emergency_beds || 4),
              Number(item.isolation_beds || 2),
              Number(item.oxygen_cylinders || item.oxygen || 12),
            ]
          );
          inserted.push(r.rows[0]);
        }
      } else if (entityType === 'district') {
        const distName = item.name || item.district_name;
        const sId = item.state_id || item.stateid;
        if (distName && sId) {
          const r = await client.query(
            `INSERT INTO districts (id, name, state_id) VALUES (gen_random_uuid(), $1, $2) RETURNING id, name`,
            [distName, sId]
          );
          inserted.push(r.rows[0]);
        }
      } else if (entityType === 'state') {
        const sName = item.name || item.state_name;
        const sCode = (item.code || item.state_code || '').toUpperCase();
        if (sName && sCode) {
          const r = await client.query(
            `INSERT INTO states (id, name, code, country) VALUES (gen_random_uuid(), $1, $2, 'India') RETURNING id, name, code`,
            [sName, sCode]
          );
          inserted.push(r.rows[0]);
        }
      } else if (entityType === 'nation') {
        const nCode = (item.code || item.country_code || '').toUpperCase();
        const nName = item.name || item.country_name;
        if (nCode && nName) {
          const r = await client.query(
            `INSERT INTO nations (code, name, status, active_model_version)
             VALUES ($1, $2, 'ONLINE', 'demand-forecaster-v1.20')
             ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
             RETURNING id, code, name`,
            [nCode, nName]
          );
          inserted.push(r.rows[0]);
        }
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      insertedCount: inserted.length,
      inserted,
      message: `Successfully ingested ${inserted.length} ${entityType} record(s) into PostgreSQL database.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Batch Ingestion Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});
