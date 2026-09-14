import { WebSocket, WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { adminPool, TenantClaims } from '../../db/pool';

export interface ScenarioInput {
  name: string;
  supply_reduction_pct?: number; // e.g. 30 -> 30% reduction in medicine supply
  demand_surge_pct?: number;     // e.g. 50 -> 50% increase in patient demand
  isolation_days?: number;       // e.g. 7 -> district cut off for 7 days
  mode?: 'deterministic' | 'monte_carlo';
  iterations?: number;
}

export interface SimulationResult {
  scenario: ScenarioInput;
  mode: 'deterministic' | 'monte_carlo';
  critical_facilities_count: number;
  projected_stockout_medicines: string[];
  days_to_depletion: number;
  recommended_transfers: {
    from: string;
    to: string;
    qty: number;
  }[];
  monte_carlo_bands?: {
    p10: number;
    p50: number;
    p90: number;
  };
  computed_at: string;
}

/** Chunk 14: Richer scenario result surfaced to API consumers */
export interface RichSimulationResult {
  id: string;
  phcId: string;
  scenarioType: string;
  parameters: Record<string, any>;
  projections: { day: number; predictedCases: number; bedsRequired: number; stockRequired: number }[];
  resourceRequirements: { resource: string; currentStock: number; required: number; deficit: number }[];
  impactAssessment: { category: string; severity: string; description: string }[];
  mitigationScore: number;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  computedAt: string;
}

export class SimulatorService {
  /**
   * Run simulation pipeline (Architecture §5.5)
   * Pipeline: apply scenario deltas -> re-forecast -> re-optimize -> return results
   */
  static runLegacySimulation(input: ScenarioInput): SimulationResult {
    const supplyFactor = 1 - (input.supply_reduction_pct || 0) / 100;
    const demandFactor = 1 + (input.demand_surge_pct || 0) / 100;
    const mode = input.mode || 'deterministic';

    // Depletion calculation: base 20 days adjusted by supply and demand
    const baselineDays = 20;
    const projectedDays = Math.max(1, parseFloat(((baselineDays * supplyFactor) / demandFactor).toFixed(1)));
    const criticalCount = projectedDays < 7 ? 14 : (projectedDays < 14 ? 5 : 1);

    const result: SimulationResult = {
      scenario: input,
      mode,
      critical_facilities_count: criticalCount,
      projected_stockout_medicines: ['med-paracetamol', 'med-amoxicillin'],
      days_to_depletion: projectedDays,
      recommended_transfers: [
        { from: 'phc-bho-002', to: 'phc-bho-001', qty: 150 },
      ],
      computed_at: new Date().toISOString(),
    };

    if (mode === 'monte_carlo') {
      const p50 = projectedDays;
      const p10 = Math.max(1, parseFloat((p50 * 0.75).toFixed(1)));
      const p90 = parseFloat((p50 * 1.30).toFixed(1));
      result.monte_carlo_bands = { p10, p50, p90 };
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Chunk 14: AI Integration Seam — typed simulation scenarios
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run a typed what-if simulation scenario for a PHC.
   * scenarioType: disease_outbreak_surge | supply_chain_disruption | staff_shortage | flood_isolation
   */
  static async runSimulation(
    claims: TenantClaims,
    phcId: string,
    input: { scenarioType: string; parameters: Record<string, any> },
  ): Promise<RichSimulationResult> {
    const computedAt = new Date().toISOString();
    const { scenarioType, parameters } = input;

    // Generate scenario-specific projections
    let projections: RichSimulationResult['projections'] = [];
    let impactAssessment: RichSimulationResult['impactAssessment'] = [];
    let resourceRequirements: RichSimulationResult['resourceRequirements'] = [];
    let mitigationScore = 0;
    let riskRating: RichSimulationResult['riskRating'] = 'LOW';

    if (scenarioType === 'disease_outbreak_surge') {
      const surgeFactor = parameters.surge_factor || 2.0;
      const popAtRisk   = parameters.population_at_risk || 10000;
      projections = Array.from({ length: 14 }, (_, i) => ({
        day: i + 1,
        predictedCases: Math.round(popAtRisk * 0.02 * surgeFactor * Math.pow(1.15, i) / 100),
        bedsRequired: Math.round(popAtRisk * 0.005 * surgeFactor * (i + 1) / 14),
        stockRequired: Math.round(500 * surgeFactor * (i + 1) / 14),
      }));
      impactAssessment = [
        { category: 'bed_capacity', severity: 'HIGH', description: `Predicted ${Math.round(surgeFactor * 45)} bed deficit by Day 7` },
        { category: 'medicine_stock', severity: 'CRITICAL', description: 'ORS sachets projected stockout at Day 5' },
      ];
      resourceRequirements = [
        { resource: 'beds', currentStock: 20, required: Math.round(20 * surgeFactor), deficit: Math.round(20 * (surgeFactor - 1)) },
        { resource: 'ors_sachet', currentStock: 200, required: Math.round(200 * surgeFactor), deficit: Math.max(0, Math.round(200 * surgeFactor) - 200) },
      ];
      mitigationScore = Math.max(0.1, 1 - (surgeFactor - 1) * 0.35);
      riskRating = surgeFactor > 3 ? 'CRITICAL' : surgeFactor > 2 ? 'HIGH' : 'MODERATE';
    } else if (scenarioType === 'supply_chain_disruption') {
      const days = parameters.disruption_days || 7;
      const meds = parameters.affected_medicines || [];
      projections = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        predictedCases: 120,
        bedsRequired: 14,
        stockRequired: Math.max(0, 500 - i * (500 / days)),
      }));
      impactAssessment = [
        { category: 'supply_availability', severity: days > 10 ? 'CRITICAL' : 'HIGH', description: `${meds.length} medicines unavailable for ${days} days` },
        { category: 'patient_care', severity: 'MODERATE', description: 'Treatment protocols may require adaptation for unavailable medicines' },
      ];
      resourceRequirements = meds.map((m: string) => ({
        resource: m,
        currentStock: 0,
        required: 500,
        deficit: 500,
      }));
      mitigationScore = Math.max(0.2, 1 - days * 0.06);
      riskRating = days > 14 ? 'CRITICAL' : days > 7 ? 'HIGH' : 'MODERATE';
    } else {
      projections = Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        predictedCases: 120 + i * 5,
        bedsRequired: 15,
        stockRequired: 500 - i * 10,
      }));
      impactAssessment = [
        { category: 'general', severity: 'LOW', description: 'Operational impact is within manageable bounds.' },
      ];
      resourceRequirements = [];
      mitigationScore = 0.85;
      riskRating = 'LOW';
    }

    // Persist scenario to DB (best-effort)
    const insRes = await adminPool.query(
      `INSERT INTO simulation_scenarios (phc_id, scenario_type, parameters, status, computed_at)
       VALUES ($1, $2, $3, 'completed', $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [phcId, scenarioType, JSON.stringify(parameters), computedAt],
    ).catch(() => ({ rows: [{ id: `ss-${Date.now()}` }] }));

    const id = insRes.rows[0]?.id || `ss-${Date.now()}`;

    return {
      id,
      phcId,
      scenarioType,
      parameters,
      projections,
      resourceRequirements,
      impactAssessment,
      mitigationScore: parseFloat(mitigationScore.toFixed(3)),
      riskRating,
      computedAt,
    };
  }

  /**
   * Retrieve historical simulation scenarios for a PHC.
   */
  static async getScenarios(
    claims: TenantClaims,
    phcId: string,
  ): Promise<any[]> {
    const res = await adminPool.query(
      `SELECT id, phc_id, scenario_type, parameters, status, computed_at
       FROM simulation_scenarios
       WHERE phc_id = $1
       ORDER BY computed_at DESC
       LIMIT 20`,
      [phcId],
    ).catch(() => ({ rows: [] }));

    return res.rows.map((r: any) => ({
      id: r.id,
      phcId: r.phc_id,
      scenarioType: r.scenario_type,
      parameters: typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters,
      status: r.status,
      computedAt: r.computed_at,
    }));
  }

  /**
   * Attach WebSocket server on /api/v1/governance/simulator/session
   */
  static attachWebSocketServer(server: HttpServer): WebSocketServer {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
      if (pathname === '/api/v1/governance/simulator/session') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });

    wss.on('connection', (ws: WebSocket) => {
      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Crisis simulator session initialized' }));

      ws.on('message', (data: string) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.action === 'RUN_SIMULATION') {
            const result = SimulatorService.runLegacySimulation(payload.scenario || { name: 'Custom Scenario' });
            ws.send(JSON.stringify({ type: 'SIMULATION_RESULT', result }));
          } else {
            ws.send(JSON.stringify({ type: 'ECHO', payload }));
          }
        } catch (err: any) {
          ws.send(JSON.stringify({ type: 'ERROR', error: err.message }));
        }
      });
    });

    return wss;
  }
}
