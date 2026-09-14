import { pool, TenantClaims } from '../../db/pool';
import { FacilityService } from '../facility/facilityService';
import { eventBus } from '../../events/eventBus';

export interface EquipmentItem {
  id:                 string;
  phc_id:             string;
  equipment_type:     string;
  quantity:           number;
  working_qty:        number;
  maintenance_status: 'operational' | 'maintenance' | 'decommissioned';
  last_serviced_at?:  string;
  created_at:         string;
}

export class ResourceService {
  /**
   * Update bed capacity snapshot with server-side computed metrics (Prompt 7)
   */
  static async updateBeds(
    phcId: string,
    beds: {
      total_beds?:     number;
      occupied_beds?:  number;
      emergency_beds?: number;
      isolation_beds?: number;
    },
    claims?: TenantClaims,
  ) {
    const updated = await FacilityService.updateFacility(phcId, beds, claims);
    return {
      phc_id:         phcId,
      total_beds:     updated.total_beds,
      occupied_beds:  updated.occupied_beds,
      emergency_beds: updated.emergency_beds,
      isolation_beds: updated.isolation_beds,
      available_beds: updated.available_beds,
      occupancy_rate: updated.occupancy_rate,
      updated_at:     updated.updated_at,
    };
  }

  /**
   * Update oxygen capacity snapshot (Prompt 7)
   */
  static async updateOxygen(
    phcId: string,
    oxygen: {
      oxygen_cylinders?:     number;
      oxygen_concentrators?: number;
    },
    claims?: TenantClaims,
  ) {
    const updated = await FacilityService.updateFacility(phcId, oxygen, claims);
    return {
      phc_id:               phcId,
      oxygen_cylinders:     updated.oxygen_cylinders,
      oxygen_concentrators: updated.oxygen_concentrators,
      updated_at:           updated.updated_at,
    };
  }

  /**
   * List equipment items registered for a PHC (RLS enforced)
   */
  static async listEquipment(phcId: string, claims?: TenantClaims): Promise<EquipmentItem[]> {
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
        `SELECT id, phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at, created_at
         FROM equipment
         WHERE phc_id = $1
         ORDER BY equipment_type ASC`,
        [phcId],
      );
      await client.query('COMMIT');

      return res.rows.map((r) => ({
        id:                 r.id,
        phc_id:             r.phc_id,
        equipment_type:     r.equipment_type,
        quantity:           Number(r.quantity),
        working_qty:        Number(r.working_qty),
        maintenance_status: r.maintenance_status,
        last_serviced_at:   r.last_serviced_at?.toISOString?.().split('T')[0] || r.last_serviced_at,
        created_at:         r.created_at?.toISOString?.() || r.created_at,
      }));
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Register a new equipment asset for a PHC
   */
  static async createEquipment(
    phcId: string,
    data: {
      equipment_type:     string;
      quantity?:          number;
      working_qty?:       number;
      maintenance_status?: 'operational' | 'maintenance' | 'decommissioned';
      last_serviced_at?:  string;
    },
    claims?: TenantClaims,
  ): Promise<EquipmentItem> {
    if (claims?.role === 'phc_user' && claims.phcId !== phcId) {
      const err: any = new Error('FORBIDDEN_PHC_ACCESS');
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
        `INSERT INTO equipment (
           phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at, created_at`,
        [
          phcId,
          data.equipment_type,
          data.quantity || 1,
          data.working_qty !== undefined ? data.working_qty : (data.quantity || 1),
          data.maintenance_status || 'operational',
          data.last_serviced_at || null,
        ],
      );

      await client.query('COMMIT');
      const item = res.rows[0];

      await eventBus.publish('equipment.updated', {
        phcId,
        action: 'created',
        equipmentId: item.id,
        equipmentType: item.equipment_type,
      });

      return {
        id:                 item.id,
        phc_id:             item.phc_id,
        equipment_type:     item.equipment_type,
        quantity:           Number(item.quantity),
        working_qty:        Number(item.working_qty),
        maintenance_status: item.maintenance_status,
        last_serviced_at:   item.last_serviced_at,
        created_at:         item.created_at?.toISOString?.() || item.created_at,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update equipment working count or maintenance status
   */
  static async updateEquipment(
    phcId: string,
    equipmentId: string,
    updates: {
      quantity?:           number;
      working_qty?:        number;
      maintenance_status?: 'operational' | 'maintenance' | 'decommissioned';
      last_serviced_at?:   string;
    },
    claims?: TenantClaims,
  ): Promise<EquipmentItem> {
    if (claims?.role === 'phc_user' && claims.phcId !== phcId) {
      const err: any = new Error('FORBIDDEN_PHC_ACCESS');
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
        `UPDATE equipment
         SET quantity = COALESCE($1, quantity),
             working_qty = COALESCE($2, working_qty),
             maintenance_status = COALESCE($3, maintenance_status),
             last_serviced_at = COALESCE($4, last_serviced_at)
         WHERE id = $5 AND phc_id = $6
         RETURNING id, phc_id, equipment_type, quantity, working_qty, maintenance_status, last_serviced_at, created_at`,
        [
          updates.quantity,
          updates.working_qty,
          updates.maintenance_status,
          updates.last_serviced_at,
          equipmentId,
          phcId,
        ],
      );

      if (res.rowCount === 0) {
        const err: any = new Error('EQUIPMENT_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }

      await client.query('COMMIT');
      const item = res.rows[0];

      await eventBus.publish('equipment.updated', {
        phcId,
        action: 'updated',
        equipmentId,
        working_qty: item.working_qty,
        maintenance_status: item.maintenance_status,
      });

      return {
        id:                 item.id,
        phc_id:             item.phc_id,
        equipment_type:     item.equipment_type,
        quantity:           Number(item.quantity),
        working_qty:        Number(item.working_qty),
        maintenance_status: item.maintenance_status,
        last_serviced_at:   item.last_serviced_at,
        created_at:         item.created_at?.toISOString?.() || item.created_at,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}
