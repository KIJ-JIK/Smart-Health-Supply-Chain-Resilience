import { pool, TenantClaims } from '../../db/pool';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpToolCallResult {
  toolName: string;
  status: 'success' | 'error';
  executionTimeMs: number;
  result: any;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard Model Context Protocol (MCP) Tools Registry for Healthcare Intelligence
// ─────────────────────────────────────────────────────────────────────────────
export const MCP_HEALTHCARE_TOOLS: McpToolDefinition[] = [
  {
    name: 'search_health_db',
    description: 'Execute read-only SQL queries against the PostgreSQL smarthealth database across 36 States & UTs.',
    parameters: {
      type: 'object',
      properties: {
        sqlQuery: {
          type: 'string',
          description: 'Safe read-only SELECT query against states, districts, phc_facilities, staff_registry, medicines, or alerts.',
        },
      },
      required: ['sqlQuery'],
    },
  },
  {
    name: 'get_phc_facility_telemetry',
    description: 'Retrieve real-time operational capacity, total beds, occupied beds, utilization percentage, and oxygen cylinders for a PHC or district.',
    parameters: {
      type: 'object',
      properties: {
        facilityName: { type: 'string', description: 'Name of the PHC facility (e.g. "Hadapsar PHC", "Patna Urban Primary Health Centre").' },
        districtName: { type: 'string', description: 'Name of the district (e.g. "Pune", "Patna", "Lucknow").' },
        stateName: { type: 'string', description: 'Name of the state (e.g. "Maharashtra", "Bihar", "Uttar Pradesh").' },
      },
      required: [],
    },
  },
  {
    name: 'get_medicine_inventory_levels',
    description: 'Check batch stock levels, minimum safety thresholds, and expiry dates for essential medicines across monitored health facilities.',
    parameters: {
      type: 'object',
      properties: {
        medicineName: { type: 'string', description: 'Name of the medicine (e.g. "Amoxicillin 500mg", "ORS Sachet", "Paracetamol 500mg").' },
        onlyStockouts: { type: 'string', description: 'Set to "true" to only return facilities with remaining_qty <= minimum_threshold.' },
      },
      required: [],
    },
  },
  {
    name: 'get_workforce_doctors_roster',
    description: 'Retrieve healthcare personnel counts, registered doctors, nurses, ANMs, and active attendance status across jurisdictions.',
    parameters: {
      type: 'object',
      properties: {
        stateName: { type: 'string', description: 'Filter by State name (e.g. "Bihar", "Maharashtra").' },
        districtName: { type: 'string', description: 'Filter by District name (e.g. "Pune", "Patna").' },
        role: { type: 'string', description: 'Filter by staff role: "doctor", "nurse", "anm", "pharmacist", "technician".' },
      },
      required: [],
    },
  },
  {
    name: 'get_epidemiological_alerts',
    description: 'Fetch active clinical warnings, dengue/malaria outbreak clusters, and supply chain emergency alerts.',
    parameters: {
      type: 'object',
      properties: {
        severity: { type: 'string', description: 'Filter by severity: "critical", "warning", "info".', enum: ['critical', 'warning', 'info', 'all'] },
        stateName: { type: 'string', description: 'Filter alerts by state.' },
      },
      required: [],
    },
  },
  {
    name: 'simulate_supply_shock',
    description: 'Simulate the impact of a surge in patient footfall or supply chain disruption on bed occupancy and medicine buffers.',
    parameters: {
      type: 'object',
      properties: {
        phcId: { type: 'string', description: 'Target PHC facility ID.' },
        footfallSurgePercentage: { type: 'string', description: 'Estimated percentage increase in OPD footfall (e.g. "30").' },
      },
      required: ['phcId', 'footfallSurgePercentage'],
    },
  },
];

export const MCP_RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'smarthealth://schema/catalog',
    name: 'PostgreSQL SmartHealth Schema Catalog',
    description: 'Entity relationship definitions for 36 Indian states, 192 PHCs, medicines, inventory batches, and alerts.',
    mimeType: 'application/json',
  },
  {
    uri: 'smarthealth://jurisdiction/hierarchy',
    name: 'National Governance Jurisdiction Hierarchy',
    description: 'Three-tier hierarchy: Tier 1 (National Health Authority), Tier 2 (State Surveillance), Tier 3 (District Command).',
    mimeType: 'application/json',
  },
];

