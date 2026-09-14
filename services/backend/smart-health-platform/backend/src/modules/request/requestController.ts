import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { requireDeviceBinding } from '../../middleware/deviceBinding';
import { RequestService, RequestStatus } from './requestService';

const router = Router({ mergeParams: true });

// ── GET /api/v1/phc/:phcId/requests ────────────────────────────────────────
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { status, source } = req.query;
    const requests = await RequestService.listRequests(req.tenantClaims!, phcId, {
      status: status as string,
      source: source as string,
    });
    res.json({ count: requests.length, data: requests });
  } catch (err: any) {
    console.error('List requests error', err);
    res.status(500).json({ error_code: 'REQUEST_FETCH_FAILED', message: err.message });
  }
});

// ── POST /api/v1/phc/:phcId/requests ───────────────────────────────────────
router.post('/requests', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const created = await RequestService.createRequest(req.tenantClaims!, phcId, req.body);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Create request error', err);
    res.status(500).json({ error_code: 'REQUEST_CREATE_FAILED', message: err.message });
  }
});

// ── PATCH /api/v1/phc/:phcId/requests/:requestId/status ───────────────────
// Full lifecycle state machine. Only district_admin+ can approve/reject/dispatch.
router.patch('/requests/:requestId/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId, requestId } = req.params;
    const { status, notes, decided_by } = req.body as {
      status: RequestStatus;
      notes?: string;
      decided_by?: string;
    };

    const validStatuses: RequestStatus[] = [
      'approved', 'rejected', 'dispatched', 'in_transit', 'delivered',
    ];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        error_code: 'INVALID_STATUS',
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const updated = await RequestService.transitionStatus(
      req.tenantClaims!,
      phcId,
      requestId,
      status,
      { notes, decidedBy: decided_by },
    );
    res.json(updated);
  } catch (err: any) {
    const code = err.statusCode || 500;
    res.status(code).json({ error_code: err.message });
  }
});

// ── DELETE /api/v1/phc/:phcId/requests/:requestId ─────────────────────────
// PHC user self-cancel of their own pending draft request.
router.delete('/requests/:requestId', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId, requestId } = req.params;
    const result = await RequestService.cancelRequest(req.tenantClaims!, phcId, requestId);
    res.json(result);
  } catch (err: any) {
    const code = err.statusCode || 500;
    res.status(code).json({ error_code: err.message });
  }
});

// ── POST /api/v1/phc/:phcId/emergency ─────────────────────────────────────
// CRITICAL severity fast-path — no batch delay.
router.post('/emergency', requireAuth, requireDeviceBinding, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { alert_type, title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ error_code: 'MISSING_FIELDS', message: 'title and description are required' });
      return;
    }
    const alert = await RequestService.reportEmergency(req.tenantClaims!, phcId, {
      alert_type: alert_type || 'emergency_report',
      title,
      description,
    });
    res.status(201).json(alert);
  } catch (err: any) {
    console.error('Emergency report error', err);
    res.status(500).json({ error_code: 'EMERGENCY_REPORT_FAILED', message: err.message });
  }
});

export default router;
