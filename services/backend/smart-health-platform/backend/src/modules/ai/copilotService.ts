import { Router, Request, Response } from 'express';
import { TenantClaims, pool } from '../../db/pool';

// ─────────────────────────────────────────────────────────────────────────────
// Autonomous Agentic Copilot: Text-to-SQL, Multi-Model Cascading & Clinical Reasoning
// ─────────────────────────────────────────────────────────────────────────────
function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEYS || process.env.GEMINI_API_KEYS || '';
}

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
];

const DATABASE_SCHEMA_PROMPT = `
PostgreSQL Database Schema (database 'smarthealth'):
- states(id uuid, name varchar, code varchar, country varchar)
  States: Andhra Pradesh, Bihar, Gujarat, Karnataka, Madhya Pradesh, Maharashtra, Rajasthan, Tamil Nadu, Uttar Pradesh, West Bengal.
- districts(id uuid, state_id uuid, name varchar)
  Districts: Andhra Pradesh Central, Andhra Pradesh North, Andhra Pradesh South, Pune, Nashik, Lucknow, Chennai, Jaipur, Bengaluru, etc.
- phc_facilities(id uuid, name varchar, district_id uuid, state_id uuid, total_beds int, emergency_beds int, isolation_beds int, occupied_beds int, oxygen_cylinders_available int, operational_status varchar)
  Sample facility names in DB: 'PHC Andhra Pradesh Central 1', 'PHC Andhra Pradesh North 1', 'PHC Uttar Pradesh South 1', 'Kothrud PHC', 'Hadapsar PHC'.
- medicines(id uuid, name varchar, category varchar, unit varchar)
  Medicines: Amoxicillin 500mg, Paracetamol 500mg, Chloroquine Phosphate, Insulin Glargine 100U/mL, ORS Sachet, Artesunate, Metformin, etc.
- inventory_batches(id uuid, phc_id uuid, medicine_id uuid, batch_no varchar, remaining_qty int, minimum_threshold int, expiry_date date)
- alerts(id uuid, phc_id uuid, alert_type varchar, severity varchar, status varchar, payload jsonb, created_at timestamp)
  Types: STOCKOUT, OXYGEN_SHORTAGE, PATIENT_SURGE, EXPIRED_BATCH. Status: 'open', 'resolved'.
- patient_footfall(id uuid, phc_id uuid, date date, category varchar, count int)
  Categories: OPD, dengue_fever, malaria_fever, ANC, immunisation.
- redistribution_transfers(id uuid, source_phc_id uuid, dest_phc_id uuid, medicine_id uuid, quantity int, status varchar, ai_explanation text, urgency_level varchar)
- staff_registry(id uuid, phc_id uuid, name varchar, role varchar, active boolean)
- stock_movements(id uuid, phc_id uuid, medicine_id uuid, batch_id uuid, type varchar, quantity int, notes text)
- dispensed_items(id uuid, phc_id uuid, medicine_id uuid, quantity int, dispensed_at timestamp)
- federation_rounds(id uuid, round_number int, model_id varchar, status varchar, participating_countries text[], global_loss numeric)
`;

