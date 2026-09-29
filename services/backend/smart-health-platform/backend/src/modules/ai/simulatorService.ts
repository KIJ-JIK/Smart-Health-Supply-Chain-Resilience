import { WebSocket, WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { adminPool, TenantClaims } from '../../db/pool';

export interface ScenarioInput {
  id?: string;
  name: string;
  supply_reduction_pct?: number;
  demand_surge_pct?: number;
  isolation_days?: number;
  mode?: 'deterministic' | 'monte_carlo';
  iterations?: number;
}

export interface SimulationResult {
  scenario: ScenarioInput;
  mode: 'deterministic' | 'monte_carlo';
  critical_facilities_count: number;
  projected_stockout_medicines: string[];
  days_to_depletion: number;
  recommended_transfers: { from: string; to: string; qty: number; medicine?: string }[];
  actions?: string[];
  monte_carlo_bands?: { p10: number; p50: number; p90: number };
  computed_at: string;
}

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

const SCENARIO_PROFILES: Record<string, {
  supply_reduction_pct: number;
  demand_surge_pct: number;
  isolation_days: number;
  stockout_medicines: string[];
  transfers: { from: string; to: string; qty: number; medicine: string }[];
  critical_facilities: number;
  actions: string[];
}> = {
  flood: {
    supply_reduction_pct: 70,
    demand_surge_pct: 20,
    isolation_days: 10,
    stockout_medicines: ['med-iv-fluids', 'med-oral-rehydration-salts', 'med-tetanus-toxoid', 'med-ciprofloxacin'],
    transfers: [
      { from: 'phc-raipur-03', to: 'phc-raipur-01', qty: 300, medicine: 'med-iv-fluids' },
      { from: 'district-hub-cg', to: 'phc-raipur-02', qty: 500, medicine: 'med-oral-rehydration-salts' },
    ],
    critical_facilities: 8,
    actions: [
      'Activate Emergency Procurement for IV Fluids and ORS from state buffer.',
      'Deploy mobile medical units to 3 flood-isolated PHCs.',
      'Coordinate heli-drop of medical supplies to cut-off districts.',
      'Issue Boil Water Advisory across 5 affected talukas.',
    ],
  },
  outbreak: {
    supply_reduction_pct: 0,
    demand_surge_pct: 180,
    isolation_days: 0,
    stockout_medicines: ['med-dengue-rapid-kit', 'med-paracetamol-500mg', 'med-platelet-transfusion-bag'],
    transfers: [
      { from: 'state-blood-bank-mh', to: 'phc-pune-07', qty: 120, medicine: 'med-platelet-transfusion-bag' },
      { from: 'district-hub-pune', to: 'phc-pune-03', qty: 2000, medicine: 'med-paracetamol-500mg' },
      { from: 'district-hub-pune', to: 'phc-pune-11', qty: 400, medicine: 'med-dengue-rapid-kit' },
    ],
    critical_facilities: 13,
    actions: [
      'Initiate fogging operations across 5 identified vector hotspots.',
      'Activate outbreak response team — issue Alert Level 2.',
      'Emergency procurement of 5,000 Dengue NS1 rapid test kits.',
      'Expand OPD hours at 12 PHCs to handle surge demand.',
      'Coordinate platelet donor drives with 3 city blood banks.',
    ],
  },
  stockout: {
    supply_reduction_pct: 100,
    demand_surge_pct: 0,
    isolation_days: 0,
    stockout_medicines: ['med-amoxicillin-500mg', 'med-metformin-500mg', 'med-amlodipine-5mg', 'med-salbutamol-inhaler', 'med-iron-folic-acid'],
    transfers: [
      { from: 'state-buffer-ka', to: 'phc-bengaluru-north-04', qty: 5000, medicine: 'med-amoxicillin-500mg' },
      { from: 'state-buffer-ka', to: 'phc-mysuru-02', qty: 3000, medicine: 'med-metformin-500mg' },
      { from: 'regional-hub-ka', to: 'phc-tumkur-01', qty: 1500, medicine: 'med-salbutamol-inhaler' },
      { from: 'regional-hub-ka', to: 'phc-chitradurga-03', qty: 8000, medicine: 'med-iron-folic-acid' },
    ],
    critical_facilities: 28,
    actions: [
      'Trigger Emergency State Buffer Release for all 5 stockout medicines.',
      'Suspend non-urgent FEFO redistribution — prioritize critical stockout refills.',
      'Engage 3 backup suppliers via GeM emergency procurement portal.',
      'Issue Patient Advisory: temporary prescription substitution protocol activated.',
      'Audit last 6 months procurement orders to identify systemic failure point.',
    ],
  },
  pandemic: {
    supply_reduction_pct: 10,
    demand_surge_pct: 900,
    isolation_days: 0,
    stockout_medicines: ['med-remdesivir', 'med-dexamethasone', 'med-high-flow-o2-concentrator', 'med-prone-positioning-kit', 'med-vasopressors'],
    transfers: [
      { from: 'aiims-delhi', to: 'phc-delhi-east-07', qty: 200, medicine: 'med-remdesivir' },
      { from: 'central-buffer-north', to: 'phc-ncr-gurgaon-03', qty: 50, medicine: 'med-high-flow-o2-concentrator' },
      { from: 'district-hub-delhi', to: 'phc-delhi-south-02', qty: 300, medicine: 'med-dexamethasone' },
    ],
    critical_facilities: 44,
    actions: [
      'Activate National Emergency Health Protocol — ICU surge capacity mode.',
      'Commandeer 15 private hospital ICU beds under Section 65 Epidemic Act.',
      'Issue Mutual Aid Request to 4 adjacent states for ventilator sharing.',
      'Fast-track 72-hour procurement of 200 high-flow O2 concentrators.',
      'Deploy NDRF medical teams to 8 overwhelmed district hospitals.',
      'Coordinate with Railways for Oxygen Express deployment within 24 hours.',
    ],
  },
};

export class SimulatorService {
  static runLegacySimulation(input: ScenarioInput): SimulationResult {
    const scenarioId = input.id || (
      (input.name || '').toLowerCase().includes('flood') ? 'flood' :
      (input.name || '').toLowerCase().includes('dengue') || (input.name || '').toLowerCase().includes('outbreak') ? 'outbreak' :
      (input.name || '').toLowerCase().includes('stockout') ? 'stockout' :
      (input.name || '').toLowerCase().includes('pandemic') || (input.name || '').toLowerCase().includes('icu') ? 'pandemic' :
      null
    );

    const profile = scenarioId ? SCENARIO_PROFILES[scenarioId] : null;
    const supplyFactor = 1 - (profile?.supply_reduction_pct ?? input.supply_reduction_pct ?? 35) / 100;
    const demandFactor = 1 + (profile?.demand_surge_pct ?? input.demand_surge_pct ?? 50) / 100;
    const mode = input.mode || 'deterministic';
    const baselineDays = 30;
    const projectedDays = Math.max(1, parseFloat(((baselineDays * supplyFactor) / demandFactor).toFixed(1)));
    const criticalCount = profile?.critical_facilities ??
      (projectedDays < 5 ? 20 : projectedDays < 10 ? 10 : projectedDays < 20 ? 4 : 1);

    const result: SimulationResult = {
      scenario: input,
      mode,
      critical_facilities_count: criticalCount,
      projected_stockout_medicines: profile?.stockout_medicines ?? ['med-paracetamol', 'med-amoxicillin'],
      days_to_depletion: projectedDays,
      recommended_transfers: profile?.transfers ?? [{ from: 'district-hub', to: 'phc-001', qty: 150, medicine: 'med-paracetamol' }],
      actions: profile?.actions ?? [],
      computed_at: new Date().toISOString(),
    };

    if (mode === 'monte_carlo') {
      const p50 = projectedDays;
      result.monte_carlo_bands = {
        p10: Math.max(1, parseFloat((p50 * 0.70).toFixed(1))),
        p50,
        p90: parseFloat((p50 * 1.40).toFixed(1)),
      };
    }
    return result;
  }

  static async runSimulation(
    claims: TenantClaims,
    phcId: string,
    input: { scenarioType: string; parameters: Record<string, any> },
  ): Promise<RichSimulationResult> {
    const computedAt = new Date().toISOString();
    const { scenarioType, parameters } = input;
    let projections: RichSimulationResult['projections'] = [];
    let impactAssessment: RichSimulationResult['impactAssessment'] = [];
    let resourceRequirements: RichSimulationResult['resourceRequirements'] = [];
    let mitigationScore = 0;
    let riskRating: RichSimulationResult['riskRating'] = 'LOW';

    if (scenarioType === 'disease_outbreak_surge') {
      const surgeFactor = parameters.surge_factor || 2.0;
      const popAtRisk = parameters.population_at_risk || 10000;
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
        day: i + 1, predictedCases: 120, bedsRequired: 14,
        stockRequired: Math.max(0, 500 - i * (500 / days)),
      }));
      impactAssessment = [
        { category: 'supply_availability', severity: days > 10 ? 'CRITICAL' : 'HIGH', description: `${meds.length} medicines unavailable for ${days} days` },
        { category: 'patient_care', severity: 'MODERATE', description: 'Treatment protocols may require adaptation' },
      ];
      resourceRequirements = meds.map((m: string) => ({ resource: m, currentStock: 0, required: 500, deficit: 500 }));
      mitigationScore = Math.max(0.2, 1 - days * 0.06);
      riskRating = days > 14 ? 'CRITICAL' : days > 7 ? 'HIGH' : 'MODERATE';
    } else {
      projections = Array.from({ length: 7 }, (_, i) => ({ day: i + 1, predictedCases: 120 + i * 5, bedsRequired: 15, stockRequired: 500 - i * 10 }));
      impactAssessment = [{ category: 'general', severity: 'LOW', description: 'Operational impact is within manageable bounds.' }];
      resourceRequirements = [];
      mitigationScore = 0.85;
      riskRating = 'LOW';
    }

    const insRes = await adminPool.query(
      `INSERT INTO simulation_scenarios (phc_id, scenario_type, parameters, status, computed_at) VALUES ($1, $2, $3, 'completed', $4) ON CONFLICT DO NOTHING RETURNING id`,
      [phcId, scenarioType, JSON.stringify(parameters), computedAt],
    ).catch(() => ({ rows: [{ id: `ss-${Date.now()}` }] }));

    return {
      id: insRes.rows[0]?.id || `ss-${Date.now()}`,
      phcId, scenarioType, parameters, projections, resourceRequirements, impactAssessment,
      mitigationScore: parseFloat(mitigationScore.toFixed(3)),
      riskRating, computedAt,
    };
  }

  static async getScenarios(claims: TenantClaims, phcId: string): Promise<any[]> {
    const res = await adminPool.query(
      `SELECT id, phc_id, scenario_type, parameters, status, computed_at FROM simulation_scenarios WHERE phc_id = $1 ORDER BY computed_at DESC LIMIT 20`,
      [phcId],
    ).catch(() => ({ rows: [] }));
    return res.rows.map((r: any) => ({
      id: r.id, phcId: r.phc_id, scenarioType: r.scenario_type,
      parameters: typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters,
      status: r.status, computedAt: r.computed_at,
    }));
  }

  static describeResult(result: SimulationResult): string {
    const lines = [
      `Simulation Run: ${result.scenario?.name || 'Custom Scenario'} (${result.mode} mode)`,
      `Projected days to depletion: ${result.days_to_depletion} days.`,
      `Critical facilities impacted: ${result.critical_facilities_count}.`,
      `Projected stockout medicines: ${result.projected_stockout_medicines?.join(', ') || 'None'}.`,
    ];
    if (result.recommended_transfers?.length) {
      lines.push('Recommended transfers:\n' + result.recommended_transfers.map((t) => `  * ${t.qty} units of ${t.medicine || 'supplies'} from ${t.from} to ${t.to}`).join('\n'));
    }
    if (result.actions?.length) {
      lines.push('Required actions:\n' + result.actions.map((a: string, i: number) => `  ${i + 1}. ${a}`).join('\n'));
    }
    if (result.monte_carlo_bands) {
      lines.push(`Monte Carlo bands -- P10: ${result.monte_carlo_bands.p10}d, P50: ${result.monte_carlo_bands.p50}d, P90: ${result.monte_carlo_bands.p90}d.`);
    }
    return lines.join('\n');
  }

  static attachWebSocketServer(server: HttpServer): WebSocketServer {
    const wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
      if (pathname === '/api/v1/governance/simulator/session') {
        wss.handleUpgrade(request, socket, head, (ws) => { wss.emit('connection', ws, request); });
      }
    });

    wss.on('connection', (ws: WebSocket) => {
      ws.send(JSON.stringify({ id: `conn-${Date.now()}`, type: 'CONNECTED', payload: { role: 'system', text: 'Crisis simulator session initialized. Ready for scenarios.', timestamp: new Date().toISOString() }, message: 'Crisis simulator session initialized' }));

      ws.on('message', (data: string) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.action === 'RUN_SIMULATION' || payload.type === 'start_scenario') {
            let scenarioInput: ScenarioInput;
            if (payload.scenario) {
              scenarioInput = { id: payload.scenario.id || payload.payload, name: payload.scenario.name || 'Custom Scenario', mode: 'deterministic' };
            } else if (payload.type === 'start_scenario') {
              const scId = typeof payload.payload === 'string' ? payload.payload : (payload.payload?.id || payload.payload?.scenario || '');
              const scName = typeof payload.payload === 'object' ? (payload.payload?.name || scId) : scId;
              scenarioInput = { id: scId, name: scName, mode: 'deterministic' };
            } else {
              scenarioInput = { name: 'Custom Scenario' };
            }
            const result = SimulatorService.runLegacySimulation(scenarioInput);
            ws.send(JSON.stringify({ id: payload.id || `sim-${Date.now()}`, type: 'SIMULATION_RESULT', payload: { role: 'model', text: SimulatorService.describeResult(result), timestamp: new Date().toISOString() }, result }));
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
