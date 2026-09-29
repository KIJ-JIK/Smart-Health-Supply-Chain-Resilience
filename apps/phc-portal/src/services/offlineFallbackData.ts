import {
  PHCFacility,
  Medicine,
  InventoryBatch,
  Alert,
  PatientFootfall,
  StaffRegistry,
  Equipment,
  StaffAttendance,
  ResourceRequest,
} from '../types';
import { PhcFacilityBackendItem } from './phcBackendService';

export const OFFLINE_FALLBACK_FACILITIES: PhcFacilityBackendItem[] = [
  // ── Maharashtra ─────────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000001',
    name: 'Kothrud Model Primary Health Centre',
    district: 'Pune',
    state: 'Maharashtra',
    district_id: 'b0000002-0000-0000-0000-000000000001',
    state_id: 'a0000001-0000-0000-0000-000000000001',
    total_beds: 35,
    occupied_beds: 28,
    emergency_beds: 6,
    isolation_beds: 4,
    oxygen_cylinders: 40,
    oxygen_concentrators: 5,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000002',
    name: 'Hadapsar 24x7 Health Centre',
    district: 'Pune',
    state: 'Maharashtra',
    district_id: 'b0000002-0000-0000-0000-000000000001',
    state_id: 'a0000001-0000-0000-0000-000000000001',
    total_beds: 40,
    occupied_beds: 34,
    emergency_beds: 8,
    isolation_beds: 4,
    oxygen_cylinders: 25,
    oxygen_concentrators: 4,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Baramati Sub-District Community Health Node',
    district: 'Pune',
    state: 'Maharashtra',
    district_id: 'b0000002-0000-0000-0000-000000000001',
    state_id: 'a0000001-0000-0000-0000-000000000001',
    total_beds: 60,
    occupied_beds: 52,
    emergency_beds: 12,
    isolation_beds: 6,
    oxygen_cylinders: 55,
    oxygen_concentrators: 8,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000004',
    name: 'Wagholi Rural Health Centre',
    district: 'Pune',
    state: 'Maharashtra',
    district_id: 'b0000002-0000-0000-0000-000000000001',
    state_id: 'a0000001-0000-0000-0000-000000000001',
    total_beds: 25,
    occupied_beds: 18,
    emergency_beds: 4,
    isolation_beds: 2,
    oxygen_cylinders: 15,
    oxygen_concentrators: 3,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000005',
    name: 'Solapur Central Urban Health Post',
    district: 'Solapur',
    state: 'Maharashtra',
    district_id: 'b0000002-0000-0000-0000-000000000002',
    state_id: 'a0000001-0000-0000-0000-000000000001',
    total_beds: 30,
    occupied_beds: 22,
    emergency_beds: 5,
    isolation_beds: 3,
    oxygen_cylinders: 20,
    oxygen_concentrators: 3,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000006',
    name: 'Nashik Road 24x7 Family Clinic',
    district: 'Nashik',
    state: 'Maharashtra',
    district_id: 'b0000002-0000-0000-0000-000000000003',
    state_id: 'a0000001-0000-0000-0000-000000000001',
    total_beds: 35,
    occupied_beds: 26,
    emergency_beds: 6,
    isolation_beds: 3,
    oxygen_cylinders: 30,
    oxygen_concentrators: 4,
    operational_status: 'active',
  },

  // ── Delhi (NCT) ───────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000010',
    name: 'Connaught Place Urban PHC',
    district: 'Central Delhi',
    state: 'Delhi (NCT)',
    district_id: 'dist-del-central',
    state_id: 'a0000001-0000-0000-0000-000000000034',
    total_beds: 40,
    occupied_beds: 32,
    emergency_beds: 10,
    isolation_beds: 5,
    oxygen_cylinders: 35,
    oxygen_concentrators: 6,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000011',
    name: 'Hauz Khas Model Health Centre',
    district: 'South Delhi',
    state: 'Delhi (NCT)',
    district_id: 'dist-del-south',
    state_id: 'a0000001-0000-0000-0000-000000000034',
    total_beds: 50,
    occupied_beds: 44,
    emergency_beds: 12,
    isolation_beds: 6,
    oxygen_cylinders: 40,
    oxygen_concentrators: 8,
    operational_status: 'active',
  },

  // ── Karnataka ─────────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000020',
    name: 'Indiranagar Urban Primary Health Centre',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    district_id: 'dist-ka-blr',
    state_id: 'a0000001-0000-0000-0000-000000000017',
    total_beds: 45,
    occupied_beds: 36,
    emergency_beds: 8,
    isolation_beds: 4,
    oxygen_cylinders: 35,
    oxygen_concentrators: 5,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000021',
    name: 'Whitefield Community Clinic & Triage',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    district_id: 'dist-ka-blr',
    state_id: 'a0000001-0000-0000-0000-000000000017',
    total_beds: 35,
    occupied_beds: 29,
    emergency_beds: 6,
    isolation_beds: 3,
    oxygen_cylinders: 28,
    oxygen_concentrators: 4,
    operational_status: 'active',
  },

  // ── Uttar Pradesh ─────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000030',
    name: 'Ghat Marg Heritage PHC',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    district_id: 'dist-up-vns',
    state_id: 'a0000001-0000-0000-0000-000000000033',
    total_beds: 30,
    occupied_beds: 24,
    emergency_beds: 6,
    isolation_beds: 3,
    oxygen_cylinders: 22,
    oxygen_concentrators: 4,
    operational_status: 'active',
  },
  {
    id: 'c0000003-0000-0000-0000-000000000031',
    name: 'Hazratganj Model Health Centre',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    district_id: 'dist-up-lko',
    state_id: 'a0000001-0000-0000-0000-000000000033',
    total_beds: 50,
    occupied_beds: 41,
    emergency_beds: 10,
    isolation_beds: 5,
    oxygen_cylinders: 38,
    oxygen_concentrators: 6,
    operational_status: 'active',
  },

  // ── Kerala ────────────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000040',
    name: 'Kovalam Coastal 24x7 PHC',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    district_id: 'dist-kl-tvm',
    state_id: 'a0000001-0000-0000-0000-000000000018',
    total_beds: 30,
    occupied_beds: 20,
    emergency_beds: 6,
    isolation_beds: 3,
    oxygen_cylinders: 25,
    oxygen_concentrators: 5,
    operational_status: 'active',
  },

  // ── Gujarat ───────────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000050',
    name: 'Sabarmati Model Health Clinic',
    district: 'Ahmedabad',
    state: 'Gujarat',
    district_id: 'dist-gj-ahd',
    state_id: 'a0000001-0000-0000-0000-000000000012',
    total_beds: 40,
    occupied_beds: 31,
    emergency_beds: 8,
    isolation_beds: 4,
    oxygen_cylinders: 32,
    oxygen_concentrators: 5,
    operational_status: 'active',
  },

  // ── Rajasthan ─────────────────────────────────────────────────────────────
  {
    id: 'c0000003-0000-0000-0000-000000000060',
    name: 'Pink City Central Dispensary',
    district: 'Jaipur',
    state: 'Rajasthan',
    district_id: 'dist-rj-jpr',
    state_id: 'a0000001-0000-0000-0000-000000000028',
    total_beds: 35,
    occupied_beds: 27,
    emergency_beds: 6,
    isolation_beds: 3,
    oxygen_cylinders: 26,
    oxygen_concentrators: 4,
    operational_status: 'active',
  },
];

