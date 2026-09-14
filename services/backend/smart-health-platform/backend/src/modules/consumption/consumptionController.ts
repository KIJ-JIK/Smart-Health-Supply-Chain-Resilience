import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { VelocityService } from './velocityService';
import { AutoDraftService } from './autoDraftService';

const router = Router({ mergeParams: true });

router.get('/consumption/velocity', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const medicineId = req.query.medicineId as string;
    const days = Number(req.query.days || 14);

    if (!medicineId) {
      res.status(400).json({ error_code: 'MISSING_MEDICINE_ID', message: 'medicineId query param is required' });
      return;
    }

    const stats = await VelocityService.getVelocityStats(req.tenantClaims!, phcId, medicineId, days);
    res.json(stats);
  } catch (err: any) {
    console.error('Consumption velocity error', err);
    res.status(500).json({ error_code: 'VELOCITY_FETCH_FAILED', message: err.message });
  }
});

router.get('/consumption/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const medicineId = req.query.medicineId as string | undefined;
    const limit = Number(req.query.limit || 100);

    const history = await VelocityService.getConsumptionHistory(req.tenantClaims!, phcId, medicineId, limit);
    res.json({ count: history.length, data: history });
  } catch (err: any) {
    console.error('Consumption history error', err);
    res.status(500).json({ error_code: 'CONSUMPTION_HISTORY_FAILED', message: err.message });
  }
});

router.post('/consumption/evaluate-drafts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { medicineId, horizonDays, safetyBufferPct } = req.body;

    if (medicineId) {
      const result = await AutoDraftService.evaluateStandalone(req.tenantClaims!, phcId, medicineId, {
        forecastHorizonDays: horizonDays,
        safetyBufferPct,
      });
      res.json({ data: [result] });
    } else {
      const results = await AutoDraftService.evaluateAllMedicines(req.tenantClaims!, phcId);
      res.json({ count: results.length, data: results });
    }
  } catch (err: any) {
    console.error('Evaluate auto-drafts error', err);
    res.status(500).json({ error_code: 'AUTO_DRAFT_EVALUATION_FAILED', message: err.message });
  }
});

export default router;
