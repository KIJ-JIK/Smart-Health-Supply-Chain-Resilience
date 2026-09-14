import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { SupplyChainService } from './supplyChainService';
import { z } from 'zod';

export const supplyChainRouter = Router();

const UpdateStatusSchema = z.object({
  status: z.enum(['dispatched', 'in_transit', 'delivered', 'delayed', 'cancelled']),
  carrier: z.string().optional(),
  notes: z.string().optional(),
  dispatchedAt: z.string().optional(),
  deliveredAt: z.string().optional(),
});

/**
 * GET /api/v1/shipments/analytics
 * Supplier performance / delay analytics for Governance Portal (Prompt 19).
 */
supplyChainRouter.get('/shipments/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims;
    const districtId = req.query.districtId as string | undefined;
    const analytics = await SupplyChainService.getSupplierAnalytics(claims, districtId);
    return res.json({ data: analytics });
  } catch (err: any) {
    console.error('GET /api/v1/shipments/analytics error', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/shipments
 * List shipments with optional status/source/dest filters and tenant RLS enforcement.
 */
supplyChainRouter.get('/shipments', requireAuth, async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims;
    const filter = {
      status: req.query.status as string | undefined,
      sourcePhcId: req.query.sourcePhcId as string | undefined,
      destPhcId: req.query.destPhcId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const shipments = await SupplyChainService.listShipments(claims, filter);
    return res.json({ count: shipments.length, data: shipments });
  } catch (err: any) {
    console.error('GET /api/v1/shipments error', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/shipments/:id
 * Retrieve single shipment details.
 */
supplyChainRouter.get('/shipments/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims;
    const shipment = await SupplyChainService.getShipmentById(claims, req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    return res.json({ data: shipment });
  } catch (err: any) {
    console.error('GET /api/v1/shipments/:id error', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/shipments/:id/status
 * Manual shipment status update endpoint for prototype / logistics operations (Prompt 19).
 */
supplyChainRouter.patch('/shipments/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims;
    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid shipment status update payload',
        details: parsed.error.issues,
      });
    }

    const updated = await SupplyChainService.updateShipmentStatus(claims, req.params.id, parsed.data);
    return res.json({ message: 'Shipment status updated', data: updated });
  } catch (err: any) {
    console.error('PATCH /api/v1/shipments/:id/status error', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});