export class McpServer {
  static listTools(): McpToolDefinition[] {
    return MCP_HEALTHCARE_TOOLS;
  }

  static listResources(): McpResourceDefinition[] {
    return MCP_RESOURCES;
  }

  static async callTool(
    toolName: string,
    args: Record<string, any>,
    _claims?: TenantClaims
  ): Promise<McpToolCallResult> {
    const startTime = Date.now();
    const client = await pool.connect().catch(() => null);
    if (!client) {
      return {
        toolName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        result: null,
        error: 'Database connection pool unavailable.',
      };
    }

    try {
      switch (toolName) {
        case 'search_health_db': {
          const sql = String(args.sqlQuery || '').trim();
          const upper = sql.toUpperCase();
          if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
            throw new Error('MCP security policy: Only read-only SELECT queries are allowed.');
          }
          if (
            upper.includes('INSERT ') ||
            upper.includes('UPDATE ') ||
            upper.includes('DELETE ') ||
            upper.includes('DROP ') ||
            upper.includes('ALTER ') ||
            upper.includes('TRUNCATE ')
          ) {
            throw new Error('MCP security policy: Mutating SQL operations are strictly forbidden.');
          }
          const res = await client.query(sql);
          return {
            toolName,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            result: { rowsCount: res.rows.length, rows: res.rows.slice(0, 50) },
          };
        }

        case 'get_phc_facility_telemetry': {
          let query = `
            SELECT p.id, p.name, p.total_beds, p.occupied_beds, p.emergency_beds, p.isolation_beds,
                   p.oxygen_cylinders_available, p.operational_status, d.name AS district_name, s.name AS state_name
            FROM phc_facilities p
            JOIN districts d ON p.district_id = d.id
            JOIN states s ON p.state_id = s.id
            WHERE 1=1
          `;
          const params: any[] = [];
          if (args.facilityName) {
            params.push(`%${args.facilityName}%`);
            query += ` AND p.name ILIKE $${params.length}`;
          }
          if (args.districtName) {
            params.push(`%${args.districtName}%`);
            query += ` AND d.name ILIKE $${params.length}`;
          }
          if (args.stateName) {
            params.push(`%${args.stateName}%`);
            query += ` AND s.name ILIKE $${params.length}`;
          }
          query += ` ORDER BY p.occupied_beds DESC LIMIT 25;`;

          const res = await client.query(query, params);
          return {
            toolName,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            result: {
              facilitiesFound: res.rows.length,
              facilities: res.rows.map((r) => ({
                ...r,
                utilizationPercentage: r.total_beds > 0 ? Number(((r.occupied_beds / r.total_beds) * 100).toFixed(1)) : 0,
                availableBeds: Math.max(0, r.total_beds - r.occupied_beds),
              })),
            },
          };
        }

        case 'get_medicine_inventory_levels': {
          let query = `
            SELECT ib.id, ib.batch_no, ib.remaining_qty, ib.minimum_threshold, ib.expiry_date,
                   m.name AS medicine_name, m.category, m.unit,
                   p.name AS phc_name, s.name AS state_name
            FROM inventory_batches ib
            JOIN medicines m ON ib.medicine_id = m.id
            JOIN phc_facilities p ON ib.phc_id = p.id
            JOIN states s ON p.state_id = s.id
            WHERE 1=1
          `;
          const params: any[] = [];
          if (args.medicineName) {
            params.push(`%${args.medicineName}%`);
            query += ` AND m.name ILIKE $${params.length}`;
          }
          if (args.onlyStockouts === 'true' || args.onlyStockouts === true) {
            query += ` AND ib.remaining_qty <= ib.minimum_threshold`;
          }
          query += ` ORDER BY ib.remaining_qty ASC LIMIT 30;`;

          const res = await client.query(query, params);
          return {
            toolName,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            result: {
              batchCount: res.rows.length,
              batches: res.rows,
            },
          };
        }

        case 'get_workforce_doctors_roster': {
          let query = `
            SELECT sr.id, sr.name, sr.role, sr.active,
                   p.name AS phc_name, d.name AS district_name, s.name AS state_name
            FROM staff_registry sr
            JOIN phc_facilities p ON sr.phc_id = p.id
            JOIN districts d ON p.district_id = d.id
            JOIN states s ON p.state_id = s.id
            WHERE 1=1
          `;
          const params: any[] = [];
          if (args.stateName) {
            params.push(`%${args.stateName}%`);
            query += ` AND s.name ILIKE $${params.length}`;
          }
          if (args.districtName) {
            params.push(`%${args.districtName}%`);
            query += ` AND d.name ILIKE $${params.length}`;
          }
          if (args.role) {
            params.push(`%${args.role}%`);
            query += ` AND sr.role ILIKE $${params.length}`;
          }
          query += ` ORDER BY sr.role, sr.name LIMIT 50;`;

          const res = await client.query(query, params);
          const totalStaff = res.rows.length;
          const doctors = res.rows.filter((r) => /doctor|medical\s*officer/i.test(r.role)).length;
          const nurses = res.rows.filter((r) => /nurse|anm/i.test(r.role)).length;
          const activeStaff = res.rows.filter((r) => r.active).length;

          return {
            toolName,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            result: {
              summary: { totalStaff, doctors, nurses, activeStaff },
              staffRoster: res.rows,
            },
          };
        }

        case 'get_epidemiological_alerts': {
          let query = `
            SELECT a.id, a.alert_type, a.severity, a.status, a.payload, a.created_at,
                   p.name AS phc_name, s.name AS state_name
            FROM alerts a
            LEFT JOIN phc_facilities p ON a.phc_id = p.id
            LEFT JOIN states s ON a.state_id = s.id
            WHERE a.status = 'open'
          `;
          const params: any[] = [];
          if (args.severity && args.severity !== 'all') {
            params.push(args.severity);
            query += ` AND a.severity = $${params.length}`;
          }
          if (args.stateName) {
            params.push(`%${args.stateName}%`);
            query += ` AND s.name ILIKE $${params.length}`;
          }
          query += ` ORDER BY a.created_at DESC LIMIT 20;`;

          const res = await client.query(query, params);
          return {
            toolName,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            result: {
              activeAlertsCount: res.rows.length,
              alerts: res.rows,
            },
          };
        }

        case 'simulate_supply_shock': {
          const phcId = args.phcId || 'phc-001';
          const surgePct = Number(args.footfallSurgePercentage || 30);
          const facRes = await client.query(
            `SELECT p.name, p.total_beds, p.occupied_beds, p.oxygen_cylinders_available
             FROM phc_facilities p WHERE p.id = $1 OR p.name ILIKE $2 LIMIT 1;`,
            [phcId, `%${phcId}%`]
          );
          const fac = facRes.rows[0] || { name: 'PHC Facility', total_beds: 40, occupied_beds: 28, oxygen_cylinders_available: 12 };
          const simulatedOccupied = Math.min(fac.total_beds, Math.round(fac.occupied_beds * (1 + surgePct / 100)));
          const simulatedOccPct = Number(((simulatedOccupied / fac.total_beds) * 100).toFixed(1));
          const daysOxygenBuffer = Math.max(1, Math.floor(fac.oxygen_cylinders_available / (1 + surgePct / 50)));

          return {
            toolName,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            result: {
              facility: fac.name,
              baselineOccupancy: fac.occupied_beds,
              simulatedOccupancy: simulatedOccupied,
              simulatedUtilizationPct: simulatedOccPct,
              isCriticalSurge: simulatedOccPct >= 90,
              estimatedOxygenBufferDays: daysOxygenBuffer,
              recommendedDirective: simulatedOccPct >= 90
                ? 'Issue emergency patient diversion order and request mutual-aid redistribution.'
                : 'Facility capacity remains within nominal safety margin.',
            },
          };
        }

        default:
          throw new Error(`Unrecognized MCP tool: ${toolName}`);
      }
    } catch (err: any) {
      return {
        toolName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        result: null,
        error: err.message || 'Unknown MCP tool error',
      };
    } finally {
      try { client.release(); } catch (_) {}
    }
  }
}
