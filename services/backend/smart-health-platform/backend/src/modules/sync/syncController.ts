import { Router, Request, Response } from 'express';
import { SyncService, SyncPushRequestInput } from './syncService';
import { requireAuth } from '../../middleware/tenantContext';
import { DeviceService } from '../auth/deviceService';

const router = Router();

/**
 * POST /sync/push
 * Upload a batch of queued offline mutations.
 * Enforces JWT authentication, device binding, and idempotency.
 */
router.post('/push', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as SyncPushRequestInput;

    if (!body || !body.device_id || !body.phc_id || !Array.isArray(body.mutations)) {
      res.status(400).json({
        error_code: 'MALFORMED_ENVELOPE',
        message: 'Sync push envelope must contain device_id, phc_id, and mutations array.',
      });
      return;
    }

    // Role check: phc_user cannot push mutations for another PHC
    if (req.tenantClaims?.role === 'phc_user' && req.tenantClaims.phcId !== body.phc_id) {
      res.status(403).json({
        error_code: 'FORBIDDEN_PHC_ACCESS',
        message: 'Token not authorized for the claimed phc_id.',
      });
      return;
    }

    // Device binding verification: if signature header is provided, cryptographically verify
    const deviceSig = req.headers['x-device-signature'] as string | undefined;
    const deviceTs = req.headers['x-device-timestamp'] as string | undefined;

    if (deviceSig && deviceTs) {
      const canonicalPayload = `${req.method}:${req.baseUrl || ''}${req.path}:${deviceTs}:${JSON.stringify(req.body || {})}`;
      const verifyRes = await DeviceService.verifyDeviceBinding(body.device_id, body.phc_id, canonicalPayload, deviceSig);
      if (!verifyRes.valid) {
        res.status(403).json({
          error_code: 'DEVICE_BINDING_FAILED',
          message: `Device binding rejected: ${verifyRes.reason}`,
        });
        return;
      }
    }

    const response = await SyncService.processPush(body, req.tenantClaims);
    res.status(200).json(response);
  } catch (err: any) {
    console.error('[sync/push] error', err);
    res.status(500).json({
      error_code: 'INTERNAL_SYNC_ERROR',
      message: err.message || 'An unexpected error occurred during sync push.',
    });
  }
});

/**
 * GET /sync/pull
 * Download authoritative deltas since last known watermark.
 */
router.get('/pull', requireAuth, async (req: Request, res: Response) => {
  try {
    const since = parseInt(req.query.since as string, 10);
    const deviceId = req.query.device_id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;

    if (isNaN(since) || since < 0) {
      res.status(400).json({
        error_code: 'INVALID_WATERMARK',
        message: 'Query parameter "since" must be a non-negative integer.',
      });
      return;
    }

    if (!deviceId) {
      res.status(400).json({
        error_code: 'MISSING_DEVICE_ID',
        message: 'Query parameter "device_id" is required.',
      });
      return;
    }

    const phcId = req.tenantClaims?.phcId;
    if (!phcId) {
      res.status(403).json({
        error_code: 'PHC_SCOPE_REQUIRED',
        message: 'Sync pull requires a token scoped to a specific PHC.',
      });
      return;
    }

    const response = await SyncService.processPull({
      phcId,
      since,
      deviceId,
      limit,
    });

    res.status(200).json(response);
  } catch (err: any) {
    if (err.statusCode === 410 || err.message === 'WATERMARK_TOO_STALE') {
      res.status(410).json({
        error_code: 'WATERMARK_STALE',
        message: 'Requested watermark is older than server retention window. Full resync required.',
      });
      return;
    }

    console.error('[sync/pull] error', err);
    res.status(500).json({
      error_code: 'INTERNAL_SYNC_ERROR',
      message: err.message || 'An unexpected error occurred during sync pull.',
    });
  }
});

export default router;
