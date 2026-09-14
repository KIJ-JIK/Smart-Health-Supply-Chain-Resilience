import { Router, Request, Response } from 'express';
import { InventoryService } from './inventoryService';
import { requireAuth } from '../../middleware/tenantContext';

const router = Router({ mergeParams: true });

// -----------------------------------------------------------------------------
// Medicines Master Endpoints
// -----------------------------------------------------------------------------

router.get('/medicines', requireAuth, async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const medicines = await InventoryService.listMedicines(category);
    res.status(200).json({ medicines, count: medicines.length });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_LIST_MEDICINES' });
  }
});

router.get('/medicines/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const medicine = await InventoryService.getMedicine(req.params.id);
    res.status(200).json(medicine);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_GET_MEDICINE' });
  }
});

router.post('/medicines', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, category, unit } = req.body;
    if (!name) {
      res.status(400).json({ error_code: 'MISSING_NAME', message: 'Medicine name is required' });
      return;
    }
    const medicine = await InventoryService.createMedicine({ name, category, unit });
    res.status(201).json(medicine);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_CREATE_MEDICINE' });
  }
});

// -----------------------------------------------------------------------------
// PHC Inventory & Batch Endpoints
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/phc/:phcId/inventory
 * List batches and per-medicine live derived health status (RLS enforced)
 */
router.get('/phc/:phcId/inventory', requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const inventory = await InventoryService.getPhcInventory(phcId, req.tenantClaims);
    res.status(200).json({ inventory, count: inventory.length });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_GET_INVENTORY' });
  }
});

/**
 * POST /api/v1/phc/:phcId/inventory
 * Receive new stock batch into PHC inventory
 */
router.post('/phc/:phcId/inventory', requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const { medicine_id, batch_no, quantity, expiry_date, minimum_threshold } = req.body;
    const batch = await InventoryService.receiveStock(
      phcId,
      { medicine_id, batch_no, quantity: Number(quantity), expiry_date, minimum_threshold: minimum_threshold ? Number(minimum_threshold) : undefined },
      req.tenantClaims,
    );
    res.status(201).json(batch);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_RECEIVE_STOCK' });
  }
});

/**
 * POST /api/v1/phc/:phcId/inventory/:batchId/adjust
 * Adjust stock count with mandatory audit reason (Masterplan §9)
 */
router.post('/phc/:phcId/inventory/:batchId/adjust', requireAuth, async (req: Request, res: Response) => {
  try {
    const phcId = req.params.phcId;
    const batchId = req.params.batchId;
    const { reason, quantity_delta, new_quantity, device_id } = req.body;

    const result = await InventoryService.adjustStock(
      phcId,
      batchId,
      {
        reason,
        quantity_delta: quantity_delta !== undefined ? Number(quantity_delta) : undefined,
        new_quantity: new_quantity !== undefined ? Number(new_quantity) : undefined,
        device_id,
        user_id: req.tenantClaims?.sub,
      },
      req.tenantClaims,
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_ADJUST_STOCK' });
  }
});

export default router;
