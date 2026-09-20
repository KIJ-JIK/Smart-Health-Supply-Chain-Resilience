// ─────────────────────────────────────────────────────────────────────────────
// Analytics & Reports Data Module — Masterplan Four Report Tiers
// 1. National: resource status, medicine stock, shortages, forecasts, emergencies
// 2. State: performance, district comparison, utilization, supply chain
// 3. District: PHC comparison, shortages, requests, redistribution
// 4. PHC: inventory, billing, consumption, footfall, staff, resources
// ─────────────────────────────────────────────────────────────────────────────
import { UserRole } from '@/types';

export type ReportTier = 'national' | 'state' | 'district' | 'phc';
export type ExportFormat = 'PDF' | 'CSV' | 'XLSX';

export interface ReportTierConfig {
  tier: ReportTier;
  title: string;
  subtitle: string;
  requiredRole: UserRole[];
  sections: string[];
  keyMetrics: Array<{ label: string; value: string | number; delta?: string }>;
}

export const REPORT_TIERS: Record<ReportTier, ReportTierConfig> = {
  national: {
    tier: 'national',
    title: 'National Health Resilience Dossier',
    subtitle: 'Consolidated statutory report across all states: strategic reserves, macro forecasts, and national emergencies',
    requiredRole: ['national_admin'],
    sections: [
      'National Resource Status (Beds, Cryogenic & Cylinder Oxygen, Critical Equipment)',
      'Strategic Medicine Stock & Essential Drug Buffer Reserves',
      'Macro Shortage Projections & Zero-Stock Hotspots',
      '14-Day AI Epidemiological Surge & Patient Footfall Trajectories',
      'Active National Health Emergencies & Fast-Track Procurement Directives',
    ],
    keyMetrics: [
      { label: 'Total Monitored PHCs', value: '45,320', delta: '98.4% operational' },
      { label: 'Strategic Buffer Coverage', value: '84.2 Days', delta: 'National mean' },
      { label: 'Critical Shortage PHCs', value: '78 Facilities', delta: '-12 vs last month' },
      { label: 'Active Emergency Decl.', value: '3 Active', delta: 'Level-3 Surge' },
    ],
  },
  state: {
    tier: 'state',
    title: 'State Performance & Inter-District Audit',
    subtitle: 'State health executive report: cross-district performance indices, hospital utilization, and logistics compliance',
    requiredRole: ['national_admin', 'state_admin'],
    sections: [
      'Statewide District Performance Rankings & Governance Scorecard',
      'Cross-District Health Resource Utilization & ICU Saturation',
      'Regional Pharmaceutical Supply Chain Turnaround & Transit Delay Audit',
      'State Buffer Depot Inventory Reserves & Reorder Allocation',
    ],
    keyMetrics: [
      { label: 'State Facilities', value: '3,682 PHCs / SDHs', delta: 'Maharashtra State' },
      { label: 'Mean Stockout Recovery', value: '4.2 Days', delta: 'Target: < 5.0 days' },
      { label: 'Cold-Chain SLA Compliance', value: '98.2%', delta: 'IoT sensors' },
      { label: 'Inter-District Movements', value: '142 Consignments', delta: 'This month' },
    ],
  },
  district: {
    tier: 'district',
    title: 'District Operational Intelligence Report',
    subtitle: 'District health officer brief: facility-by-facility comparisons, shortage queues, and redistribution balancing',
    requiredRole: ['national_admin', 'state_admin', 'district_admin'],
    sections: [
      'Intra-District PHC Comparative Scorecard & Patient Strain Index',
      'Facility-Level Medicine Shortages & 14-Day Stockout Projections',
      'Facility Requisition Orders & Central Drug Store Fulfillments',
      'Approved Inter-Facility Redistribution Transfers & Transit Tracking',
    ],
    keyMetrics: [
      { label: 'District Facilities', value: '64 PHCs', delta: 'Pune District' },
      { label: 'Redistribution Executed', value: '28 Transfers', delta: 'Averted 4 stockouts' },
      { label: 'Mean Last-Mile Transit', value: '22.4 Hours', delta: 'Target: 8.0h' },
      { label: 'Clinical Staff Availability', value: '84.8%', delta: 'Doctor:Patient 1:85' },
    ],
  },
  phc: {
    tier: 'phc',
    title: 'PHC Facility Granular Operational Audit',
    subtitle: 'Facility medical officer ledger: stock balance, drug dispensations, OPD volumes, staff attendance, and ward beds',
    requiredRole: ['national_admin', 'state_admin', 'district_admin'],
    sections: [
      'Real-Time Pharmaceutical Inventory Balance & Expiry Tracking',
      'Daily Outpatient & Emergency Drug Dispensation Ledger',
      'Daily OPD / IPD Patient Footfall & Seasonal Disease Triage',
      'Clinical & Para-Medical Staff Duty Roster & Attendance Logs',
      'Ward Bed Occupancy & Medical Oxygen Cylinder Pressures',
    ],
    keyMetrics: [
      { label: 'Catchment Population', value: '48,500', delta: 'Hadapsar PHC' },
      { label: 'Active OPD Visits / Day', value: '340 Patients', delta: '+42% fever surge' },
      { label: 'Bed Occupancy', value: '95.8%', delta: '23 / 24 beds' },
      { label: 'Available D-Cylinders', value: '4 Cylinders', delta: '0.9 days coverage' },
    ],
  },
};

