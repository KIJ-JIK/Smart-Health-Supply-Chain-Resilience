import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { AuditService } from './auditService';

export const auditRouter = Router();

/**
 * GET /api/v1/audit/logs
 * Scoped audit log queries with caller jurisdiction boundaries (Prompt 20).
 */
auditRouter.get('/audit/logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims;
    const filter = {
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      actorId: req.query.actorId as string | undefined,
      phcId: req.query.phcId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const logs = await AuditService.queryAuditLogs(claims, filter);
    return res.json({ count: logs.length, data: logs });
  } catch (err: any) {
    console.error('GET /api/v1/audit/logs error', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/audit/summary
 * Audit dashboard metrics (actions breakdown, security alert flags, integrity check).
 */
auditRouter.get('/audit/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims;
    const summary = await AuditService.getAuditSummary(claims);
    return res.json({ data: summary });
  } catch (err: any) {
    console.error('GET /api/v1/audit/summary error', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/audit/verify
 * Verifies the unbroken cryptographic SHA-256 hash-chain of audit log entries.
 */
auditRouter.get('/audit/verify', requireAuth, async (_req: Request, res: Response) => {
  try {
    const verification = await AuditService.verifyAuditChain(200);
    return res.json({
      status: verification.isValid ? 'valid' : 'tampered',
      data: verification,
    });
  } catch (err: any) {
    console.error('GET /api/v1/audit/verify error', err);
    return res.status(500).json({ error: err.message });
  }
});
