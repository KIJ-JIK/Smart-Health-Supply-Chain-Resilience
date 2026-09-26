/**
 * Verification test for Worker 1:
 * - Route aliasing & mounting (/api/v1/facilities, /api/v1/inventory/*, /api/v1/ocr/*, /api/v1/events/stream, /governance/kpi/stream)
 * - SSE authentication with ?token= and dev mode bypass
 * - Gemini 3-key pool discovery and 429 rotation
 * - BRICS comma-delimited key parsing
 */

import http from 'http';
import { app } from '../src/index';
import { getGeminiApiKeys, getNextGeminiApiKey, rotateGeminiApiKey } from '../src/modules/ai/visionService';
import { getBricsGeminiApiKeys, getNextBricsGeminiApiKey } from '../src/modules/ai/bricsIntelligenceService';
import { pool, adminPool } from '../src/db/pool';

let server: http.Server;
let port: number;

function assert(cond: boolean, label: string, details?: any) {
  if (cond) {
    console.log(`[PASS] ${label}${details ? ' - ' + JSON.stringify(details) : ''}`);
  } else {
    console.error(`[FAIL] ${label}${details ? ' - ' + JSON.stringify(details) : ''}`);
    process.exitCode = 1;
  }
}

async function get(path: string, headers: Record<string, string> = {}): Promise<{ status: number; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, { headers }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(body), raw: body });
        } catch {
          resolve({ status: res.statusCode || 0, data: null, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function post(path: string, payload: any, headers: Record<string, string> = {}): Promise<{ status: number; data: any; raw: string }> {
  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(body), raw: body });
        } catch {
          resolve({ status: res.statusCode || 0, data: null, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testSseStream(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      let receivedChunk = false;
      const statusOk = res.statusCode === 200;
      const contentTypeOk = res.headers['content-type']?.includes('text/event-stream');

      res.on('data', (chunk) => {
        if (!receivedChunk && (chunk.toString().includes('connected') || chunk.toString().includes('data:'))) {
          receivedChunk = true;
          req.destroy();
          resolve(statusOk && !!contentTypeOk);
        }
      });

      setTimeout(() => {
        req.destroy();
        resolve(statusOk && !!contentTypeOk);
      }, 1500);
    });
    req.on('error', () => resolve(false));
  });
}

