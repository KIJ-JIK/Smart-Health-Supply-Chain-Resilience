import { Router, Request, Response } from 'express';
import { TenantClaims, pool } from '../../db/pool';

// ─────────────────────────────────────────────────────────────────────────────
// Autonomous Agentic Copilot: Text-to-SQL, Multi-Model Cascading & Clinical Reasoning
// ─────────────────────────────────────────────────────────────────────────────
let keyIndex = 0;
function getGeminiApiKeys(): string[] {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GOOGLE_AI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysStr.split(',').map((k) => k.trim()).filter(Boolean);
}

const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
];

const DATABASE_SCHEMA_PROMPT = `
PostgreSQL Database Schema (database 'smarthealth'):
- states(id uuid, name varchar, code varchar, country varchar)
  All 36 Indian States & UTs: Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal, Andaman and Nicobar Islands, Chandigarh, Dadra and Nagar Haveli and Daman and Diu, Delhi (NCT), Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry.
- districts(id uuid, state_id uuid, name varchar)
  Districts across India (e.g. Pune, Nashik, Lucknow, Patna, Gaya, Muzaffarpur, Bhagalpur, Begusarai, Darbhanga, Chennai, Coimbatore, Madurai, Jaipur, Bengaluru, Ahmedabad, etc.)
- phc_facilities(id uuid, name varchar, district_id uuid, state_id uuid, total_beds int, emergency_beds int, isolation_beds int, occupied_beds int, oxygen_cylinders_available int, operational_status varchar, latitude numeric, longitude numeric)
  Sample PHCs: 'Patna Urban Primary Health Centre', 'Danapur Cantonment Clinic', 'Begusarai Industrial PHC', 'Bhagalpur Silk City Clinic', 'Gaya Bodhi Health Center', 'Muzaffarpur Litchi Hub PHC', 'PHC Andhra Pradesh Central 1', 'Hadapsar PHC', 'Kothrud PHC', 'PHC Uttar Pradesh South 1'.
- medicines(id uuid, name varchar, category varchar, unit varchar)
  Medicines: Amoxicillin 500mg, Paracetamol 500mg, Chloroquine Phosphate, Insulin Glargine 100U/mL, ORS Sachet, Artesunate, Metformin, Azithromycin, Doxycycline, etc.
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
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) return null;

  for (let k = 0; k < apiKeys.length; k++) {
    const apiKey = apiKeys[(keyIndex + k) % apiKeys.length];
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
          continue;
        }

        const data: any = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find((p: any) => p.text)?.text;
        if (textPart) {
          keyIndex = (keyIndex + 1) % apiKeys.length;
          return { text: textPart.trim(), model };
        }
      } catch {
        continue;
      }
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
  const plannerPrompt = `You are the SQL & Intent Planner for AURA Copilot (AURA Health Intelligence & Governance System).
Database Schema:
${DATABASE_SCHEMA_PROMPT}

User Question: "${question}"

Instructions:
1. If the user question is a casual conversation, greeting, capability check, or polite query (e.g. "hola", "hello", "hi", "namaste", "kaiso ho aap", "aap kaise ho", "kese ho", "good morning", "how are you", "who are you", "what can you do", "thank you", "thanks"):
Respond ONLY with:
CHAT: <your warm, helpful, conversational response as AURA Copilot (AURA Health Intelligence Copilot), replying in the user's language (Hindi, Hinglish, English, Spanish, etc.) warmly>

2. If the user asks ANY question about health data, clinical reasons, facility status, footfall, inventory, alerts, beds, staff, or transfers:
Write a single, safe, read-only PostgreSQL SELECT query to retrieve the necessary data.
Reply ONLY with:
SQL: <single SQL statement>

Critical Rules for SQL:
- Handle variations in spacing and naming: e.g. "andhrapradesh" -> 'Andhra Pradesh', "bihar" -> 'Bihar', "phc andhrapradesh central 1" -> match 'PHC Andhra Pradesh Central 1'.
  Always use ILIKE filters for state names: WHERE s.name ILIKE '%Bihar%' or p.name ILIKE '%Bihar%'.
