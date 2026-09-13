import { db } from './index';
import {
  PHCFacility,
  Equipment,
  Medicine,
  InventoryBatch,
  StaffRegistry,
  StaffAttendance,
  PatientFootfall,
  ResourceRequest,
  Alert,
  State,
  District,
  SystemConfig,
  BillingTransaction,
  DispensedItem,
  StockMovement,
} from '../types';

export const CURRENT_PHC_ID = 'phc-varanasi-rampur-001';
export const CURRENT_DEVICE_ID = 'dev-phc-tab-01';

export async function initializeDatabase() {
  const facilityCount = await db.phc_facilities.count();
  if (facilityCount > 0) {
    return; // Database already seeded
  }

  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  // 1. States & Districts
  const states: State[] = [
    { id: 'state-up', name: 'Uttar Pradesh', code: 'UP' },
    { id: 'state-mh', name: 'Maharashtra', code: 'MH' },
    { id: 'state-br', name: 'Bihar', code: 'BR' },
    { id: 'state-tn', name: 'Tamil Nadu', code: 'TN' },
  ];

  const districts: District[] = [
    { id: 'dist-varanasi', state_id: 'state-up', name: 'Varanasi' },
    { id: 'dist-gorakhpur', state_id: 'state-up', name: 'Gorakhpur' },
    { id: 'dist-lucknow', state_id: 'state-up', name: 'Lucknow' },
    { id: 'dist-pune', state_id: 'state-mh', name: 'Pune' },
    { id: 'dist-patna', state_id: 'state-br', name: 'Patna' },
  ];

  // 2. Primary PHC Facility
  const facility: PHCFacility = {
    id: CURRENT_PHC_ID,
    name: 'PHC Rampur',
    district_id: 'dist-varanasi',
    state_id: 'state-up',
    district_name: 'Varanasi',
    state_name: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    address: 'Rural Health Center, Block Rampur, Varanasi, UP - 221001',
    contact_phone: '+91 542 2289410',
    contact_email: 'phc.rampur.up@gov.in',
    total_beds: 24,
    emergency_beds: 6,
    isolation_beds: 4,
    occupied_beds: 19,
    oxygen_cylinders: 12,
    oxygen_concentrators: 4,
    status: 'active',
    operational_status: 'operational',
    emergency_capability: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: nowIso,
  };

  // 3. Medicines Master
  const medicines: Medicine[] = [
    {
      id: 'med-01',
      name: 'Paracetamol 500mg Tablets',
      category: 'Analgesics / Antipyretic',
      unit: 'Tablets',
      unit_price: 1.5,
      min_threshold: 400,
      critical_threshold: 150,
      description: 'First-line antipyretic and mild analgesic',
    },
    {
      id: 'med-02',
      name: 'Amoxicillin 500mg Capsules',
      category: 'Antibiotics',
      unit: 'Capsules',
      unit_price: 4.2,
      min_threshold: 300,
      critical_threshold: 100,
      description: 'Broad-spectrum beta-lactam antibiotic',
    },
    {
      id: 'med-03',
      name: 'Regular Human Insulin 100IU/ml',
      category: 'Antidiabetic',
      unit: 'Vials',
      unit_price: 145.0,
      min_threshold: 25,
      critical_threshold: 10,
      description: 'Short-acting insulin for glycemic control',
    },
    {
      id: 'med-04',
      name: 'Oral Rehydration Salts (ORS) 21.8g',
      category: 'Rehydration',
      unit: 'Sachets',
      unit_price: 5.0,
      min_threshold: 250,
      critical_threshold: 80,
      description: 'WHO formula oral rehydration powder',
    },
    {
      id: 'med-05',
      name: 'Metformin 500mg Tablets',
      category: 'Antidiabetic',
      unit: 'Tablets',
      unit_price: 2.0,
      min_threshold: 350,
      critical_threshold: 120,
      description: 'First line medication for Type 2 Diabetes',
    },
    {
      id: 'med-06',
      name: 'Azithromycin 500mg Tablets',
      category: 'Antibiotics',
      unit: 'Tablets',
      unit_price: 12.0,
      min_threshold: 150,
      critical_threshold: 50,
      description: 'Macrolide antibiotic for respiratory & skin infections',
    },
    {
      id: 'med-07',
      name: 'Pantoprazole 40mg Tablets',
      category: 'Gastrointestinal',
      unit: 'Tablets',
      unit_price: 3.5,
      min_threshold: 200,
      critical_threshold: 60,
      description: 'Proton pump inhibitor for acid reflux',
    },
    {
      id: 'med-08',
      name: 'Salbutamol Inhaler 100mcg',
      category: 'Respiratory',
      unit: 'Inhalers',
      unit_price: 85.0,
      min_threshold: 20,
      critical_threshold: 8,
      description: 'Bronchodilator for asthma and COPD relief',
    },
    {
      id: 'med-09',
      name: 'Tetanus Toxoid 0.5ml Ampoule',
      category: 'Vaccines',
      unit: 'Ampoules',
      unit_price: 18.0,
      min_threshold: 50,
      critical_threshold: 15,
      description: 'Active immunization against tetanus',
    },
    {
      id: 'med-10',
      name: 'Dextrose Normal Saline (DNS) 500ml',
      category: 'IV Fluids',
      unit: 'Bottles',
      unit_price: 32.0,
      min_threshold: 80,
      critical_threshold: 25,
      description: 'Electrolyte and fluid replenishment IV',
    },
  ];

  // Helper date function
  const addDays = (d: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };

  // 4. Batches (FEFO Unit)
  const batches: InventoryBatch[] = [
    // Paracetamol: 2 batches (Batch 1 expiring in 25 days - near expiry; Batch 2 in 180 days)
    {
      id: 'batch-pcm-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-01',
      batch_no: 'PCM-2025-A',
      received_qty: 600,
      remaining_qty: 120,
      minimum_threshold: 200,
      expiry_date: addDays(25),
      received_at: '2026-01-10T08:00:00Z',
      source: 'State Medical Supply Depot',
    },
    {
      id: 'batch-pcm-02',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-01',
      batch_no: 'PCM-2026-B',
      received_qty: 800,
      remaining_qty: 650,
      minimum_threshold: 200,
      expiry_date: addDays(240),
      received_at: '2026-02-15T08:00:00Z',
      source: 'Central Medical Stores',
    },
    // Amoxicillin: 1 batch (healthy)
    {
      id: 'batch-amx-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-02',
      batch_no: 'AMX-9941',
      received_qty: 500,
      remaining_qty: 380,
      minimum_threshold: 150,
      expiry_date: addDays(150),
      received_at: '2026-02-01T08:00:00Z',
      source: 'State Medical Supply Depot',
    },
    // Insulin: 1 batch (CRITICAL LOW STOCK: only 6 vials remaining!)
    {
      id: 'batch-ins-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-03',
      batch_no: 'INS-4011',
      received_qty: 40,
      remaining_qty: 6,
      minimum_threshold: 25,
      expiry_date: addDays(60),
      received_at: '2026-01-20T08:00:00Z',
      source: 'District Cold Chain Store',
    },
    // ORS: 1 batch (healthy)
    {
      id: 'batch-ors-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-04',
      batch_no: 'ORS-772',
      received_qty: 500,
      remaining_qty: 420,
      minimum_threshold: 100,
      expiry_date: addDays(300),
      received_at: '2026-02-10T08:00:00Z',
      source: 'State Medical Supply Depot',
    },
    // Metformin: 1 batch (near threshold)
    {
      id: 'batch-met-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-05',
      batch_no: 'MET-883',
      received_qty: 500,
      remaining_qty: 310,
      minimum_threshold: 350,
      expiry_date: addDays(190),
      received_at: '2026-01-15T08:00:00Z',
      source: 'Central Medical Stores',
    },
    // Azithromycin: 1 batch (healthy)
    {
      id: 'batch-azi-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-06',
      batch_no: 'AZI-102',
      received_qty: 300,
      remaining_qty: 210,
      minimum_threshold: 150,
      expiry_date: addDays(210),
      received_at: '2026-02-05T08:00:00Z',
      source: 'State Medical Supply Depot',
    },
    // Pantoprazole: 1 batch (healthy)
    {
      id: 'batch-pan-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-07',
      batch_no: 'PAN-331',
      received_qty: 400,
      remaining_qty: 320,
      minimum_threshold: 200,
      expiry_date: addDays(280),
      received_at: '2026-02-12T08:00:00Z',
      source: 'Central Medical Stores',
    },
    // Salbutamol: 1 batch (WARNING LOW)
    {
      id: 'batch-sal-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-08',
      batch_no: 'SAL-090',
      received_qty: 30,
      remaining_qty: 12,
      minimum_threshold: 20,
      expiry_date: addDays(110),
      received_at: '2026-01-25T08:00:00Z',
      source: 'District Cold Chain Store',
    },
    // Tetanus: 1 batch (healthy)
    {
      id: 'batch-tt-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-09',
      batch_no: 'TT-551',
      received_qty: 100,
      remaining_qty: 78,
      minimum_threshold: 50,
      expiry_date: addDays(140),
      received_at: '2026-02-18T08:00:00Z',
      source: 'District Cold Chain Store',
    },
    // DNS: 1 batch (healthy)
    {
      id: 'batch-dns-01',
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-10',
      batch_no: 'DNS-112',
      received_qty: 120,
      remaining_qty: 94,
      minimum_threshold: 80,
      expiry_date: addDays(360),
      received_at: '2026-02-20T08:00:00Z',
      source: 'State Medical Supply Depot',
    },
  ];

  // 5. Equipment
  const equipment: Equipment[] = [
    {
      id: 'eq-01',
      phc_id: CURRENT_PHC_ID,
      equipment_type: 'ECG Machine 12-Channel',
      quantity: 2,
      working_qty: 1,
      non_working_qty: 1,
      maintenance_status: 'maintenance',
      last_serviced_at: '2026-01-10',
      next_service_date: addDays(5),
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'eq-02',
      phc_id: CURRENT_PHC_ID,
      equipment_type: 'Electric Suction Machine',
      quantity: 3,
      working_qty: 3,
      non_working_qty: 0,
      maintenance_status: 'operational',
      last_serviced_at: '2026-02-01',
      next_service_date: addDays(90),
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'eq-03',
      phc_id: CURRENT_PHC_ID,
      equipment_type: 'Autoclave Sterilizer 50L',
      quantity: 1,
      working_qty: 1,
      non_working_qty: 0,
      maintenance_status: 'operational',
      last_serviced_at: '2026-01-20',
      next_service_date: addDays(45),
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'eq-04',
      phc_id: CURRENT_PHC_ID,
      equipment_type: 'Centrifuge Machine',
      quantity: 2,
      working_qty: 2,
      non_working_qty: 0,
      maintenance_status: 'operational',
      last_serviced_at: '2026-02-15',
      next_service_date: addDays(120),
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'eq-05',
      phc_id: CURRENT_PHC_ID,
      equipment_type: 'Heavy-Duty Nebulizer',
      quantity: 5,
      working_qty: 4,
      non_working_qty: 1,
      maintenance_status: 'broken',
      last_serviced_at: '2025-12-15',
      next_service_date: addDays(-10),
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'eq-06',
      phc_id: CURRENT_PHC_ID,
      equipment_type: 'Fingertip Pulse Oximeter',
      quantity: 8,
      working_qty: 7,
      non_working_qty: 1,
      maintenance_status: 'operational',
      last_serviced_at: '2026-02-10',
      next_service_date: addDays(60),
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  // 6. Staff Registry
  const staff: StaffRegistry[] = [
    {
      id: 'staff-01',
      phc_id: CURRENT_PHC_ID,
      role: 'doctor',
      name: 'Dr. Rajesh Sharma',
      active: true,
      phone: '+91 98765 43210',
      email: 'dr.rajesh@phc.gov.in',
    },
    {
      id: 'staff-02',
      phc_id: CURRENT_PHC_ID,
      role: 'doctor',
      name: 'Dr. Priya Verma',
      active: true,
      phone: '+91 98765 43211',
      email: 'dr.priya@phc.gov.in',
    },
    {
      id: 'staff-03',
      phc_id: CURRENT_PHC_ID,
      role: 'nurse',
      name: 'Sunita Devi (Staff Nurse)',
      active: true,
      phone: '+91 98765 43212',
    },
    {
      id: 'staff-04',
      phc_id: CURRENT_PHC_ID,
      role: 'nurse',
      name: 'Anita Yadav (Staff Nurse)',
      active: true,
      phone: '+91 98765 43213',
    },
    {
      id: 'staff-05',
      phc_id: CURRENT_PHC_ID,
      role: 'pharmacist',
      name: 'Ramesh Kumar (Pharmacist)',
      active: true,
      phone: '+91 98765 43214',
    },
    {
      id: 'staff-06',
      phc_id: CURRENT_PHC_ID,
      role: 'technician',
      name: 'Manoj Singh (Lab Tech)',
      active: true,
      phone: '+91 98765 43215',
    },
    {
      id: 'staff-07',
      phc_id: CURRENT_PHC_ID,
      role: 'other',
      name: 'Pooja Kumari (ANM / Field Staff)',
      active: true,
      phone: '+91 98765 43216',
    },
  ];

  // 7. Today's Staff Attendance (5 Present, 1 Absent, 1 On Leave)
  const attendance: StaffAttendance[] = [
    { id: 'att-01', staff_id: 'staff-01', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'present' },
    { id: 'att-02', staff_id: 'staff-02', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'present' },
    { id: 'att-03', staff_id: 'staff-03', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'present' },
    { id: 'att-04', staff_id: 'staff-04', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'absent', notes: 'Unannounced absence' },
    { id: 'att-05', staff_id: 'staff-05', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'present' },
    { id: 'att-06', staff_id: 'staff-06', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'leave', notes: 'Approved medical leave' },
    { id: 'att-07', staff_id: 'staff-07', phc_id: CURRENT_PHC_ID, attendance_date: today, status: 'present' },
  ];

  // 8. Patient Footfall (Past 7 days)
  const footfall: PatientFootfall[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const dtStr = dt.toISOString().split('T')[0];
    const base = i === 0 ? 1 : 0; // slight variance

    footfall.push(
      { id: `ff-opd-${i}`, phc_id: CURRENT_PHC_ID, category: 'opd', count: 110 + (i * 7) + (base * 15), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-emg-${i}`, phc_id: CURRENT_PHC_ID, category: 'emergency', count: 8 + (i % 3), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-adm-${i}`, phc_id: CURRENT_PHC_ID, category: 'admission', count: 4 + (i % 2), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-ref-${i}`, phc_id: CURRENT_PHC_ID, category: 'referral', count: 3 + (i % 2), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-inf-${i}`, phc_id: CURRENT_PHC_ID, category: 'disease_infectious', count: 38 + (i * 3), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-chr-${i}`, phc_id: CURRENT_PHC_ID, category: 'disease_chronic', count: 45 + (i * 2), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-mat-${i}`, phc_id: CURRENT_PHC_ID, category: 'disease_maternal', count: 18 + (i % 4), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
      { id: `ff-oth-${i}`, phc_id: CURRENT_PHC_ID, category: 'other', count: 9 + (i % 3), date: dtStr, created_at: `${dtStr}T17:00:00Z` },
    );
  }

  // 9. Resource Requests
  const requests: ResourceRequest[] = [
    {
      id: 'req-01',
      phc_id: CURRENT_PHC_ID,
      request_type: 'medicine',
      item_ref: 'med-03',
      item_name: 'Regular Human Insulin 100IU/ml',
      quantity: 50,
      priority: 'critical',
      reason: 'threshold_breach',
      source: 'auto_draft',
      status: 'pending',
      notes: 'Stock dropped below critical threshold (6 remaining)',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'req-02',
      phc_id: CURRENT_PHC_ID,
      request_type: 'oxygen',
      item_name: 'D-Type High Pressure Oxygen Cylinders',
      quantity: 10,
      priority: 'urgent',
      reason: 'threshold_breach',
      source: 'manual',
      status: 'in_transit',
      notes: 'Dispatched from District Medical Store Varanasi',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      decided_at: new Date(Date.now() - 43200000).toISOString(),
      decided_by: 'Dr. A. K. Mishra (CMO)',
      estimated_delivery: addDays(1),
    },
    {
      id: 'req-03',
      phc_id: CURRENT_PHC_ID,
      request_type: 'medicine',
      item_ref: 'med-01',
      item_name: 'Paracetamol 500mg Tablets',
      quantity: 1000,
      priority: 'routine',
      reason: 'manual',
      source: 'manual',
      status: 'delivered',
      notes: 'Batch PCM-2026-B delivered',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      decided_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      decided_by: 'State Logistics Officer',
    },
  ];

  // 10. Alerts
  const alerts: Alert[] = [
    {
      id: 'alert-01',
      phc_id: CURRENT_PHC_ID,
      alert_type: 'stockout',
      severity: 'critical',
      title: 'Insulin Stock Critical',
      message: 'Regular Insulin 100IU stock is at 6 vials (critical threshold: 10). Projected stockout in 1.8 days.',
      source_module: 'inventory',
      payload: { medicine_id: 'med-03', remaining: 6, threshold: 10 },
      status: 'open',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'alert-02',
      phc_id: CURRENT_PHC_ID,
      alert_type: 'near_expiry',
      severity: 'medium',
      title: 'Batch Expiring in 25 Days',
      message: 'Paracetamol 500mg Batch PCM-2025-A (120 tabs remaining) will expire on ' + addDays(25) + '.',
      source_module: 'inventory',
      payload: { medicine_id: 'med-01', batch_id: 'batch-pcm-01', days_left: 25 },
      status: 'open',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'alert-03',
      phc_id: CURRENT_PHC_ID,
      alert_type: 'equipment_maintenance',
      severity: 'high',
      title: 'ECG Machine Under Maintenance',
      message: 'ECG Machine 12-Channel scheduled maintenance ongoing. 1 unit operational.',
      source_module: 'equipment',
      payload: { equipment_id: 'eq-01' },
      status: 'open',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'alert-04',
      phc_id: CURRENT_PHC_ID,
      alert_type: 'staff_shortage',
      severity: 'medium',
      title: 'Staff Nurse Absent',
      message: 'Anita Yadav (Staff Nurse) marked absent today. Shift load redistributed.',
      source_module: 'staff',
      payload: { staff_id: 'staff-04' },
      status: 'open',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

  // 11. System Configuration
  const configs: SystemConfig[] = [
    { key: 'min_stock_threshold_pct', value: 20, description: 'Percentage below which stock status becomes WARNING', updated_at: nowIso },
    { key: 'critical_stock_threshold_pct', value: 10, description: 'Percentage below which stock status becomes CRITICAL', updated_at: nowIso },
    { key: 'near_expiry_days', value: 45, description: 'Days before expiry when batch is flagged NEAR_EXPIRY', updated_at: nowIso },
    { key: 'bed_occupancy_alert_pct', value: 80, description: 'Bed occupancy percentage that triggers alert', updated_at: nowIso },
    { key: 'oxygen_critical_threshold', value: 5, description: 'Available cylinders count below which oxygen status is CRITICAL', updated_at: nowIso },
    { key: 'footfall_anomaly_sigma', value: 2.5, description: 'Standard deviation threshold for patient surge warning', updated_at: nowIso },
    { key: 'forecast_horizon_days', value: 30, description: 'Lookahead horizon for AI demand forecasts', updated_at: nowIso },
    { key: 'safety_buffer_pct', value: 15, description: 'Safety buffer percentage added to auto-draft requirements', updated_at: nowIso },
    { key: 'sync_batch_max_mutations', value: 200, description: 'Maximum pending mutations pushed per batch', updated_at: nowIso },
  ];

  // 12. Seed Historical Billing & Dispensed items (for consumption velocity calculations)
  const billing: BillingTransaction[] = [];
  const dispensed: DispensedItem[] = [];
  const movements: StockMovement[] = [];

  // Simulate past 10 days of checkouts
  for (let d = 10; d >= 1; d--) {
    const txnDt = new Date();
    txnDt.setDate(txnDt.getDate() - d);
    txnDt.setHours(10 + (d % 6), 15 * (d % 4), 0);
    const txnIso = txnDt.toISOString();
    const txnId = `seed-txn-${d}`;

    billing.push({
      id: txnId,
      phc_id: CURRENT_PHC_ID,
      client_txn_id: `seed-client-uuid-${d}`,
      patient_ref: `walk_in_pat_${d + 100}`,
      dispensed_by_staff_id: 'staff-05',
      dispensed_by_staff_name: 'Ramesh Kumar (Pharmacist)',
      total_amount: 45.0 + d * 5,
      client_timestamp: txnIso,
      server_timestamp: txnIso,
      status: 'completed',
      sync_status: 'synced',
    });

    // Paracetamol dispensed: 20 tabs per day
    dispensed.push({
      id: `seed-disp-pcm-${d}`,
      billing_transaction_id: txnId,
      batch_id: 'batch-pcm-01',
      medicine_id: 'med-01',
      medicine_name: 'Paracetamol 500mg Tablets',
      batch_no: 'PCM-2025-A',
      quantity: 20,
      unit_price: 1.5,
    });

    // Amoxicillin dispensed: 10 caps per day
    dispensed.push({
      id: `seed-disp-amx-${d}`,
      billing_transaction_id: txnId,
      batch_id: 'batch-amx-01',
      medicine_id: 'med-02',
      medicine_name: 'Amoxicillin 500mg Capsules',
      batch_no: 'AMX-9941',
      quantity: 10,
      unit_price: 4.2,
    });

    // Insulin dispensed: 2 vials every 2 days
    if (d % 2 === 0) {
      dispensed.push({
        id: `seed-disp-ins-${d}`,
        billing_transaction_id: txnId,
        batch_id: 'batch-ins-01',
        medicine_id: 'med-03',
        medicine_name: 'Regular Human Insulin 100IU/ml',
        batch_no: 'INS-4011',
        quantity: 2,
        unit_price: 145.0,
      });
    }

    movements.push({
      id: `seed-mov-${d}`,
      phc_id: CURRENT_PHC_ID,
      medicine_id: 'med-01',
      batch_id: 'batch-pcm-01',
      batch_no: 'PCM-2025-A',
      type: 'dispense',
      quantity: 20,
      previous_qty: 140 + d * 20,
      new_qty: 120 + d * 20,
      reason: 'OPD Prescription Dispense',
      user_name: 'Ramesh Kumar',
      device_id: CURRENT_DEVICE_ID,
      timestamp: txnIso,
    });
  }

  // Populate Dexie tables
  await db.transaction('rw', [
    db.states,
    db.districts,
    db.phc_facilities,
    db.medicines,
    db.inventory_batches,
    db.equipment,
    db.staff_registry,
    db.staff_attendance,
    db.patient_footfall,
    db.resource_requests,
    db.alerts,
    db.system_config,
    db.billing_transactions,
    db.dispensed_items,
    db.stock_movements,
  ], async () => {
    await db.states.bulkAdd(states);
    await db.districts.bulkAdd(districts);
    await db.phc_facilities.add(facility);
    await db.medicines.bulkAdd(medicines);
    await db.inventory_batches.bulkAdd(batches);
    await db.equipment.bulkAdd(equipment);
    await db.staff_registry.bulkAdd(staff);
    await db.staff_attendance.bulkAdd(attendance);
    await db.patient_footfall.bulkAdd(footfall);
    await db.resource_requests.bulkAdd(requests);
    await db.alerts.bulkAdd(alerts);
    await db.system_config.bulkAdd(configs);
    await db.billing_transactions.bulkAdd(billing);
    await db.dispensed_items.bulkAdd(dispensed);
    await db.stock_movements.bulkAdd(movements);
  });

  console.log('PHC Database successfully seeded with operational datasets.');
}
