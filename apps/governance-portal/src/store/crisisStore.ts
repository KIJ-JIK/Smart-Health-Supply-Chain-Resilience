// ─────────────────────────────────────────────────────────────────────────────
// Crisis Store — Zustand
//
// Masterplan Crisis Mode & Statutory Emergency Directives:
// - Only national_admin may activate or deactivate crisis mode.
// - State and district admins see it as read-only.
// - When active, re-prioritizes primary layout across 9 crisis echelons.
// - Supports configuring statutory emergency directives per protocol.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

export interface ProtocolDirective {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  paramLabel?: string;
  paramValue?: string;
  paramType?: 'text' | 'number' | 'select';
  paramOptions?: string[];
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  level: 'national' | 'state' | 'district';
  status: 'active' | 'standby';
  description: string;
  leadAgency: string;
  notes?: string;
  lastUpdated?: string;
  directives: ProtocolDirective[];
}

export const DEFAULT_EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 'ep-level3-national',
    name: 'National Level-3 Public Health Surge & Strategic Reserve Mobilization',
    level: 'national',
    status: 'active',
    leadAgency: 'Ministry of Health & Family Welfare / NDMA',
    notes: 'Standing order for high-impact surge response across high-burden geographic corridors.',
    lastUpdated: '2026-09-29T18:00:00.000Z',
    description: 'Mandatory requisition of inter-state pharmaceutical buffers, armed forces logistics corridors, and immediate fast-track procurement.',
    directives: [
      {
        id: 'dir-nat-buffer',
        name: 'Mandatory Inter-State Reserve Buffer Requisition',
        description: 'Draw down up to authorized ceiling percentage from contiguous states to replenish acute stockout zones.',
        enabled: true,
        paramLabel: 'Buffer Drawdown Ceiling (%)',
        paramValue: '35%',
        paramType: 'select',
        paramOptions: ['15%', '25%', '35%', '50%'],
      },
      {
        id: 'dir-nat-airlift',
        name: 'Armed Forces & NDRF Logistics Air Corridors',
        description: 'Authorize IAF / NDRF air-lifting for ultra-critical cold-chain and emergency medicine consignments.',
        enabled: true,
        paramLabel: 'Corridor Priority Level',
        paramValue: 'Alpha Priority (Immediate Dispatch)',
        paramType: 'select',
        paramOptions: ['Alpha Priority (Immediate Dispatch)', 'Bravo Priority (Within 6h)', 'Standard Civil Transit'],
      },
      {
        id: 'dir-nat-sec29',
        name: 'Statutory Section 29 Deficit Allocation Standard',
        description: 'Mandatory triggering of emergency redistribution for facilities exceeding 92% bed occupancy or <1.2 days oxygen.',
        enabled: true,
      },
      {
        id: 'dir-nat-escrow',
        name: 'Emergency Central Reserve Replenishment Escrow',
        description: 'Autonomous financial escrow guaranteeing instant settlement to manufacturing pharmaceutical units.',
        enabled: false,
        paramLabel: 'Escrow Reserve Cap',
        paramValue: '₹50 Crores',
        paramType: 'text',
      },
    ],
  },
  {
    id: 'ep-flood',
    name: 'Monsoon Flood & Waterborne Epidemic Containment',
    level: 'state',
    status: 'active',
    leadAgency: 'State Disaster Management Authority (SDMA)',
    notes: 'Active surveillance during heavy precipitation and flood inundation warnings.',
    lastUpdated: '2026-09-29T17:30:00.000Z',
    description: 'Air-drop triage kits, mobile chlorine water testing, and emergency oral rehydration stockpiles for cut-off rural settlements.',
    directives: [
      {
        id: 'dir-flood-airdrop',
        name: 'Drone & Helicopter Medical Air-Drop Protocol',
        description: 'Deploy UAV fleets and state disaster choppers to transport life-saving anti-venom, antibiotics, and water purifiers.',
        enabled: true,
        paramLabel: 'Operational Airlift Radius',
        paramValue: '75 km radius',
        paramType: 'text',
      },
      {
        id: 'dir-flood-water',
        name: 'Mobile Chlorine Testing & Water Purification Deployment',
        description: 'Equip primary frontline field workers with rapid water purification tablets and pathogen detectors.',
        enabled: true,
        paramLabel: 'Mobile Testing Unit Count',
        paramValue: '12 Units',
        paramType: 'number',
      },
      {
        id: 'dir-flood-ors',
        name: 'Mass Oral Rehydration Stockpiling at Vulnerable Nodes',
        description: 'Pre-position 10,000+ ORS sachets and IV fluids at sub-district hospitals and community clinics.',
        enabled: true,
        paramLabel: 'Minimum Buffer Sachet Target',
        paramValue: '15,000 Sachets / Node',
        paramType: 'text',
      },
      {
        id: 'dir-flood-vector',
        name: 'Vector-Borne Epidemic Rapid Diagnostic Sweep',
        description: 'Activate early-warning sentinel surveillance for cholera, leptospirosis, and dengue outbreaks.',
        enabled: false,
        paramLabel: 'Surveillance Test Kits',
        paramValue: '5,000 Rapid Kits',
        paramType: 'text',
      },
    ],
  },
  {
    id: 'ep-stockout-fasttrack',
    name: 'Emergency Procurement & Red-Tape Waiver Protocol',
    level: 'national',
    status: 'standby',
    leadAgency: 'Central Medical Services Society (CMSS)',
    notes: 'Invoked when multi-state supply chain bottlenecks create critical drug depletion.',
    lastUpdated: '2026-09-29T14:15:00.000Z',
    description: 'Bypasses 30-day tender waiting period; authorizes direct district medical store purchasing at state pre-negotiated ceiling rates.',
    directives: [
      {
        id: 'dir-proc-tender',
        name: 'Statutory 30-Day E-Tender Waiting Period Waiver',
        description: 'Exempt critical stock purchases from standard government tender delay cycles under emergency provisions.',
        enabled: true,
        paramLabel: 'Emergency Approval Turnaround',
        paramValue: '4 Hours Fast-Track',
        paramType: 'select',
        paramOptions: ['2 Hours Expedited', '4 Hours Fast-Track', '12 Hours Standard'],
      },
      {
        id: 'dir-proc-markup',
        name: 'Direct District Warehouse Purchase Rate Ceiling Waiver',
        description: 'Permit local chief medical officers to procure directly from verified open-market distributors within authorized price cap.',
        enabled: true,
        paramLabel: 'Maximum Rate Markup Allowance',
        paramValue: '+15% over State Rate Contract',
        paramType: 'text',
      },
      {
        id: 'dir-proc-spot',
        name: 'Emergency Spot Purchase Discretionary Cap',
        description: 'Per-facility autonomous spot spending cap without prior ministerial sanction during emergency surge.',
        enabled: true,
        paramLabel: 'Facility Discretionary Limit',
        paramValue: '₹25,00,000',
        paramType: 'text',
      },
      {
        id: 'dir-proc-ai',
        name: 'Autonomous AI-Guided Inter-Facility Redistribution',
        description: 'Allow algorithm-generated redistribution orders to execute automatically when confidence is above threshold.',
        enabled: false,
        paramLabel: 'Auto-Approval Confidence Threshold',
        paramValue: '95%',
        paramType: 'select',
        paramOptions: ['85%', '90%', '95%', '98%'],
      },
    ],
  },
  {
    id: 'ep-mass-casualty',
    name: 'Mass Casualty & Trauma Incident Response',
    level: 'district',
    status: 'standby',
    leadAgency: 'District Emergency Command & Civil Surgeon',
    notes: 'Triggered upon major vehicular, industrial, or natural disaster casualty events.',
    lastUpdated: '2026-09-29T12:00:00.000Z',
    description: 'Activates secondary and tertiary surgical bed conversion, blood bank cold-chain surge dispatch, and triage annex deployment.',
    directives: [
      {
        id: 'dir-trauma-beds',
        name: 'Surgical ICU & Trauma Surge Bed Conversion',
        description: 'Convert standard general ward capacity into acute trauma care and oxygen-supported stabilization beds.',
        enabled: true,
        paramLabel: 'Surge Conversion Ratio',
        paramValue: '30% of Ward Capacity',
        paramType: 'select',
        paramOptions: ['20% of Ward Capacity', '30% of Ward Capacity', '50% of Ward Capacity'],
      },
      {
        id: 'dir-trauma-blood',
        name: 'Regional Blood Bank Cold-Chain Surge Dispatch',
        description: 'Initiate emergency police escort convoy to deliver PRBC, plasma, and whole blood to frontline hospitals.',
        enabled: true,
        paramLabel: 'Surge Blood Reserve Target',
        paramValue: '250 Units PRBC',
        paramType: 'text',
      },
      {
        id: 'dir-trauma-triage',
        name: 'Deploy Field Triage Tent Annexes',
        description: 'Set up external triage and decontamination tents in hospital perimeters to manage patient overflow.',
        enabled: true,
        paramLabel: 'Mobile Annex Units',
        paramValue: '6 Tent Units (60 beds)',
        paramType: 'text',
      },
      {
        id: 'dir-trauma-als',
        name: 'Inter-District ALS Trauma Ambulance Requisition',
        description: 'Requisition Advanced Life Support (ALS) ambulances from contiguous private and public fleets.',
        enabled: false,
        paramLabel: 'Fleet Requisition Target',
        paramValue: '15 ALS Ambulances',
        paramType: 'number',
      },
    ],
  },
];

