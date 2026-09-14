import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TenantClaims } from '../../db/pool';

export interface UserClaims {
  userId:      string;
  role:        TenantClaims['role'];
  phcId?:      string;
  districtId?: string;
  stateId?:    string;
  name?:       string;
  email?:      string;
}

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub:         string;
  role:        TenantClaims['role'];
  phc_id?:     string;
  district_id?: string;
  state_id?:   string;
  name?:       string;
  email?:      string;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds (900 = 15m)
  tokenType:    'Bearer';
}

const JWT_SECRET = process.env.JWT_SECRET || 'smart-health-resilience-jwt-secret-key-2026';
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds per §6.1 / Prompt 4
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// In-memory store for active refresh tokens (can be backed by Redis in production)
const refreshStore = new Map<string, { claims: UserClaims; expiresAt: number }>();

export class TokenService {
  /**
   * Issues a short-lived access token (~15 min) and a refresh token
   */
  static issueTokenPair(claims: UserClaims): TokenPair {
    const payload: AccessTokenPayload = {
      sub: claims.userId,
      role: claims.role,
      phc_id: claims.phcId,
      district_id: claims.districtId,
      state_id: claims.stateId,
      name: claims.name,
      email: claims.email,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
      algorithm: 'HS256',
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = Date.now() + REFRESH_TOKEN_TTL * 1000;

    refreshStore.set(refreshToken, { claims, expiresAt });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
      tokenType: 'Bearer',
    };
  }

  /**
   * Verifies and extracts claims from an access token
   */
  static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
      return decoded;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      }
      throw new Error('INVALID_ACCESS_TOKEN');
    }
  }

  /**
   * Rotates a refresh token and returns a new token pair
   */
  static refreshAccessToken(refreshToken: string): TokenPair {
    const entry = refreshStore.get(refreshToken);
    if (!entry) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    if (Date.now() > entry.expiresAt) {
      refreshStore.delete(refreshToken);
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    // Invalidate used refresh token (one-time rotation)
    refreshStore.delete(refreshToken);

    return this.issueTokenPair(entry.claims);
  }

  /**
   * Revokes a refresh token (logout)
   */
  static revokeRefreshToken(refreshToken: string): boolean {
    return refreshStore.delete(refreshToken);
  }
}
