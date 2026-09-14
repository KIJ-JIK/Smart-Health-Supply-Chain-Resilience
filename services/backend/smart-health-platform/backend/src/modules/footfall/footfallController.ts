import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { requireDeviceBinding } from '../../middleware/deviceBinding';
import { FootfallService } from './footfallService';

const router = Router({ mergeParams: true });

router.get('/footfall', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { startDate, endDate, category, limit } = req.query;

    const result = await FootfallService.getFootfall(req.tenantClaims!, phcId, {
      startDate: startDate as string,
      endDate: endDate as string,
      category: category as string,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get footfall error', err);
    res.status(err.statusCode || 500).json({ error_code: 'FOOTFALL_FETCH_FAILED', message: err.message });
  }
});

router.post('/footfall', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { category, count, time } = req.body;

    if (!category || count === undefined) {
      res.status(400).json({ error_code: 'MISSING_FIELDS', message: 'category and count are required' });
      return;
    }

    const record = await FootfallService.recordFootfall(req.tenantClaims!, phcId, {
      category,
      count: Number(count),
      time,
    });
    res.status(201).json(record);
  } catch (err: any) {
    console.error('Record footfall error', err);
    res.status(err.statusCode || 500).json({ error_code: 'FOOTFALL_RECORD_FAILED', message: err.message });
  }
});

router.post('/footfall/adjustment', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { original_date, category, count_adjustment, reason } = req.body;

    if (!original_date || !category || count_adjustment === undefined || !reason) {
      res.status(400).json({
        error_code: 'MISSING_FIELDS',
        message: 'original_date, category, count_adjustment, and reason are all required for adjustments',
      });
      return;
    }

    const result = await FootfallService.recordAdjustment(req.tenantClaims!, phcId, {
      original_date,
      category,
      count_adjustment: Number(count_adjustment),
      reason,
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Footfall adjustment error', err);
    res.status(err.statusCode || 500).json({ error_code: 'ADJUSTMENT_FAILED', message: err.message });
  }
});

router.put('/footfall*', (req: Request, res: Response) => {
  res.status(422).json({
    error_code: 'FOOTFALL_IMMUTABLE',
    message: 'Patient footfall is strictly append-only. Overwrites are forbidden. Submit a POST to /footfall/adjustment with reason instead.',
  });
});

export default router;
