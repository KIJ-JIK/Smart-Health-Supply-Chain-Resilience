import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-Memory Telemetry & Sync Store (mimics Postgres + Redis)
let serverSeqCounter = 1000;
const receivedMutations: any[] = [];
const facilitiesMaster = [
  {
    id: 'phc-varanasi-rampur-001',
    name: 'Rampur Primary Health Centre',
    district_id: 'dist-varanasi',
    state_id: 'state-up',
    status: 'operational',
    total_beds: 24,
    occupied_beds: 16,
    oxygen_cylinders: 12,
    oxygen_concentrators: 4,
    active_emergencies: 0,
    last_sync_time: new Date().toISOString(),
  },
  {
    id: 'phc-varanasi-cholapur-002',
    name: 'Cholapur Community Health Centre',
    district_id: 'dist-varanasi',
    state_id: 'state-up',
    status: 'operational',
    total_beds: 40,
    occupied_beds: 38,
    oxygen_cylinders: 4,
    oxygen_concentrators: 2,
    active_emergencies: 1,
    last_sync_time: new Date().toISOString(),
  },
];

const activeAlerts = [
  {
    id: 'alt-001',
    phc_id: 'phc-varanasi-cholapur-002',
    phc_name: 'Cholapur CHC',
    type: 'OXYGEN_SHORTAGE',
    severity: 'critical',
    message: 'Oxygen reserve below critical threshold (4 cylinders remaining).',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'OPEN',
  },
  {
    id: 'alt-002',
    phc_id: 'phc-varanasi-rampur-001',
    phc_name: 'Rampur PHC',
    type: 'MEDICINE_EXPIRY_RISK',
    severity: 'warning',
    message: '240 Amoxicillin 500mg units expiring within 30 days. FEFO priority required.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'ACKNOWLEDGED',
  },
];

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Smart Health Resilience Central Sync Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    server_seq: serverSeqCounter,
  });
});

// ── SYNC ENGINE CONTRACT (From final_architecture.md §8 & Ansh_PHC_Portal.md) ──

// 1. PUSH: POST /sync/push
app.post('/sync/push', (req: Request, res: Response) => {
  const { device_id, phc_id, mutations = [] } = req.body;
  console.log(`[SYNC:PUSH] Received ${mutations.length} mutations from device "${device_id}" (PHC: ${phc_id})`);

  const results = mutations.map((m: any) => {
    serverSeqCounter += 1;
    receivedMutations.push({
      ...m,
      server_seq: serverSeqCounter,
      server_received_at: new Date().toISOString(),
    });

    return {
      mutation_id: m.id,
      status: 'accepted',
      server_seq: serverSeqCounter,
      server_entity_id: m.id,
    };
  });

  res.json({
    server_seq: serverSeqCounter,
    results,
    processed_count: results.length,
    timestamp: new Date().toISOString(),
  });
});

// 2. PULL: GET /sync/pull
app.get('/sync/pull', (req: Request, res: Response) => {
  const since = parseInt(req.query.since as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 100;

  const deltas = receivedMutations
    .filter((m) => m.server_seq > since)
    .slice(0, limit)
    .map((m) => ({
      server_seq: m.server_seq,
      entity_type: m.entity_type,
      operation: m.operation || 'upsert',
      entity_id: m.id,
      payload: m.payload,
      server_timestamp: m.server_received_at,
    }));

  res.json({
    server_seq: serverSeqCounter,
    has_more: false,
    deltas,
  });
});

// ── TELEMETRY & GOVERNANCE APIS ──

app.get('/api/facilities', (_req: Request, res: Response) => {
  res.json(facilitiesMaster);
});

app.get('/api/alerts', (_req: Request, res: Response) => {
  res.json(activeAlerts);
});

app.post('/api/alerts', (req: Request, res: Response) => {
  const newAlert = {
    id: `alt-${uuidv4().substring(0, 8)}`,
    ...req.body,
    timestamp: new Date().toISOString(),
    status: 'OPEN',
  };
  activeAlerts.unshift(newAlert);
  res.status(201).json(newAlert);
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 SMART HEALTH CORE BACKEND & SYNC ENGINE RUNNING`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔁 Sync Push: http://localhost:${PORT}/sync/push`);
  console.log(`🔁 Sync Pull: http://localhost:${PORT}/sync/pull`);
  console.log(`=======================================================`);
});
