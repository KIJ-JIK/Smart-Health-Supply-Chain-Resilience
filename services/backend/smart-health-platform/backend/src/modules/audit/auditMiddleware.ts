import { Request, Response, NextFunction } from 'express';
import { AuditService } from './auditService';

/**
 * Auto-instrumentation middleware for Prompt 20:
 * Intercepts writes to billing_transactions, resource_requests, redistribution_transfers,
 * and detects cross-tenant reads, writing structured append-only audit entries.
 */
export function auditInstrumentationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const claims = (req as any).claims;
  const path = req.path;
  const method = req.method;

  const correlationId = (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`;
  const deviceId = (req.headers['x-device-id'] as string) || (req.headers['x-device-cert'] as string) || undefined;
  const sourceIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;

  // Intercept write operations on target tables
  const isBillingWrite = (method === 'POST' || method === 'PUT') && path.includes('/billing');
  const isRequestWrite = (method === 'POST' || method === 'PATCH' || method === 'PUT') && path.includes('/requests');
  const isRedistributionWrite = (method === 'POST' || method === 'PATCH' || method === 'PUT') && (path.includes('/redistribution') || path.includes('/transfers'));
  const isShipmentWrite = (method === 'POST' || method === 'PATCH' || method === 'PUT') && path.includes('/shipments');

  // Intercept cross-tenant read
  if (method === 'GET' && claims) {
    const phcParam = req.params.phcId || (req.query.phcId as string);
    if (phcParam && claims.role === 'phc_user' && claims.phc_id && claims.phc_id !== phcParam) {
      // Detected cross-tenant read attempt
      AuditService.recordCrossTenantRead(
        claims,
        'phc_facilities',
        phcParam,
        { phcId: phcParam },
        { sourceIp, deviceId, correlationId },
      ).catch((e) => console.warn('[auditMiddleware] Cross-tenant read log error:', e.message));
    }
  }

  if (isBillingWrite || isRequestWrite || isRedistributionWrite || isShipmentWrite) {
    const beforeState = req.body ? { ...req.body } : null;
    let action = 'WRITE_OPERATION';
    let entityType = 'unknown';

    if (isBillingWrite) {
      action = 'BILLING_TRANSACTION_CREATE';
      entityType = 'billing_transactions';
    } else if (isRequestWrite) {
      action = method === 'POST' ? 'RESOURCE_REQUEST_CREATE' : 'RESOURCE_REQUEST_UPDATE';
      entityType = 'resource_requests';
    } else if (isRedistributionWrite) {
      action = 'REDISTRIBUTION_TRANSFER_DECIDE';
      entityType = 'redistribution_transfers';
    } else if (isShipmentWrite) {
      action = 'SUPPLY_CHAIN_SHIPMENT_UPDATE';
      entityType = 'supply_chain_shipments';
    }

    // Intercept response to capture after_state and generated entity ID
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const responseData = body;
      const entityId = responseData?.data?.id || responseData?.id || req.params.id || null;
      const aiRecPayload = req.body?.aiRecommendation || req.body?.aiRecPayload || null;

      // Asynchronous append-only audit record creation
      AuditService.recordAuditEntry({
        actorId: claims?.sub || null,
        actorRole: claims?.role || null,
        action,
        entityType,
        entityId,
        beforeState,
        afterState: responseData,
        phcId: claims?.phc_id || req.params.phcId || null,
        districtId: claims?.district_id || null,
        stateId: claims?.state_id || null,
        sourceIp,
        deviceId,
        correlationId,
        aiRecPayload,
      }).catch((e) => console.warn('[auditMiddleware] Write audit record error:', e.message));

      return originalJson(body);
    };
  }

  next();
}