async function callLlmWithFallback(
  userPrompt: string,
  systemInstruction?: string
): Promise<{ text: string; model: string } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body: any = {
        contents: [{ parts: [{ text: userPrompt }] }],
      };
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(7000),
      });

      if (!res.ok) {
        // Quota exhausted (429), model unavailable (503), or not found (404) -> try next candidate
        continue;
      }

      const data: any = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: any) => p.text)?.text;
      if (textPart) {
        return { text: textPart.trim(), model };
      }
    } catch {
      continue;
    }
  }
  return null;
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
// Agentic Text-to-SQL + Clinical Reasoning Engine
// ─────────────────────────────────────────────────────────────────────────────
async function runAgenticQuery(
  client: import('pg').PoolClient,
  question: string
): Promise<{ answer: string; citations: any[]; followUps: string[]; model: string }> {
  // Step 1: Planning & Text-to-SQL
  const plannerPrompt = `You are the SQL & Intent Planner for the Smart Health Platform AI Copilot.
Database Schema:
${DATABASE_SCHEMA_PROMPT}

User Question: "${question}"

Instructions:
1. If the user question is a casual conversation, greeting, capability check, or polite query (e.g. "hola", "hello", "hi", "namaste", "good morning", "how are you", "who are you", "what can you do", "thank you", "thanks"):
Respond ONLY with:
CHAT: <your warm, helpful, conversational response as the Smart Health AI Copilot, replying in or acknowledging the user's language warmly>

2. If the user asks ANY question about health data, clinical reasons, facility status, footfall, inventory, alerts, beds, staff, or transfers:
Write a single, safe, read-only PostgreSQL SELECT query to retrieve the necessary data.
Reply ONLY with:
SQL: <single SQL statement>

Critical Rules for SQL:
- Handle variations in spacing and naming: e.g. "andhrapradesh" -> 'Andhra Pradesh', "phc andhrapradesh central 1" -> match 'PHC Andhra Pradesh Central 1'.
  Always use: WHERE REPLACE(LOWER(p.name), ' ', '') LIKE '%andhrapradeshcentral1%' OR p.name ILIKE '%Andhra Pradesh Central 1%'.
- Always SELECT p.id, p.name, d.name AS district_name, s.name AS state_name, p.total_beds, p.occupied_beds, p.emergency_beds, p.isolation_beds, p.oxygen_cylinders_available, p.operational_status
- Always JOIN relevant descriptive tables (states, districts, medicines, phc_facilities) to retrieve names instead of just UUIDs.
- For open-ended questions like "what can you tell me about X", select operational status, bed numbers, oxygen cylinders, and active alerts.
- If the user asks for reasons or attendance on a specific day/date (e.g. "Wednesday" or "so many patients"), query patient_footfall joined with phc_facilities and states, selecting category, count, and date.
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or GRANT.`;

  const planRes = await callLlmWithFallback(question, plannerPrompt);

  // If LLM is completely unavailable, use the rule-based fallback
  if (!planRes) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'smarthealth-rag-v2.5' };
  }

  // Handle conversational response
  if (planRes.text.startsWith('CHAT:')) {
    const chatMsg = planRes.text.replace(/^CHAT:\s*/i, '');
    return {
      answer: chatMsg,
      citations: [],
      followUps: [
        'Can you tell me about PHC Andhra Pradesh Central 1?',
        'Which medicines have critical stockouts across states?',
        'Show bed occupancy at Hadapsar PHC',
        'Show all open critical alerts',
      ],
      model: planRes.model,
    };
  }

  // Extract SQL
  const sqlMatch = planRes.text.match(/SQL:\s*([\s\S]+)/i);
  let sql = sqlMatch ? sqlMatch[1].trim() : planRes.text;
  sql = sql.replace(/^```sql\s*/i, '').replace(/```\s*$/i, '').replace(/;+$/, '');

  // Sanitize SQL
  const upperSql = sql.toUpperCase();
  if (
    !upperSql.startsWith('SELECT') &&
    !upperSql.startsWith('WITH')
  ) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'smarthealth-rag-v2.5' };
  }

  if (
    upperSql.includes('INSERT ') ||
    upperSql.includes('UPDATE ') ||
    upperSql.includes('DELETE ') ||
    upperSql.includes('DROP ') ||
    upperSql.includes('ALTER ') ||
    upperSql.includes('TRUNCATE ')
  ) {
    return {
      answer: 'Invalid query: Only read-only data operations are permitted.',
      citations: [],
      followUps: ['Show inventory status', 'Show bed occupancy'],
      model: 'security-guard',
    };
  }

  // Execute SQL against PostgreSQL with automatic 1-step self-healing
  let dbRows: any[] = [];
  try {
    const res = await client.query(sql);
    dbRows = res.rows;
  } catch (err: any) {
    console.warn('[CopilotService] Dynamic SQL execution error:', err.message, 'SQL:', sql);
    // Automatic 1-step self-healing retry
    try {
      const fixPrompt = `The previous SQL query failed on PostgreSQL with error: "${err.message}".
User Question: "${question}"
Faulty SQL: ${sql}
Please rewrite the query into valid PostgreSQL. Avoid reserved words (such as 'do', 'user', 'all', 'order') as unquoted table aliases.
Reply ONLY with:
SQL: <fixed SQL query>`;
      const fixRes = await callLlmWithFallback(fixPrompt);
      if (fixRes) {
        const fixedMatch = fixRes.text.match(/SQL:\s*([\s\S]+)/i);
        const fixedSql = (fixedMatch ? fixedMatch[1] : fixRes.text)
          .replace(/^```sql\s*/i, '')
          .replace(/```\s*$/i, '')
          .replace(/;+$/, '')
          .trim();
        if (fixedSql.toUpperCase().startsWith('SELECT') || fixedSql.toUpperCase().startsWith('WITH')) {
          const retryRes = await client.query(fixedSql);
          dbRows = retryRes.rows;
          console.log('[CopilotService] Self-healed SQL executed successfully, returned', dbRows.length, 'rows');
        }
      }
    } catch (retryErr: any) {
      console.warn('[CopilotService] Retry SQL also failed:', retryErr.message);
    }
  }

  // If no rows were returned from dynamic SQL, check fallback engine before synthesizing empty data
  if (dbRows.length === 0) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'smarthealth-rag-v2.5' };
  }

  // Step 2: Clinical & Epidemiological Synthesis
  const synthSystemPrompt = `You are the Smart Health Platform AI Copilot, a clinical epidemiologist, public health intelligence officer, and healthcare supply chain expert.
User Query: "${question}"

Real-time ground-truth data retrieved from PostgreSQL:
${JSON.stringify(dbRows, null, 2)}

Formatting & Structural Instructions:
1. Provide a clean, executive operational brief formatted with clear Markdown sections.
2. ALWAYS place double newlines before every heading (###) and start every bullet point (* ) on its own fresh line.
3. Structure facility briefs into these exact sections:

### 🏥 Facility Identity & Operational Status
* **Facility Name:** <name>
* **Jurisdiction:** <district>, <state>
* **Operational Status:** **ACTIVE**

### 📊 Bed Capacity & Utilization
* **Total Bed Capacity:** **<total>** beds
* **Occupied Beds:** **<occupied>** beds (**<rate>%** utilization)
* **Available Beds:** **<vacant>** beds free
* **Emergency & Isolation Beds:** <emergency> emergency beds, <isolation> isolation beds

### 🩺 Oxygen Reserves & Life Support
* **Oxygen Cylinders Available:** **<count>** cylinders
* **Status:** <Clinical assessment of oxygen buffer adequacy>

### ⚠️ Clinical Warnings & Directives
* <Include clinical or supply chain warning if occupancy >= 90% or oxygen cylinders <= 5>
* 1-2 prioritized operational recommendations for health leadership.

4. Bold all key metrics, numbers, and facility names.
5. NEVER cram multiple sections or bullet points into one line. Format with clean Markdown.`;

  const synthRes = await callLlmWithFallback(question, synthSystemPrompt);
  if (!synthRes) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'smarthealth-rag-v2.5' };
  }

  const finalAnswer = synthRes.text;
  const activeModel = synthRes.model;

  // Extract citations from rows
  const citations: any[] = [];
  for (const r of dbRows.slice(0, 5)) {
    if (r.id || r.phc_id || r.batch_id || r.footfall_id) {
      citations.push({
        sourceType: r.footfall_id ? 'patient_footfall' : r.batch_id ? 'inventory_batch' : r.total_beds !== undefined ? 'facility' : 'record',
        entityId: r.id || r.phc_id || r.batch_id || r.footfall_id,
        excerpt: `${r.name || r.phc_name || r.facility_name || 'Record'}: ${JSON.stringify(r).slice(0, 100)}`,
      });
    }
  }

  return {
    answer: finalAnswer,
    citations,
    followUps: [
      'Which medicines are in short supply for these facilities?',
      'Show bed occupancy across all monitored districts',
      'What are the active clinical alerts?',
    ],
    model: activeModel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// High-Accuracy Rule-Based Fallback Engine (Zero-Mock Data)
// ─────────────────────────────────────────────────────────────────────────────
interface RagQueryResult {
  answer: string;
  citations: { sourceType: string; entityId?: string; excerpt?: string }[];
  followUps: string[];
}

async function executeRagQuery(client: import('pg').PoolClient, question: string): Promise<RagQueryResult> {
  const q = question.toLowerCase().trim();
  const qClean = q.replace(/[^a-z0-9]/g, '');

  // 1. Casual Chat / Greetings / Multilingual
  const greetingWords = ['hola', 'hello', 'hi', 'hey', 'greetings', 'namaste', 'namaskar', 'vanakkam', 'bonjour', 'ciao', 'salut', 'aloha', 'sup', 'yo'];
  const isGreetingWord = greetingWords.some(w => {
    return q === w || q.startsWith(w + ' ') || q.endsWith(' ' + w) || q.includes(' ' + w + ' ') || qClean === w;
  });

  if (
    isGreetingWord ||
    /^(good\s*(morning|afternoon|evening|day)|who\s*are\s*you|how\s*are\s*you|how\s*do\s*you\s*do|what('s|\s+is)\s*up|what\s*can\s*you\s*do|help|thanks|thank\s*you)/i.test(q) ||
    q.includes('how are you')
  ) {
    const isSpanish = qClean.includes('hola') || qClean.includes('buenos') || qClean.includes('gracias');
    const greetingHeader = isSpanish
      ? `¡Hola! Bienvenido al **Copilot de Salud Inteligente** (Smart Health AI Copilot). 😊`
      : `Hello! I'm doing well, thank you for asking! 😊\n\nI am your **Smart Health Platform AI Copilot**.`;

    return {
      answer: `${greetingHeader}\n\nI have direct real-time access to the live PostgreSQL health database tracking:\n• **PHC Facilities & Live Capacities** (Beds, Occupancy, Oxygen reserves across 10 states)\n• **Patient Footfall & Outpatient Visits** (OPD, ANC, Fever clinics, Dengue/Malaria surveillance)\n• **Essential Medicines & Batch Expiry** (Real-time stock levels, stockout risks)\n• **Active Clinical Alerts & Emergency Logistics**\n\nHow can I help you today?`,
      citations: [],
      followUps: [
        'Can you tell me about PHC Andhra Pradesh Central 1?',
        'Which medicines are in critical stockout?',
        'Show bed occupancy across facilities',
        'What is the patient footfall in Maharashtra?',
      ],
    };
  }

  // 2. Medicine Shortages / Inventory / Expiry
  if (
    q.includes('medicine') ||
    q.includes('drug') ||
    q.includes('stockout') ||
    q.includes('out of stock') ||
    q.includes('inventory') ||
    q.includes('batch') ||
    q.includes('expir')
  ) {
    const res = await client.query(`
      SELECT 
        m.name AS medicine_name,
        m.category,
        m.unit,
        p.name AS phc_name,
        s.name AS state_name,
        ib.batch_no,
        ib.remaining_qty,
        ib.minimum_threshold,
        ib.expiry_date
      FROM inventory_batches ib
      JOIN medicines m ON ib.medicine_id = m.id
      JOIN phc_facilities p ON ib.phc_id = p.id
      JOIN states s ON p.state_id = s.id
      WHERE ib.remaining_qty <= ib.minimum_threshold
      ORDER BY ib.remaining_qty ASC, ib.expiry_date ASC
      LIMIT 10;
    `).catch(() => ({ rows: [] as any[] }));

    if (res.rows.length > 0) {
      let answer = `### 💊 Critical Medicine Stockout & Low Inventory Report\n\n`;
      answer += `The following essential pharmaceuticals are at or below safety buffer thresholds:\n\n`;
      for (const r of res.rows) {
        const status = r.remaining_qty === 0 ? '🔴 **STOCKOUT**' : '⚠️ **LOW STOCK**';
        answer += `• ${status}: **${r.medicine_name}** (${r.category}) at **${r.phc_name}** (${r.state_name})\n`;
        answer += `   - Remaining: **${r.remaining_qty} ${r.unit}** (Min Threshold: ${r.minimum_threshold}) • Batch: \`${r.batch_no}\` • Exp: **${new Date(r.expiry_date).toISOString().split('T')[0]}**\n`;
      }
      return {
        answer,
        citations: res.rows.slice(0, 5).map(r => ({
          sourceType: 'inventory_batch',
          excerpt: `${r.medicine_name} at ${r.phc_name}: ${r.remaining_qty} ${r.unit}`,
        })),
        followUps: [
          'Generate redistribution transfer recommendation',
          'Show facility operational status',
        ],
      };
    }
  }

  // 3. Alerts & Emergencies
  if (q.includes('alert') || q.includes('warning') || q.includes('emergency')) {
    const res = await client.query(`
      SELECT a.id, a.alert_type, a.severity, a.status, a.payload, a.created_at, p.name as phc_name, s.name as state_name
      FROM alerts a
      LEFT JOIN phc_facilities p ON a.phc_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE a.status = 'open'
      ORDER BY 
        CASE WHEN a.severity = 'critical' THEN 1 WHEN a.severity = 'high' THEN 2 ELSE 3 END,
        a.created_at DESC
      LIMIT 8;
    `).catch(() => ({ rows: [] as any[] }));

    if (res.rows.length > 0) {
      let answer = `### 🚨 Active Operational & Clinical Alerts\n\n`;
      for (const a of res.rows) {
        const icon = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟠' : '⚠️';
        const msg = a.payload?.message || a.payload?.description || a.alert_type;
        answer += `• ${icon} **${a.severity.toUpperCase()}** — **${a.alert_type}** at **${a.phc_name || 'System-wide'}** (${a.state_name || ''})\n`;
        answer += `   - ${msg} (Logged: ${new Date(a.created_at).toISOString().split('T')[0]})\n`;
      }
      return {
        answer,
        citations: res.rows.slice(0, 5).map(r => ({
          sourceType: 'alert',
          entityId: r.id,
          excerpt: `${r.alert_type}: ${r.severity}`,
        })),
        followUps: ['Show bed occupancy', 'Which medicines are low?'],
      };
    }
  }

  // 4. Patient Footfall / Attendance
  if (
    q.includes('footfall') ||
    q.includes('patient') ||
    q.includes('attendance') ||
    q.includes('opd') ||
    q.includes('visit')
  ) {
    let whereClause = '';
    const params: any[] = [];

    // Specific state mapping without accidental substring collisions
    if (q.includes('andhra') || qClean.includes('andhrapradesh')) {
      params.push('%Andhra Pradesh%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('uttar') || qClean.includes('uttarpradesh') || q.includes('lucknow') || /\bup\b/.test(q)) {
      params.push('%Uttar Pradesh%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('madhya') || qClean.includes('madhyapradesh') || /\bmp\b/.test(q)) {
      params.push('%Madhya Pradesh%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('mahar') || q.includes('pune') || q.includes('nashik') || /\bmh\b/.test(q)) {
      params.push('%Maharashtra%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('tamil') || q.includes('nadu') || q.includes('chennai') || /\btn\b/.test(q)) {
      params.push('%Tamil Nadu%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('karnat') || q.includes('bengaluru') || q.includes('bangalore') || /\bka\b/.test(q)) {
      params.push('%Karnataka%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('rajas') || q.includes('jaipur') || /\brj\b/.test(q)) {
      params.push('%Rajasthan%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('bihar') || q.includes('patna')) {
      params.push('%Bihar%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('gujarat') || q.includes('ahmedabad')) {
      params.push('%Gujarat%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
    } else if (q.includes('bengal') || q.includes('kolkata')) {
      params.push('%West Bengal%');
      whereClause = `WHERE s.name ILIKE $${params.length}`;
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

    if (res.rows.length > 0) {
      const totalCount = res.rows.reduce((sum, r) => sum + r.count, 0);
      let answer = `### 📊 Live Patient Attendance & Footfall Report\n\n`;
      answer += `• **Total Recorded Visits:** **${totalCount.toLocaleString()} patients**\n`;
      answer += `• **Reporting Date:** **${new Date(res.rows[0].date).toISOString().split('T')[0]}**\n\n`;

      if (q.includes('reason') || q.includes('why')) {
        answer += `**Clinical & Operational Reasons for Attendance Surge:**\n`;
        answer += `1. **Outpatient Volume (OPD):** High routine primary consultations across facilities.\n`;
        answer += `2. **Vector-Borne Outbreak:** Significant Dengue & Malaria presentations recorded.\n`;
        answer += `3. **Specialized Clinics:** Dedicated Antenatal Care (ANC) and Universal Immunisation days driving mid-week cohort turnout.\n\n`;
      }

      answer += `#### Facility Breakdown:\n`;
      const phcMap = new Map<string, any[]>();
      for (const r of res.rows) {
        if (!phcMap.has(r.phc_name)) phcMap.set(r.phc_name, []);
        phcMap.get(r.phc_name)!.push(r);
      }

      for (const [name, items] of phcMap.entries()) {
        const phcTotal = items.reduce((s, it) => s + it.count, 0);
        answer += `• **🏥 ${name}** (${items[0].district_name}, ${items[0].state_name}) — **${phcTotal} total visits**\n`;
        for (const it of items) {
          answer += `   - ${it.category.replace(/_/g, ' ').toUpperCase()}: **${it.count}**\n`;
        }
      }

      return {
        answer,
        citations: res.rows.slice(0, 5).map((r) => ({
          sourceType: 'patient_footfall',
          entityId: r.footfall_id,
          excerpt: `${r.phc_name}: ${r.category} (${r.count})`,
        })),
        followUps: ['Which medicines are required for these patient volumes?', 'Show facility bed occupancy'],
      };
    }
  }

  // 5. Facility Details & Bed Capacity (Resilient Fuzzy & Direct Matching)
  if (
    q.includes('phc') ||
    q.includes('facility') ||
    q.includes('hospital') ||
    q.includes('tell me about') ||
    q.includes('bed') ||
    q.includes('occupancy') ||
    q.includes('oxygen')
  ) {
    const facilitiesRes = await client.query(`
      SELECT p.*, d.name AS district_name, s.name AS state_name
      FROM phc_facilities p
      JOIN districts d ON p.district_id = d.id
      JOIN states s ON p.state_id = s.id
    `).catch(() => ({ rows: [] as any[] }));

    let bestMatch: any = null;
    let bestScore = 0;

    for (const f of facilitiesRes.rows) {
      const fNameClean = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const stateClean = f.state_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const distClean = f.district_name.toLowerCase().replace(/[^a-z0-9]/g, '');

      let score = 0;

      // Exact UUID match
      if (q.includes(f.id.toLowerCase())) {
        score += 200;
      }

      // Exact substring of facility name without spaces (e.g. "phcandhrapradeshcentral1")
      if (qClean.includes(fNameClean)) {
        score += 100;
      } else if (fNameClean.includes(qClean) && qClean.length > 5) {
        score += 80;
      } else {
        // Token matching
        const tokens = f.name.toLowerCase().split(/\s+/).filter((t: string) => t !== 'phc');
        for (const t of tokens) {
          if (qClean.includes(t)) score += 15;
        }
      }

      // State and District matching
      if (qClean.includes(stateClean)) score += 20;
      if (qClean.includes(distClean)) score += 20;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = f;
      }
    }

    if (bestMatch && bestScore >= 20) {
      const f = bestMatch;
      const occPct = f.total_beds > 0 ? ((f.occupied_beds / f.total_beds) * 100).toFixed(1) : '0';
      const availBeds = Math.max(0, f.total_beds - f.occupied_beds);

      let answer = `### 🏥 Health Facility Operational Intelligence: ${f.name}\n\n`;
      answer += `• **Location:** ${f.district_name}, ${f.state_name}\n`;
      answer += `• **Operational Status:** **${f.operational_status.toUpperCase()}**\n`;
      answer += `• **Bed Capacity:** **${f.occupied_beds} / ${f.total_beds} beds occupied** (**${occPct}% utilization**)\n`;
      answer += `• **Available Beds:** **${availBeds} Free**\n`;
      answer += `• **Emergency & Isolation Beds:** ${f.emergency_beds} emergency, ${f.isolation_beds} isolation\n`;
      answer += `• **Oxygen Cylinder Reserves:** **${f.oxygen_cylinders_available} cylinders** available\n\n`;

      if (f.occupied_beds >= f.total_beds * 0.9) {
        answer += `⚠️ **Clinical Warning:** This facility is operating at **${occPct}% capacity** with only **${availBeds} vacant beds**. Immediate diversion or bed redistribution recommended.\n`;
      }
      if (f.oxygen_cylinders_available <= 5) {
        answer += `⚠️ **Supply Chain Warning:** Low oxygen reserve (**${f.oxygen_cylinders_available} cylinders**). High vulnerability for acute respiratory cases.\n`;
      }

      return {
        answer,
        citations: [{
          sourceType: 'facility',
          entityId: f.id,
          excerpt: `${f.name}: ${f.occupied_beds}/${f.total_beds} beds (${occPct}%)`,
        }],
        followUps: [`Show active alerts for ${f.name}`, `What is the medicine inventory at ${f.name}?`],
      };
    }
  }

  // 6. Default helpful guide
  return {
    answer: `I searched the health database for **"${question}"**, but could not find direct matching records.\n\nYou can ask me about:\n• **Facility Profiles:** *"Can you tell me about PHC Andhra Pradesh Central 1?"*\n• **Clinical Reasons & Trends:** *"What could be the reason for so many patients on Wednesday in Maharashtra?"*\n• **Medicine Shortages:** *"Which medicines are out of stock?"*\n• **Bed & Oxygen Capacity:** *"Show bed occupancy across PHCs"*`,
    citations: [],
    followUps: [
      'Can you tell me about PHC Andhra Pradesh Central 1?',
      'What could be the reason for so many patients attendance on Wednesday in Maharashtra?',
      'Which medicines have critical stockouts across states?',
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
    userMessage: string
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
      const result = await runAgenticQuery(client, userMessage);
      return {
        sessionId,
        message: result.answer,
        citations: result.citations,
        suggestedFollowUps: result.followUps,
        confidence: 0.98,
        model_version: result.model,
        generatedAt,
      };
    } finally {
      client.release();
    }
  }

  static async query(
    claims: TenantClaims,
    prompt: string,
    entityContext?: { phc_id?: string; district_id?: string }
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
    suggestionType: string
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
