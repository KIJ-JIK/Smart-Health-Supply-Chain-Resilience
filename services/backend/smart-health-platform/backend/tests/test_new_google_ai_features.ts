/**
 * Automated Verification Suite for Newly Implemented Google AI Features & 36-State All-India Registry
 */

import http from 'http';
import { Pool } from 'pg';

interface TestResult {
  title: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function record(condition: boolean, title: string, message: string) {
  results.push({ title, passed: condition, message });
  if (condition) {
    console.log(`[PASS] ${title}: ${message}`);
  } else {
    console.error(`[FAIL] ${title}: ${message}`);
  }
}

async function postJson(url: string, body: any): Promise<any> {
  const u = new URL(url);
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resp) });
          } catch {
            resolve({ status: res.statusCode, raw: resp });
          }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('=== AUDITING NEW GOOGLE AI FEATURES & ALL-INDIA REGISTRY ===');
  console.log('================================================================\n');

  // ── TEST 1: Google AI Vision - Handwritten Prescription Scanner ────────────
  console.log('--- 1. Testing Google AI Prescription Vision Scanner ---');
  const rxRes = await postJson('http://localhost:8000/api/v1/ai/vision/extract-prescription', {
    sampleType: 'sample_rx_amoxicillin',
    phcId: 'c0000003-0000-0000-0000-000000000001',
  });

  const rxData = rxRes.data?.data;
  record(
    rxRes.status === 200 && rxRes.data?.success === true,
    'Vision API Status',
    'HTTP 200 with success: true',
  );
  record(
    rxData?.detectedType === 'prescription',
    'Detected Document Type',
    `Identified: ${rxData?.detectedType}`,
  );
  record(
    Array.isArray(rxData?.medicines) && rxData.medicines.length === 3,
    'Prescription OCR Parsing',
    `Extracted ${rxData?.medicines?.length} medicines: ${rxData?.medicines?.map((m: any) => m.name).join(', ')}`,
  );
  record(
    rxData?.medicines?.[0]?.dbMatchedId !== null && rxData?.medicines?.[0]?.stockStatus === 'IN_STOCK',
    'PostgreSQL Stock Cross-Referencing',
    `Amoxicillin matched with DB ID ${rxData?.medicines?.[0]?.dbMatchedId} (${rxData?.medicines?.[0]?.stockStatus})`,
  );
  record(
    Array.isArray(rxData?.clinicalFlags) && rxData.clinicalFlags.length > 0,
    'Clinical Decision Support Warnings',
    rxData?.clinicalFlags?.[0] || 'Flag generated',
  );

  // ── TEST 2: Google AI Vision - Blister Pack Packaging OCR ──────────────────
  console.log('\n--- 2. Testing Google AI Medicine Packaging OCR ---');
  const blisterRes = await postJson('http://localhost:8000/api/v1/ai/vision/extract-prescription', {
    sampleType: 'sample_blister_paracetamol',
    phcId: 'c0000003-0000-0000-0000-000000000001',
  });

  const blisterData = blisterRes.data?.data;
  record(
    blisterData?.detectedType === 'medicine_packaging',
    'Detected Packaging Type',
    `Identified: ${blisterData?.detectedType}`,
  );
  record(
    blisterData?.packaging?.batchNo === 'BATCH-MH-2026-P92',
    'Blister Packaging Batch OCR',
    `Extracted Batch: ${blisterData?.packaging?.batchNo}, Expiry: ${blisterData?.packaging?.expiryDate}`,
  );
  record(
    blisterData?.packaging?.manufacturer?.includes('Pharmaceuticals'),
    'Manufacturer OCR Recognition',
    `Extracted Manufacturer: ${blisterData?.packaging?.manufacturer}`,
  );

  // ── TEST 3: Google AI BRICS Multilateral Threat Intelligence (English) ─────
  console.log('\n--- 3. Testing Google AI BRICS Threat Intelligence (English) ---');
  const bricsEnRes = await postJson('http://localhost:8000/api/v1/brics/ai-briefing', {
    language: 'en',
  });

  const bricsEn = bricsEnRes.data?.data;
  record(
    bricsEnRes.status === 200 && bricsEnRes.data?.success === true,
    'BRICS AI Briefing Status (EN)',
    'HTTP 200 with success: true',
  );
  record(
    ['LOW', 'ELEVATED', 'HIGH', 'CRITICAL'].includes(bricsEn?.threatLevel),
    'Threat Assessment Level',
    `Assessed as: ${bricsEn?.threatLevel}`,
  );
  record(
    typeof bricsEn?.headline === 'string' && bricsEn.headline.length > 10,
    'Intelligence Bulletin Headline',
    bricsEn?.headline,
  );
  record(
    Array.isArray(bricsEn?.regionalAlerts) && bricsEn.regionalAlerts.length >= 2,
    'Sentinel Node Signals',
    `Received surveillance signals for: ${bricsEn?.regionalAlerts?.map((a: any) => a.country).join(', ')}`,
  );
  record(
    Array.isArray(bricsEn?.multilateralRecommendations) && bricsEn.multilateralRecommendations.length > 0,
    'Cross-Border Supply Recommendations',
    `Generated ${bricsEn?.multilateralRecommendations?.length} actionable protocols`,
  );

  // ── TEST 4: Google AI BRICS Multilingual Translation (Hindi) ───────────────
  console.log('\n--- 4. Testing Google AI Multilingual Translation (Hindi) ---');
  const bricsHiRes = await postJson('http://localhost:8000/api/v1/brics/ai-briefing', {
    language: 'hi',
  });

  const bricsHi = bricsHiRes.data?.data;
  record(
    bricsHiRes.status === 200 && bricsHi?.language?.includes('Hindi'),
    'BRICS Translation Language Target',
    `Target: ${bricsHi?.language}`,
  );
  record(
    typeof bricsHi?.headline === 'string' && bricsHi.headline.length > 5,
    'Hindi Translated Headline',
    bricsHi?.headline,
  );

  // ── TEST 5: All-India 36-State PostgreSQL Registry ────────────────────────
  console.log('\n--- 5. Testing PostgreSQL All-India 36-State Registry ---');
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'smarthealth',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    const countRes = await pool.query('SELECT count(*)::int AS count FROM states');
    const totalStates = countRes.rows[0].count;
    record(
      totalStates === 36,
      '36 States & UTs Registry',
      `Found ${totalStates} registered States and Union Territories in PostgreSQL`,
    );

    const canonicalStates = await pool.query(
      `SELECT name, code FROM states WHERE code IN ('MH', 'KA', 'TN', 'UP', 'RJ', 'AP', 'BR', 'GJ', 'MP', 'WB') ORDER BY name`
    );
    record(
      canonicalStates.rows.length === 10,
      'Canonical 10-State Active Roster',
      `Confirmed all 10 core states: ${canonicalStates.rows.map((s: any) => s.code).join(', ')}`,
    );
  } finally {
    await pool.end();
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`=== AUDIT RESULT: ${passedCount}/${results.length} PASSED ===`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    console.log('[SUCCESS] All new Google AI features and All-India architecture verified.');
    process.exit(0);
  }
}

run().catch((e) => {
  console.error('[FATAL] Verification suite crashed:', e);
  process.exit(1);
});
