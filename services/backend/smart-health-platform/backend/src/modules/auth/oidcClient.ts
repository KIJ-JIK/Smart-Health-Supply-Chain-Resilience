import { UserClaims } from './tokenService';

export interface OidcConfig {
  issuerUrl:    string;
  clientId:     string;
  clientSecret: string;
}

export class OidcClient {
  private config: OidcConfig;

  constructor(config?: Partial<OidcConfig>) {
    this.config = {
      issuerUrl:    process.env.OIDC_ISSUER_URL    || 'http://localhost:8080/realms/medtech',
      clientId:     process.env.OIDC_CLIENT_ID     || 'smart-health-backend',
      clientSecret: process.env.OIDC_CLIENT_SECRET || 'medtech-secret',
      ...config,
    };
  }

  /**
   * Mock/Dev IdP login exchange:
   * Maps an identity provider user into canonical platform claims.
   * Matches the four roles specified in §6.1 / Prompt 4:
   *   national_admin, state_admin, district_admin, phc_user
   */
  async mockAuthenticate(input: {
    username:   string;
    role?:      UserClaims['role'];
    phcId?:     string;
    districtId?: string;
    stateId?:   string;
  }): Promise<UserClaims> {
    const role = input.role || 'phc_user';

    return {
      userId:     `usr-${Buffer.from(input.username).toString('hex').slice(0, 12)}`,
      role,
      phcId:      input.phcId,
      districtId: input.districtId,
      stateId:    input.stateId,
      name:       input.username,
      email:      `${input.username}@health.gov.in`,
    };
  }

  /**
   * Live Keycloak / OIDC token exchange (standard OAuth2 Authorization Code flow)
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<Record<string, unknown>> {
    const tokenEndpoint = `${this.config.issuerUrl}/protocol/openid-connect/token`;
    // If live Keycloak is configured, fetch tokens:
    try {
      const body = new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const res = await fetch(tokenEndpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      });

      if (!res.ok) {
        throw new Error(`OIDC provider returned ${res.status}: ${await res.text()}`);
      }

      return await res.json() as Record<string, unknown>;
    } catch (err: any) {
      throw new Error(`OIDC exchange failed: ${err.message}`);
    }
  }
}

export const defaultOidcClient = new OidcClient();
