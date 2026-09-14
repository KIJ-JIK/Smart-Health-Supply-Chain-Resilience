import { Router, Request, Response } from 'express';
import { ResourceService } from './resourceService';
import { requireAuth } from '../../middleware/tenantContext';

const router = Router({ mergeParams: true });

/**
 * PUT /api/v1/phc/:phcId/resources/beds
 * Update bed snapshot for a PHC (computes available beds and occupancy rate)
 */
router.put(['/beds', '/resources/beds'], requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const result = await ResourceService.updateBeds(phcId, req.body, req.tenantClaims);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_UPDATE_BEDS' });
  }
});

/**
 * PUT /api/v1/phc/:phcId/resources/oxygen (or /oxygen)
 * Update oxygen cylinder / concentrator counts
 */
router.put(['/oxygen', '/resources/oxygen'], requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const result = await ResourceService.updateOxygen(phcId, req.body, req.tenantClaims);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_UPDATE_OXYGEN' });
  }
});

/**
 * GET /api/v1/phc/:phcId/equipment
 * List equipment for a PHC
 */
router.get('/equipment', requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const equipment = await ResourceService.listEquipment(phcId, req.tenantClaims);
    res.status(200).json({ equipment, count: equipment.length });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_LIST_EQUIPMENT' });
  }
});

/**
 * POST /api/v1/phc/:phcId/equipment
 * Register equipment for a PHC
 */
router.post('/equipment', requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const { equipment_type, quantity, working_qty, maintenance_status, last_serviced_at } = req.body;
    if (!equipment_type) {
      res.status(400).json({ error_code: 'MISSING_EQUIPMENT_TYPE', message: 'equipment_type is required' });
      return;
    }

    const item = await ResourceService.createEquipment(
      phcId,
      { equipment_type, quantity, working_qty, maintenance_status, last_serviced_at },
      req.tenantClaims,
    );
    res.status(201).json(item);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_CREATE_EQUIPMENT' });
  }
});

/**
 * PUT /api/v1/phc/:phcId/equipment/:id
 * Update maintenance status / counts of equipment
 */
router.put('/equipment/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const equipmentId = req.params.id;
    const item = await ResourceService.updateEquipment(phcId, equipmentId, req.body, req.tenantClaims);
    res.status(200).json(item);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_UPDATE_EQUIPMENT' });
  }
});

export default router;
