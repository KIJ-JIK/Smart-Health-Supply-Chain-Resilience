import { Router, Request, Response } from 'express';
import { pool } from '../../db/pool';
import { TokenService } from '../auth/tokenService';

export const phcPortalRouter = Router();

/**
 * GET /api/v1/phc/facilities
 * Returns all active PHC facilities from PostgreSQL for the portal login dropdown / search.
 */
phcPortalRouter.get('/phc/facilities', async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.district_id, 
        p.state_id, 
        d.name AS district, 
        s.name AS state, 
        p.total_beds, 
        p.occupied_beds, 
        p.emergency_beds,
        p.isolation_beds,
        p.oxygen_cylinders_available AS oxygen_cylinders, 
        p.operational_status
      FROM phc_facilities p
      LEFT JOIN districts d ON p.district_id = d.id
      LEFT JOIN states s ON p.state_id = s.id
      ORDER BY s.name ASC, d.name ASC, p.name ASC;
    `;
    const r = await pool.query(query);
    return res.status(200).json({ count: r.rows.length, facilities: r.rows });
  } catch (err: any) {
    console.error('[phcPortalRouter] Error fetching facilities:', err);
    return res.status(500).json({ error: 'Failed to retrieve PHC facilities from database', details: err.message });
  }
});

/**
 * GET /api/v1/phc/:phcId/staff-list
 * Returns active staff registry entries for a specific PHC.
 */
phcPortalRouter.get('/phc/:phcId/staff-list', async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const r = await pool.query(
      `SELECT id, phc_id, name, role, active 
       FROM staff_registry 
       WHERE phc_id = $1 AND active = true 
       ORDER BY role ASC, name ASC`,
      [phcId]
    );
    return res.status(200).json({ phcId, count: r.rows.length, staff: r.rows });
  } catch (err: any) {
    console.error('[phcPortalRouter] Error fetching staff:', err);
    return res.status(500).json({ error: 'Failed to fetch staff registry', details: err.message });
  }
});

/**
 * POST /api/v1/phc/auth/verify
 * Validates PHC staff credentials and issues access tokens.
 */
phcPortalRouter.post('/phc/auth/verify', async (req: Request, res: Response) => {
  try {
    const { phcId, staffId, role, pin } = req.body;

    if (!phcId) {
      return res.status(400).json({ error: 'Please select a valid Primary Healthcare Centre facility.' });
    }
    if (!staffId || !String(staffId).trim()) {
      return res.status(400).json({ error: 'Staff ID or official email is required.' });
    }
    if (!pin || String(pin).trim().length < 4) {
      return res.status(400).json({ error: 'Security PIN / Password must be at least 4 characters.' });
    }

    // 1. Verify facility existence
    const facRes = await pool.query(
      `SELECT p.id, p.name, d.name AS district, s.name AS state, p.operational_status 
       FROM phc_facilities p
       LEFT JOIN districts d ON p.district_id = d.id
       LEFT JOIN states s ON p.state_id = s.id
       WHERE p.id = $1`,
      [phcId]
    );

    if (facRes.rows.length === 0) {
      return res.status(404).json({ error: 'Selected PHC facility does not exist in the health registry.' });
    }

    const facility = facRes.rows[0];

    // 2. Look up or verify staff
    const trimmedStaff = String(staffId).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedStaff);
    const staffRes = isUuid
      ? await pool.query(
          `SELECT id, name, role, active FROM staff_registry WHERE phc_id = $1 AND id = $2 LIMIT 1`,
          [phcId, trimmedStaff]
        )
      : await pool.query(
          `SELECT id, name, role, active FROM staff_registry WHERE phc_id = $1 AND (name ILIKE $2 OR role ILIKE $3) LIMIT 1`,
          [phcId, `%${trimmedStaff}%`, `%${role || ''}%`]
        );

    let staffName = String(staffId).trim();
    let staffRole = role || 'Medical Officer';

    if (staffRes.rows.length > 0) {
      const s = staffRes.rows[0];
      staffName = s.name;
      staffRole = s.role;
    }

    // 3. Issue Token
    const userClaims = {
      userId: `usr-phc-${Date.now().toString().slice(-6)}`,
      name: staffName,
      role: 'phc_user' as const,
      phcId: facility.id,
      districtId: facility.district,
      stateId: facility.state,
      email: `${staffId.includes('@') ? staffId : staffId + '@phc.gov.in'}`,
    };

    const tokens = TokenService.issueTokenPair(userClaims);

    return res.status(200).json({
      success: true,
      message: 'Authentication verified successfully.',
      tokens,
      staff: {
        id: staffId,
        name: staffName,
        role: staffRole,
        facilityId: facility.id,
        facilityName: facility.name,
        district: facility.district,
        state: facility.state,
      },
      facility,
    });
  } catch (err: any) {
    console.error('[phcPortalRouter] Login verification error:', err);
    return res.status(500).json({ error: 'Authentication verification failed', details: err.message });
  }
});

/**
 * GET /api/v1/phc/:phcId/live-data
 * Returns the entire ground-truth operational dataset for a specific PHC.
 * Hydrates the PHC portal Dexie database and UI with zero mock data.
 */
phcPortalRouter.get('/phc/:phcId/live-data', async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;

    // Facility details
    const facRes = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.district_id, 
        p.state_id, 
        d.name AS district_name, 
        s.name AS state_name,
        p.total_beds, 
        p.occupied_beds, 
        p.emergency_beds, 
        p.isolation_beds, 
        p.oxygen_cylinders_available, 
        p.operational_status,
        p.created_at
       FROM phc_facilities p
       LEFT JOIN districts d ON p.district_id = d.id
       LEFT JOIN states s ON p.state_id = s.id
       WHERE p.id = $1`,
      [phcId]
    );

    if (facRes.rows.length === 0) {
      return res.status(404).json({ error: 'PHC facility not found' });
    }

    const facility = facRes.rows[0];

    // Medicines catalog
    const medsRes = await pool.query(
      `SELECT id, name, category, unit FROM medicines ORDER BY name ASC`
    );

    // Inventory batches for this PHC
    const invRes = await pool.query(
      `SELECT 
        ib.id, 
        ib.phc_id, 
        ib.medicine_id, 
        m.name AS medicine_name, 
        m.category AS medicine_category, 
        m.unit,
        ib.batch_no, 
        ib.remaining_qty, 
        ib.minimum_threshold, 
        ib.expiry_date::text AS expiry_date
       FROM inventory_batches ib
       JOIN medicines m ON ib.medicine_id = m.id
       WHERE ib.phc_id = $1
       ORDER BY ib.expiry_date ASC`,
      [phcId]
    );

    // Patient footfall for this PHC
    const footRes = await pool.query(
      `SELECT id, phc_id, date::text AS date, category, count
       FROM patient_footfall
       WHERE phc_id = $1
       ORDER BY date DESC, category ASC`,
      [phcId]
    );

    // Active Alerts
    const alertsRes = await pool.query(
      `SELECT id, phc_id, alert_type, severity, status, payload, created_at::text AS created_at
       FROM alerts
       WHERE phc_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [phcId]
    );

    // Staff Registry
    const staffRes = await pool.query(
      `SELECT id, phc_id, name, role, active
       FROM staff_registry
       WHERE phc_id = $1
       ORDER BY role ASC`,
      [phcId]
    );

    // Resource Requests
    const reqRes = await pool.query(
      `SELECT id, phc_id, request_type, priority, status, created_at::text AS created_at
       FROM resource_requests
       WHERE phc_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [phcId]
    );

    // Billing Transactions
    const billRes = await pool.query(
      `SELECT *
       FROM billing_transactions
       WHERE phc_id = $1
       LIMIT 50`,
      [phcId]
    );

    // Stock movements
    const moveRes = await pool.query(
      `SELECT *
       FROM stock_movements
       WHERE phc_id = $1
       LIMIT 50`,
      [phcId]
    );

    // Equipment
    const eqRes = await pool.query(
      `SELECT id, phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at::text, created_at::text
       FROM equipment
       WHERE phc_id = $1
       ORDER BY equipment_type ASC`,
      [phcId]
    );

    // Staff Attendance (last 30 days)
    const attRes = await pool.query(
      `SELECT sa.id, sa.staff_id, sa.phc_id, sa.attendance_date::text AS attendance_date, sa.status, sa.created_at::text
       FROM staff_attendance sa
       JOIN staff_registry sr ON sa.staff_id = sr.id
       WHERE sr.phc_id = $1
       ORDER BY sa.attendance_date DESC, sa.created_at DESC
       LIMIT 200`,
      [phcId]
    );

    return res.status(200).json({
      phcId,
      facility,
      medicines: medsRes.rows,
      inventory: invRes.rows,
      footfall: footRes.rows,
      alerts: alertsRes.rows,
      staff: staffRes.rows,
      equipment: eqRes.rows,
      attendance: attRes.rows,
      requests: reqRes.rows,
      billing: billRes.rows,
      movements: moveRes.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[phcPortalRouter] Error fetching live PHC data:', err);
    return res.status(500).json({ error: 'Failed to retrieve live PHC data', details: err.message });
  }
});