interface CrisisState {
  isCrisisMode: boolean;
  activatedAt: string | null;
  activatedBy: string | null;
  crisisTitle: string;
  crisisLevel: 'Level-1 (Local)' | 'Level-2 (Statewide)' | 'Level-3 (National Emergency)';
  protocols: EmergencyProtocol[];

  // Actions
  activateCrisisMode: (user: User, title?: string, level?: CrisisState['crisisLevel']) => boolean;
  deactivateCrisisMode: (user: User) => boolean;
  canManageCrisis: (user: User) => boolean;
  updateProtocol: (protocolId: string, updates: Partial<EmergencyProtocol>) => void;
  toggleDirective: (protocolId: string, directiveId: string) => void;
  updateDirectiveParam: (protocolId: string, directiveId: string, value: string) => void;
  resetProtocolsToDefault: () => void;
}

export const useCrisisStore = create<CrisisState>()(
  persist(
    (set, get) => ({
      isCrisisMode: false,
      activatedAt: null,
      activatedBy: null,
      crisisTitle: 'National Public Health Emergency Protocol',
      crisisLevel: 'Level-3 (National Emergency)',
      protocols: DEFAULT_EMERGENCY_PROTOCOLS,

      canManageCrisis: (user: User) => {
        return user.role === 'national_admin';
      },

      activateCrisisMode: (user: User, title, level) => {
        if (user.role !== 'national_admin') {
          return false; // Forbidden for state/district admins
        }
        set({
          isCrisisMode: true,
          activatedAt: new Date().toISOString(),
          activatedBy: user.name || 'National Command Center',
          crisisTitle: title || 'National Level-3 Public Health Surge Protocol',
          crisisLevel: level || 'Level-3 (National Emergency)',
        });
        return true;
      },

      deactivateCrisisMode: (user: User) => {
        if (user.role !== 'national_admin') {
          return false; // Forbidden for state/district admins
        }
        set({
          isCrisisMode: false,
          activatedAt: null,
          activatedBy: null,
        });
        return true;
      },

      updateProtocol: (protocolId, updates) => {
        set((state) => ({
          protocols: state.protocols.map((p) =>
            p.id === protocolId
              ? { ...p, ...updates, lastUpdated: new Date().toISOString() }
              : p
          ),
        }));
      },

      toggleDirective: (protocolId, directiveId) => {
        set((state) => ({
          protocols: state.protocols.map((p) => {
            if (p.id !== protocolId) return p;
            return {
              ...p,
              lastUpdated: new Date().toISOString(),
              directives: p.directives.map((d) =>
                d.id === directiveId ? { ...d, enabled: !d.enabled } : d
              ),
            };
          }),
        }));
      },

      updateDirectiveParam: (protocolId, directiveId, value) => {
        set((state) => ({
          protocols: state.protocols.map((p) => {
            if (p.id !== protocolId) return p;
            return {
              ...p,
              lastUpdated: new Date().toISOString(),
              directives: p.directives.map((d) =>
                d.id === directiveId ? { ...d, paramValue: value } : d
              ),
            };
          }),
        }));
      },

      resetProtocolsToDefault: () => {
        set({ protocols: DEFAULT_EMERGENCY_PROTOCOLS });
      },
    }),
    {
      name: 'governance-portal-crisis-mode-v2',
    },
  ),
);