export const OFFLINE_DEFAULT_MEDICINES: Medicine[] = [
  { id: 'med-001', name: 'Amoxicillin 500mg Capsules', category: 'Antibiotics', unit: 'strips', unit_price: 45, min_threshold: 120, critical_threshold: 40 },
  { id: 'med-002', name: 'Metformin 500mg Tablets', category: 'Antidiabetic', unit: 'strips', unit_price: 25, min_threshold: 200, critical_threshold: 60 },
  { id: 'med-003', name: 'Paracetamol 650mg Tablets', category: 'Analgesics', unit: 'strips', unit_price: 18, min_threshold: 300, critical_threshold: 90 },
  { id: 'med-004', name: 'Human Regular Insulin 40 IU/ml', category: 'Critical Cold-Chain', unit: 'vials', unit_price: 160, min_threshold: 40, critical_threshold: 12 },
  { id: 'med-005', name: 'Ceftriaxone 1g Injectable', category: 'Antibiotics', unit: 'vials', unit_price: 85, min_threshold: 60, critical_threshold: 20 },
  { id: 'med-006', name: 'Oral Rehydration Salts (ORS) 20.5g', category: 'Essential Fluids', unit: 'sachets', unit_price: 8, min_threshold: 400, critical_threshold: 100 },
  { id: 'med-007', name: 'Rabies Antiserum 1000 IU', category: 'Critical Antivenom/Serum', unit: 'vials', unit_price: 420, min_threshold: 20, critical_threshold: 6 },
  { id: 'med-008', name: 'Atorvastatin 10mg Tablets', category: 'Cardiovascular', unit: 'strips', unit_price: 55, min_threshold: 150, critical_threshold: 45 },
  { id: 'med-009', name: 'Amlodipine 5mg Tablets', category: 'Antihypertensive', unit: 'strips', unit_price: 22, min_threshold: 180, critical_threshold: 50 },
  { id: 'med-010', name: 'Ciprofloxacin 500mg Tablets', category: 'Antibiotics', unit: 'strips', unit_price: 38, min_threshold: 110, critical_threshold: 35 },
  { id: 'med-011', name: 'Iron & Folic Acid Tablets (IFA)', category: 'Maternal Health', unit: 'strips', unit_price: 12, min_threshold: 350, critical_threshold: 80 },
  { id: 'med-012', name: 'Azithromycin 500mg Tablets', category: 'Antibiotics', unit: 'strips', unit_price: 70, min_threshold: 90, critical_threshold: 30 },
  { id: 'med-013', name: 'Normal Saline IV 0.9% 500ml', category: 'Essential Fluids', unit: 'bottles', unit_price: 35, min_threshold: 160, critical_threshold: 50 },
  { id: 'med-014', name: 'Dextrose 5% IV 500ml', category: 'Essential Fluids', unit: 'bottles', unit_price: 38, min_threshold: 140, critical_threshold: 45 },
  { id: 'med-015', name: 'Zinc Sulphate 20mg Tablets', category: 'Pediatric Care', unit: 'strips', unit_price: 15, min_threshold: 120, critical_threshold: 35 },
];

