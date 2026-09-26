import { Router, Request, Response } from 'express';
import { pool } from '../../db/pool';

export const liveInventoryRouter = Router({ mergeParams: true });

/**
 * GET /api/v1/inventory
 * Live inventory batches across all facilities with medicine metadata
 */
liveInventoryRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { district_id, state_id, medicine_id, limit = '200' } = req.query;
    const params: any[] = [];
    const clauses: string[] = [];

    if (district_id) {
      params.push(district_id);
      clauses.push(`f.district_id = $${params.length}`);
    }
    if (state_id) {
      params.push(state_id);
      clauses.push(`f.state_id = $${params.length}`);
    }
    if (medicine_id) {
      params.push(medicine_id);
      clauses.push(`ib.medicine_id = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    params.push(Math.min(1000, Number(limit) || 200));

    const sql = `
      SELECT 
        ib.id,
        ib.phc_id,
        f.name AS phc_name,
        f.district_id,
        d.name AS district_name,
        f.state_id,
        s.name AS state_name,
        ib.medicine_id,
        m.name AS medicine_name,
        m.category AS medicine_category,
        m.unit,
        ib.batch_no,
        ib.remaining_qty,
        ib.minimum_threshold,
        ib.expiry_date::text AS expiry_date,
        CASE
          WHEN ib.remaining_qty = 0 THEN 'OUT_OF_STOCK'
          WHEN ib.remaining_qty <= ib.minimum_threshold THEN 'LOW_STOCK'
          WHEN ib.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
          ELSE 'IN_STOCK'
        END AS stock_status,
        ib.created_at
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      LEFT JOIN phc_facilities f ON ib.phc_id = f.id
      LEFT JOIN districts d ON f.district_id = d.id
      LEFT JOIN states s ON f.state_id = s.id
      ${where}
      ORDER BY ib.expiry_date ASC
      LIMIT $${params.length}
    `;

    const r = await pool.query(sql, params);
    return res.status(200).json({
      count: r.rows.length,
      data: r.rows,
      inventory: r.rows,
    });
  } catch (err: any) {
    console.error('[liveInventoryRouter] Error listing inventory:', err);
    return res.status(500).json({ error: 'Failed to retrieve inventory records', details: err.message });
  }
});

/**
 * GET /api/v1/inventory/facilities
 * Aggregated live inventory status grouped by PHC facility
 */
liveInventoryRouter.get('/facilities', async (req: Request, res: Response) => {
  try {
    const { district_id, state_id } = req.query;
    const params: any[] = [];
    const clauses: string[] = [];

    if (district_id) {
      params.push(district_id);
      clauses.push(`f.district_id = $${params.length}`);
    }
    if (state_id) {
      params.push(state_id);
      clauses.push(`f.state_id = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        f.id AS facility_id,
        f.id AS phc_id,
        f.name AS facility_name,
        f.district_id,
        d.name AS district_name,
        f.state_id,
        s.name AS state_name,
        COUNT(ib.id)::int AS total_batches,
        COALESCE(SUM(ib.remaining_qty), 0)::int AS total_quantity,
        COUNT(DISTINCT ib.medicine_id)::int AS distinct_medicines_count,
        COUNT(CASE WHEN ib.remaining_qty = 0 THEN 1 END)::int AS stockouts_count,
        COUNT(CASE WHEN ib.remaining_qty > 0 AND ib.remaining_qty <= ib.minimum_threshold THEN 1 END)::int AS low_stock_count,
        COUNT(CASE WHEN ib.expiry_date <= CURRENT_DATE THEN 1 END)::int AS expired_count
      FROM phc_facilities f
      LEFT JOIN districts d ON f.district_id = d.id
      LEFT JOIN states s ON f.state_id = s.id
      LEFT JOIN inventory_batches ib ON f.id = ib.phc_id
      ${where}
      GROUP BY f.id, f.name, f.district_id, d.name, f.state_id, s.name
      ORDER BY f.name ASC
    `;

    const r = await pool.query(sql, params);
    return res.status(200).json({
      count: r.rows.length,
      data: r.rows,
      facilities: r.rows,
    });
  } catch (err: any) {
    console.error('[liveInventoryRouter] Error listing facility inventories:', err);
    return res.status(500).json({ error: 'Failed to retrieve facility inventory aggregates', details: err.message });
  }
});

/**
 * GET /api/v1/inventory/medicines
 * Aggregated live inventory status grouped by medicine catalog item
 */
liveInventoryRouter.get('/medicines', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const params: any[] = [];
    const clauses: string[] = [];

    if (category) {
      params.push(category);
      clauses.push(`m.category = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.category,
        m.unit,
        COUNT(ib.id)::int AS batch_count,
        COALESCE(SUM(ib.remaining_qty), 0)::int AS total_quantity,
        COUNT(DISTINCT ib.phc_id)::int AS facilities_stocked_count,
        COUNT(CASE WHEN ib.remaining_qty = 0 THEN 1 END)::int AS stockouts_count,
        COUNT(CASE WHEN ib.remaining_qty > 0 AND ib.remaining_qty <= ib.minimum_threshold THEN 1 END)::int AS low_stock_count
      FROM medicines m
      LEFT JOIN inventory_batches ib ON m.id = ib.medicine_id
      ${where}
      GROUP BY m.id, m.name, m.category, m.unit
      ORDER BY m.name ASC
    `;

    const r = await pool.query(sql, params);
    return res.status(200).json({
      count: r.rows.length,
      data: r.rows,
      medicines: r.rows,
    });
  } catch (err: any) {
    console.error('[liveInventoryRouter] Error listing medicines inventory:', err);
    return res.status(500).json({ error: 'Failed to retrieve medicine inventory aggregates', details: err.message });
  }
});

/**
 * GET /api/v1/inventory/batches
 * Raw inventory batches with medicine details
 */
liveInventoryRouter.get('/batches', async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        ib.id,
        ib.phc_id,
        ib.medicine_id,
        m.name AS medicine_name,
        m.category AS medicine_category,
        ib.batch_no,
        ib.remaining_qty,
        ib.minimum_threshold,
        ib.expiry_date::text AS expiry_date,
        ib.created_at
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      ORDER BY ib.expiry_date ASC
      LIMIT 500
    `;
    const r = await pool.query(sql);
    return res.status(200).json({
      count: r.rows.length,
      data: r.rows,
      batches: r.rows,
    });
  } catch (err: any) {
    console.error('[liveInventoryRouter] Error listing inventory batches:', err);
    return res.status(500).json({ error: 'Failed to retrieve inventory batches', details: err.message });
  }
});

/**
 * GET /api/v1/inventory/:phcId
 * Specific facility inventory batches
 */
liveInventoryRouter.get('/:phcId', async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const sql = `
      SELECT 
        ib.id,
        ib.phc_id,
        ib.medicine_id,
        m.name AS medicine_name,
        m.category AS medicine_category,
        m.unit,
        ib.batch_no,
        ib.remaining_qty,
        ib.minimum_threshold,
        ib.expiry_date::text AS expiry_date,
        CASE
          WHEN ib.remaining_qty = 0 THEN 'OUT_OF_STOCK'
          WHEN ib.remaining_qty <= ib.minimum_threshold THEN 'LOW_STOCK'
          WHEN ib.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
          ELSE 'IN_STOCK'
        END AS stock_status,
        ib.created_at
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      WHERE ib.phc_id = $1
      ORDER BY ib.expiry_date ASC
    `;
    const r = await pool.query(sql, [phcId]);
    return res.status(200).json({
      phcId,
      count: r.rows.length,
      data: r.rows,
      inventory: r.rows,
    });
  } catch (err: any) {
    console.error('[liveInventoryRouter] Error fetching facility inventory:', err);
    return res.status(500).json({ error: 'Failed to fetch facility inventory', details: err.message });
  }
});
