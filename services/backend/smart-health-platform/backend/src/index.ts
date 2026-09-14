import express from 'express';
import { tenantContextMiddleware, requireAuth } from './middleware/tenantContext';

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Global: 10-field structured request logging middleware (Prompt 21)
// ---------------------------------------------------------------------------
import { structuredLoggingMiddleware } from './middleware/structuredLogger';
app.use(structuredLoggingMiddleware);

// ---------------------------------------------------------------------------
// Global: inject tenant RLS context on every request
// ---------------------------------------------------------------------------
app.use(tenantContextMiddleware);

// ---------------------------------------------------------------------------
// Global: append-only audit instrumentation middleware (Prompt 20)
// ---------------------------------------------------------------------------
import { auditInstrumentationMiddleware } from './modules/audit/auditMiddleware';
app.use(auditInstrumentationMiddleware);

// ---------------------------------------------------------------------------
// Health check — unauthenticated
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// GET /api/v1/facilities — returns facilities visible to the authenticated role
// ---------------------------------------------------------------------------
app.get('/api/v1/facilities', requireAuth, async (req, res) => {
  try {
    const rows = await req.withTenantContext(async (client) => {
      const r = await client.query(
        `SELECT id, name, district_id, state_id, total_beds, occupied_beds, oxygen_cylinders
         FROM phc_facilities
         ORDER BY name`,
      );
      return r.rows;
    });
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('/api/v1/facilities error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/phc/:phcId/inventory — returns inventory_batches for a PHC
// ---------------------------------------------------------------------------
app.get('/api/v1/phc/:phcId/inventory', requireAuth, async (req, res) => {
  try {
    const { phcId } = req.params;
    const rows = await req.withTenantContext(async (client) => {
      const r = await client.query(
        `SELECT ib.id, ib.medicine_id, m.name AS medicine_name, ib.batch_no,
                ib.remaining_qty, ib.minimum_threshold, ib.expiry_date
         FROM inventory_batches ib
         JOIN medicines m ON m.id = ib.medicine_id
         WHERE ib.phc_id = $1
         ORDER BY ib.expiry_date`,
        [phcId],
      );
      return r.rows;
    });
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('/api/v1/phc/:phcId/inventory error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/phc/:phcId/requests — returns resource_requests for a PHC
// ---------------------------------------------------------------------------
app.get('/api/v1/phc/:phcId/requests', requireAuth, async (req, res) => {
  try {
    const { phcId } = req.params;
    const rows = await req.withTenantContext(async (client) => {
      const r = await client.query(
        `SELECT id, request_type, priority, status, created_at, decided_at
         FROM resource_requests
         WHERE phc_id = $1
         ORDER BY created_at DESC`,
        [phcId],
      );
      return r.rows;
    });
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('/api/v1/phc/:phcId/requests error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/alerts — returns alerts visible to the authenticated role
// ---------------------------------------------------------------------------
app.get('/api/v1/alerts', requireAuth, async (req, res) => {
  try {
    const rows = await req.withTenantContext(async (client) => {
      const r = await client.query(
        `SELECT id, phc_id, district_id, state_id, alert_type, severity, status, created_at
         FROM alerts
         WHERE status = 'open'
         ORDER BY created_at DESC
         LIMIT 200`,
      );
      return r.rows;
    });
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('/api/v1/alerts error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Auth & RBAC Endpoints (Prompt 4)
// ---------------------------------------------------------------------------
import { TokenService } from './modules/auth/tokenService';
import { defaultOidcClient } from './modules/auth/oidcClient';
import { DeviceService } from './modules/auth/deviceService';
import { requireDeviceBinding } from './middleware/deviceBinding';

/**
 * POST /api/v1/auth/login
 * Simulates external IdP / Keycloak authentication and returns short-lived JWT
 * access token (~15 min) + refresh token.
 */
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, role, phcId, districtId, stateId } = req.body;
    if (!username) {
      res.status(400).json({ error: 'Username is required.' });
      return;
    }

    const userClaims = await defaultOidcClient.mockAuthenticate({
      username,
      role,
      phcId,
      districtId,
      stateId,
    });

    const tokens = TokenService.issueTokenPair(userClaims);
    res.json({
      ...tokens,
      user: {
        userId: userClaims.userId,
        name: userClaims.name,
        role: userClaims.role,
        phcId: userClaims.phcId,
        districtId: userClaims.districtId,
        stateId: userClaims.stateId,
      },
    });
  } catch (err: any) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Rotates an active refresh token and returns a new access/refresh token pair.
 */
app.post('/api/v1/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required.' });
      return;
    }
    const tokens = TokenService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (err: any) {
    res.status(401).json({ error: 'Token refresh failed', reason: err.message });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user claims.
 */
app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.tenantClaims });
});

/**
 * POST /api/v1/auth/device/register
 * Registers a new PHC device, issues certificate / key pair, stores in registry.
 */
app.post('/api/v1/auth/device/register', requireAuth, async (req, res) => {
  try {
    const { phcId, deviceName, publicKey, metadata } = req.body;
    if (!phcId || !deviceName) {
      res.status(400).json({ error: 'phcId and deviceName are required.' });
      return;
    }

    // Ensure non-admins can only register devices for their own PHC
    if (req.tenantClaims?.role === 'phc_user' && req.tenantClaims.phcId !== phcId) {
      res.status(403).json({ error: 'Cannot register device for a different PHC.' });
      return;
    }

    const device = await DeviceService.registerDevice({
      phcId,
      deviceName,
      publicKey,
      metadata,
    });

    res.status(201).json({ data: device });
  } catch (err: any) {
    console.error('Device registration error', err);
    res.status(400).json({ error: 'Device registration failed', reason: err.message });
  }
});

/**
 * POST /api/v1/auth/device/revoke
 * Revokes a registered device.
 */
app.post('/api/v1/auth/device/revoke', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      res.status(400).json({ error: 'deviceId is required.' });
      return;
    }
    const success = await DeviceService.revokeDevice(deviceId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Device revocation failed', details: err.message });
  }
});

/**
 * POST /api/v1/phc/:phcId/inventory — Protected write endpoint
 * Requires BOTH valid user JWT AND valid device binding
 */
app.post('/api/v1/phc/:phcId/inventory', requireAuth, requireDeviceBinding, async (req, res) => {
  try {
    const { phcId } = req.params;
    const { medicineId, batchNo, remainingQty, minimumThreshold, expiryDate } = req.body;

    if (!medicineId || !batchNo || remainingQty === undefined) {
      res.status(400).json({ error: 'medicineId, batchNo, and remainingQty are required.' });
      return;
    }

    const newBatch = await req.withTenantContext(async (client) => {
      const r = await client.query(
        `INSERT INTO inventory_batches (
           phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date`,
        [phcId, medicineId, batchNo, remainingQty, minimumThreshold || 10, expiryDate || '2027-12-31'],
      );
      return r.rows[0];
    });

    res.status(201).json({ data: newBatch, message: 'Inventory batch created with device binding verification.' });
  } catch (err: any) {
    console.error('Inventory write error', err);
    res.status(500).json({ error: 'Failed to write inventory batch', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// Facility & Resources Modules (Prompt 7)
// ---------------------------------------------------------------------------
import facilityController from './modules/facility/facilityController';
import { FacilityService } from './modules/facility/facilityService';
import resourceController from './modules/resource/resourceController';

app.use('/api/v1/facilities', facilityController);
app.get('/api/v1/phc/:phcId/facility', requireAuth, async (req, res) => {
  try {
    const facility = await FacilityService.getFacility(req.params.phcId, req.tenantClaims);
    res.status(200).json(facility);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_GET_FACILITY' });
  }
});
app.put('/api/v1/phc/:phcId/facility', requireAuth, async (req, res) => {
  try {
    const updated = await FacilityService.updateFacility(req.params.phcId, req.body, req.tenantClaims);
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error_code: err.message || 'FAILED_TO_UPDATE_FACILITY' });
  }
});
app.use('/api/v1/phc/:phcId', resourceController);

// ---------------------------------------------------------------------------
// Inventory & Batch Module (Prompt 8)
// ---------------------------------------------------------------------------
import inventoryController from './modules/inventory/inventoryController';
app.use('/api/v1', inventoryController);

// ---------------------------------------------------------------------------
// Billing / FEFO Dispensing Engine (Prompt 9, Architecture §3.3.1 & §5.1)
// ---------------------------------------------------------------------------
import billingController from './modules/billing/billingController';
app.use('/api/v1/phc/:phcId', billingController);

// ---------------------------------------------------------------------------
// Offline Delta Sync Engine (Prompt 6, Architecture §8.2)
// ---------------------------------------------------------------------------
import syncController from './modules/sync/syncController';
app.use('/sync', syncController);
app.use('/api/v1/sync', syncController);

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Consumption & Auto-Draft Module (Prompt 10)
// ---------------------------------------------------------------------------
import consumptionController from './modules/consumption/consumptionController';
app.use('/api/v1/phc/:phcId', consumptionController);

// ---------------------------------------------------------------------------
// Workforce & Attendance Module (Prompt 11)
// ---------------------------------------------------------------------------
import workforceController from './modules/workforce/workforceController';
app.use('/api/v1/phc/:phcId', workforceController);

// ---------------------------------------------------------------------------
// Patient Footfall Module (Prompt 11)
// ---------------------------------------------------------------------------
import footfallController from './modules/footfall/footfallController';
app.use('/api/v1/phc/:phcId', footfallController);

// ---------------------------------------------------------------------------
// Resource Requests & Emergency Module (Prompts 10 & 12)
// ---------------------------------------------------------------------------
import requestController from './modules/request/requestController';
app.use('/api/v1/phc/:phcId', requestController);

// ---------------------------------------------------------------------------
// Alerts Module & SSE Stream (Prompt 13)
// ---------------------------------------------------------------------------
import alertsController from './modules/alerts/alertsController';
import { AlertsService } from './modules/alerts/alertsService';
AlertsService.registerEventConsumers(); // Wire event-bus → alerts DB + SSE fan-out
app.use('/api/v1', alertsController);

// ---------------------------------------------------------------------------
// PHC Alerts Endpoint (/api/v1/phc/:phcId/alerts matching openapi.yaml)
// ---------------------------------------------------------------------------
app.get('/api/v1/phc/:phcId/alerts', requireAuth, async (req, res) => {
  try {
    const { phcId } = req.params;
    const rows = await req.withTenantContext(async (client) => {
      const r = await client.query(
        `SELECT id, phc_id, district_id, state_id, alert_type, severity, status, created_at
         FROM alerts
         WHERE phc_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [phcId],
      );
      return r.rows;
    });
    res.json({ count: rows.length, data: rows });
  } catch (err: any) {
    console.error('/api/v1/phc/:phcId/alerts error', err);
    res.status(500).json({ error_code: 'ALERTS_FETCH_FAILED', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Governance GraphQL Read Layer (Prompt 15)
// ---------------------------------------------------------------------------
import { graphqlRouter } from './modules/governance/graphqlServer';
app.use(graphqlRouter);
app.use('/api/v1', graphqlRouter);

// ---------------------------------------------------------------------------
// Configuration Management Module (Prompt 16)
// ---------------------------------------------------------------------------
import { configRouter } from './modules/config/configController';
app.use('/api/v1', configRouter);

// ---------------------------------------------------------------------------
// Governance Copilot Scoped Retrieval (Prompt 17)
// ---------------------------------------------------------------------------
import { copilotRouter } from './modules/ai/copilotService';
app.use('/api/v1', copilotRouter);

// ---------------------------------------------------------------------------
// Supply Chain Module (Prompt 19)
// ---------------------------------------------------------------------------
import { supplyChainRouter } from './modules/supplychain/supplyChainController';
import { SupplyChainService } from './modules/supplychain/supplyChainService';
SupplyChainService.initEventSubscribers();
app.use('/api/v1', supplyChainRouter);

// ---------------------------------------------------------------------------
// Append-Only Audit System (Prompt 20)
// ---------------------------------------------------------------------------
import { auditRouter } from './modules/audit/auditController';
app.use('/api/v1', auditRouter);

// ---------------------------------------------------------------------------
// Observability & Metrics (Prompt 21)
// ---------------------------------------------------------------------------
import { metricsRouter } from './modules/observability/metricsController';
app.use(metricsRouter);
app.use('/api/v1', metricsRouter);

// ---------------------------------------------------------------------------
// Crisis Simulator WebSocket (Prompt 17) & HTTP Server
// ---------------------------------------------------------------------------
import http from 'http';
import { SimulatorService } from './modules/ai/simulatorService';

const server = http.createServer(app);
SimulatorService.attachWebSocketServer(server);

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`Smart Health Platform backend listening on :${PORT}`);
  console.log('RLS session-claim middleware active on all /api/* routes');
  console.log('GraphQL surface active at /graphql');
  console.log('Simulator WebSocket session active at /api/v1/governance/simulator/session');
  console.log('Device-binding middleware active on /api/v1/phc/:phcId/* write routes');
  console.log('Offline Sync Engine active at /sync/push and /sync/pull');
});

export { app, server };
export default app;
