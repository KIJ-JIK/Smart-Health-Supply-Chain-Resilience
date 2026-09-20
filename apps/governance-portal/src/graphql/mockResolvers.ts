// ─────────────────────────────────────────────────────────────────────────────
// Mock resolvers for all 12 GraphQL root fields defined in the backend contract.
// Swap these out by replacing the Apollo `link` once the real backend is live.
// ─────────────────────────────────────────────────────────────────────────────
import {
  NationalOverview,
  StateOverview,
  DistrictOverview,
  MedicineStock,
  ResourceItem,
  WorkforceRecord,
  PatientMetrics,
  Forecast,
  RedistributionRecommendation,
  Shipment,
  AuditEntry,
  PhcDetail,
} from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const isoDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

// ── National Overview ─────────────────────────────────────────────────────────
export const mockNationalOverview = (): NationalOverview => ({
  totalPhcs: 45_320,
  activePhcs: 44_108,
  stockoutAlerts: 234,
  criticalShortages: 78,
  pendingRedistributions: 156,
  outbreakAlerts: 12,
  kpis: [
    { label: 'Medicine Coverage', value: 87.4, unit: '%', trend: 'up', delta: 2.1, severity: 'ok' },
    { label: 'Avg Stock Days', value: 42, unit: 'days', trend: 'up', delta: 3, severity: 'ok' },
    { label: 'Workforce Vacancy', value: 14.2, unit: '%', trend: 'down', delta: -1.3, severity: 'warn' },
    { label: 'Shipment On-Time', value: 91.6, unit: '%', trend: 'flat', delta: 0.2, severity: 'ok' },
    { label: 'Critical Stockouts', value: 78, unit: 'PHCs', trend: 'down', delta: -5, severity: 'warn' },
    { label: 'Outbreak Alerts', value: 12, unit: 'active', trend: 'up', delta: 3, severity: 'critical' },
  ],
});

// ── State Overview ─────────────────────────────────────────────────────────────
export const mockStateOverview = (stateId: string): StateOverview => ({
  stateId,
  stateName: 'Maharashtra',
  totalPhcs: 3_682,
  activePhcs: 3_601,
  stockoutAlerts: rand(10, 40),
  criticalShortages: rand(2, 15),
  kpis: [
    { label: 'Medicine Coverage', value: 84.1, unit: '%', trend: 'up', delta: 1.8, severity: 'ok' },
    { label: 'Avg Stock Days', value: 38, unit: 'days', trend: 'flat', delta: 0, severity: 'ok' },
    { label: 'Workforce Vacancy', value: 16.7, unit: '%', trend: 'down', delta: -0.9, severity: 'warn' },
    { label: 'Shipment On-Time', value: 89.3, unit: '%', trend: 'down', delta: -1.1, severity: 'warn' },
  ],
});

// ── District Overview ──────────────────────────────────────────────────────────
export const mockDistrictOverview = (districtId: string): DistrictOverview => ({
  districtId,
  districtName: 'Pune',
  stateId: 'state-mh',
  stateName: 'Maharashtra',
  totalPhcs: 148,
  activePhcs: 145,
  stockoutAlerts: rand(1, 8),
  kpis: [
    { label: 'Medicine Coverage', value: 88.9, unit: '%', trend: 'up', delta: 2.4, severity: 'ok' },
    { label: 'Avg Stock Days', value: 44, unit: 'days', trend: 'up', delta: 4, severity: 'ok' },
    { label: 'Workforce Vacancy', value: 11.3, unit: '%', trend: 'flat', delta: 0.1, severity: 'warn' },
  ],
});

// ── PHC Detail ─────────────────────────────────────────────────────────────────
export const mockPhcDetail = (phcId: string): PhcDetail => ({
  phcId,
  phcName: 'Hadapsar PHC',
  districtId: 'dist-pune',
  districtName: 'Pune',
  stateId: 'state-mh',
  stateName: 'Maharashtra',
  lat: 18.5018,
  lng: 73.9260,
  catchmentPopulation: 28_000,
  activeStaff: 23,
  stockStatus: 'low',
  lastUpdated: isoDate(0),
});

