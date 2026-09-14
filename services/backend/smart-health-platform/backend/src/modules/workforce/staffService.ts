import { withTenantContext, TenantClaims } from '../../db/pool';
import { eventBus } from '../../events/eventBus';

export interface StaffMember {
  id: string;
  phc_id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'other';
  active: boolean;
  created_at: string;
}

export interface StaffAttendanceRecord {
  id: string;
  staff_id: string;
  staff_name?: string;
  role?: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'leave';
  recorded_at: string;
}

export class StaffService {
  private static VALID_ROLES = ['doctor', 'nurse', 'pharmacist', 'technician', 'other'];

  static async listStaff(claims: TenantClaims, phcId: string, activeOnly: boolean = false): Promise<StaffMember[]> {
    return withTenantContext(claims, async (client) => {
      let query = `SELECT id, phc_id, name, role, active, created_at FROM staff_registry WHERE phc_id = $1`;
      if (activeOnly) {
        query += ` AND active = true`;
      }
      query += ` ORDER BY role ASC, name ASC`;
      const res = await client.query(query, [phcId]);
      return res.rows;
    });
  }

  static async createStaff(
    claims: TenantClaims,
    phcId: string,
    input: { name: string; role: string; active?: boolean },
  ): Promise<StaffMember> {
    const roleLower = (input.role || '').toLowerCase();
    if (!this.VALID_ROLES.includes(roleLower)) {
      const err: any = new Error(`Invalid staff role: ${input.role}. Valid roles: ${this.VALID_ROLES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `INSERT INTO staff_registry (phc_id, name, role, active)
         VALUES ($1, $2, $3, $4)
         RETURNING id, phc_id, name, role, active, created_at`,
        [phcId, input.name, roleLower, input.active !== false],
      );
      return res.rows[0];
    });
  }

  static async updateStaff(
    claims: TenantClaims,
    phcId: string,
    staffId: string,
    input: { role?: string; active?: boolean; name?: string },
  ): Promise<StaffMember> {
    return withTenantContext(claims, async (client) => {
      const roleLower = input.role ? input.role.toLowerCase() : undefined;
      if (roleLower && !this.VALID_ROLES.includes(roleLower)) {
        const err: any = new Error(`Invalid role: ${input.role}`);
        err.statusCode = 400;
        throw err;
      }

      const res = await client.query(
        `UPDATE staff_registry
         SET role = COALESCE($1, role),
             active = COALESCE($2, active),
             name = COALESCE($3, name)
         WHERE id = $4 AND phc_id = $5
         RETURNING id, phc_id, name, role, active, created_at`,
        [roleLower ?? null, input.active !== undefined ? input.active : null, input.name ?? null, staffId, phcId],
      );

      if (res.rows.length === 0) {
        const err: any = new Error('Staff member not found');
        err.statusCode = 404;
        throw err;
      }
      return res.rows[0];
    });
  }

  static async recordAttendance(
    claims: TenantClaims,
    phcId: string,
    input: { staff_id: string; attendance_date: string; status: string },
  ): Promise<StaffAttendanceRecord> {
    let status = (input.status || 'present').toLowerCase();
    if (status === 'on_leave') status = 'leave';
    if (!['present', 'absent', 'leave'].includes(status)) {
      const err: any = new Error(`Invalid attendance status: ${input.status}. Must be present, absent, or leave.`);
      err.statusCode = 400;
      throw err;
    }

    return withTenantContext(claims, async (client) => {
      const staffCheck = await client.query<{ id: string; role: string; name: string }>(
        `SELECT id, role, name FROM staff_registry WHERE id = $1 AND phc_id = $2`,
        [input.staff_id, phcId],
      );
      if (staffCheck.rows.length === 0) {
        const err: any = new Error('Staff member does not exist in this PHC facility.');
        err.statusCode = 404;
        throw err;
      }

      const res = await client.query(
        `INSERT INTO staff_attendance (staff_id, attendance_date, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (staff_id, attendance_date) DO UPDATE
         SET status = EXCLUDED.status, recorded_at = now()
         RETURNING id, staff_id, attendance_date, status, recorded_at`,
        [input.staff_id, input.attendance_date, status],
      );
      const record = res.rows[0];

      const daySummary = await client.query<{ total_doctors: string; present_doctors: string; total_active: string; total_present: string }>(
        `SELECT 
           COUNT(*) FILTER (WHERE sr.role = 'doctor') AS total_doctors,
           COUNT(*) FILTER (WHERE sr.role = 'doctor' AND sa.status = 'present') AS present_doctors,
           COUNT(*) AS total_active,
           COUNT(*) FILTER (WHERE sa.status = 'present') AS total_present
         FROM staff_registry sr
         LEFT JOIN staff_attendance sa ON sa.staff_id = sr.id AND sa.attendance_date = $1
         WHERE sr.phc_id = $2 AND sr.active = true`,
        [input.attendance_date, phcId],
      );

      const totalDocs = Number(daySummary.rows[0]?.total_doctors ?? 0);
      const presentDocs = Number(daySummary.rows[0]?.present_doctors ?? 0);

      if (totalDocs > 0 && presentDocs === 0) {
        setImmediate(() => {
          eventBus.publish('staff.shortage_detected', {
            phc_id: phcId,
            attendance_date: input.attendance_date,
            shortage_type: 'doctor_shortage',
            total_doctors: totalDocs,
            present_doctors: 0,
          }, 'workforce-service').catch(() => {});
        });
      }

      return record;
    });
  }

  static async getAttendance(
    claims: TenantClaims,
    phcId: string,
    startDate: string,
    endDate: string = startDate,
  ): Promise<{ count: number; data: StaffAttendanceRecord[] }> {
    return withTenantContext(claims, async (client) => {
      const res = await client.query(
        `SELECT sa.id, sa.staff_id, sr.name AS staff_name, sr.role, sa.attendance_date, sa.status, sa.recorded_at
         FROM staff_attendance sa
         JOIN staff_registry sr ON sr.id = sa.staff_id
         WHERE sr.phc_id = $1 AND sa.attendance_date BETWEEN $2 AND $3
         ORDER BY sa.attendance_date DESC, sr.role ASC`,
        [phcId, startDate, endDate],
      );
      return { count: res.rows.length, data: res.rows };
    });
  }
}