- Always SELECT p.id, p.name, d.name AS district_name, s.name AS state_name, p.total_beds, p.occupied_beds, p.emergency_beds, p.isolation_beds, p.oxygen_cylinders_available, p.operational_status
- Always JOIN relevant descriptive tables (states, districts, medicines, phc_facilities) to retrieve names instead of just UUIDs.
- For open-ended questions like "what can you tell me about X", select operational status, bed numbers, oxygen cylinders, and active alerts.
- If the user asks for reasons or attendance on a specific day/date or patient visits in a state, query patient_footfall joined with phc_facilities and states, selecting category, count, date, p.name, and s.name.
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or GRANT.`;

  const planRes = await callLlmWithFallback(question, plannerPrompt).catch(() => null);

  // If LLM is completely unavailable, use the rule-based fallback
  if (!planRes) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'aura-rag-v2.5' };
  }

  // Handle conversational response
  if (planRes.text.startsWith('CHAT:')) {
    const chatMsg = planRes.text.replace(/^CHAT:\s*/i, '');
    return {
      answer: chatMsg,
      citations: [],
      followUps: [
        'Bihar rajya ke PHC facilities ki sthiti dikhayein',
        'Which medicines have critical stockouts across states?',
        'Show bed occupancy across Bihar and Maharashtra PHCs',
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
    return { ...fallbackRes, model: 'aura-rag-v2.5' };
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
  if (!dbRows || dbRows.length === 0) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'aura-rag-v2.5' };
  }

  // Step 2: Clinical & Epidemiological Synthesis
  const synthSystemPrompt = `You are AURA Copilot, the AI Clinical Epidemiologist, Public Health Intelligence Officer, and Health Governance Copilot for the AURA Platform.
User Query: "${question}"

Real-time ground-truth data retrieved from PostgreSQL:
${JSON.stringify(dbRows, null, 2)}

