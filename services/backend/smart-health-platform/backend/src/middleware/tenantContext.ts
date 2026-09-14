import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TenantClaims, withTenantContext } from '../db/pool';

import { TokenService } from '../modules/auth/tokenService';

// ---------------------------------------------------------------------------
// JWT payload shape issued by the auth module (Prompt 4).
// For now we also accept trusted request headers for local development.
// ---------------------------------------------------------------------------
interface JwtPayload {
  sub:         string;
  role:        TenantClaims['role'];
  phc_id?:     string;
  district_id?: string;
  state_id?:   string;
}

// Extend Express Request with tenant helpers
declare global {
  namespace Express {
    interface Request {
      tenantClaims?: TenantClaims;
      /** Run a block of queries under the authenticated tenant's RLS context. */
      withTenantContext: <T>(fn: (client: import('pg').PoolClient) => Promise<T>) => Promise<T>;
    }
  }
}

// ---------------------------------------------------------------------------
// tenantContextMiddleware
//
// Priority order for claim extraction:
//  1. Authorization: Bearer <JWT>  (production)
//  2. x-user-role / x-phc-id / x-district-id / x-state-id headers (dev / inter-service)
//
// Attaches:
//  - req.tenantClaims  — the raw claims object
//  - req.withTenantContext — convenience wrapper around pool.withTenantContext
//
// Does NOT reject unauthenticated requests — route handlers must call
// requireAuth() if they need a mandatory authentication check.
// ---------------------------------------------------------------------------
export function tenantContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  let claims: TenantClaims | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const decoded = TokenService.verifyAccessToken(token);
      claims = {
        role:        decoded.role,
        phcId:      decoded.phc_id,
        districtId: decoded.district_id,
        stateId:    decoded.state_id,
      };
    } catch {
      // Invalid token — leave claims undefined; route can reject later
    }
  }

  // Fallback: trust explicit headers for local dev / service-to-service calls
  if (!claims && req.headers['x-user-role']) {
    const role = req.headers['x-user-role'] as TenantClaims['role'];
    claims = {
      role,
      phcId:      req.headers['x-phc-id']      as string | undefined,
      districtId: req.headers['x-district-id'] as string | undefined,
      stateId:    req.headers['x-state-id']    as string | undefined,
    };
  }

  if (claims) {
    req.tenantClaims = claims;
    req.withTenantContext = <T>(fn: (client: import('pg').PoolClient) => Promise<T>) => withTenantContext<T>(claims!, fn);
  }

  next();
}

// ---------------------------------------------------------------------------
// requireAuth — use as second middleware on protected routes.
// ---------------------------------------------------------------------------
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenantClaims) {
    res.status(401).json({ error: 'Unauthorized: valid JWT or tenant headers required.' });
    return;
  }
  next();
}
