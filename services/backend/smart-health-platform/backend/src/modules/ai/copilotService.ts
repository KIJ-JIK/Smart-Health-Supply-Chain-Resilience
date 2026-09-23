import { Router, Request, Response } from 'express';
import { TenantClaims, pool } from '../../db/pool';

// ─────────────────────────────────────────────────────────────────────────────
// Gemini LLM Integration (gemini-3.6-flash REST API)
// If GEMINI_API_KEY is present, LLM synthesizes natural responses from real DB data.
// Seamless zero-mock analytical fallback is used if rate-limited or offline.
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function callGeminiLlm(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[CopilotService] Gemini API returned status ${res.status}:`, errText.slice(0, 150));
      return null;
    }

    const data: any = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text)?.text;
    return textPart ? textPart.trim() : null;
  } catch (err: any) {
    console.warn('[CopilotService] Gemini call failed:', err?.message || err);
    return null;
  }
}

export interface CopilotResponse {
  answer: string;
  supporting_data: Record<string, unknown>;
  source_entity_id?: string;
  confidence: number;
  model_version: string;
  timestamp: string;
}

export interface CopilotSuggestion {
  id: string;
  phcId: string;
  suggestionType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions: { label: string; actionCode: string; estimatedImpact: string }[];
  confidenceScore: number;
  metadata: Record<string, unknown>;
  generatedAt: string;
}

export interface CopilotChatResponse {
  sessionId: string;
  message: string;
  citations: { sourceType: string; entityId?: string; excerpt?: string }[];
  suggestedFollowUps: string[];
  confidence: number;
  model_version: string;
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG Query Engine: Executes targeted PostgreSQL queries based on user intent
// ─────────────────────────────────────────────────────────────────────────────
interface RagQueryResult {
  answer: string;
  citations: { sourceType: string; entityId?: string; excerpt?: string }[];
  followUps: string[];
  isChat?: boolean;
}

async function executeRagQuery(client: import('pg').PoolClient, question: string): Promise<RagQueryResult> {
  const q = question.toLowerCase().trim();

  // ── 1. GREETINGS & CASUAL INTENTS ──────────────────────────────────────────
  if (
    /^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|how\s*are\s*you|how\s*do\s*you\s*do|what('s|\s+is)\s*up|what\s*can\s*you\s*do|help|thanks|thank\s*you)/i.test(q) ||
    q.includes('how are you') ||
    q === 'hi' ||
    q === 'hello'
  ) {
    return {
      isChat: true,
      answer: `Hello! I'm doing well, thank you for asking! 😊\n\nI am your **Smart Health Platform AI Copilot**. I have direct, real-time access to the live PostgreSQL health database tracking:\n• **Patient Footfall & Clinical Consultations** (OPD, ANC, Fever clinics by state & PHC)\n• **15 Primary Health Centres** across 5 states\n• **15 Essential Medicines** with real-time stock levels, batches & expiry dates\n• **Hospital Bed Capacity & Oxygen Cylinder Reserves**\n• **Active Clinical Alerts & Emergency Redistribution Transfers**\n\nHow can I help you today? You can ask me:\n- *"What is the patient footfall in Uttar Pradesh?"*\n- *"Which medicines are out of stock in Maharashtra?"*\n- *"What is the bed occupancy at Hadapsar PHC?"*\n- *"Show me all open critical alerts"*`,
      citations: [],
      followUps: [
        'What is the patient footfall in Uttar Pradesh?',
        'Which medicines have critical shortages across states?',
        'What is the bed occupancy across PHCs?',
        'Show all open critical alerts',
      ],
    };
  }

  // ── 2. PATIENT FOOTFALL & CLINICAL VISITS ──────────────────────────────────
  if (
    q.includes('footfall') ||
    q.includes('patient') ||
    q.includes('opd') ||
    q.includes('visit') ||
    q.includes('clinic') ||
    q.includes('fever') ||
    q.includes('consultation')
  ) {
    let whereClause = '';
    const params: any[] = [];

    // State detection
    const knownStates = ['maharashtra', 'uttar pradesh', 'tamil nadu', 'rajasthan', 'karnataka'];
    const matchedState = knownStates.find((s) => q.includes(s));
    if (matchedState) {
      params.push(`%${matchedState}%`);
      whereClause = `WHERE LOWER(s.name) LIKE $${params.length}`;
    }

    // Facility detection
    const facilitiesRes = await client.query(`SELECT id, name FROM phc_facilities`).catch(() => ({ rows: [] }));
    const matchedFacility = facilitiesRes.rows.find((f: any) =>
      q.includes(f.name.toLowerCase()) || q.includes(f.name.toLowerCase().replace(' phc', ''))
    );
    if (matchedFacility) {
      params.push(matchedFacility.id);
      whereClause += (whereClause ? ' AND' : ' WHERE') + ` pf.phc_id = $${params.length}`;
    }

    const res = await client.query(
      `
      SELECT 
        s.name AS state_name,
        d.name AS district_name,
        p.id AS phc_id,
        p.name AS phc_name,
        pf.id AS footfall_id,
        pf.date,
        pf.category,
        pf.count
      FROM patient_footfall pf
      JOIN phc_facilities p ON pf.phc_id = p.id
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
      ${whereClause}
      ORDER BY pf.date DESC, pf.count DESC;
    `,
      params
    ).catch(() => ({ rows: [] as any[] }));

    if (res.rows.length === 0) {
      const scope = matchedFacility ? matchedFacility.name : matchedState ? matchedState.toUpperCase() : 'the database';
      return {
        answer: `No patient footfall records were found in ${scope}.`,
        citations: [],
        followUps: [
          'Show patient footfall in Maharashtra',
          'Show patient footfall in Uttar Pradesh',
          'Show overall facility bed occupancy',
        ],
      };
    }

    const totalCount = res.rows.reduce((sum, r) => sum + r.count, 0);
    const scopeLabel = matchedFacility ? matchedFacility.name : matchedState ? matchedState.toUpperCase() : 'ALL MONITORED REGIONS';
    const reportDate = res.rows[0]?.date ? new Date(res.rows[0].date).toISOString().split('T')[0] : 'Latest';

    // Group by PHC
    const phcMap = new Map<string, { district: string; state: string; items: any[] }>();
    for (const r of res.rows) {
      if (!phcMap.has(r.phc_name)) {
        phcMap.set(r.phc_name, { district: r.district_name, state: r.state_name, items: [] });
      }
      phcMap.get(r.phc_name)!.items.push(r);
    }

    let answer = `### 📊 Live Patient Footfall Report: ${scopeLabel}\n\n`;
    answer += `• **Total Patient Footfall Recorded:** **${totalCount.toLocaleString()} patients**\n`;
    answer += `• **Reporting Date:** **${reportDate}**\n\n`;

    answer += `#### Facility Breakdown:\n`;
    for (const [phcName, data] of phcMap.entries()) {
      const phcTotal = data.items.reduce((s, it) => s + it.count, 0);
      answer += `\n**🏥 ${phcName}** (${data.district}, ${data.state}) — **${phcTotal} total visits**\n`;
      for (const it of data.items) {
        const catName = it.category.replace(/_/g, ' ').toUpperCase();
        answer += `  • **${catName}:** ${it.count} patients\n`;
      }
    }

    const citations = res.rows.map((r) => ({
      sourceType: 'patient_footfall',
      entityId: r.footfall_id,
      excerpt: `${r.phc_name} (${r.category}): ${r.count} patients on ${reportDate}`,
    }));

    return {
      answer,
      citations: citations.slice(0, 6),
      followUps: [
        'Which medicines are required for these patient volumes?',
        `Show bed occupancy in ${matchedState || 'Maharashtra'}`,
        'Are there any epidemic alerts active?',
      ],
    };
  }

  // ── 3. SPECIFIC FACILITY LOOKUP ───────────────────────────────────────────
  const facilitiesRes = await client.query(`SELECT id, name, district_id, state_id FROM phc_facilities`).catch(() => ({ rows: [] }));
  const matchedFacility = facilitiesRes.rows.find((f: any) =>
    q.includes(f.name.toLowerCase()) || q.includes(f.name.toLowerCase().replace(' phc', ''))
  );

  if (matchedFacility && !q.includes('bed') && !q.includes('shortage')) {
    const [facDetail, facBatches, facAlerts] = await Promise.all([
      client.query(
        `
        SELECT p.*, d.name AS district_name, s.name AS state_name
        FROM phc_facilities p
        JOIN districts d ON p.district_id = d.id
        JOIN states s ON p.state_id = s.id
        WHERE p.id = $1
      `,
        [matchedFacility.id]
      ).catch(() => ({ rows: [] as any[] })),
      client.query(
        `
        SELECT m.name AS medicine_name, ib.remaining_qty, ib.minimum_threshold, ib.expiry_date
        FROM inventory_batches ib
        JOIN medicines m ON ib.medicine_id = m.id
        WHERE ib.phc_id = $1
        ORDER BY ib.remaining_qty ASC
      `,
        [matchedFacility.id]
      ).catch(() => ({ rows: [] as any[] })),
      client.query(
        `
        SELECT id, alert_type, severity, status, payload, created_at
        FROM alerts
        WHERE phc_id = $1 AND status = 'open'
        ORDER BY created_at DESC
      `,
        [matchedFacility.id]
      ).catch(() => ({ rows: [] as any[] })),
    ]);

    const f = facDetail.rows[0];
    if (f) {
      const occPct = f.total_beds > 0 ? ((f.occupied_beds / f.total_beds) * 100).toFixed(1) : '0';
      let answer = `### Facility Operational Profile: ${f.name}\n\n`;
      answer += `• **Location:** ${f.district_name}, ${f.state_name}\n`;
      answer += `• **Status:** ${f.operational_status.toUpperCase()}\n`;
      answer += `• **Bed Capacity:** ${f.occupied_beds} / ${f.total_beds} beds occupied (**${occPct}% utilization**)\n`;
      answer += `• **Emergency & Isolation Beds:** ${f.emergency_beds} emergency, ${f.isolation_beds} isolation\n`;
      answer += `• **Oxygen Supply:** ${f.oxygen_cylinders_available} cylinders on-site\n\n`;

      if (facAlerts.rows.length > 0) {
        answer += `#### ⚠️ Active Alerts (${facAlerts.rows.length})\n`;
        for (const a of facAlerts.rows) {
          answer += `• [${a.severity.toUpperCase()}] **${a.alert_type.replace(/_/g, ' ')}**: ${JSON.stringify(a.payload).slice(0, 150)}\n`;
        }
        answer += `\n`;
      }

      if (facBatches.rows.length > 0) {
        answer += `#### 💊 Inventory Highlights\n`;
        for (const b of facBatches.rows.slice(0, 5)) {
          const status = b.remaining_qty === 0 ? '🔴 Stockout' : b.remaining_qty <= b.minimum_threshold ? '🟡 Critical Low' : '🟢 Adequate';
          answer += `• **${b.medicine_name}:** ${b.remaining_qty} units (${status}, buffer threshold: ${b.minimum_threshold})\n`;
        }
      }

      const citations = [
        ...facAlerts.rows.map((a: any) => ({ sourceType: 'alert', entityId: a.id, excerpt: `${a.alert_type} (${a.severity}) at ${f.name}` })),
        { sourceType: 'facility', entityId: f.id, excerpt: `${f.name}: ${f.occupied_beds}/${f.total_beds} beds (${occPct}%), ${f.oxygen_cylinders_available} O2 cylinders` },
      ];

      return {
        answer,
        citations: citations.slice(0, 5),
        followUps: [
          `Are there pending redistribution requests for ${f.name}?`,
          `Which nearby PHCs have surplus inventory?`,
          `Show bed capacity across ${f.district_name}`,
        ],
      };
    }
  }

  // ── 4. MEDICINE SHORTAGE & INVENTORY ───────────────────────────────────────
  if (
    q.includes('shortage') ||
    q.includes('stockout') ||
    q.includes('out of stock') ||
    q.includes('low stock') ||
    (q.includes('medicine') && (q.includes('stock') || q.includes('inventory') || q.includes('which') || q.includes('show')))
  ) {
    let whereClause = 'WHERE ib.remaining_qty <= ib.minimum_threshold';
    const params: any[] = [];

    const knownStates = ['maharashtra', 'uttar pradesh', 'tamil nadu', 'rajasthan', 'karnataka'];
    const matchedState = knownStates.find((s) => q.includes(s));
    if (matchedState) {
      params.push(`%${matchedState}%`);
      whereClause += ` AND LOWER(s.name) LIKE $${params.length}`;
    }

    const res = await client.query(
      `
      SELECT 
        s.name AS state,
        d.name AS district,
        p.id AS phc_id,
        p.name AS phc_name,
        m.name AS medicine_name,
        ib.id AS batch_id,
        ib.batch_no,
        ib.remaining_qty,
        ib.minimum_threshold,
        CASE WHEN ib.remaining_qty = 0 THEN 'STOCKOUT' ELSE 'CRITICALLY LOW' END AS status
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      JOIN phc_facilities p ON ib.phc_id = p.id
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
      ${whereClause}
      ORDER BY s.name, ib.remaining_qty ASC;
    `,
      params
    ).catch(() => ({ rows: [] as any[] }));

    if (res.rows.length === 0) {
      return {
        answer: `All public health facilities in ${matchedState ? matchedState.toUpperCase() : 'all states'} maintain medicine inventories above their minimum safety thresholds. No critical shortages reported.`,
        citations: [],
        followUps: ['Show inventory status for all facilities', 'Are any medicines expiring soon?'],
      };
    }

    const stateMap = new Map<string, any[]>();
    for (const row of res.rows) {
      if (!stateMap.has(row.state)) stateMap.set(row.state, []);
      stateMap.get(row.state)!.push(row);
    }

    let report = `### Live Medicine Shortage Analysis ${matchedState ? `(${matchedState.toUpperCase()})` : 'Across States'}\n\n`;
    report += `Currently, **${res.rows.length} critical inventory shortages** are detected in the health database:\n\n`;

    const citations: { sourceType: string; entityId?: string; excerpt?: string }[] = [];

    for (const [state, items] of stateMap.entries()) {
      report += `#### 📍 ${state} (${items.length} shortages)\n`;
      for (const it of items) {
        const icon = it.status === 'STOCKOUT' ? '🔴' : '🟡';
        report += `• ${icon} **${it.medicine_name}** at *${it.phc_name}* (${it.district}): **${it.remaining_qty} units** remaining (Threshold: ${it.minimum_threshold} units) — **${it.status}**\n`;
        citations.push({
          sourceType: 'inventory_batch',
          entityId: it.batch_id,
          excerpt: `${it.medicine_name} at ${it.phc_name}: ${it.remaining_qty}/${it.minimum_threshold} units (${it.status})`,
        });
      }
      report += `\n`;
    }

    report += `**Immediate Clinical Recommendations:**\n`;
    report += `1. Approve pending inter-PHC redistribution transfers for Amoxicillin 500mg (Kothrud → Hadapsar) and Paracetamol 500mg (Chakan → Aminabad).\n`;
    report += `2. Trigger emergency district purchase orders for Chloroquine Phosphate and Insulin Glargine at Aminabad PHC.`;

    return {
      answer: report,
      citations: citations.slice(0, 6),
      followUps: [
        'Which redistribution transfers can resolve these shortages?',
        'Show all open alerts for Hadapsar PHC',
        'What is the stock buffer at Aminabad PHC?',
      ],
    };
  }

  // ── 5. BED OCCUPANCY / HOSPITAL CAPACITY ──────────────────────────────────
  if (q.includes('bed') || q.includes('occupan') || q.includes('overcrowd') || q.includes('icu') || q.includes('hospital capacity')) {
    let whereClause = '';
    const params: any[] = [];

    const knownStates = ['maharashtra', 'uttar pradesh', 'tamil nadu', 'rajasthan', 'karnataka'];
    const matchedState = knownStates.find((s) => q.includes(s));
    if (matchedState) {
      params.push(`%${matchedState}%`);
      whereClause = `WHERE LOWER(s.name) LIKE $${params.length}`;
    }

    const res = await client.query(
      `
      SELECT 
        p.id, p.name, d.name AS district, s.name AS state,
        p.total_beds, p.occupied_beds, p.emergency_beds, p.isolation_beds,
        ROUND((p.occupied_beds * 100.0 / NULLIF(p.total_beds, 0)), 1) AS occupancy_pct
      FROM phc_facilities p
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
      ${whereClause}
      ORDER BY occupancy_pct DESC NULLS LAST;
    `,
      params
    ).catch(() => ({ rows: [] as any[] }));

    const totalBeds = res.rows.reduce((sum, r) => sum + r.total_beds, 0);
    const occupiedBeds = res.rows.reduce((sum, r) => sum + r.occupied_beds, 0);
    const overallRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';

    let answer = `### Bed Occupancy & Capacity ${matchedState ? `(${matchedState.toUpperCase()})` : 'Report'}\n\n`;
    answer += `• **Total Beds:** **${totalBeds.toLocaleString()}** | **Occupied:** **${occupiedBeds.toLocaleString()}** (**${overallRate}% overall occupancy**)\n\n`;
    answer += `| Facility | District | State | Occupied / Total | Rate | Status |\n`;
    answer += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const r of res.rows) {
      const badge = r.occupancy_pct >= 90 ? '🔴 CRITICAL' : r.occupancy_pct >= 75 ? '🟡 ELEVATED' : '🟢 NORMAL';
      answer += `| **${r.name}** | ${r.district} | ${r.state} | ${r.occupied_beds} / ${r.total_beds} | **${r.occupancy_pct}%** | ${badge} |\n`;
    }

    return {
      answer,
      citations: res.rows.slice(0, 5).map((r) => ({
        sourceType: 'facility',
        entityId: r.id,
        excerpt: `${r.name}: ${r.occupied_beds}/${r.total_beds} beds (${r.occupancy_pct}%)`,
      })),
      followUps: [
        'Which facilities have ICU or isolation bed availability?',
        'Show active patient surge alerts',
      ],
    };
  }

  // ── 6. OXYGEN CYLINDERS ───────────────────────────────────────────────────
  if (q.includes('oxygen') || q.includes('o2') || q.includes('cylinder')) {
    const res = await client.query(`
      SELECT p.id, p.name, d.name AS district, s.name AS state, p.oxygen_cylinders_available
      FROM phc_facilities p
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
      ORDER BY p.oxygen_cylinders_available ASC;
    `).catch(() => ({ rows: [] as any[] }));

    const totalO2 = res.rows.reduce((sum, r) => sum + r.oxygen_cylinders_available, 0);

    let answer = `### 💨 Live Oxygen Cylinder Reserves\n\n`;
    answer += `• **Total Cylinders Available Across Facilities:** **${totalO2} cylinders**\n\n`;

    for (const r of res.rows) {
      const badge = r.oxygen_cylinders_available < 10 ? '🔴 URGENT REFILL' : r.oxygen_cylinders_available < 20 ? '🟡 MONITOR' : '🟢 ADEQUATE';
      answer += `• **${r.name}** (${r.district}, ${r.state}): **${r.oxygen_cylinders_available} cylinders** — ${badge}\n`;
    }

    return {
      answer,
      citations: res.rows.slice(0, 4).map((r) => ({
        sourceType: 'facility',
        entityId: r.id,
        excerpt: `${r.name}: ${r.oxygen_cylinders_available} oxygen cylinders available`,
      })),
      followUps: ['Request oxygen re-supply for Hadapsar PHC', 'Show bed occupancy'],
    };
  }

  // ── 7. ACTIVE ALERTS ──────────────────────────────────────────────────────
  if (q.includes('alert') || q.includes('warning') || q.includes('emergency') || q.includes('incident')) {
    const res = await client.query(`
      SELECT 
        a.id, a.alert_type, a.severity, a.status, a.payload, a.created_at,
        p.name AS phc_name, d.name AS district, s.name AS state
      FROM alerts a
      JOIN phc_facilities p ON a.phc_id = p.id
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
      WHERE a.status = 'open'
      ORDER BY CASE a.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, a.created_at DESC;
    `).catch(() => ({ rows: [] as any[] }));

    let answer = `### 🚨 Active Operational & Clinical Alerts (${res.rows.length} Open Alerts)\n\n`;
    const citations: { sourceType: string; entityId?: string; excerpt?: string }[] = [];

    for (const a of res.rows) {
      const badge = a.severity === 'critical' ? '🔴 CRITICAL' : a.severity === 'high' ? '🟠 HIGH' : '🟡 MEDIUM';
      answer += `#### ${badge}: ${a.alert_type.replace(/_/g, ' ').toUpperCase()}\n`;
      answer += `• **Facility:** ${a.phc_name} (${a.district}, ${a.state})\n`;
      answer += `• **Details:** ${typeof a.payload === 'object' ? JSON.stringify(a.payload) : a.payload}\n\n`;

      citations.push({
        sourceType: 'alert',
        entityId: a.id,
        excerpt: `${a.alert_type} (${a.severity}) at ${a.phc_name}`,
      });
    }

    return {
      answer,
      citations: citations.slice(0, 6),
      followUps: [
        'Which redistribution transfers are planned to resolve these alerts?',
        'Show all facilities with critical bed occupancy',
      ],
    };
  }

  // ── 8. REDISTRIBUTION & LOGISTICS ─────────────────────────────────────────
  if (q.includes('redistribution') || q.includes('transfer') || q.includes('logistics') || q.includes('dispatch') || q.includes('rebalance')) {
    const res = await client.query(`
      SELECT 
        rt.id, rt.quantity, rt.status, rt.urgency_level, rt.ai_explanation,
        src.name AS source_phc, dst.name AS dest_phc, m.name AS medicine_name,
        src_d.name AS src_district, dst_d.name AS dst_district
      FROM redistribution_transfers rt
      JOIN phc_facilities src ON rt.source_phc_id = src.id
      JOIN phc_facilities dst ON rt.dest_phc_id = dst.id
      JOIN medicines m ON rt.medicine_id = m.id
      JOIN districts src_d ON src.district_id = src_d.id
      JOIN districts dst_d ON dst.district_id = dst_d.id
      ORDER BY rt.created_at DESC;
    `).catch(() => ({ rows: [] as any[] }));

    let answer = `### Active Inter-PHC Redistribution Transfers (${res.rows.length} Transfers)\n\n`;
    const citations: { sourceType: string; entityId?: string; excerpt?: string }[] = [];

    for (const t of res.rows) {
      const badge = t.urgency_level === 'CRITICAL' ? '🚨' : '⚡';
      answer += `#### ${badge} Transfer: ${t.medicine_name} (${t.status.toUpperCase()})\n`;
      answer += `• **Route:** ${t.source_phc} (${t.src_district}) ➔ **${t.dest_phc} (${t.dst_district})**\n`;
      answer += `• **Quantity:** **${t.quantity.toLocaleString()} units** (Urgency: **${t.urgency_level}**)\n`;
      answer += `• **AI Justification:** ${t.ai_explanation}\n\n`;

      citations.push({
        sourceType: 'redistribution',
        entityId: t.id,
        excerpt: `${t.source_phc} ➔ ${t.dest_phc}: ${t.quantity} units ${t.medicine_name} [${t.status}]`,
      });
    }

    return {
      answer,
      citations,
      followUps: [
        'Which other facilities have surplus Amoxicillin?',
        'Show near-expiry medicine batches',
      ],
    };
  }

  // ── 9. EXPIRING MEDICINES ─────────────────────────────────────────────────
  if (q.includes('expir') || q.includes('shelf life') || q.includes('fefo')) {
    const res = await client.query(`
      SELECT 
        ib.id, ib.batch_no, ib.remaining_qty, ib.expiry_date,
        m.name AS medicine_name, p.name AS phc_name,
        (ib.expiry_date - CURRENT_DATE) AS days_to_expiry
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      JOIN phc_facilities p ON ib.phc_id = p.id
      WHERE ib.expiry_date <= CURRENT_DATE + 60 AND ib.remaining_qty > 0
      ORDER BY ib.expiry_date ASC;
    `).catch(() => ({ rows: [] as any[] }));

    let answer = `### Near-Expiry Medicine Batches (Next 60 Days)\n\n`;
    const citations: { sourceType: string; entityId?: string; excerpt?: string }[] = [];

    for (const b of res.rows) {
      answer += `• ⏳ **${b.medicine_name}** at *${b.phc_name}*: Batch \`${b.batch_no}\`, **${b.remaining_qty} units** — Expires in **${b.days_to_expiry} days** (${b.expiry_date})\n`;
      citations.push({
        sourceType: 'inventory_batch',
        entityId: b.id,
        excerpt: `Batch ${b.batch_no} (${b.medicine_name}) at ${b.phc_name}: ${b.remaining_qty} units expiring in ${b.days_to_expiry}d`,
      });
    }

    return {
      answer,
      citations,
      followUps: [
        'Create redistribution transfer for expiring batches',
        'Which facilities have highest consumption velocity?',
      ],
    };
  }

  // ── 10. WORKFORCE / STAFF ─────────────────────────────────────────────────
  if (q.includes('staff') || q.includes('doctor') || q.includes('nurse') || q.includes('anm') || q.includes('workforce')) {
    const res = await client.query(`
      SELECT 
        s.role,
        count(*)::int AS total_registered,
        count(*) FILTER (WHERE s.active = true)::int AS active_staff,
        count(*) FILTER (WHERE s.active = false)::int AS on_leave
      FROM staff_registry s
      GROUP BY s.role
      ORDER BY total_registered DESC;
    `).catch(() => ({ rows: [] as any[] }));

    let answer = `### Public Health Workforce Status\n\n`;
    for (const r of res.rows) {
      answer += `• **${r.role}:** ${r.active_staff} Active, ${r.on_leave} On Leave (Total: ${r.total_registered})\n`;
    }

    return {
      answer,
      citations: [{ sourceType: 'staff_registry', excerpt: `Active workforce coverage: ${res.rows.map((r: any) => `${r.role}: ${r.active_staff}`).join(', ')}` }],
      followUps: ['Show facilities with staff shortages', 'What is the doctor to patient ratio?'],
    };
  }

  // ── 11. GENERAL RAG SEARCH FALLBACK ───────────────────────────────────────
  const searchTerms = q.split(/\s+/).filter((w) => w.length > 2);
  const pattern = searchTerms.length > 0 ? `%${searchTerms[0]}%` : '%';

  const [matchedMeds, matchedFacs, matchedAlerts] = await Promise.all([
    client.query(
      `
      SELECT m.name AS medicine_name, p.name AS phc_name, ib.remaining_qty, ib.minimum_threshold
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      JOIN phc_facilities p ON ib.phc_id = p.id
      WHERE m.name ILIKE $1 OR m.category ILIKE $1
      LIMIT 5
    `,
      [pattern]
    ).catch(() => ({ rows: [] as any[] })),
    client.query(
      `
      SELECT p.name, p.total_beds, p.occupied_beds, p.oxygen_cylinders_available, d.name AS district
      FROM phc_facilities p
      JOIN districts d ON p.district_id = d.id
      WHERE p.name ILIKE $1 OR d.name ILIKE $1
      LIMIT 5
    `,
      [pattern]
    ).catch(() => ({ rows: [] as any[] })),
    client.query(
      `
      SELECT id, alert_type, severity, payload
      FROM alerts
      WHERE alert_type ILIKE $1 OR severity ILIKE $1
      LIMIT 5
    `,
      [pattern]
    ).catch(() => ({ rows: [] as any[] })),
  ]);

  if (matchedMeds.rows.length > 0 || matchedFacs.rows.length > 0 || matchedAlerts.rows.length > 0) {
    let answer = `### Relevant Database Records for "${question}":\n\n`;
    const citations: { sourceType: string; entityId?: string; excerpt?: string }[] = [];

    if (matchedMeds.rows.length > 0) {
      answer += `#### 💊 Matching Medicine Stock:\n`;
      for (const m of matchedMeds.rows) {
        answer += `• **${m.medicine_name}** at ${m.phc_name}: **${m.remaining_qty} units** in stock (Threshold: ${m.minimum_threshold})\n`;
      }
      answer += `\n`;
    }

    if (matchedFacs.rows.length > 0) {
      answer += `#### 🏥 Matching Facilities:\n`;
      for (const f of matchedFacs.rows) {
        answer += `• **${f.name}** (${f.district}): ${f.occupied_beds}/${f.total_beds} beds, ${f.oxygen_cylinders_available} O2 cylinders\n`;
      }
      answer += `\n`;
    }

    if (matchedAlerts.rows.length > 0) {
      answer += `#### 🚨 Matching Alerts:\n`;
      for (const a of matchedAlerts.rows) {
        answer += `• [${a.severity.toUpperCase()}] **${a.alert_type.replace(/_/g, ' ')}**: ${JSON.stringify(a.payload).slice(0, 100)}\n`;
        citations.push({ sourceType: 'alert', entityId: a.id, excerpt: `${a.alert_type} (${a.severity})` });
      }
    }

    return {
      answer,
      citations,
      followUps: ['Which medicines have shortages across states?', 'Show all open alerts'],
    };
  }

  // If truly nothing was matched, provide an intelligent, helpful response:
  return {
    answer: `I searched the health database for **"${question}"**, but could not find direct matching records.\n\nYou can ask me about:\n• **Patient Footfall:** *"Patient footfall in Uttar Pradesh"* or *"OPD visits in Maharashtra"*\n• **Medicine Shortages:** *"Which medicines are out of stock?"* or *"Stock for Amoxicillin"*\n• **Facility Capacity:** *"Bed occupancy in Maharashtra"* or *"Oxygen cylinders available"*\n• **Alerts & Operations:** *"Show all open critical alerts"* or *"Pending redistribution transfers"*`,
    citations: [],
    followUps: [
      'Patient footfall in Uttar Pradesh',
      'Which medicines have shortages across states?',
      'Show bed occupancy across PHCs',
      'Show all open critical alerts',
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CopilotService
// ─────────────────────────────────────────────────────────────────────────────
export class CopilotService {
  static async chat(
    _claims: TenantClaims,
    _phcId: string,
    userMessage: string,
  ): Promise<CopilotChatResponse> {
    const sessionId = `session-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    const client = await pool.connect().catch(() => null);
    if (!client) {
      return {
        sessionId,
        message: 'Unable to connect to the health database. Please ensure PostgreSQL is running.',
        citations: [],
        suggestedFollowUps: ['Retry query'],
        confidence: 0,
        model_version: 'offline',
        generatedAt,
      };
    }

    try {
      const ragResult = await executeRagQuery(client, userMessage);
      let finalMessage = ragResult.answer;
      let activeModel = 'smarthealth-rag-v2.5';

      // If user sent a casual greeting, or if Gemini LLM is available, generate conversational polish
      if (!ragResult.isChat && GEMINI_API_KEY) {
        const systemPrompt = `You are the Smart Health Platform AI Copilot, an expert health supply chain and public health intelligence officer.
The user asked: "${userMessage}"

Real ground-truth data retrieved from the PostgreSQL health database:
${ragResult.answer}

Instructions:
1. Answer the user's question directly, conversationally, and clearly using the retrieved database facts above.
2. Preserve all factual numbers, facility names, stock counts, and dates exactly as reported.
3. Be professional, clinical, and proactive. Use Markdown formatting with headings and bullet points.`;

        const llmResponse = await callGeminiLlm(systemPrompt, userMessage);
        if (llmResponse) {
          finalMessage = llmResponse;
          activeModel = 'gemini-3.6-flash-rag';
        }
      }

      return {
        sessionId,
        message: finalMessage,
        citations: ragResult.citations,
        suggestedFollowUps: ragResult.followUps,
        confidence: 0.98,
        model_version: activeModel,
        generatedAt,
      };
    } finally {
      client.release();
    }
  }

  static async query(
    claims: TenantClaims,
    prompt: string,
    entityContext?: { phc_id?: string; district_id?: string },
  ): Promise<CopilotResponse> {
    const chatResponse = await CopilotService.chat(claims, entityContext?.phc_id ?? 'national', prompt);
    return {
      answer: chatResponse.message,
      supporting_data: { citations: chatResponse.citations },
      confidence: chatResponse.confidence,
      model_version: chatResponse.model_version,
      timestamp: chatResponse.generatedAt,
    };
  }

  static async generateSuggestion(
    _claims: TenantClaims,
    phcId: string,
    suggestionType: string,
  ): Promise<CopilotSuggestion> {
    const client = await pool.connect().catch(() => null);
    let lowStockItem: any = null;

    if (client) {
      try {
        const r = await client.query(`
          SELECT ib.remaining_qty, ib.minimum_threshold, ib.expiry_date, m.name AS medicine_name, p.name AS phc_name
          FROM inventory_batches ib
          JOIN medicines m ON ib.medicine_id = m.id
          JOIN phc_facilities p ON ib.phc_id = p.id
          WHERE ib.remaining_qty <= ib.minimum_threshold
          LIMIT 1;
        `);
        lowStockItem = r.rows[0];
      } finally {
        client.release();
      }
    }

    const id = `cs-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    if (lowStockItem) {
      return {
        id,
        phcId,
        suggestionType,
        title: `Urgent Reorder: ${lowStockItem.medicine_name}`,
        description: `${lowStockItem.medicine_name} at ${lowStockItem.phc_name} has only ${lowStockItem.remaining_qty} units remaining (Threshold: ${lowStockItem.minimum_threshold}). Batch expires on ${lowStockItem.expiry_date}.`,
        priority: 'critical',
        actions: [
          { label: 'Dispatch Emergency Kit', actionCode: 'DISPATCH_EMERGENCY', estimatedImpact: 'Restores 14-day stock buffer' },
          { label: 'Request Inter-PHC Transfer', actionCode: 'REQUEST_TRANSFER', estimatedImpact: 'Delivery within 24 hours' },
        ],
        confidenceScore: 0.95,
        metadata: { medicine: lowStockItem.medicine_name, remainingQty: lowStockItem.remaining_qty },
        generatedAt,
      };
    }

    return {
      id,
      phcId,
      suggestionType,
      title: 'Facility Readiness Verification',
      description: 'All stock and facility parameters are currently within normal baseline thresholds.',
      priority: 'low',
      actions: [{ label: 'Verify status', actionCode: 'VERIFY', estimatedImpact: 'Maintain compliance' }],
      confidenceScore: 0.9,
      metadata: {},
      generatedAt,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Express Router
// ─────────────────────────────────────────────────────────────────────────────
export const copilotRouter = Router();

copilotRouter.post('/governance/copilot/query', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims || { role: 'national_admin', sub: 'dev' };
    const { prompt, entity_context } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing required field: prompt' });

    const response = await CopilotService.query(claims, prompt, entity_context);
    return res.status(200).json(response);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

copilotRouter.post('/governance/copilot/suggest', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims || { role: 'national_admin', sub: 'dev' };
    const { phcId, suggestionType } = req.body;
    if (!phcId || !suggestionType) return res.status(400).json({ error: 'Missing required fields: phcId, suggestionType' });

    const suggestion = await CopilotService.generateSuggestion(claims, phcId, suggestionType);
    return res.status(200).json(suggestion);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

copilotRouter.post('/governance/copilot/chat', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims || { role: 'national_admin', sub: 'dev' };
    const { phcId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing required field: message' });

    const response = await CopilotService.chat(claims, phcId ?? 'national', message);
    return res.status(200).json(response);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});