// ── Medicine Intelligence ──────────────────────────────────────────────────────
const MEDICINES = [
  'Amoxicillin 500mg', 'Paracetamol 500mg', 'ORS Sachets', 'Metformin 500mg',
  'Amlodipine 5mg', 'Atorvastatin 10mg', 'Iron Folic Acid', 'Vitamin D3',
  'Cotrimoxazole 480mg', 'Chloroquine 250mg', 'Artemether-Lumefantrine',
  'Rifampicin 150mg', 'Isoniazid 100mg', 'Ethambutol 400mg',
];

export const mockMedicineIntelligence = (): MedicineStock[] =>
  MEDICINES.map((name, i) => {
    const current = rand(0, 5000);
    const reorder = 1000;
    const critical = 300;
    const status =
      current === 0 ? 'stockout' :
      current < critical ? 'critical' :
      current < reorder ? 'low' : 'adequate';
    return {
      medicineId: `med-${i + 1}`,
      medicineName: name,
      genericName: name.split(' ')[0],
      category: i < 4 ? 'Essential' : i < 8 ? 'Chronic Disease' : 'Infectious Disease',
      currentStock: current,
      unit: 'units',
      coverageDays: Math.floor(current / 80),
      reorderLevel: reorder,
      criticalLevel: critical,
      expiryDate: isoDate(rand(10, 180)),
      status,
    };
  });

// ── Resource Intelligence ──────────────────────────────────────────────────────
const RESOURCES = [
  { name: 'Hospital Beds', cat: 'Infrastructure' },
  { name: 'ICU Beds', cat: 'Infrastructure' },
  { name: 'Ventilators', cat: 'Equipment' },
  { name: 'Ambulances', cat: 'Transport' },
  { name: 'Cold Chain Units', cat: 'Equipment' },
  { name: 'Diagnostic Kits', cat: 'Consumables' },
];

export const mockResourceIntelligence = (): ResourceItem[] =>
  RESOURCES.map((r, i) => {
    const required = rand(100, 1000);
    const available = rand(60, required);
    const utilization = Math.round((available / required) * 100);
    return {
      resourceId: `res-${i + 1}`,
      resourceName: r.name,
      category: r.cat,
      available,
      required,
      utilization,
      unit: 'units',
      status: utilization < 70 ? 'critical' : utilization < 85 ? 'constrained' : 'adequate',
    };
  });

// ── Workforce Intelligence ─────────────────────────────────────────────────────
const ROLES = [
  'Medical Officer', 'Staff Nurse', 'ANM', 'Lab Technician',
  'Pharmacist', 'Health Educator', 'ASHA Supervisor',
];

export const mockWorkforceIntelligence = (): WorkforceRecord[] =>
  ROLES.map((role, i) => {
    const sanctioned = rand(50, 500);
    const onLeave = rand(2, 20);
    const inPosition = rand(Math.floor(sanctioned * 0.7), sanctioned);
    const vacancies = sanctioned - inPosition;
    return {
      roleId: `role-${i + 1}`,
      roleName: role,
      sanctioned,
      inPosition,
      vacancies,
      onLeave,
      trainingDue: rand(0, 30),
      vacancyRate: Math.round((vacancies / sanctioned) * 100),
    };
  });

// ── Patient Intelligence ───────────────────────────────────────────────────────
export const mockPatientIntelligence = (): PatientMetrics => ({
  totalVisits: rand(80_000, 200_000),
  avgWaitTimeMinutes: rand(12, 45),
  referralRate: parseFloat((rand(5, 18) + Math.random()).toFixed(1)),
  ncdCoverage: parseFloat((rand(55, 85) + Math.random()).toFixed(1)),
  immunizationCoverage: parseFloat((rand(70, 95) + Math.random()).toFixed(1)),
  maternalCareEnrollment: parseFloat((rand(60, 90) + Math.random()).toFixed(1)),
  period: 'Q3 FY2025-26',
});

// ── Forecasts ──────────────────────────────────────────────────────────────────
export const mockForecasts = (metric: string): Forecast => {
  const points = Array.from({ length: 12 }, (_, i) => ({
    date: isoDate(i * 7),
    value: rand(1000, 5000),
    lowerBound: rand(800, 1200),
    upperBound: rand(4500, 6000),
  }));
  return {
    entityId: 'national',
    entityType: 'national',
    metric,
    horizon: '12 weeks',
    model: 'LSTM-Ensemble',
    confidence: 0.87,
    generatedAt: isoDate(0),
    points,
  };
};