export function generateOfflineBatches(phcId: string): InventoryBatch[] {
  const now = new Date();
  const plusDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split('T')[0];

  return [
    { id: `bat-${phcId}-01`, phc_id: phcId, medicine_id: 'med-001', batch_no: 'AMX-2026-081', received_qty: 300, remaining_qty: 180, minimum_threshold: 120, expiry_date: plusDays(180), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
    { id: `bat-${phcId}-02`, phc_id: phcId, medicine_id: 'med-001', batch_no: 'AMX-2026-044', received_qty: 100, remaining_qty: 35, minimum_threshold: 120, expiry_date: plusDays(28), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
    { id: `bat-${phcId}-03`, phc_id: phcId, medicine_id: 'med-002', batch_no: 'MET-2026-112', received_qty: 400, remaining_qty: 240, minimum_threshold: 200, expiry_date: plusDays(320), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
    { id: `bat-${phcId}-04`, phc_id: phcId, medicine_id: 'med-003', batch_no: 'PCM-2026-901', received_qty: 600, remaining_qty: 420, minimum_threshold: 300, expiry_date: plusDays(400), received_at: now.toISOString(), source: 'District Drug Warehouse' },
    { id: `bat-${phcId}-05`, phc_id: phcId, medicine_id: 'med-004', batch_no: 'INS-2026-019', received_qty: 80, remaining_qty: 18, minimum_threshold: 40, expiry_date: plusDays(65), received_at: now.toISOString(), source: 'Cold Chain Express Logistics' },
    { id: `bat-${phcId}-06`, phc_id: phcId, medicine_id: 'med-005', batch_no: 'CEF-2026-302', received_qty: 120, remaining_qty: 75, minimum_threshold: 60, expiry_date: plusDays(210), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
    { id: `bat-${phcId}-07`, phc_id: phcId, medicine_id: 'med-006', batch_no: 'ORS-2026-554', received_qty: 800, remaining_qty: 520, minimum_threshold: 400, expiry_date: plusDays(360), received_at: now.toISOString(), source: 'Disaster Relief Stock' },
    { id: `bat-${phcId}-08`, phc_id: phcId, medicine_id: 'med-007', batch_no: 'RAB-2026-004', received_qty: 30, remaining_qty: 14, minimum_threshold: 20, expiry_date: plusDays(90), received_at: now.toISOString(), source: 'State Serum Institute' },
    { id: `bat-${phcId}-09`, phc_id: phcId, medicine_id: 'med-008', batch_no: 'ATV-2026-211', received_qty: 250, remaining_qty: 165, minimum_threshold: 150, expiry_date: plusDays(280), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
    { id: `bat-${phcId}-10`, phc_id: phcId, medicine_id: 'med-009', batch_no: 'AML-2026-108', received_qty: 300, remaining_qty: 195, minimum_threshold: 180, expiry_date: plusDays(310), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
    { id: `bat-${phcId}-11`, phc_id: phcId, medicine_id: 'med-010', batch_no: 'CIP-2026-092', received_qty: 200, remaining_qty: 125, minimum_threshold: 110, expiry_date: plusDays(195), received_at: now.toISOString(), source: 'District Drug Warehouse' },
    { id: `bat-${phcId}-12`, phc_id: phcId, medicine_id: 'med-011', batch_no: 'IFA-2026-801', received_qty: 500, remaining_qty: 390, minimum_threshold: 350, expiry_date: plusDays(450), received_at: now.toISOString(), source: 'NHM Maternal Health Depot' },
    { id: `bat-${phcId}-13`, phc_id: phcId, medicine_id: 'med-013', batch_no: 'NS-2026-441', received_qty: 250, remaining_qty: 170, minimum_threshold: 160, expiry_date: plusDays(300), received_at: now.toISOString(), source: 'State Medical Supply Depot' },
  ];
}

export function generateOfflineStaff(phcId: string): StaffRegistry[] {
  const now = new Date().toISOString();
  return [
    { id: `stf-${phcId}-01`, phc_id: phcId, name: 'Dr. Anjali Sharma', role: 'doctor', phone: '+91 9876543210', email: 'dr.anjali@phc.gov.in', active: true },
    { id: `stf-${phcId}-02`, phc_id: phcId, name: 'Dr. Rajesh Patil', role: 'doctor', phone: '+91 9876543211', email: 'dr.rajesh@phc.gov.in', active: true },
    { id: `stf-${phcId}-03`, phc_id: phcId, name: 'Suresh More', role: 'pharmacist', phone: '+91 9876543212', email: 'pharmacist@phc.gov.in', active: true },
    { id: `stf-${phcId}-04`, phc_id: phcId, name: 'Pooja Deshmukh', role: 'nurse', phone: '+91 9876543213', email: 'pooja.nurse@phc.gov.in', active: true },
    { id: `stf-${phcId}-05`, phc_id: phcId, name: 'Kavita Shinde', role: 'nurse', phone: '+91 9876543214', email: 'kavita.nurse@phc.gov.in', active: true },
    { id: `stf-${phcId}-06`, phc_id: phcId, name: 'Sunil Jadhav', role: 'technician', phone: '+91 9876543215', email: 'lab@phc.gov.in', active: true },
  ];
}

export function generateOfflineEquipment(phcId: string): Equipment[] {
  const now = new Date().toISOString();
  const nextServ = new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0];

  return [
    { id: `eq-${phcId}-01`, phc_id: phcId, equipment_type: 'Medical Oxygen Concentrator 10L', quantity: 5, working_qty: 5, non_working_qty: 0, maintenance_status: 'operational', last_serviced_at: now, next_service_date: nextServ, created_at: now },
    { id: `eq-${phcId}-02`, phc_id: phcId, equipment_type: 'ILR Cold-Chain Refrigerator 240L', quantity: 2, working_qty: 2, non_working_qty: 0, maintenance_status: 'operational', last_serviced_at: now, next_service_date: nextServ, created_at: now },
    { id: `eq-${phcId}-03`, phc_id: phcId, equipment_type: 'Multipara Patient Monitor', quantity: 6, working_qty: 5, non_working_qty: 1, maintenance_status: 'maintenance', last_serviced_at: now, next_service_date: nextServ, created_at: now },
    { id: `eq-${phcId}-04`, phc_id: phcId, equipment_type: 'Electric Suction Apparatus', quantity: 4, working_qty: 4, non_working_qty: 0, maintenance_status: 'operational', last_serviced_at: now, next_service_date: nextServ, created_at: now },
    { id: `eq-${phcId}-05`, phc_id: phcId, equipment_type: 'Semi-Auto Biochemistry Analyzer', quantity: 1, working_qty: 1, non_working_qty: 0, maintenance_status: 'operational', last_serviced_at: now, next_service_date: nextServ, created_at: now },
  ];
}

export function generateOfflineFootfall(phcId: string): PatientFootfall[] {
  const footfalls: PatientFootfall[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dtStr = d.toISOString().split('T')[0];

    const opdBase = 65 + (i * 7) % 25;
    const emgBase = 8 + (i * 3) % 8;
    const admBase = 4 + (i * 2) % 6;
    const refBase = 2 + (i % 4);

    footfalls.push(
      { id: `ft-${phcId}-${dtStr}-opd`, phc_id: phcId, date: dtStr, category: 'opd', count: opdBase, created_at: now.toISOString() },
      { id: `ft-${phcId}-${dtStr}-emg`, phc_id: phcId, date: dtStr, category: 'emergency', count: emgBase, created_at: now.toISOString() },
      { id: `ft-${phcId}-${dtStr}-adm`, phc_id: phcId, date: dtStr, category: 'admission', count: admBase, created_at: now.toISOString() },
      { id: `ft-${phcId}-${dtStr}-ref`, phc_id: phcId, date: dtStr, category: 'referral', count: refBase, created_at: now.toISOString() }
    );
  }

  return footfalls;
}

export function generateOfflineAlerts(phcId: string): Alert[] {
  const now = new Date().toISOString();
  return [
    {
      id: `alt-${phcId}-01`,
      phc_id: phcId,
      alert_type: 'stockout',
      severity: 'medium',
      title: 'Low Stock Warning',
      message: 'Human Regular Insulin below safety reserve (18 vials remaining). Request replenishment.',
      source_module: 'inventory',
      payload: { medicine_name: 'Human Regular Insulin 40 IU/ml', current_qty: 18, min_threshold: 40 },
      status: 'open',
      created_at: now,
    },
    {
      id: `alt-${phcId}-02`,
      phc_id: phcId,
      alert_type: 'near_expiry',
      severity: 'medium',
      title: 'Near Expiry Warning',
      message: 'Amoxicillin Batch AMX-2026-044 expires in 28 days. Prioritize FEFO dispensing.',
      source_module: 'inventory',
      payload: { batch_no: 'AMX-2026-044', days_left: 28 },
      status: 'open',
      created_at: now,
    },
  ];
}