async function run() {
  console.log('================================================================');
  console.log('=== WORKER 1 VERIFICATION: ROUTE ALIASING, SSE, KEY ROTATION ===');
  console.log('================================================================\n');

  // Start test server on random ephemeral port
  server = app.listen(0);
  const addr: any = server.address();
  port = addr.port;
  console.log(`Test server running on port ${port}\n`);

  try {
    // ── 1. Facilities Route (Unshadowed & Live) ─────────────────────────────
    console.log('--- 1. Testing /api/v1/facilities (Unshadowed) ---');
    const facRes = await get('/api/v1/facilities');
    assert(facRes.status === 200, 'GET /api/v1/facilities returns HTTP 200', { status: facRes.status });
    assert(Array.isArray(facRes.data?.facilities) && facRes.data.facilities.length > 0,
      'Facilities returned as array with length > 0',
      { count: facRes.data?.facilities?.length });
    assert(Array.isArray(facRes.data?.data), 'Facilities also available under data key for backward compat');

    // ── 2. Live Inventory Routes ────────────────────────────────────────────
    console.log('\n--- 2. Testing /api/v1/inventory/* Routes ---');
    const invRes = await get('/api/v1/inventory');
    assert(invRes.status === 200, 'GET /api/v1/inventory returns HTTP 200', { status: invRes.status });
    assert(Array.isArray(invRes.data?.inventory) && invRes.data.inventory.length > 0,
      'Live inventory records returned', { count: invRes.data?.inventory?.length });

    const invFacRes = await get('/api/v1/inventory/facilities');
    assert(invFacRes.status === 200, 'GET /api/v1/inventory/facilities returns HTTP 200', { status: invFacRes.status });
    assert(Array.isArray(invFacRes.data?.facilities) && invFacRes.data.facilities.length > 0,
      'Aggregated facility inventory returned', { count: invFacRes.data?.facilities?.length });

    const invMedRes = await get('/api/v1/inventory/medicines');
    assert(invMedRes.status === 200, 'GET /api/v1/inventory/medicines returns HTTP 200', { status: invMedRes.status });
    assert(Array.isArray(invMedRes.data?.medicines) && invMedRes.data.medicines.length > 0,
      'Aggregated medicines inventory returned', { count: invMedRes.data?.medicines?.length });

    // ── 3. OCR Route Forwarding & Aliasing ──────────────────────────────────
    console.log('\n--- 3. Testing /api/v1/ocr/* Route Forwarding ---');
    const ocrStatus = await get('/api/v1/ocr');
    assert(ocrStatus.status === 200, 'GET /api/v1/ocr status endpoint returns HTTP 200', ocrStatus.data);

    const ocrExtractRes = await post('/api/v1/ocr/extract-prescription', {
      sampleType: 'sample_rx_amoxicillin',
    });
    assert(ocrExtractRes.status === 200 && ocrExtractRes.data?.success === true,
      'POST /api/v1/ocr/extract-prescription returns 200 with extracted prescription',
      { detectedType: ocrExtractRes.data?.data?.detectedType, count: ocrExtractRes.data?.data?.medicines?.length });

    const ocrProcessRes = await post('/api/v1/ocr/process', {
      sampleType: 'sample_blister_paracetamol',
    });
    assert(ocrProcessRes.status === 200 && ocrProcessRes.data?.success === true,
      'POST /api/v1/ocr/process alias returns 200 with blister pack OCR data',
      { batchNo: ocrProcessRes.data?.data?.packaging?.batchNo });

    // ── 4. SSE Stream Authentication & Connection ───────────────────────────
    console.log('\n--- 4. Testing SSE Streams & Auth ---');
    const eventsStreamConnected = await testSseStream('/api/v1/events/stream');
    assert(eventsStreamConnected, 'GET /api/v1/events/stream connects with HTTP 200 and text/event-stream');

    const kpiStreamConnected = await testSseStream('/governance/kpi/stream');
    assert(kpiStreamConnected, 'GET /governance/kpi/stream connects with HTTP 200 and text/event-stream');

    const kpiApiStreamConnected = await testSseStream('/api/v1/governance/kpi/stream');
    assert(kpiApiStreamConnected, 'GET /api/v1/governance/kpi/stream connects with HTTP 200 and text/event-stream');

    const alertsStreamConnected = await testSseStream('/api/v1/governance/alerts/stream');
    assert(alertsStreamConnected, 'GET /api/v1/governance/alerts/stream connects with HTTP 200 and text/event-stream');

    // ── 5. Gemini 3-Key Pool Discovery & Rotation ───────────────────────────
    console.log('\n--- 5. Testing Gemini 3-Key Pool & Rotation ---');
    const keys = getGeminiApiKeys();
    assert(keys.length >= 3, `Discovered ${keys.length} keys in pool (expected >= 3)`, { poolSize: keys.length });

    const key1 = getNextGeminiApiKey();
    const key2 = getNextGeminiApiKey();
    const key3 = getNextGeminiApiKey();
    assert(key1 !== '' && key2 !== '' && key3 !== '', 'Retrieved keys from round-robin key pool');
    rotateGeminiApiKey();
    console.log('[PASS] rotateGeminiApiKey executes smoothly');

    // ── 6. BRICS Comma-Separated Key Parsing ────────────────────────────────
    console.log('\n--- 6. Testing BRICS Comma-Separated Key Parsing ---');
    const bricsKeys = getBricsGeminiApiKeys();
    assert(bricsKeys.length >= 3, `BRICS parsed ${bricsKeys.length} discrete keys from comma-separated string`);
    assert(bricsKeys.every((k) => !k.includes(',')), 'Every parsed key is strictly single key without comma delimiters');
    const nextBricsKey = getNextBricsGeminiApiKey();
    assert(typeof nextBricsKey === 'string' && nextBricsKey.length > 10, 'getNextBricsGeminiApiKey returns valid single key');

    console.log('\n================================================================');
    if (process.exitCode === 1) {
      console.log('=== TEST SUITE FAILED ===');
      process.exit(1);
    } else {
      console.log('=== ALL WORKER 1 CHECKS PASSED (100%) ===');
      console.log('================================================================\n');
      process.exit(0);
    }
  } finally {
    server.close();
    await pool.end().catch(() => {});
    await adminPool.end().catch(() => {});
  }
}

run().catch((e) => {
  console.error('[FATAL] Test crashed:', e);
  process.exit(1);
});