// ── Redistribution Recommendations ────────────────────────────────────────────
const URGENCY: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
const REC_STATUS: Array<'pending' | 'approved' | 'rejected' | 'modified'> = [
  'pending', 'pending', 'approved', 'rejected', 'modified',
];

export const mockRedistributionRecommendations = (): RedistributionRecommendation[] =>
  Array.from({ length: 8 }, (_, i) => ({
    recommendationId: `rec-${i + 1}`,
    medicineId: `med-${(i % 5) + 1}`,
    medicineName: MEDICINES[i % MEDICINES.length],
    fromPhcId: `phc-src-${i}`,
    fromPhcName: `Kothrud PHC ${i}`,
    toPhcId: `phc-dst-${i}`,
    toPhcName: `Hadapsar PHC ${i}`,
    districtId: 'dist-pune',
    quantity: rand(50, 500),
    unit: 'units',
    urgency: URGENCY[i % URGENCY.length],
    reason: `AI detected ${rand(3, 14)}-day stockout risk at destination PHC`,
    aiConfidence: parseFloat((0.7 + Math.random() * 0.28).toFixed(2)),
    status: REC_STATUS[i % REC_STATUS.length],
    createdAt: isoDate(-rand(0, 5)),
    decisionAt: i > 1 ? isoDate(-rand(0, 2)) : undefined,
    decisionBy: i > 1 ? 'Dr. Priya Sharma' : undefined,
    notes: i === 3 ? 'Rejected: source PHC also running low' : undefined,
  }));

// ── Supply Chain Shipments ─────────────────────────────────────────────────────
const SHIP_STATUS: Array<ShipmentStatus> = [
  'in_transit', 'delivered', 'ordered', 'dispatched', 'delayed',
];
type ShipmentStatus = 'ordered' | 'dispatched' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';

export const mockSupplyChainShipments = (): Shipment[] =>
  Array.from({ length: 10 }, (_, i) => ({
    shipmentId: `ship-${i + 1}`,
    orderDate: isoDate(-rand(1, 10)),
    expectedDelivery: isoDate(rand(0, 7)),
    actualDelivery: i % 3 === 0 ? isoDate(-rand(0, 2)) : undefined,
    status: SHIP_STATUS[i % SHIP_STATUS.length],
    supplier: ['MedPharma Ltd', 'HealthCorp India', 'BioSource Pvt'][i % 3],
    destinationPhcId: `phc-${i + 1}`,
    destinationPhcName: `PHC ${String.fromCharCode(65 + i)}`,
    districtId: 'dist-pune',
    stateId: 'state-mh',
    totalValue: rand(10_000, 500_000),
    currency: 'INR',
    items: [
      {
        medicineId: `med-${i + 1}`,
        medicineName: MEDICINES[i % MEDICINES.length],
        quantity: rand(100, 2000),
        unit: 'units',
      },
    ],
  }));

// ── Audit Log ──────────────────────────────────────────────────────────────────
const AUDIT_ACTIONS = [
  'redistribution.approved', 'redistribution.rejected', 'redistribution.modified',
  'user.login', 'report.downloaded', 'alert.acknowledged', 'admin.role_changed',
];
const AUDIT_ROLES: Array<'national_admin' | 'state_admin' | 'district_admin'> = [
  'national_admin', 'state_admin', 'district_admin',
];

export const mockAuditLog = (): AuditEntry[] =>
  Array.from({ length: 20 }, (_, i) => ({
    auditId: `audit-${i + 1}`,
    action: AUDIT_ACTIONS[i % AUDIT_ACTIONS.length],
    entityType: 'redistribution',
    entityId: `rec-${i + 1}`,
    userId: `user-${(i % 5) + 1}`,
    userName: ['Dr. Priya Sharma', 'Rahul Verma', 'Smt. Anita Nair', 'Suresh Iyer', 'Meera Joshi'][i % 5],
    userRole: AUDIT_ROLES[i % AUDIT_ROLES.length],
    timestamp: isoDate(-rand(0, 30)),
    ipAddress: `192.168.${rand(1, 10)}.${rand(1, 254)}`,
    metadata: { reason: 'Standard operation' },
  }));
