import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { requireDeviceBinding } from '../../middleware/deviceBinding';
import { StaffService } from './staffService';

const router = Router({ mergeParams: true });

router.get('/staff', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const activeOnly = req.query.active === 'true';
    const staff = await StaffService.listStaff(req.tenantClaims!, phcId, activeOnly);
    res.json({ count: staff.length, data: staff });
  } catch (err: any) {
    console.error('List staff error', err);
    res.status(err.statusCode || 500).json({ error_code: 'STAFF_FETCH_FAILED', message: err.message });
  }
});

router.post('/staff', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { name, role, active } = req.body;
    if (!name || !role) {
      res.status(400).json({ error_code: 'MISSING_FIELDS', message: 'name and role are required' });
      return;
    }
    const staff = await StaffService.createStaff(req.tenantClaims!, phcId, { name, role, active });
    res.status(201).json(staff);
  } catch (err: any) {
    console.error('Create staff error', err);
    res.status(err.statusCode || 500).json({ error_code: 'STAFF_CREATE_FAILED', message: err.message });
  }
});

router.put('/staff/:staffId', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId, staffId } = req.params;
    const updated = await StaffService.updateStaff(req.tenantClaims!, phcId, staffId, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update staff error', err);
    res.status(err.statusCode || 500).json({ error_code: 'STAFF_UPDATE_FAILED', message: err.message });
  }
});

router.post('/staff/attendance', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { staff_id, attendance_date, status } = req.body;
    if (!staff_id || !attendance_date || !status) {
      res.status(400).json({ error_code: 'MISSING_FIELDS', message: 'staff_id, attendance_date, and status are required' });
      return;
    }
    const record = await StaffService.recordAttendance(req.tenantClaims!, phcId, { staff_id, attendance_date, status });
    res.status(201).json(record);
  } catch (err: any) {
    console.error('Attendance error', err);
    res.status(err.statusCode || 500).json({ error_code: 'ATTENDANCE_FAILED', message: err.message });
  }
});

router.get('/staff/attendance', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startDate = (req.query.startDate as string) || date;
    const endDate = (req.query.endDate as string) || date;

    const report = await StaffService.getAttendance(req.tenantClaims!, phcId, startDate, endDate);
    res.json(report);
  } catch (err: any) {
    console.error('Get attendance error', err);
    res.status(err.statusCode || 500).json({ error_code: 'ATTENDANCE_FETCH_FAILED', message: err.message });
  }
});

export default router;
