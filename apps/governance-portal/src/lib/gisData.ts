// ─────────────────────────────────────────────────────────────────────────────
// GIS Map Data & Inter-PHC Supply Routes
// Masterplan: MapLibre + Deck.gl Multi-Layer Geographics
// Constraint: Supply routes are visible strictly from PHC to PHC only.
// ─────────────────────────────────────────────────────────────────────────────

export interface PhcGisFeature {
  id: string;
  name: string;
  code: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: '24x7_PHC' | 'Urban_PHC' | 'Sub_Center' | 'CHC';
  population: number;
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  medicineCoverageDays: number;
  medicineStatus: 'adequate' | 'low' | 'critical' | 'stockout';
  bedOccupancy: number; // percentage (0 - 100)
  totalBeds: number;
  oxygenDays: number;
  oxygenStatus: 'stable' | 'warning' | 'critical';
  staffShortagePct: number; // vacancy rate (0 - 100)
  activeStaff: number;
  totalStaff: number;
  hasEmergency: boolean;
  emergencyDetail?: string;
  lastSyncTime: string;
}

export interface PhcSupplyRoute {
  id: string;
  fromPhcId: string;
  fromPhcName: string;
  fromCoords: [number, number]; // [lng, lat]
  toPhcId: string;
  toPhcName: string;
  toCoords: [number, number]; // [lng, lat]
  stateId: string;
  districtId: string; // District where the route operates (or cross-district)
  commodity: string;
  quantity: number;
  unit: string;
  etaHours: number;
  status: 'in_transit' | 'dispatched' | 'scheduled';
}

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const GIS_PHCS: PhcGisFeature[] = [
  // ── Pune District (Maharashtra) ────────────────────────────────────────────
  {
    id: 'phc-hadapsar',
    name: 'Hadapsar 24x7 PHC',
    code: 'PHC-MH-PUN-001',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [73.926, 18.5018],
    type: '24x7_PHC',
    population: 28400,
    riskScore: 84,
    riskLevel: 'CRITICAL',
    medicineCoverageDays: 1.2,
    medicineStatus: 'critical',
    bedOccupancy: 94,
    totalBeds: 24,
    oxygenDays: 0.9,
    oxygenStatus: 'critical',
    staffShortagePct: 35,
    activeStaff: 15,
    totalStaff: 23,
    hasEmergency: true,
    emergencyDetail: 'Stage-2 Dengue & Chikungunya vector cluster (42 cases)',
    lastSyncTime: minutesAgo(6),
  },
  {
    id: 'phc-shirur',
    name: 'Shirur Rural PHC',
    code: 'PHC-MH-PUN-002',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [74.3789, 18.8256],
    type: '24x7_PHC',
    population: 34100,
    riskScore: 68,
    riskLevel: 'HIGH',
    medicineCoverageDays: 2.8,
    medicineStatus: 'low',
    bedOccupancy: 78,
    totalBeds: 20,
    oxygenDays: 2.1,
    oxygenStatus: 'warning',
    staffShortagePct: 22,
    activeStaff: 18,
    totalStaff: 23,
    hasEmergency: false,
    lastSyncTime: minutesAgo(21),
  },
  {
    id: 'phc-baramati',
    name: 'Baramati Model CHC & PHC',
    code: 'PHC-MH-PUN-003',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [74.577, 18.1517],
    type: 'CHC',
    population: 46200,
    riskScore: 28,
    riskLevel: 'LOW',
    medicineCoverageDays: 42.0,
    medicineStatus: 'adequate',
    bedOccupancy: 65,
    totalBeds: 40,
    oxygenDays: 6.4,
    oxygenStatus: 'stable',
    staffShortagePct: 8,
    activeStaff: 34,
    totalStaff: 37,
    hasEmergency: false,
    lastSyncTime: minutesAgo(12),
  },
  {
    id: 'phc-haveli',
    name: 'Haveli Sub-Center PHC',
    code: 'PHC-MH-PUN-004',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [73.8911, 18.4412],
    type: 'Sub_Center',
    population: 18900,
    riskScore: 76,
    riskLevel: 'HIGH',
    medicineCoverageDays: 0.0,
    medicineStatus: 'stockout',
    bedOccupancy: 88,
    totalBeds: 12,
    oxygenDays: 1.1,
    oxygenStatus: 'warning',
    staffShortagePct: 40,
    activeStaff: 6,
    totalStaff: 10,
    hasEmergency: true,
    emergencyDetail: 'Antibiotics stockout & pending fever patient transfers',
    lastSyncTime: minutesAgo(140), // Stale sync demo
  },
  {
    id: 'phc-junnar',
    name: 'Junnar Tribal Health Centre',
    code: 'PHC-MH-PUN-005',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [73.8764, 19.2064],
    type: '24x7_PHC',
    population: 22700,
    riskScore: 82,
    riskLevel: 'CRITICAL',
    medicineCoverageDays: 2.1,
    medicineStatus: 'low',
    bedOccupancy: 91,
    totalBeds: 18,
    oxygenDays: 0.8,
    oxygenStatus: 'critical',
    staffShortagePct: 45,
    activeStaff: 11,
    totalStaff: 20,
    hasEmergency: true,
    emergencyDetail: 'ILR Refrigerator Temp Breach (+9.4°C) - Vaccine Relocation Alert',
    lastSyncTime: minutesAgo(210), // Stale
  },
  {
    id: 'phc-bhor',
    name: 'Bhor Mountain Valley PHC',
    code: 'PHC-MH-PUN-006',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [73.8443, 18.1594],
    type: '24x7_PHC',
    population: 26000,
    riskScore: 48,
    riskLevel: 'MODERATE',
    medicineCoverageDays: 16.5,
    medicineStatus: 'adequate',
    bedOccupancy: 70,
    totalBeds: 16,
    oxygenDays: 3.5,
    oxygenStatus: 'stable',
    staffShortagePct: 15,
    activeStaff: 17,
    totalStaff: 20,
    hasEmergency: false,
    lastSyncTime: minutesAgo(35),
  },

  // ── Mumbai Suburban District (Maharashtra) ──────────────────────────────────
  {
    id: 'phc-andheri',
    name: 'Andheri East Urban Health Centre',
    code: 'PHC-MH-MUM-001',
    districtId: 'dist-mum',
    districtName: 'Mumbai Suburban',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [72.8697, 19.1136],
    type: 'Urban_PHC',
    population: 52000,
    riskScore: 54,
    riskLevel: 'MODERATE',
    medicineCoverageDays: 22.0,
    medicineStatus: 'adequate',
    bedOccupancy: 84,
    totalBeds: 30,
    oxygenDays: 4.8,
    oxygenStatus: 'stable',
    staffShortagePct: 12,
    activeStaff: 28,
    totalStaff: 32,
    hasEmergency: false,
    lastSyncTime: minutesAgo(10),
  },
  {
    id: 'phc-chembur',
    name: 'Chembur Health Post',
    code: 'PHC-MH-MUM-002',
    districtId: 'dist-mum',
    districtName: 'Mumbai Suburban',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [72.8974, 19.0622],
    type: 'Urban_PHC',
    population: 48000,
    riskScore: 42,
    riskLevel: 'MODERATE',
    medicineCoverageDays: 18.0,
    medicineStatus: 'adequate',
    bedOccupancy: 72,
    totalBeds: 25,
    oxygenDays: 5.2,
    oxygenStatus: 'stable',
    staffShortagePct: 10,
    activeStaff: 25,
    totalStaff: 28,
    hasEmergency: false,
    lastSyncTime: minutesAgo(14),
  },
  {
    id: 'phc-kurla',
    name: 'Kurla Central Health Post',
    code: 'PHC-MH-MUM-003',
    districtId: 'dist-mum',
    districtName: 'Mumbai Suburban',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [72.8845, 19.0726],
    type: 'Urban_PHC',
    population: 61000,
    riskScore: 71,
    riskLevel: 'HIGH',
    medicineCoverageDays: 3.2,
    medicineStatus: 'low',
    bedOccupancy: 96,
    totalBeds: 35,
    oxygenDays: 1.8,
    oxygenStatus: 'warning',
    staffShortagePct: 28,
    activeStaff: 25,
    totalStaff: 35,
    hasEmergency: false,
    lastSyncTime: minutesAgo(40),
  },

  // ── Thane District (Maharashtra) ───────────────────────────────────────────
  {
    id: 'phc-kalyan',
    name: 'Kalyan East PHC',
    code: 'PHC-MH-THA-001',
    districtId: 'dist-thane',
    districtName: 'Thane',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [73.1305, 19.2403],
    type: '24x7_PHC',
    population: 39000,
    riskScore: 66,
    riskLevel: 'HIGH',
    medicineCoverageDays: 4.1,
    medicineStatus: 'low',
    bedOccupancy: 82,
    totalBeds: 24,
    oxygenDays: 2.5,
    oxygenStatus: 'warning',
    staffShortagePct: 20,
    activeStaff: 19,
    totalStaff: 24,
    hasEmergency: false,
    lastSyncTime: minutesAgo(18),
  },
  {
    id: 'phc-murbad',
    name: 'Murbad Rural PHC',
    code: 'PHC-MH-THA-002',
    districtId: 'dist-thane',
    districtName: 'Thane',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    coordinates: [73.4024, 19.2547],
    type: '24x7_PHC',
    population: 26500,
    riskScore: 74,
    riskLevel: 'HIGH',
    medicineCoverageDays: 1.5,
    medicineStatus: 'critical',
    bedOccupancy: 89,
    totalBeds: 18,
    oxygenDays: 1.2,
    oxygenStatus: 'warning',
    staffShortagePct: 35,
    activeStaff: 11,
    totalStaff: 17,
    hasEmergency: true,
    emergencyDetail: 'High pediatric viral pneumonia admissions',
    lastSyncTime: minutesAgo(110),
  },

  // ── Uttar Pradesh (Lucknow & Varanasi) ──────────────────────────────────────
  {
    id: 'phc-malihabad',
    name: 'Malihabad CHC & PHC',
    code: 'PHC-UP-LKO-001',
    districtId: 'dist-lucknow',
    districtName: 'Lucknow',
    stateId: 'state-up',
    stateName: 'Uttar Pradesh',
    coordinates: [80.7126, 26.9214],
    type: 'CHC',
    population: 42000,
    riskScore: 58,
    riskLevel: 'MODERATE',
    medicineCoverageDays: 14.2,
    medicineStatus: 'adequate',
    bedOccupancy: 85,
    totalBeds: 30,
    oxygenDays: 3.8,
    oxygenStatus: 'stable',
    staffShortagePct: 20,
    activeStaff: 24,
    totalStaff: 30,
    hasEmergency: false,
    lastSyncTime: minutesAgo(15),
  },
  {
    id: 'phc-chinhat',
    name: 'Chinhat Community PHC',
    code: 'PHC-UP-LKO-002',
    districtId: 'dist-lucknow',
    districtName: 'Lucknow',
    stateId: 'state-up',
    stateName: 'Uttar Pradesh',
    coordinates: [81.0167, 26.8833],
    type: '24x7_PHC',
    population: 36000,
    riskScore: 72,
    riskLevel: 'HIGH',
    medicineCoverageDays: 2.4,
    medicineStatus: 'low',
    bedOccupancy: 91,
    totalBeds: 22,
    oxygenDays: 1.4,
    oxygenStatus: 'warning',
    staffShortagePct: 30,
    activeStaff: 14,
    totalStaff: 20,
    hasEmergency: true,
    emergencyDetail: 'Acute gastroenteritis outbreak alert',
    lastSyncTime: minutesAgo(28),
  },
  {
    id: 'phc-ramnagar',
    name: 'Ramnagar Urban PHC',
    code: 'PHC-UP-VNS-001',
    districtId: 'dist-varanasi',
    districtName: 'Varanasi',
    stateId: 'state-up',
    stateName: 'Uttar Pradesh',
    coordinates: [83.0294, 25.2677],
    type: 'Urban_PHC',
    population: 31000,
    riskScore: 78,
    riskLevel: 'HIGH',
    medicineCoverageDays: 1.8,
    medicineStatus: 'critical',
    bedOccupancy: 93,
    totalBeds: 25,
    oxygenDays: 1.0,
    oxygenStatus: 'critical',
    staffShortagePct: 38,
    activeStaff: 13,
    totalStaff: 21,
    hasEmergency: true,
    emergencyDetail: 'Oxygen cylinder turnover delay & bed overflow',
    lastSyncTime: minutesAgo(19),
  },

  // ── Tamil Nadu (Chennai & Coimbatore) ───────────────────────────────────────
  {
    id: 'phc-guindy',
    name: 'Guindy Urban Health Centre',
    code: 'PHC-TN-CHN-001',
    districtId: 'dist-chennai',
    districtName: 'Chennai',
    stateId: 'state-tn',
    stateName: 'Tamil Nadu',
    coordinates: [80.2025, 13.0067],
    type: 'Urban_PHC',
    population: 45000,
    riskScore: 24,
    riskLevel: 'LOW',
    medicineCoverageDays: 38.0,
    medicineStatus: 'adequate',
    bedOccupancy: 60,
    totalBeds: 30,
    oxygenDays: 7.0,
    oxygenStatus: 'stable',
    staffShortagePct: 5,
    activeStaff: 30,
    totalStaff: 32,
    hasEmergency: false,
    lastSyncTime: minutesAgo(5),
  },
  {
    id: 'phc-pollachi',
    name: 'Pollachi Taluk PHC',
    code: 'PHC-TN-CBE-001',
    districtId: 'dist-coimbatore',
    districtName: 'Coimbatore',
    stateId: 'state-tn',
    stateName: 'Tamil Nadu',
    coordinates: [77.0048, 10.6609],
    type: '24x7_PHC',
    population: 29000,
    riskScore: 55,
    riskLevel: 'MODERATE',
    medicineCoverageDays: 6.2,
    medicineStatus: 'low',
    bedOccupancy: 76,
    totalBeds: 20,
    oxygenDays: 3.1,
    oxygenStatus: 'stable',
    staffShortagePct: 15,
    activeStaff: 17,
    totalStaff: 20,
    hasEmergency: false,
    lastSyncTime: minutesAgo(20),
  },

  // ── Karnataka (Bengaluru Urban) ─────────────────────────────────────────────
  {
    id: 'phc-whitefield',
    name: 'Whitefield Primary Health Centre',
    code: 'PHC-KA-BLR-001',
    districtId: 'dist-bengaluru',
    districtName: 'Bengaluru Urban',
    stateId: 'state-ka',
    stateName: 'Karnataka',
    coordinates: [77.75, 12.9698],
    type: 'Urban_PHC',
    population: 58000,
    riskScore: 32,
    riskLevel: 'LOW',
    medicineCoverageDays: 32.0,
    medicineStatus: 'adequate',
    bedOccupancy: 68,
    totalBeds: 30,
    oxygenDays: 5.8,
    oxygenStatus: 'stable',
    staffShortagePct: 10,
    activeStaff: 27,
    totalStaff: 30,
    hasEmergency: false,
    lastSyncTime: minutesAgo(11),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Inter-PHC Supply Routes
// MANDATORY REQUIREMENT: "the supply routes should be visible from phc to phc only"
// ─────────────────────────────────────────────────────────────────────────────
export const GIS_SUPPLY_ROUTES: PhcSupplyRoute[] = [
  // Route 1: Baramati (Surplus) -> Hadapsar (Critical shortage)
  {
    id: 'route-pune-01',
    fromPhcId: 'phc-baramati',
    fromPhcName: 'Baramati Model CHC',
    fromCoords: [74.577, 18.1517],
    toPhcId: 'phc-hadapsar',
    toPhcName: 'Hadapsar 24x7 PHC',
    toCoords: [73.926, 18.5018],
    stateId: 'state-mh',
    districtId: 'dist-pune',
    commodity: 'Amoxicillin 500mg',
    quantity: 2500,
    unit: 'capsules',
    etaHours: 1.8,
    status: 'in_transit',
  },

  // Route 2: Baramati -> Haveli Sub-Center (Stockout resolution)
  {
    id: 'route-pune-02',
    fromPhcId: 'phc-baramati',
    fromPhcName: 'Baramati Model CHC',
    fromCoords: [74.577, 18.1517],
    toPhcId: 'phc-haveli',
    toPhcName: 'Haveli Sub-Center PHC',
    toCoords: [73.8911, 18.4412],
    stateId: 'state-mh',
    districtId: 'dist-pune',
    commodity: 'ORS & Zinc Dispersible',
    quantity: 4000,
    unit: 'sachets',
    etaHours: 2.1,
    status: 'in_transit',
  },

  // Route 3: Hadapsar -> Shirur Rural PHC
  {
    id: 'route-pune-03',
    fromPhcId: 'phc-hadapsar',
    fromPhcName: 'Hadapsar 24x7 PHC',
    fromCoords: [73.926, 18.5018],
    toPhcId: 'phc-shirur',
    toPhcName: 'Shirur Rural PHC',
    toCoords: [74.3789, 18.8256],
    stateId: 'state-mh',
    districtId: 'dist-pune',
    commodity: 'Paracetamol & IV Saline',
    quantity: 1200,
    unit: 'units',
    etaHours: 1.4,
    status: 'dispatched',
  },

  // Route 4: Bhor Mountain -> Junnar Tribal (Cold-safe vaccine shuttle)
  {
    id: 'route-pune-04',
    fromPhcId: 'phc-bhor',
    fromPhcName: 'Bhor Mountain Valley PHC',
    fromCoords: [73.8443, 18.1594],
    toPhcId: 'phc-junnar',
    toPhcName: 'Junnar Tribal Health Centre',
    toCoords: [73.8764, 19.2064],
    stateId: 'state-mh',
    districtId: 'dist-pune',
    commodity: 'Pentavalent & BCG Vaccines (ILR Backup)',
    quantity: 380,
    unit: 'vials',
    etaHours: 2.6,
    status: 'in_transit',
  },

  // Route 5: Chembur -> Kurla (Urban Inter-PHC stock redistribution)
  {
    id: 'route-mum-01',
    fromPhcId: 'phc-chembur',
    fromPhcName: 'Chembur Health Post',
    fromCoords: [72.8974, 19.0622],
    toPhcId: 'phc-kurla',
    toPhcName: 'Kurla Central Health Post',
    toCoords: [72.8845, 19.0726],
    stateId: 'state-mh',
    districtId: 'dist-mum',
    commodity: 'Salbutamol Inhalers & Azithromycin',
    quantity: 800,
    unit: 'units',
    etaHours: 0.6,
    status: 'in_transit',
  },

  // Route 6: Kalyan -> Murbad (Thane District)
  {
    id: 'route-tha-01',
    fromPhcId: 'phc-kalyan',
    fromPhcName: 'Kalyan East PHC',
    fromCoords: [73.1305, 19.2403],
    toPhcId: 'phc-murbad',
    toPhcName: 'Murbad Rural PHC',
    toCoords: [73.4024, 19.2547],
    stateId: 'state-mh',
    districtId: 'dist-thane',
    commodity: 'Pediatric Antibiotic Syrups',
    quantity: 1500,
    unit: 'bottles',
    etaHours: 1.1,
    status: 'scheduled',
  },

  // Route 7: Malihabad -> Chinhat (Lucknow District)
  {
    id: 'route-up-01',
    fromPhcId: 'phc-malihabad',
    fromPhcName: 'Malihabad CHC',
    fromCoords: [80.7126, 26.9214],
    toPhcId: 'phc-chinhat',
    toPhcName: 'Chinhat Community PHC',
    toCoords: [81.0167, 26.8833],
    stateId: 'state-up',
    districtId: 'dist-lucknow',
    commodity: 'Metronidazole & Dextrose IV Fluids',
    quantity: 3200,
    unit: 'units',
    etaHours: 1.2,
    status: 'in_transit',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Geographic bounding boxes & camera targets for role-based confinement
// ─────────────────────────────────────────────────────────────────────────────
export interface GeoExtent {
  center: [number, number]; // [lng, lat]
  zoom: number;
  minZoom: number;
  maxZoom: number;
  bounds?: [[number, number], [number, number]]; // [[swLng, swLat], [neLng, neLat]]
}

export const JURISDICTION_EXTENTS: Record<string, GeoExtent> = {
  // National scope
  national: {
    center: [78.9629, 20.5937],
    zoom: 4.8,
    minZoom: 3.5,
    maxZoom: 17,
    bounds: [
      [68.1, 6.7],
      [97.4, 35.5],
    ],
  },
  // Maharashtra State
  'state-mh': {
    center: [75.7139, 19.7515],
    zoom: 6.8,
    minZoom: 5.5,
    maxZoom: 17,
    bounds: [
      [72.5, 15.6],
      [80.9, 22.1],
    ],
  },
  // Uttar Pradesh State
  'state-up': {
    center: [80.9462, 26.8467],
    zoom: 6.6,
    minZoom: 5.5,
    maxZoom: 17,
    bounds: [
      [77.0, 23.8],
      [84.7, 30.5],
    ],
  },
  // Tamil Nadu State
  'state-tn': {
    center: [78.6569, 11.1271],
    zoom: 6.9,
    minZoom: 5.8,
    maxZoom: 17,
    bounds: [
      [76.2, 8.0],
      [80.4, 13.6],
    ],
  },
  // Karnataka State
  'state-ka': {
    center: [75.7139, 15.3173],
    zoom: 6.8,
    minZoom: 5.6,
    maxZoom: 17,
    bounds: [
      [74.0, 11.5],
      [78.6, 18.5],
    ],
  },
  // Pune District (Locked for district_admin Suresh Iyer)
  'dist-pune': {
    center: [74.15, 18.62],
    zoom: 9.3,
    minZoom: 8.2, // District admin cannot zoom out past district boundary
    maxZoom: 17,
    bounds: [
      [73.2, 17.8],
      [75.2, 19.4],
    ],
  },
  // Mumbai Suburban District
  'dist-mum': {
    center: [72.88, 19.08],
    zoom: 11.0,
    minZoom: 9.8,
    maxZoom: 17,
    bounds: [
      [72.7, 18.8],
      [73.1, 19.3],
    ],
  },
  // Thane District
  'dist-thane': {
    center: [73.25, 19.25],
    zoom: 9.8,
    minZoom: 8.5,
    maxZoom: 17,
    bounds: [
      [72.8, 18.9],
      [73.6, 19.6],
    ],
  },
  // Lucknow District
  'dist-lucknow': {
    center: [80.94, 26.85],
    zoom: 10.2,
    minZoom: 9.0,
    maxZoom: 17,
    bounds: [
      [80.6, 26.6],
      [81.2, 27.1],
    ],
  },
};
