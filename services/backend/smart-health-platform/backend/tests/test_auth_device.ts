/**
 * Auth, RBAC & Device Binding Test Suite (Final Architecture §6.1, Abdul_Backend.md Prompt 4)
 *
 * Verifies:
 *  1. JWT issuance for all 4 roles with correct scope claims and 15-min TTL
 *  2. Refresh token rotation & replay rejection
 *  3. Device registration (RSA-2048 keypair generation & fingerprinting)
 *  4. Device signature signing & verification
 *  5. Device binding validation:
 *     - Authorized device & matching PHC -> SUCCESS
 *     - Stolen credential / Unrecognized device -> REJECTED
 *     - Device from different PHC -> REJECTED
 *     - Revoked device -> REJECTED
 *  6. End-to-end RLS queries executed under verified JWT claims
 */

import { TokenService } from '../src/modules/auth/tokenService';
import { DeviceService } from '../src/modules/auth/deviceService';
import { defaultOidcClient } from '../src/modules/auth/oidcClient';
import { withTenantContext, pool, adminPool } from '../src/db/pool';

function assert(label: string, condition: boolean, detail?: string) {
  const icon = condition ? '✓' : '✗';
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`  ${icon} [${status}] ${label}${detail ? ` (${detail})` : ''}`);
  if (!condition) {
    process.exitCode = 1;
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' Auth, RBAC & Device Binding Test Suite (Prompt 4)');
  console.log('══════════════════════════════════════════════════════\n');

  // Query fixture PHC IDs using adminPool
  const phcRes = await adminPool.query(`SELECT id, district_id, state_id FROM phc_facilities LIMIT 2`);
  const phc1 = phcRes.rows[0];
  const phc2 = phcRes.rows[1];

  // ---------------------------------------------------------------------------
  // 1. JWT Token Issuance & Claims Verification for All 4 Roles
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 1: JWT Issuance & Scope Claims (15-min TTL)');

  const roles: Array<{ role: 'national_admin' | 'state_admin' | 'district_admin' | 'phc_user'; scope: any }> = [
    { role: 'national_admin', scope: {} },
    { role: 'state_admin', scope: { stateId: phc1.state_id } },
    { role: 'district_admin', scope: { stateId: phc1.state_id, districtId: phc1.district_id } },
    { role: 'phc_user', scope: { stateId: phc1.state_id, districtId: phc1.district_id, phcId: phc1.id } },
  ];

  for (const r of roles) {
    const claims = await defaultOidcClient.mockAuthenticate({
      username: `test_${r.role}`,
      role: r.role,
      ...r.scope,
    });

    const tokens = TokenService.issueTokenPair(claims);
    assert(`${r.role} token issued`, !!tokens.accessToken && !!tokens.refreshToken);
    assert(`${r.role} 15-min TTL (900s)`, tokens.expiresIn === 900);

    const decoded = TokenService.verifyAccessToken(tokens.accessToken);
    assert(`${r.role} claims decoded`, decoded.role === r.role);
    if (r.role === 'phc_user') {
      assert(`phc_user has phc_id claim`, decoded.phc_id === phc1.id);
    }
  }
  console.log('└─ JWT Issuance OK\n');

  // ---------------------------------------------------------------------------
  // 2. Refresh Token Rotation & Invalidation
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 2: Refresh Token Rotation');
  const initialClaims = await defaultOidcClient.mockAuthenticate({
    username: 'refresh_user',
    role: 'phc_user',
    phcId: phc1.id,
  });
  const tokenPair1 = TokenService.issueTokenPair(initialClaims);

  const tokenPair2 = TokenService.refreshAccessToken(tokenPair1.refreshToken);
  assert('Refresh token exchanged for new token pair', !!tokenPair2.accessToken);
  assert('New refresh token generated', tokenPair2.refreshToken !== tokenPair1.refreshToken);

  // Invalidate on reuse: trying to use old refresh token again must fail
  let reuseFailed = false;
  try {
    TokenService.refreshAccessToken(tokenPair1.refreshToken);
  } catch (err: any) {
    reuseFailed = err.message === 'INVALID_REFRESH_TOKEN';
  }
  assert('One-time use: old refresh token rejected on reuse', reuseFailed);
  console.log('└─ Refresh Token OK\n');

  // ---------------------------------------------------------------------------
  // 3. Device Registration & Certificate / Key Pair Issuance
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 3: Device Registration & Keypair Generation');

  const regResult = await DeviceService.registerDevice({
    phcId: phc1.id,
    deviceName: 'Tablet-Room-1',
    metadata: { model: 'Samsung Galaxy Tab A', os: 'Android 13' },
  });

  assert('Device registered in registry', !!regResult.deviceId);
  assert('Server-generated RSA public key present', regResult.publicKey.includes('PUBLIC KEY'));
  assert('Server-generated RSA private key returned for initial registration', !!regResult.privateKey);
  assert('SHA-256 fingerprint generated', regResult.deviceFingerprint.length === 64);
  assert('Device status active', regResult.status === 'active');
  assert('Bound to target PHC', regResult.phcId === phc1.id);
  console.log('└─ Device Registration OK\n');

  // ---------------------------------------------------------------------------
  // 4. Device Cryptographic Signature & Binding Verification
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 4: Device Cryptographic Signature Verification');

  const timestamp = new Date().toISOString();
  const rawBody = JSON.stringify({ batch_no: 'TEST-BATCH-001', remaining_qty: 100 });
  const canonicalPayload = `POST:/api/v1/phc/${phc1.id}/inventory:${timestamp}:${rawBody}`;

  const validSignature = DeviceService.signPayload(canonicalPayload, regResult.privateKey!);
  assert('Payload signed with private key', !!validSignature);

  // Valid binding test: legitimate device + legitimate matching PHC
  const validCheck = await DeviceService.verifyDeviceBinding(
    regResult.deviceId,
    phc1.id,
    canonicalPayload,
    validSignature,
  );
  assert('Valid device & matching PHC -> SUCCESS', validCheck.valid);

  // Tampered payload test
  const tamperedPayload = `POST:/api/v1/phc/${phc1.id}/inventory:${timestamp}:${JSON.stringify({ batch_no: 'HACKED' })}`;
  const tamperedCheck = await DeviceService.verifyDeviceBinding(
    regResult.deviceId,
    phc1.id,
    tamperedPayload,
    validSignature,
  );
  assert('Tampered payload rejected', !tamperedCheck.valid, tamperedCheck.reason);

  // Device from different PHC test (phc2)
  const mismatchCheck = await DeviceService.verifyDeviceBinding(
    regResult.deviceId,
    phc2.id,
    canonicalPayload,
    validSignature,
  );
  assert('Device used against different PHC -> REJECTED', !mismatchCheck.valid, mismatchCheck.reason);

  // Unregistered / Stolen device ID test
  const fakeDeviceId = '00000000-0000-0000-0000-000000000000';
  const fakeCheck = await DeviceService.verifyDeviceBinding(
    fakeDeviceId,
    phc1.id,
    canonicalPayload,
    validSignature,
  );
  assert('Unregistered device ID -> REJECTED', !fakeCheck.valid, fakeCheck.reason);

  // Revoked device test
  await DeviceService.revokeDevice(regResult.deviceId);
  const revokedCheck = await DeviceService.verifyDeviceBinding(
    regResult.deviceId,
    phc1.id,
    canonicalPayload,
    validSignature,
  );
  assert('Revoked device -> REJECTED', !revokedCheck.valid, revokedCheck.reason);
  console.log('└─ Device Cryptographic Verification OK\n');

  // ---------------------------------------------------------------------------
  // 5. End-to-End RLS Query with JWT Claims
  // ---------------------------------------------------------------------------
  console.log('┌─ Test 5: End-to-End RLS Query with JWT Claims');

  const phcUserClaims = await defaultOidcClient.mockAuthenticate({
    username: 'dr_sharma',
    role: 'phc_user',
    phcId: phc1.id,
    districtId: phc1.district_id,
    stateId: phc1.state_id,
  });
  const userTokens = TokenService.issueTokenPair(phcUserClaims);
  const verifiedClaims = TokenService.verifyAccessToken(userTokens.accessToken);

  const facilitiesCount = await withTenantContext(
    {
      role: verifiedClaims.role,
      phcId: verifiedClaims.phc_id,
      districtId: verifiedClaims.district_id,
      stateId: verifiedClaims.state_id,
    },
    async (client) => {
      const r = await client.query(`SELECT COUNT(*) FROM phc_facilities`);
      return Number(r.rows[0].count);
    },
  );

  assert('phc_user sees exactly 1 facility via JWT RLS context', facilitiesCount === 1);
  console.log('└─ End-to-End RLS with JWT OK\n');

  console.log('══════════════════════════════════════════════════════');
  if (process.exitCode === 1) {
    console.log(' ✗  Auth & Device Binding tests FAILED');
  } else {
    console.log(' ✓  All Auth, RBAC & Device Binding tests PASSED');
  }
  console.log('══════════════════════════════════════════════════════\n');

  await pool.end();
  await adminPool.end();
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