export interface GeneratedReport {
  id: string;
  title: string;
  tier: ReportTier;
  format: ExportFormat;
  status: 'processing' | 'ready' | 'failed';
  progressPct: number;
  size: string;
  createdAt: string;
  downloadUrl?: string;
  scopeLabel: string;
  generatedBy: string;
}

export const INITIAL_GENERATED_REPORTS: GeneratedReport[] = [
  {
    id: 'RPT-2026-09-001',
    title: 'National Health Resilience Dossier (Q2 FY26)',
    tier: 'national',
    format: 'PDF',
    status: 'ready',
    progressPct: 100,
    size: '4.8 MB',
    createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    downloadUrl: 'https://gov-reports.mohfw.gov.in/exports/2026/09/national_resilience_dossier.pdf',
    scopeLabel: 'National Overview',
    generatedBy: 'Dr. V. Sharma (National Health Director)',
  },
  {
    id: 'RPT-2026-09-002',
    title: 'Maharashtra State Inter-District Comparison (Aug 2026)',
    tier: 'state',
    format: 'CSV',
    status: 'ready',
    progressPct: 100,
    size: '1.2 MB',
    createdAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
    downloadUrl: 'https://gov-reports.mohfw.gov.in/exports/2026/09/mh_state_district_comparison.csv',
    scopeLabel: 'Maharashtra State',
    generatedBy: 'Dr. A. Deshmukh (State Health Secretary)',
  },
  {
    id: 'RPT-2026-09-003',
    title: 'Pune District PHC Shortages & Redistribution Audit',
    tier: 'district',
    format: 'PDF',
    status: 'ready',
    progressPct: 100,
    size: '2.4 MB',
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    downloadUrl: 'https://gov-reports.mohfw.gov.in/exports/2026/09/pune_district_redistribution.pdf',
    scopeLabel: 'Pune District',
    generatedBy: 'Dr. S. Patil (District Health Officer)',
  },
  {
    id: 'RPT-2026-09-004',
    title: 'Hadapsar PHC Daily Inventory & Dispensation Ledger',
    tier: 'phc',
    format: 'XLSX',
    status: 'ready',
    progressPct: 100,
    size: '890 KB',
    createdAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
    downloadUrl: 'https://gov-reports.mohfw.gov.in/exports/2026/09/hadapsar_phc_inventory.xlsx',
    scopeLabel: 'Hadapsar PHC',
    generatedBy: 'Dr. R. Kulkarni (Medical Officer)',
  },
];
