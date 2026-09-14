import { pool, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';

export interface BedCapacityComputation {
  total_beds:       number;
  occupied_beds:    number;
  emergency_beds:   number;
  isolation_beds:   number;
  available_beds:   number;
  occupancy_rate:   number; // 0.0 to 1.0 (or > 1.0 if over capacity)
}

export interface FacilityProfile extends BedCapacityComputation {
  id:                   string;
  name:                 string;
  district_id:          string;
  district_name?:       string;
  state_id:             string;
  state_name?:          string;
  latitude:             number;
  longitude:            number;
  oxygen_cylinders:     number;
  oxygen_concentrators: number;
  status:               string;
  created_at:           string;
  updated_at:           string;
}

export class FacilityService {
  /**
   * Helper to compute bed statistics server-side.
   * Invariant: Never trust client-calculated availability or occupancy rate.
   */
  static computeBedMetrics(total: number, occupied: number): { available: number; occupancyRate: number } {
    const totalBeds = Math.max(0, Number(total) || 0);
    const occupiedBeds = Math.max(0, Number(occupied) || 0);
    const available = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Number((occupiedBeds / totalBeds).toFixed(4)) : 0;
    return { available, occupancyRate };
  }

  /**
   * Get single facility by ID with computed bed metrics (RLS enforced)
   */
  static async getFacility(phcId: string, claims?: TenantClaims): Promise<FacilityProfile> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      const res = await client.query(
        `SELECT f.id, f.name, f.district_id, d.name AS district_name,
                f.state_id, s.name AS state_name,
                ST_Y(f.location::geometry) AS latitude,
                ST_X(f.location::geometry) AS longitude,
                f.total_beds, f.emergency_beds, f.isolation_beds, f.occupied_beds,
                f.oxygen_cylinders, f.oxygen_concentrators, f.status,
                f.created_at, f.updated_at
         FROM phc_facilities f
         JOIN districts d ON d.id = f.district_id
         JOIN states s ON s.id = f.state_id
         WHERE f.id = $1`,
        [phcId],
      );

      await client.query('COMMIT');

      if (res.rowCount === 0) {
        const err: any = new Error('FACILITY_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }

      const row = res.rows[0];
      const { available, occupancyRate } = this.computeBedMetrics(row.total_beds, row.occupied_beds);

      return {
        id: row.id,
        name: row.name,
        district_id: row.district_id,
        district_name: row.district_name,
        state_id: row.state_id,
        state_name: row.state_name,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        total_beds: Number(row.total_beds),
        emergency_beds: Number(row.emergency_beds),
        isolation_beds: Number(row.isolation_beds),
        occupied_beds: Number(row.occupied_beds),
        available_beds: available,
        occupancy_rate: occupancyRate,
        oxygen_cylinders: Number(row.oxygen_cylinders),
        oxygen_concentrators: Number(row.oxygen_concentrators),
        status: row.status,
        created_at: row.created_at?.toISOString?.() || row.created_at,
        updated_at: row.updated_at?.toISOString?.() || row.updated_at,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * List facilities in the caller's authorized jurisdiction (RLS enforced)
   */
  static async listFacilities(claims?: TenantClaims, districtId?: string): Promise<FacilityProfile[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      const params: any[] = [];
      let sql = `
        SELECT f.id, f.name, f.district_id, d.name AS district_name,
               f.state_id, s.name AS state_name,
               ST_Y(f.location::geometry) AS latitude,
               ST_X(f.location::geometry) AS longitude,
               f.total_beds, f.emergency_beds, f.isolation_beds, f.occupied_beds,
               f.oxygen_cylinders, f.oxygen_concentrators, f.status,
               f.created_at, f.updated_at
        FROM phc_facilities f
        JOIN districts d ON d.id = f.district_id
        JOIN states s ON s.id = f.state_id
      `;

      if (districtId) {
        params.push(districtId);
        sql += ` WHERE f.district_id = $1`;
      }

      sql += ` ORDER BY f.name ASC`;

      const res = await client.query(sql, params);
      await client.query('COMMIT');

      return res.rows.map((row) => {
        const { available, occupancyRate } = this.computeBedMetrics(row.total_beds, row.occupied_beds);
        return {
          id: row.id,
          name: row.name,
          district_id: row.district_id,
          district_name: row.district_name,
          state_id: row.state_id,
          state_name: row.state_name,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          total_beds: Number(row.total_beds),
          emergency_beds: Number(row.emergency_beds),
          isolation_beds: Number(row.isolation_beds),
          occupied_beds: Number(row.occupied_beds),
          available_beds: available,
          occupancy_rate: occupancyRate,
          oxygen_cylinders: Number(row.oxygen_cylinders),
          oxygen_concentrators: Number(row.oxygen_concentrators),
          status: row.status,
          created_at: row.created_at?.toISOString?.() || row.created_at,
          updated_at: row.updated_at?.toISOString?.() || row.updated_at,
        };
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update facility operational fields or administrative fields.
   * Architecture §7.2:
   * - district_admin+ can update administrative fields (name, status)
   * - phc_user can only update their own facility's operational fields (beds, oxygen)
   */
  static async updateFacility(
    phcId: string,
    updates: Partial<{
      name:                 string;
      total_beds:           number;
      emergency_beds:       number;
      isolation_beds:       number;
      occupied_beds:        number;
      oxygen_cylinders:     number;
      oxygen_concentrators: number;
      status:               string;
    }>,
    claims?: TenantClaims,
  ): Promise<FacilityProfile> {
    if (claims?.role === 'phc_user' && claims.phcId !== phcId) {
      const err: any = new Error('FORBIDDEN_FACILITY_ACCESS');
      err.statusCode = 403;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      // Read current state
      const currentRes = await client.query(`SELECT * FROM phc_facilities WHERE id = $1 FOR UPDATE`, [phcId]);
      if (currentRes.rowCount === 0) {
        const err: any = new Error('FACILITY_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }
      const cur = currentRes.rows[0];

      // Build safe update values per role policy (§7.2)
      let name = cur.name;
      let status = cur.status;

      if (claims && claims.role !== 'phc_user') {
        if (updates.name !== undefined) name = updates.name;
        if (updates.status !== undefined) status = updates.status;
      }

      const totalBeds = updates.total_beds !== undefined ? Number(updates.total_beds) : cur.total_beds;
      const emergencyBeds = updates.emergency_beds !== undefined ? Number(updates.emergency_beds) : cur.emergency_beds;
      const isolationBeds = updates.isolation_beds !== undefined ? Number(updates.isolation_beds) : cur.isolation_beds;
      const occupiedBeds = updates.occupied_beds !== undefined ? Number(updates.occupied_beds) : cur.occupied_beds;
      const oxygenCylinders = updates.oxygen_cylinders !== undefined ? Number(updates.oxygen_cylinders) : cur.oxygen_cylinders;
      const oxygenConcentrators = updates.oxygen_concentrators !== undefined ? Number(updates.oxygen_concentrators) : cur.oxygen_concentrators;

      await client.query(
        `UPDATE phc_facilities
         SET name = $1,
             total_beds = $2,
             emergency_beds = $3,
             isolation_beds = $4,
             occupied_beds = $5,
             oxygen_cylinders = $6,
             oxygen_concentrators = $7,
             status = $8,
             updated_at = now()
         WHERE id = $9`,
        [name, totalBeds, emergencyBeds, isolationBeds, occupiedBeds, oxygenCylinders, oxygenConcentrators, status, phcId],
      );

      await client.query('COMMIT');

      const updated = await this.getFacility(phcId, claims);

      // Emit domain events per Masterplan §47
      await eventBus.publish('facility.updated', {
        phcId,
        updatedFields: Object.keys(updates),
        status: updated.status,
        timestamp: updated.updated_at,
      });

      if (updates.total_beds !== undefined || updates.occupied_beds !== undefined || updates.emergency_beds !== undefined) {
        await eventBus.publish('bed.updated', {
          phcId,
          total_beds: updated.total_beds,
          occupied_beds: updated.occupied_beds,
          available_beds: updated.available_beds,
          occupancy_rate: updated.occupancy_rate,
        });
      }

      if (updates.oxygen_cylinders !== undefined || updates.oxygen_concentrators !== undefined) {
        await eventBus.publish('oxygen.updated', {
          phcId,
          oxygen_cylinders: updated.oxygen_cylinders,
          oxygen_concentrators: updated.oxygen_concentrators,
        });
      }

      return updated;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new PHC facility (restricted to district_admin+)
   */
  static async createFacility(
    data: {
      name: string;
      district_id: string;
      state_id: string;
      latitude: number;
      longitude: number;
      total_beds?: number;
      oxygen_cylinders?: number;
    },
    claims?: TenantClaims,
  ): Promise<FacilityProfile> {
    if (claims?.role === 'phc_user') {
      const err: any = new Error('UNAUTHORIZED_FACILITY_CREATION');
      err.statusCode = 403;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (claims) {
        await client.query(`SELECT set_config('app.current_role', $1, true)`, [claims.role]);
        await client.query(`SELECT set_config('app.current_phc_id', $1, true)`, [claims.phcId || '']);
        await client.query(`SELECT set_config('app.current_district_id', $1, true)`, [claims.districtId || '']);
        await client.query(`SELECT set_config('app.current_state_id', $1, true)`, [claims.stateId || '']);
      }

      const res = await client.query(
        `INSERT INTO phc_facilities (
           name, district_id, state_id, location, total_beds, oxygen_cylinders, status
         ) VALUES (
           $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, 'active'
         ) RETURNING id`,
        [
          data.name,
          data.district_id,
          data.state_id,
          data.longitude,
          data.latitude,
          data.total_beds || 0,
          data.oxygen_cylinders || 0,
        ],
      );

      const phcId = res.rows[0].id;
      await client.query('COMMIT');

      const created = await this.getFacility(phcId, claims);
      await eventBus.publish('facility.updated', { phcId, action: 'created', name: data.name });

      return created;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}
