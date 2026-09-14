import { Router, Request, Response } from 'express';
import { FacilityService } from './facilityService';
import { requireAuth } from '../../middleware/tenantContext';

const router = Router();

/**
 * GET /api/v1/facilities
 * List facilities accessible to the current authenticated user (RLS scoped)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const districtId = req.query.district_id as string | undefined;
    const facilities = await FacilityService.listFacilities(req.tenantClaims, districtId);
    res.status(200).json({ facilities, count: facilities.length });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_LIST_FACILITIES' });
  }
});

/**
 * POST /api/v1/facilities
 * Create new PHC facility (district_admin+ only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, district_id, state_id, latitude, longitude, total_beds, oxygen_cylinders } = req.body;
    if (!name || !district_id || !state_id || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error_code: 'MISSING_REQUIRED_FIELDS', message: 'name, district_id, state_id, latitude, and longitude are required' });
      return;
    }

    const facility = await FacilityService.createFacility(
      { name, district_id, state_id, latitude: Number(latitude), longitude: Number(longitude), total_beds, oxygen_cylinders },
      req.tenantClaims,
    );
    res.status(201).json(facility);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_CREATE_FACILITY' });
  }
});

/**
 * GET /api/v1/facilities/:phcId or GET /api/v1/phc/:phcId/facility
 * Get specific facility profile with computed bed metrics
 */
router.get('/:phcId', requireAuth, async (req: Request, res: Response) => {
  try {
    const facility = await FacilityService.getFacility(req.params.phcId, req.tenantClaims);
    res.status(200).json(facility);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_GET_FACILITY' });
  }
});

/**
 * PUT /api/v1/facilities/:phcId or PUT /api/v1/phc/:phcId/facility
 * Update facility operational or administrative fields
 */
router.put('/:phcId', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await FacilityService.updateFacility(req.params.phcId, req.body, req.tenantClaims);
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_UPDATE_FACILITY' });
  }
});

export default router;
