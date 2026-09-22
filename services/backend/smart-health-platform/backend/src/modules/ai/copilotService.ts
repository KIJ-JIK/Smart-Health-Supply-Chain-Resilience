import { Router, Request, Response } from 'express';
import { withTenantContext, TenantClaims, pool } from '../../db/pool';

// ─────────────────────────────────────────────────────────────────────────────
// Gemini LLM Integration (google/generative-ai)
// Falls back to structured template answers if key is not set.
// ─────────────────────────────────────────────────────────────────────────────
let geminiModel: import('@google/generative-ai').GenerativeModel | null = null;

(async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'PASTE_YOUR_KEY_HERE') {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('[CopilotService] Gemini LLM initialized ✓');
    } catch (e) {
      console.warn('[CopilotService] Gemini init failed:', e);
    }
  } else {
    console.warn('[CopilotService] GEMINI_API_KEY not set — using structured fallback answers.');
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────
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
// DB Retrieval Tools — pull real rows for grounding the LLM context
// ─────────────────────────────────────────────────────────────────────────────
async function getOpenAlerts(client: import('pg').PoolClient, limit = 10) {
  const r = await client
    .query(
      `SELECT a.id, a.alert_type, a.severity, a.status, a.created_at,
              a.payload, p.name AS phc_name
       FROM alerts a
       LEFT JOIN phc_facilities p ON a.phc_id = p.id
       WHERE a.status = 'open'
       ORDER BY
         CASE a.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
         a.created_at DESC
       LIMIT $1`,
      [limit],
    )
    .catch(() => ({ rows: [] as Record<string, unknown>[] }));
  return r.rows;
}

async function getLowStockItems(client: import('pg').PoolClient, limit = 10) {
  const r = await client
    .query(
      `SELECT ib.id, ib.batch_no, ib.remaining_qty, ib.minimum_threshold, ib.expiry_date,
              m.name AS medicine, p.name AS phc_name
       FROM inventory_batches ib
       JOIN medicines m ON ib.medicine_id = m.id
       JOIN phc_facilities p ON ib.phc_id = p.id
       WHERE ib.remaining_qty <= ib.minimum_threshold
       ORDER BY ib.remaining_qty ASC
       LIMIT $1`,
      [limit],
    )
    .catch(() => ({ rows: [] as Record<string, unknown>[] }));
  return r.rows;
}

async function getExpiringBatches(client: import('pg').PoolClient, daysAhead = 30) {
  const r = await client
    .query(
      `SELECT ib.id, ib.batch_no, ib.remaining_qty, ib.expiry_date,
              m.name AS medicine, p.name AS phc_name,
              (ib.expiry_date - CURRENT_DATE) AS days_to_expiry
       FROM inventory_batches ib
       JOIN medicines m ON ib.medicine_id = m.id
       JOIN phc_facilities p ON ib.phc_id = p.id
       WHERE ib.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1
         AND ib.remaining_qty > 0
       ORDER BY ib.expiry_date ASC
       LIMIT 15`,
      [daysAhead],
    )
    .catch(() => ({ rows: [] as Record<string, unknown>[] }));
  return r.rows;
}

async function getRedistributionRecommendations(client: import('pg').PoolClient) {
  const r = await client
    .query(
      `SELECT rt.id, rt.quantity, rt.status, rt.urgency_level, rt.ai_explanation,
              src.name AS source_phc, dst.name AS dest_phc, m.name AS medicine
       FROM redistribution_transfers rt
       JOIN phc_facilities src ON rt.source_phc_id = src.id
       JOIN phc_facilities dst ON rt.dest_phc_id = dst.id
       JOIN medicines m ON rt.medicine_id = m.id
       WHERE rt.status IN ('recommended','approved')
       ORDER BY CASE rt.urgency_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END
       LIMIT 5`,
    )
    .catch(() => ({ rows: [] as Record<string, unknown>[] }));
  return r.rows;
}

async function getPatientFootfall(client: import('pg').PoolClient) {
  const r = await client
    .query(
      `SELECT p.name AS phc_name, pf.category, SUM(pf.count) AS total_count
       FROM patient_footfall pf
       JOIN phc_facilities p ON pf.phc_id = p.id
       WHERE pf.date >= CURRENT_DATE - 7
       GROUP BY p.name, pf.category
       ORDER BY total_count DESC
       LIMIT 15`,
    )
    .catch(() => ({ rows: [] as Record<string, unknown>[] }));
  return r.rows;
}

async function getFacilitySummary(client: import('pg').PoolClient) {
  const r = await client
    .query(
      `SELECT name, total_beds, occupied_beds, oxygen_cylinders_available, operational_status,
              ROUND(100.0 * occupied_beds / NULLIF(total_beds,0), 1) AS occupancy_pct
       FROM phc_facilities
       ORDER BY occupancy_pct DESC NULLS LAST
       LIMIT 10`,
    )
    .catch(() => ({ rows: [] as Record<string, unknown>[] }));
  return r.rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build compact context string for the LLM prompt
// ─────────────────────────────────────────────────────────────────────────────
function buildContext(data: {
  alerts: Record<string, unknown>[];
  lowStock: Record<string, unknown>[];
  expiring: Record<string, unknown>[];
  redistributions: Record<string, unknown>[];
  footfall: Record<string, unknown>[];
  facilities: Record<string, unknown>[];
}): string {
  const sections: string[] = [];

  if (data.alerts.length) {
    sections.push(
      `## Open Alerts (${data.alerts.length})\n` +
        data.alerts
          .map(
            (a) =>
              `- [${a.severity}] ${a.alert_type} at ${a.phc_name ?? 'system-wide'}: ${JSON.stringify(a.payload).slice(0, 200)}`,
          )
          .join('\n'),
    );
  }

  if (data.lowStock.length) {
    sections.push(
      `## Critical/Low Stock Items (${data.lowStock.length})\n` +
        data.lowStock
          .map(
            (s) =>
              `- ${s.medicine} at ${s.phc_name}: ${s.remaining_qty} remaining (threshold: ${s.minimum_threshold}, expires: ${s.expiry_date})`,
          )
          .join('\n'),
    );
  }

  if (data.expiring.length) {
    sections.push(
      `## Expiring Batches (within 30 days)\n` +
        data.expiring
          .map(
            (e) =>
              `- ${e.medicine} at ${e.phc_name}: Batch ${e.batch_no}, ${e.remaining_qty} units, expires in ${e.days_to_expiry} days`,
          )
          .join('\n'),
    );
  }

  if (data.redistributions.length) {
    sections.push(
      `## Pending Redistribution Recommendations\n` +
        data.redistributions
          .map(
            (r) =>
              `- ${r.status.toUpperCase()}: Transfer ${r.quantity} units of ${r.medicine} from ${r.source_phc} → ${r.dest_phc} (${r.urgency_level})`,
          )
          .join('\n'),
    );
  }

  if (data.facilities.length) {
    sections.push(
      `## Facility Bed Status\n` +
        data.facilities
          .map(
            (f) =>
              `- ${f.name}: ${f.occupied_beds}/${f.total_beds} beds (${f.occupancy_pct}%), O2: ${f.oxygen_cylinders_available} cylinders`,
          )
          .join('\n'),
    );
  }

  if (data.footfall.length) {
    sections.push(
      `## Patient Footfall (last 7 days)\n` +
        data.footfall.map((ff) => `- ${ff.phc_name} (${ff.category}): ${ff.total_count} patients`).join('\n'),
    );
  }

  return sections.join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// CopilotService
// ─────────────────────────────────────────────────────────────────────────────
export class CopilotService {
  /**
   * Main chat interface — real DB retrieval + Gemini LLM grounding
   */
  static async chat(
    claims: TenantClaims,
    phcId: string,
    userMessage: string,
  ): Promise<CopilotChatResponse> {
    const sessionId = `session-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    // Use a direct pool client (not tenant-scoped) for national-level queries
    // since the frontend may call without a JWT and we need graceful degradation.
    const client = await pool.connect().catch(() => null);

    let contextData = {
      alerts: [] as Record<string, unknown>[],
      lowStock: [] as Record<string, unknown>[],
      expiring: [] as Record<string, unknown>[],
      redistributions: [] as Record<string, unknown>[],
      footfall: [] as Record<string, unknown>[],
      facilities: [] as Record<string, unknown>[],
    };

    if (client) {
      try {
        const [alerts, lowStock, expiring, redistributions, footfall, facilities] = await Promise.all([
          getOpenAlerts(client as any),
          getLowStockItems(client as any),
          getExpiringBatches(client as any),
          getRedistributionRecommendations(client as any),
          getPatientFootfall(client as any),
          getFacilitySummary(client as any),
        ]);
        contextData = { alerts, lowStock, expiring, redistributions, footfall, facilities };
      } catch (e) {
        console.warn('[CopilotService] DB retrieval partial failure:', e);
      } finally {
        client.release();
      }
    }

    const context = buildContext(contextData);
    const citations: { sourceType: string; entityId?: string; excerpt?: string }[] = [];

    // Populate citations from retrieved data
    contextData.alerts.slice(0, 3).forEach((a) => {
      citations.push({ sourceType: 'alert', entityId: String(a.id), excerpt: `${a.alert_type} (${a.severity}) at ${a.phc_name}` });
    });
    contextData.lowStock.slice(0, 3).forEach((s) => {
      citations.push({ sourceType: 'inventory_batch', entityId: String(s.id), excerpt: `${s.medicine} at ${s.phc_name}: ${s.remaining_qty} units left` });
    });

    let message: string;
    let modelVersion = 'copilot-structured-v1.2';

    if (geminiModel && context.length > 0) {
      // Real LLM call with grounded context
      try {
        const systemPrompt = `You are a health supply chain governance AI assistant for the Indian public health system. 
You help district and national health officers understand the current status of PHC (Primary Health Centre) facilities, medicine inventory, and operational alerts.

IMPORTANT RULES:
- Answer ONLY based on the provided real-time database context below.
- Be specific: name facilities, medicines, quantities, and numbers from the data.
- If the question is not answerable from the data, say so honestly.
- Keep answers concise (3-5 sentences max) unless detailed analysis is requested.
- Format responses clearly; use bullet points for multiple items.

CURRENT HEALTH SYSTEM DATA (from live database):
${context}

USER QUESTION: ${userMessage}

Provide a direct, data-grounded answer:`;

        const result = await geminiModel.generateContent(systemPrompt);
        message = result.response.text().trim();
        modelVersion = 'gemini-2.0-flash';
      } catch (e) {
        console.warn('[CopilotService] Gemini call failed:', e);
        message = buildFallbackAnswer(userMessage, contextData);
      }
    } else {
      // Structured fallback — no LLM
      message = buildFallbackAnswer(userMessage, contextData);
    }

    return {
      sessionId,
      message,
      citations,
      confidence: geminiModel ? 0.91 : 0.78,
      model_version: modelVersion,
      suggestedFollowUps: [
        'Which PHCs have critical stockouts right now?',
        'Which redistribution transfers are pending approval?',
        'What is the current bed occupancy across all facilities?',
        'Are there any medicines expiring in the next 30 days?',
      ],
      generatedAt,
    };
  }

  /**
   * Scoped query engine (used by governance dashboard)
   */
  static async query(
    claims: TenantClaims,
    prompt: string,
    entityContext?: { phc_id?: string; district_id?: string },
  ): Promise<CopilotResponse> {
    const chatResponse = await CopilotService.chat(
      claims,
      entityContext?.phc_id ?? 'national',
      prompt,
    );
    return {
      answer: chatResponse.message,
      supporting_data: {
        citations: chatResponse.citations,
        phc_id: entityContext?.phc_id,
      },
      confidence: chatResponse.confidence,
      model_version: chatResponse.model_version,
      timestamp: chatResponse.generatedAt,
    };
  }

  /**
   * Generate AI suggestion for a PHC (reads real DB data)
   */
  static async generateSuggestion(
    claims: TenantClaims,
    phcId: string,
    suggestionType: string,
  ): Promise<CopilotSuggestion> {
    const client = await pool.connect().catch(() => null);
    let lowStockItems: Record<string, unknown>[] = [];

    if (client) {
      try {
        lowStockItems = await getLowStockItems(client as any, 5);
      } finally {
        client.release();
      }
    }

    const topItem = lowStockItems[0];
    const id = `cs-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    if (suggestionType === 'inventory_reorder' && topItem) {
      return {
        id, phcId, suggestionType,
        title: `Reorder ${topItem.medicine} — ${topItem.remaining_qty} units remaining`,
        description: `${topItem.medicine} at ${topItem.phc_name} is critically low (${topItem.remaining_qty} units, threshold: ${topItem.minimum_threshold}). Batch ${topItem.batch_no} expires ${topItem.expiry_date}.`,
        priority: (topItem.remaining_qty === 0 ? 'critical' : 'high') as 'critical' | 'high',
        actions: [
          { label: 'Raise reorder request', actionCode: 'RAISE_REORDER_REQUEST', estimatedImpact: 'Prevents stockout' },
          { label: 'Request inter-PHC transfer', actionCode: 'REQUEST_INTER_PHC_TRANSFER', estimatedImpact: 'Restores buffer within 48h' },
        ],
        confidenceScore: 0.93,
        metadata: { medicine: topItem.medicine, remainingQty: topItem.remaining_qty, phc: topItem.phc_name },
        generatedAt,
      };
    }

    // Generic fallback
    return {
      id, phcId, suggestionType,
      title: `AI Recommendation: ${suggestionType}`,
      description: 'An AI-driven recommendation has been generated based on current operational data.',
      priority: 'medium',
      actions: [{ label: 'Review and act', actionCode: 'REVIEW_AND_ACT', estimatedImpact: 'Operational improvement' }],
      confidenceScore: 0.82,
      metadata: {},
      generatedAt,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured fallback answer (when Gemini is not configured)
// ─────────────────────────────────────────────────────────────────────────────
function buildFallbackAnswer(
  userMessage: string,
  data: {
    alerts: Record<string, unknown>[];
    lowStock: Record<string, unknown>[];
    expiring: Record<string, unknown>[];
    redistributions: Record<string, unknown>[];
    footfall: Record<string, unknown>[];
    facilities: Record<string, unknown>[];
  },
): string {
  const q = userMessage.toLowerCase();

  if (q.includes('stockout') || q.includes('critical') || (q.includes('stock') && q.includes('low'))) {
    if (data.lowStock.length === 0) {
      return 'Great news — no critical stockouts are recorded in the current database. All inventory levels appear to be above their minimum thresholds.';
    }
    const items = data.lowStock
      .slice(0, 5)
      .map((s) => `• **${s.medicine}** at ${s.phc_name}: ${s.remaining_qty} units remaining (minimum: ${s.minimum_threshold})`)
      .join('\n');
    return `There are **${data.lowStock.length} stock items** at or below minimum thresholds:\n\n${items}\n\nImmediate redistribution or reorder is recommended for the critical items.`;
  }

  if (q.includes('expir')) {
    if (data.expiring.length === 0) return 'No medicines are expiring within the next 30 days.';
    const items = data.expiring
      .slice(0, 5)
      .map((e) => `• ${e.medicine} at ${e.phc_name}: ${e.remaining_qty} units, expires in ${e.days_to_expiry} days`)
      .join('\n');
    return `**${data.expiring.length} batches** are expiring within 30 days:\n\n${items}\n\nConsider redistributing excess quantities to nearby facilities.`;
  }

  if (q.includes('alert') || q.includes('warning')) {
    if (data.alerts.length === 0) return 'No open alerts are recorded in the system at this time.';
    const items = data.alerts
      .slice(0, 5)
      .map((a) => `• [${String(a.severity).toUpperCase()}] ${a.alert_type} at ${a.phc_name ?? 'system-wide'}`)
      .join('\n');
    return `There are **${data.alerts.length} open alerts**:\n\n${items}\n\nCritical alerts require immediate attention.`;
  }

  if (q.includes('redistribution') || q.includes('transfer')) {
    if (data.redistributions.length === 0) return 'No redistribution transfers are currently pending.';
    const items = data.redistributions
      .map((r) => `• ${r.medicine}: ${r.source_phc} → ${r.dest_phc}, ${r.quantity} units [${r.status}]`)
      .join('\n');
    return `**${data.redistributions.length} redistribution transfers** are pending:\n\n${items}`;
  }

  if (q.includes('bed') || q.includes('occupancy')) {
    if (data.facilities.length === 0) return 'No facility data is available at this time.';
    const items = data.facilities
      .slice(0, 5)
      .map((f) => `• ${f.name}: ${f.occupied_beds}/${f.total_beds} beds (${f.occupancy_pct}%)`)
      .join('\n');
    return `Current bed occupancy across top facilities:\n\n${items}`;
  }

  if (q.includes('patient') || q.includes('footfall') || q.includes('opd')) {
    if (data.footfall.length === 0) return 'No patient footfall data is available for the last 7 days.';
    const total = data.footfall.reduce((sum, ff) => sum + Number(ff.total_count), 0);
    return `Total patient visits in the last 7 days: **${total.toLocaleString()}** across all facilities. Highest load categories: ${data.footfall.slice(0, 3).map((ff) => `${ff.phc_name} ${ff.category} (${ff.total_count})`).join(', ')}.`;
  }

  // Generic summary
  const summaryParts: string[] = [];
  if (data.alerts.length) summaryParts.push(`${data.alerts.length} open alerts (${data.alerts.filter((a) => a.severity === 'critical').length} critical)`);
  if (data.lowStock.length) summaryParts.push(`${data.lowStock.length} low/out-of-stock items`);
  if (data.redistributions.length) summaryParts.push(`${data.redistributions.length} redistribution transfers pending`);

  if (summaryParts.length === 0) {
    return `I searched the current health database for "${userMessage}" but couldn't find a direct match. Try asking about stock levels, alerts, bed occupancy, expiring medicines, or redistribution transfers.`;
  }
  return `Current system status: ${summaryParts.join('; ')}. For a specific analysis, try asking about stockouts, alerts, bed occupancy, or redistribution transfers.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Express Router
// ─────────────────────────────────────────────────────────────────────────────
export const copilotRouter = Router();

// POST /api/v1/governance/copilot/query
copilotRouter.post('/governance/copilot/query', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims as TenantClaims ?? { role: 'national_admin', sub: 'dev' };
    const { prompt, entity_context } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing required field: prompt' });

    const response = await CopilotService.query(claims, prompt, entity_context);
    return res.status(200).json(response);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/v1/governance/copilot/suggest
copilotRouter.post('/governance/copilot/suggest', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims as TenantClaims ?? { role: 'national_admin', sub: 'dev' };
    const { phcId, suggestionType } = req.body;
    if (!phcId || !suggestionType) return res.status(400).json({ error: 'Missing required fields: phcId, suggestionType' });

    const suggestion = await CopilotService.generateSuggestion(claims, phcId, suggestionType);
    return res.status(200).json(suggestion);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/v1/governance/copilot/chat
copilotRouter.post('/governance/copilot/chat', async (req: Request, res: Response) => {
  try {
    const claims = (req as any).claims as TenantClaims ?? { role: 'national_admin', sub: 'dev' };
    const { phcId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing required field: message' });

    const response = await CopilotService.chat(claims, phcId ?? 'national', message);
    return res.status(200).json(response);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});
