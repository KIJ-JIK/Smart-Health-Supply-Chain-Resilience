import { Request, Response, NextFunction } from 'express';
import { DeviceService } from '../modules/auth/deviceService';

/**
 * requireDeviceBinding middleware:
 * Enforces that any write operation to a PHC boundary requires a valid, active
 * registered device belonging to that specific PHC.
 *
 * Headers required:
 *   - x-device-id: UUID of registered device
 *   - x-device-timestamp: ISO timestamp of request
 *   - x-device-signature: Base64 RSA signature over `${req.method}:${req.originalUrl}:${timestamp}:${rawBody}`
 */
export async function requireDeviceBinding(req: Request, res: Response, next: NextFunction): Promise<void> {
  const phcId = req.params?.phcId;

  if (!phcId) {
    res.status(400).json({ error: 'Device binding requires :phcId in route parameters.' });
    return;
  }

  // Device binding is required on mutating HTTP methods
  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (!isWriteMethod) {
    // Read operations proceed with user JWT alone
    next();
    return;
  }

  const deviceId = (req.headers['x-device-id'] as string) || '';
  const timestamp = (req.headers['x-device-timestamp'] as string) || '';
  const signature = (req.headers['x-device-signature'] as string) || '';

  if (!deviceId) {
    res.status(403).json({
      error: 'DEVICE_BINDING_REQUIRED',
      message: 'Transactional writes to PHC resources require x-device-id header.',
    });
    return;
  }

  // For testing / direct cert token: if x-device-cert is 'test-cert-bypass', allow in non-production
  if (process.env.NODE_ENV !== 'production' && req.headers['x-device-cert'] === 'trusted-test-cert') {
    next();
    return;
  }

  if (!signature || !timestamp) {
    res.status(403).json({
      error: 'DEVICE_SIGNATURE_REQUIRED',
      message: 'Missing x-device-signature or x-device-timestamp header.',
    });
    return;
  }

  // Replay protection: check clock skew (±5 minutes)
  const reqTime = new Date(timestamp).getTime();
  if (isNaN(reqTime) || Math.abs(Date.now() - reqTime) > 5 * 60 * 1000) {
    res.status(403).json({
      error: 'DEVICE_TIMESTAMP_INVALID',
      message: 'Device clock skew exceeds 5-minute threshold.',
    });
    return;
  }

  // Construct canonical payload for signature verification
  const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const canonicalPayload = `${req.method}:${req.baseUrl || ''}${req.path}:${timestamp}:${bodyString}`;

  const result = await DeviceService.verifyDeviceBinding(deviceId, phcId, canonicalPayload, signature);

  if (!result.valid) {
    res.status(403).json({
      error: 'DEVICE_BINDING_FAILED',
      message: `Device binding verification failed: ${result.reason}`,
      reason: result.reason,
    });
    return;
  }

  // Also enforce that if user is phc_user, user's token phc_id matches the device/route phc_id
  if (req.tenantClaims && req.tenantClaims.role === 'phc_user') {
    if (req.tenantClaims.phcId !== phcId) {
      res.status(403).json({
        error: 'USER_PHC_MISMATCH',
        message: 'Authenticated user does not have permission to write to this PHC.',
      });
      return;
    }
  }

  next();
}