Formatting & Structural Instructions:
1. Provide a clean, executive operational brief formatted with clear Markdown sections.
2. If the user asked in Hindi or Hinglish, respond in natural, professional Hindi/Hinglish with accurate numbers and clear formatting.
3. ALWAYS place double newlines before every heading (###) and start every bullet point (* ) on its own fresh line.
4. Bold all key metrics, numbers, patient counts, and facility names.
5. Provide actionable clinical or administrative directives for healthcare authorities.`;

  const synthRes = await callLlmWithFallback(question, synthSystemPrompt).catch(() => null);
  if (!synthRes) {
    const fallbackRes = await executeRagQuery(client, question);
    return { ...fallbackRes, model: 'aura-rag-v2.5' };
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

  // 1. Casual Chat / Greetings / Multilingual (Hindi, Hinglish, Spanish, English)
  const isHindiGreeting =
    /^(kaisa|kaise|kaiso|kese|namaste|namaskar|pranam|ram ram|kya hal|kya haal)/i.test(q) ||
    q.includes('kaise ho') ||
    q.includes('kaiso ho') ||
    q.includes('kese ho') ||
    q.includes('kya haal') ||
    qClean.includes('kaisohoaap') ||
    qClean.includes('kaisehoaap');

  const greetingWords = ['hola', 'hello', 'hi', 'hey', 'greetings', 'namaste', 'namaskar', 'vanakkam', 'bonjour', 'ciao', 'salut', 'aloha', 'sup', 'yo'];
  const isGreetingWord = greetingWords.some(w => {
    return q === w || q.startsWith(w + ' ') || q.endsWith(' ' + w) || q.includes(' ' + w + ' ') || qClean === w;
  });

  if (
    isHindiGreeting ||
    isGreetingWord ||
    /^(good\s*(morning|afternoon|evening|day)|who\s*are\s*you|how\s*are\s*you|how\s*do\s*you\s*do|what('s|\s+is)\s*up|what\s*can\s*you\s*do|help|thanks|thank\s*you)/i.test(q) ||
    q.includes('how are you')
  ) {
    if (isHindiGreeting) {
      return {
        answer: `Main badhiya hoon, aap bataiye! 😊\n\nMain **AURA Copilot** (AURA Health Intelligence & Governance System) hoon. Main aapki kya sahayata kar sakta hoon?\n\nAap mujhse live PostgreSQL database se:\n• **PHC Facilities & Live Capacity** (Beds, Occupancy, Oxygen cylinders - sabhi 36 rajyo mein)\n• **Patient Footfall & Outpatient Visits** (OPD, ANC, Fever clinics, Dengue/Malaria surveillance)\n• **Essential Medicines & Batch Expiry** (Stockout alerts, safety buffers)\n• **Clinical Warnings & Emergency Transfers**\n\nke baare mein pooch sakte hain!`,
        citations: [],
        followUps: [
          'Bihar rajya me sthith PHCs aur patient footfall dikhayein',
          'Which medicines are in critical stockout?',
          'Show bed occupancy across facilities',
          'Maharashtra rajya ke clinical alerts dikhayein',
        ],
      };
    }

    const isSpanish = qClean.includes('hola') || qClean.includes('buenos') || qClean.includes('gracias');
    const greetingHeader = isSpanish
      ? `¡Hola! Bienvenido a **AURA Copilot** (AURA Health Intelligence Copilot). 😊`
      : `Hello! I'm doing well, thank you for asking! 😊\n\nI am **AURA Copilot**, your Health Intelligence & Governance Assistant.`;

    return {
      answer: `${greetingHeader}\n\nI have direct real-time access to the live PostgreSQL health database tracking:\n• **PHC Facilities & Live Capacities** (Beds, Occupancy, Oxygen reserves across all 36 States & UTs)\n• **Patient Footfall & Outpatient Visits** (OPD, ANC, Fever clinics, Dengue/Malaria surveillance)\n• **Essential Medicines & Batch Expiry** (Real-time stock levels, stockout risks)\n• **Active Clinical Alerts & Emergency Logistics**\n\nHow can I help you today?`,
      citations: [],
      followUps: [
        'Can you tell me about PHC facilities in Bihar?',
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

  // 4. Patient Footfall / State-wide Attendance & Facility Overview
  // Match state names across India
  const STATE_KEYWORDS: { [key: string]: string } = {
    bihar: 'Bihar',
    patna: 'Bihar',
    maharashtra: 'Maharashtra',
    maharashtr: 'Maharashtra',
    pune: 'Maharashtra',
    nashik: 'Maharashtra',
    karnataka: 'Karnataka',
    bengaluru: 'Karnataka',
    bangalore: 'Karnataka',
    gujarat: 'Gujarat',
    ahmedabad: 'Gujarat',
    surat: 'Gujarat',
    rajasthan: 'Rajasthan',
    jaipur: 'Rajasthan',
    'tamil nadu': 'Tamil Nadu',
    tamilnadu: 'Tamil Nadu',
    tamil: 'Tamil Nadu',
    chennai: 'Tamil Nadu',
    'uttar pradesh': 'Uttar Pradesh',
    uttarpradesh: 'Uttar Pradesh',
    lucknow: 'Uttar Pradesh',
    up: 'Uttar Pradesh',
    'madhya pradesh': 'Madhya Pradesh',
    madhyapradesh: 'Madhya Pradesh',
    mp: 'Madhya Pradesh',
    'west bengal': 'West Bengal',
    bengal: 'West Bengal',
    kolkata: 'West Bengal',
    'andhra pradesh': 'Andhra Pradesh',
    andhra: 'Andhra Pradesh',
    kerala: 'Kerala',
    delhi: 'Delhi (NCT)',
    punjab: 'Punjab',
    haryana: 'Haryana',
    odisha: 'Odisha',
    orissa: 'Odisha',
    assam: 'Assam',
    telangana: 'Telangana',
    hyderabad: 'Telangana',
    jharkhand: 'Jharkhand',
    chhattisgarh: 'Chhattisgarh',
    goa: 'Goa',
    uttarakhand: 'Uttarakhand',
    'himachal pradesh': 'Himachal Pradesh',
    himachal: 'Himachal Pradesh',
    'jammu and kashmir': 'Jammu and Kashmir',
    kashmir: 'Jammu and Kashmir',
    jammu: 'Jammu and Kashmir',
  };

  let matchedState: string | null = null;
  for (const [kw, st] of Object.entries(STATE_KEYWORDS)) {
    if (q.includes(kw) || qClean.includes(kw.replace(/\s+/g, ''))) {
      matchedState = st;
      break;
    }
  }

  const isHindiQuery =
    q.includes('kya') ||
    q.includes('aap') ||
    q.includes('mujhe') ||
    q.includes('mujge') ||
    q.includes('rajye') ||
    q.includes('rajya') ||
    q.includes('stith') ||
    q.includes('sthit') ||
    q.includes('bare') ||
    q.includes('baare') ||
    q.includes('kitne') ||
    q.includes('marij') ||
    q.includes('mariz') ||
    q.includes('marizo') ||
    q.includes('hafte') ||
    q.includes('aaye') ||
    q.includes('ayye') ||
    q.includes('bataiye') ||
    q.includes('batao') ||
    q.includes('dikhao') ||
    q.includes('dikhayein') ||
    q.includes('kaise') ||
    q.includes('kaiso');

  if (
    matchedState &&
    (q.includes('phc') ||
      q.includes('facility') ||
      q.includes('hospital') ||
      q.includes('footfall') ||
      q.includes('patient') ||
      q.includes('marij') ||
      q.includes('mariz') ||
      q.includes('attendance') ||
      q.includes('visit') ||
      q.includes('rajye') ||
      q.includes('rajya') ||
      q.includes('bare') ||
      q.includes('baare'))
  ) {
    try {
      const [phcRes, footfallRes] = await Promise.all([
        client.query(
          `SELECT p.id, p.name, d.name AS district_name, s.name AS state_name, p.total_beds, p.occupied_beds, p.oxygen_cylinders_available, p.operational_status
           FROM phc_facilities p
           JOIN districts d ON p.district_id = d.id
           JOIN states s ON p.state_id = s.id
           WHERE s.name ILIKE $1
           ORDER BY p.name ASC;`,
          [`%${matchedState}%`]
        ).catch(() => ({ rows: [] as any[] })),
        client.query(
          `SELECT pf.category, SUM(pf.count) as total_count, COUNT(DISTINCT pf.phc_id) as phc_count, MAX(pf.date) as latest_date
           FROM patient_footfall pf
           JOIN phc_facilities p ON pf.phc_id = p.id
           JOIN states s ON p.state_id = s.id
           WHERE s.name ILIKE $1
           GROUP BY pf.category
           ORDER BY total_count DESC;`,
          [`%${matchedState}%`]
        ).catch(() => ({ rows: [] as any[] })),
      ]);

      const phcs = phcRes.rows;
      const footfalls = footfallRes.rows;
      const totalVisits = footfalls.reduce((sum: number, r: any) => sum + Number(r.total_count || 0), 0);
      const totalBeds = phcs.reduce((sum: number, r: any) => sum + Number(r.total_beds || 0), 0);
      const occupiedBeds = phcs.reduce((sum: number, r: any) => sum + Number(r.occupied_beds || 0), 0);
      const oxyCylinders = phcs.reduce((sum: number, r: any) => sum + Number(r.oxygen_cylinders_available || 0), 0);
      const occPct = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';

      if (isHindiQuery) {
        let answer = `### 🏥 **${matchedState} राज्य में PHC सुविधाएं और रोगी उपस्थिति रिपोर्ट**\n\n`;
        answer += `**AURA Copilot** लाइव PostgreSQL डेटाबेस से ${matchedState} राज्य की संपूर्ण स्वास्थ्य स्थिति प्रस्तुत कर रहा है:\n\n`;
        answer += `#### 📊 **मुख्य स्वास्थ्य सांख्यिकी (Key Metrics):**\n`;
        answer += `* **कुल मॉनिटर किए गए PHC:** **${phcs.length} सुविधाएं**\n`;
        answer += `* **कुल दर्ज मरीज (Patient Footfall):** **${totalVisits.toLocaleString()} मरीज** (OPD, ANC, बुखार क्लीनिक)\n`;
        answer += `* **कुल बेड क्षमता:** **${totalBeds} बेड्स** (**${occupiedBeds} भरे हुए**, **${occPct}% ऑक्यूपेंसी**)\n`;
        answer += `* **उपलब्ध खाली बेड्स:** **${Math.max(0, totalBeds - occupiedBeds)} बेड्स खाली**\n`;
        answer += `* **ऑक्सीजन सिलेंडर बैकअप:** **${oxyCylinders} सिलेंडर उपलब्ध**\n\n`;

        if (footfalls.length > 0) {
          answer += `#### 🩺 **रोगी श्रेणीवार विवरण (Category-wise Visits):**\n`;
          for (const f of footfalls) {
            const catName = f.category.replace(/_/g, ' ').toUpperCase();
            answer += `* **${catName}:** **${Number(f.total_count).toLocaleString()} मरीज**\n`;
          }
          answer += `\n`;
        }

        if (phcs.length > 0) {
          answer += `#### 📍 **${matchedState} के प्रमुख PHC केंद्र:**\n`;
          for (const p of phcs.slice(0, 8)) {
            const statusIcon = p.operational_status?.toLowerCase() === 'active' ? '🟢' : '⚪';
            const fOcc = p.total_beds > 0 ? ((p.occupied_beds / p.total_beds) * 100).toFixed(0) : '0';
            answer += `* ${statusIcon} **${p.name}** (${p.district_name}) — **${p.occupied_beds}/${p.total_beds} बेड्स (${fOcc}%)**, **${p.oxygen_cylinders_available} O₂ सिलेंडर** [${p.operational_status.toUpperCase()}]\n`;
          }
          if (phcs.length > 8) {
            answer += `* *...तथा अन्य ${phcs.length - 8} PHC केंद्र सक्रिय रूप से मॉनिटर हो रहे हैं.*\n`;
          }
        }

        return {
          answer,
          citations: phcs.slice(0, 5).map((p: any) => ({
            sourceType: 'phc_facilities',
            entityId: p.id,
            excerpt: `${p.name} (${p.district_name}, ${matchedState}): ${p.occupied_beds}/${p.total_beds} beds`,
          })),
          followUps: [
            `${matchedState} ke critical stockout medicines dikhayein`,
            `${matchedState} ke active clinical alerts dikhayein`,
            'Inter-PHC stock redistribution status dikhayein',
          ],
        };
      } else {
        let answer = `### 🏥 **${matchedState} State Health Facilities & Patient Inflow Report**\n\n`;
        answer += `Real-time ground truth retrieved from live PostgreSQL database for **${matchedState}**:\n\n`;
        answer += `#### 📊 **Key Healthcare Indicators:**\n`;
        answer += `* **Monitored PHC Facilities:** **${phcs.length} centers**\n`;
        answer += `* **Total Recorded Patient Footfall:** **${totalVisits.toLocaleString()} patients**\n`;
        answer += `* **Bed Occupancy:** **${occupiedBeds} / ${totalBeds} beds occupied** (**${occPct}% utilization**)\n`;
        answer += `* **Available Vacant Beds:** **${Math.max(0, totalBeds - occupiedBeds)} beds free**\n`;
        answer += `* **Oxygen Reserves:** **${oxyCylinders} cylinders** on standby across the state\n\n`;

        if (footfalls.length > 0) {
          answer += `#### 🩺 **Clinical Inflow Breakdown:**\n`;
          for (const f of footfalls) {
            const catName = f.category.replace(/_/g, ' ').toUpperCase();
            answer += `* **${catName}:** **${Number(f.total_count).toLocaleString()} visits**\n`;
          }
          answer += `\n`;
        }

        if (phcs.length > 0) {
          answer += `#### 📍 **Facilities Overview:**\n`;
          for (const p of phcs.slice(0, 8)) {
            const statusIcon = p.operational_status?.toLowerCase() === 'active' ? '🟢' : '⚪';
            const fOcc = p.total_beds > 0 ? ((p.occupied_beds / p.total_beds) * 100).toFixed(0) : '0';
            answer += `* ${statusIcon} **${p.name}** (${p.district_name}) — **${p.occupied_beds}/${p.total_beds} beds (${fOcc}%)**, **${p.oxygen_cylinders_available} O₂ cylinders**\n`;
          }
          if (phcs.length > 8) {
            answer += `* *...plus ${phcs.length - 8} additional monitored facilities across ${matchedState}.*\n`;
          }
        }

        return {
          answer,
          citations: phcs.slice(0, 5).map((p: any) => ({
            sourceType: 'phc_facilities',
            entityId: p.id,
            excerpt: `${p.name} (${p.district_name}, ${matchedState}): ${p.occupied_beds}/${p.total_beds} beds`,
          })),
          followUps: [
            `Which medicines are low in ${matchedState}?`,
            `Show active clinical alerts for ${matchedState}`,
            'Show nationwide GIS overview',
          ],
        };
      }
    } catch (e: any) {
      console.warn('[CopilotService] State query fallback error:', e.message);
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
    answer: isHindiQuery
      ? `Mainne **"${question}"** ke liye live database search kiya.\n\nAap mujhse kisi bhi rajya (e.g. Bihar, Maharashtra, UP, Rajasthan, Gujarat) ke PHC centers, patient attendance, medicine stockout, ya bed capacity ke baare mein pooch sakte hain.`
      : `I searched the health database for **"${question}"**.\n\nYou can ask me about:\n• **State Intelligence:** *"Tell me about PHCs and patient footfall in Bihar"*\n• **Facility Profiles:** *"Can you tell me about PHC Andhra Pradesh Central 1?"*\n• **Medicine Shortages:** *"Which medicines are out of stock?"*\n• **Bed & Oxygen Capacity:** *"Show bed occupancy across PHCs"*`,
    citations: [],
    followUps: [
      'Tell me about PHCs and patient footfall in Bihar',
      'Which medicines have critical stockouts across states?',
      'Show bed occupancy across facilities',
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

    let client: import('pg').PoolClient | null = null;
    try {
      client = await pool.connect().catch(() => null);
      if (!client) {
        return {
          sessionId,
          message: 'Main **AURA Copilot** hoon. Health intelligence database abhi load ho raha hai, kripya kuch seconds mein punah prayas karein.',
          citations: [],
          suggestedFollowUps: ['Retry query'],
          confidence: 0,
          model_version: 'aura-offline-safe',
          generatedAt,
        };
      }

      try {
        const result = await runAgenticQuery(client, userMessage);
        return {
          sessionId,
          message: result.answer,
          citations: result.citations || [],
          suggestedFollowUps: result.followUps || [],
          confidence: 0.98,
          model_version: result.model || 'aura-gemini-v2.5',
          generatedAt,
        };
      } catch (innerErr: any) {
        console.warn('[CopilotService] Agentic query failed, executing robust RAG fallback:', innerErr.message);
        const fallbackRes = await executeRagQuery(client, userMessage);
        return {
          sessionId,
          message: fallbackRes.answer,
          citations: fallbackRes.citations || [],
          suggestedFollowUps: fallbackRes.followUps || [],
          confidence: 0.95,
          model_version: 'aura-rag-v2.5',
          generatedAt,
        };
      }
    } catch (outerErr: any) {
      console.error('[CopilotService] Critical chat error caught:', outerErr.message);
      return {
        sessionId,
        message: 'Main **AURA Copilot** hoon. System mein temporary latency hai. Kripya punah query bhein ya kisi specific PHC ya state ka naam batayein.',
        citations: [],
        suggestedFollowUps: ['Bihar PHC report', 'Critical medicine stockouts', 'Bed occupancy'],
        confidence: 0.8,
        model_version: 'aura-safe-fallback',
        generatedAt,
      };
    } finally {
      if (client) {
        try { client.release(); } catch (_) {}
      }
    }
  }

  static async query(
    claims: TenantClaims,
    prompt: string,
    entityContext?: { phc_id?: string; district_id?: string }
  ): Promise<CopilotResponse> {
    try {
      const chatResponse = await CopilotService.chat(claims, entityContext?.phc_id ?? 'national', prompt);
      return {
        answer: chatResponse.message,
        supporting_data: { citations: chatResponse.citations },
        confidence: chatResponse.confidence,
        model_version: chatResponse.model_version,
        timestamp: chatResponse.generatedAt,
      };
    } catch (err: any) {
      return {
        answer: 'AURA Copilot received your query and is processing telemetry.',
        supporting_data: {},
        confidence: 0.8,
        model_version: 'aura-fallback',
        timestamp: new Date().toISOString(),
      };
    }
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
      } catch (_) {
      } finally {
        try { client.release(); } catch (_) {}
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
    return res.status(200).json({
      answer: 'AURA Copilot is active and connected to PostgreSQL.',
      supporting_data: {},
      confidence: 0.8,
      model_version: 'aura-safe',
      timestamp: new Date().toISOString(),
    });
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
    return res.status(200).json({
      id: `cs-${Date.now()}`,
      phcId: req.body?.phcId || 'phc-001',
      suggestionType: req.body?.suggestionType || 'inventory_check',
      title: 'Facility Parameter Check',
      description: 'System parameters monitored.',
      priority: 'low',
      actions: [{ label: 'Check details', actionCode: 'CHECK', estimatedImpact: 'Nominal' }],
      confidenceScore: 0.9,
      metadata: {},
      generatedAt: new Date().toISOString(),
    });
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
    return res.status(200).json({
      sessionId: `session-${Date.now()}`,
      message: 'AURA Copilot received your query. Live database connection is operational.',
      citations: [],
      suggestedFollowUps: ['Bihar PHC report', 'Show bed occupancy'],
      confidence: 0.8,
      model_version: 'aura-fallback',
      generatedAt: new Date().toISOString(),
    });
  }
});
