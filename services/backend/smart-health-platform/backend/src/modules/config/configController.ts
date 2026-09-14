import { Router, Request, Response } from 'express';
import { ConfigService } from './configService';
import { TenantClaims } from '../../db/pool';

export const configRouter = Router();

// GET /api/v1/governance/config
configRouter.get('/governance/config', async (req: Request, res: Response) => {
  try {
    const scope = req.query.scope as string | undefined;
    const scopeId = req.query.scopeId as string | undefined;
    const configs = await ConfigService.listConfigs(scope, scopeId);
    return res.status(200).json({ configs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/governance/config/resolve
configRouter.get('/governance/config/resolve', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ error: 'Missing required query parameter: key' });
    }
    const phcId = req.query.phcId as string | undefined;
    const districtId = req.query.districtId as string | undefined;
    const stateId = req.query.stateId as string | undefined;

    const value = await ConfigService.getConfig(key, { phcId, districtId, stateId });
    return res.status(200).json({ key, value });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/governance/config/:key
configRouter.put('/governance/config/:key', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims as TenantClaims;
    if (!claims) {
      return res.status(401).json({ error: 'UNAUTHORIZED: missing token claims' });
    }

    const { key } = req.params;
    const { value, scope, scopeId, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Missing required field: value' });
    }

    const updated = await ConfigService.setConfig(
      claims,
      key,
      String(value),
      scope || 'global',
      scopeId || null,
      description,
    );

    return res.status(200).json({ config: updated });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
});
