import { Request, Response, NextFunction } from 'express';
import { pool } from '../../db/pool';

/**
 * Route helper for GET /api/v1/facilities.
 * Queries live PostgreSQL phc_facilities records, supporting district_id & state_id filtering,
 * computing server-side bed availability and occupancy rate, and returning HTTP 200.
 */
export async function liveFacilitiesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Only intercept GET / (i.e. GET /api/v1/facilities or GET /facilities)
  if (req.method !== 'GET' || (req.path !== '/' && req.path !== '')) {
    return next();
  }

  try {
    const districtId = req.query.district_id as string | undefined;
    const stateId = req.query.state_id as string | undefined;

    const params: any[] = [];
    const clauses: string[] = [];

    if (districtId) {
      params.push(districtId);
      clauses.push(`f.district_id = $${params.length}`);
    }
    if (stateId) {
      params.push(stateId);
      clauses.push(`f.state_id = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        f.id,
        f.name,
        f.district_id,
        d.name AS district_name,
        f.state_id,
        s.name AS state_name,
        COALESCE(f.latitude, 0)::float AS latitude,
        COALESCE(f.longitude, 0)::float AS longitude,
        f.total_beds,
        f.emergency_beds,
        f.isolation_beds,
        f.occupied_beds,
        GREATEST(0, f.total_beds - f.occupied_beds)::int AS available_beds,
        CASE 
          WHEN f.total_beds > 0 THEN ROUND((f.occupied_beds::numeric / f.total_beds::numeric), 4)::float
          ELSE 0::float 
        END AS occupancy_rate,
        COALESCE(f.oxygen_cylinders_available, 0)::int AS oxygen_cylinders,
        0::int AS oxygen_concentrators,
        COALESCE(f.operational_status, 'active') AS status,
        f.created_at,
        f.updated_at
      FROM phc_facilities f
      LEFT JOIN districts d ON f.district_id = d.id
      LEFT JOIN states s ON f.state_id = s.id
      ${where}
      ORDER BY f.name ASC;
    `;

    const r = await pool.query(sql, params);

    res.status(200).json({
      facilities: r.rows,
      data: r.rows,
      count: r.rows.length,
    });
  } catch (err: any) {
    console.error('[liveFacilitiesHandler] Error listing facilities:', err);
    res.status(500).json({ error: 'Failed to retrieve facilities from database', details: err.message });
  }
}
