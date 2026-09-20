// ─────────────────────────────────────────────────────────────────────────────
// Canonical geography hierarchy for the governance portal
// Masterplan §26: National → State → District → PHC
// ─────────────────────────────────────────────────────────────────────────────

export interface PhcNode {
  id: string;
  name: string;
  code: string;
  districtId: string;
  type: '24x7_PHC' | 'Urban_PHC' | 'Sub_Center' | 'CHC';
  population: number;
  lat: number;
  lng: number;
  lastSyncTime: string; // ISO string to simulate real-time freshness
}

export interface DistrictNode {
  id: string;
  name: string;
  code: string;
  stateId: string;
  totalPhcs: number;
  activePhcs: number;
  population: number;
  phcs: PhcNode[];
}

export interface StateNode {
  id: string;
  name: string;
  code: string;
  totalDistricts: number;
  totalPhcs: number;
  population: number;
  districts: DistrictNode[];
}

// Generate relative sync times (some fresh, some slightly delayed, some stale for testing)
const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const STATES: StateNode[] = [
  {
    id: 'state-mh',
    name: 'Maharashtra',
    code: 'MH',
    totalDistricts: 36,
    totalPhcs: 3682,
    population: 125000000,
    districts: [
      {
        id: 'dist-pune',
        name: 'Pune',
        code: 'PUN',
        stateId: 'state-mh',
        totalPhcs: 148,
        activePhcs: 145,
        population: 9429408,
        phcs: [
          {
            id: 'phc-hadapsar',
            name: 'Hadapsar PHC',
            code: 'PHC-MH-PUN-001',
            districtId: 'dist-pune',
            type: '24x7_PHC',
            population: 28400,
            lat: 18.5018,
            lng: 73.926,
            lastSyncTime: minutesAgo(8), // Fresh
          },
          {
            id: 'phc-shirur',
            name: 'Shirur Rural PHC',
            code: 'PHC-MH-PUN-002',
            districtId: 'dist-pune',
            type: '24x7_PHC',
            population: 34100,
            lat: 18.8256,
            lng: 74.3789,
            lastSyncTime: minutesAgo(24), // Fresh
          },
          {
            id: 'phc-baramati',
            name: 'Baramati Model PHC',
            code: 'PHC-MH-PUN-003',
            districtId: 'dist-pune',
            type: 'CHC',
            population: 46200,
            lat: 18.1517,
            lng: 74.577,
            lastSyncTime: minutesAgo(48), // Warning / delayed sync
          },
          {
            id: 'phc-haveli',
            name: 'Haveli Sub-Center PHC',
            code: 'PHC-MH-PUN-004',
            districtId: 'dist-pune',
            type: 'Sub_Center',
            population: 18900,
            lat: 18.4412,
            lng: 73.8911,
            lastSyncTime: minutesAgo(185), // Stale sync (>3 hours)
          },
          {
            id: 'phc-junnar',
            name: 'Junnar Tribal PHC',
            code: 'PHC-MH-PUN-005',
            districtId: 'dist-pune',
            type: '24x7_PHC',
            population: 22700,
            lat: 19.2064,
            lng: 73.8764,
            lastSyncTime: minutesAgo(410), // Very stale (>6 hours)
          },
        ],
      },
      {
        id: 'dist-mum',
        name: 'Mumbai Suburban',
        code: 'MUM',
        stateId: 'state-mh',
        totalPhcs: 112,
        activePhcs: 110,
        population: 9356962,
        phcs: [
          {
            id: 'phc-andheri',
            name: 'Andheri East Urban PHC',
            code: 'PHC-MH-MUM-001',
            districtId: 'dist-mum',
            type: 'Urban_PHC',
            population: 52000,
            lat: 19.1136,
            lng: 72.8697,
            lastSyncTime: minutesAgo(12),
          },
          {
            id: 'phc-chembur',
            name: 'Chembur Health Post',
            code: 'PHC-MH-MUM-002',
            districtId: 'dist-mum',
            type: 'Urban_PHC',
            population: 48000,
            lat: 19.0622,
            lng: 72.8974,
            lastSyncTime: minutesAgo(15),
          },
          {
            id: 'phc-kurla',
            name: 'Kurla Central Dispensary',
            code: 'PHC-MH-MUM-003',
            districtId: 'dist-mum',
            type: 'Urban_PHC',
            population: 61000,
            lat: 19.0726,
            lng: 72.8845,
            lastSyncTime: minutesAgo(55),
          },
        ],
      },
      {
        id: 'dist-thane',
        name: 'Thane',
        code: 'THA',
        stateId: 'state-mh',
        totalPhcs: 135,
        activePhcs: 131,
        population: 8070032,
        phcs: [
          {
            id: 'phc-kalyan',
            name: 'Kalyan East PHC',
            code: 'PHC-MH-THA-001',
            districtId: 'dist-thane',
            type: '24x7_PHC',
            population: 39000,
            lat: 19.2403,
            lng: 73.1305,
            lastSyncTime: minutesAgo(19),
          },
          {
            id: 'phc-murbad',
            name: 'Murbad Rural PHC',
            code: 'PHC-MH-THA-002',
            districtId: 'dist-thane',
            type: '24x7_PHC',
            population: 26500,
            lat: 19.2547,
            lng: 73.4024,
            lastSyncTime: minutesAgo(140),
          },
        ],
      },
      {
        id: 'dist-nagpur',
        name: 'Nagpur',
        code: 'NAG',
        stateId: 'state-mh',
        totalPhcs: 118,
        activePhcs: 115,
        population: 4653570,
        phcs: [
          {
            id: 'phc-kamptee',
            name: 'Kamptee PHC',
            code: 'PHC-MH-NAG-001',
            districtId: 'dist-nagpur',
            type: '24x7_PHC',
            population: 32000,
            lat: 21.2227,
            lng: 79.1977,
            lastSyncTime: minutesAgo(30),
          },
        ],
      },
    ],
  },
  {
    id: 'state-up',
    name: 'Uttar Pradesh',
    code: 'UP',
    totalDistricts: 75,
    totalPhcs: 5820,
    population: 237882725,
    districts: [
      {
        id: 'dist-lucknow',
        name: 'Lucknow',
        code: 'LKO',
        stateId: 'state-up',
        totalPhcs: 120,
        activePhcs: 116,
        population: 4589838,
        phcs: [
          {
            id: 'phc-malihabad',
            name: 'Malihabad CHC & PHC',
            code: 'PHC-UP-LKO-001',
            districtId: 'dist-lucknow',
            type: 'CHC',
            population: 42000,
            lat: 26.9214,
            lng: 80.7126,
            lastSyncTime: minutesAgo(14),
          },
          {
            id: 'phc-chinhat',
            name: 'Chinhat Community PHC',
            code: 'PHC-UP-LKO-002',
            districtId: 'dist-lucknow',
            type: '24x7_PHC',
            population: 36000,
            lat: 26.8833,
            lng: 81.0167,
            lastSyncTime: minutesAgo(75),
          },
        ],
      },
      {
        id: 'dist-varanasi',
        name: 'Varanasi',
        code: 'VNS',
        stateId: 'state-up',
        totalPhcs: 95,
        activePhcs: 92,
        population: 3676841,
        phcs: [
          {
            id: 'phc-ramnagar',
            name: 'Ramnagar Urban PHC',
            code: 'PHC-UP-VNS-001',
            districtId: 'dist-varanasi',
            type: 'Urban_PHC',
            population: 31000,
            lat: 25.2677,
            lng: 83.0294,
            lastSyncTime: minutesAgo(28),
          },
        ],
      },
    ],
  },
  {
    id: 'state-tn',
    name: 'Tamil Nadu',
    code: 'TN',
    totalDistricts: 38,
    totalPhcs: 2280,
    population: 76481545,
    districts: [
      {
        id: 'dist-chennai',
        name: 'Chennai',
        code: 'CHN',
        stateId: 'state-tn',
        totalPhcs: 140,
        activePhcs: 139,
        population: 8653521,
        phcs: [
          {
            id: 'phc-guindy',
            name: 'Guindy Urban Health Centre',
            code: 'PHC-TN-CHN-001',
            districtId: 'dist-chennai',
            type: 'Urban_PHC',
            population: 45000,
            lat: 13.0067,
            lng: 80.2025,
            lastSyncTime: minutesAgo(5),
          },
        ],
      },
      {
        id: 'dist-coimbatore',
        name: 'Coimbatore',
        code: 'CBE',
        stateId: 'state-tn',
        totalPhcs: 98,
        activePhcs: 97,
        population: 3458045,
        phcs: [
          {
            id: 'phc-pollachi',
            name: 'Pollachi Taluk PHC',
            code: 'PHC-TN-CBE-001',
            districtId: 'dist-coimbatore',
            type: '24x7_PHC',
            population: 29000,
            lat: 10.6609,
            lng: 77.0048,
            lastSyncTime: minutesAgo(18),
          },
        ],
      },
    ],
  },
  {
    id: 'state-ka',
    name: 'Karnataka',
    code: 'KA',
    totalDistricts: 31,
    totalPhcs: 2540,
    population: 67562686,
    districts: [
      {
        id: 'dist-bengaluru',
        name: 'Bengaluru Urban',
        code: 'BLR',
        stateId: 'state-ka',
        totalPhcs: 165,
        activePhcs: 164,
        population: 9621551,
        phcs: [
          {
            id: 'phc-whitefield',
            name: 'Whitefield Primary Health Centre',
            code: 'PHC-KA-BLR-001',
            districtId: 'dist-bengaluru',
            type: 'Urban_PHC',
            population: 58000,
            lat: 12.9698,
            lng: 77.75,
            lastSyncTime: minutesAgo(11),
          },
        ],
      },
    ],
  },
];

// ── Geographic lookup utilities ──────────────────────────────────────────────

export function getStateById(stateId: string | null | undefined): StateNode | undefined {
  if (!stateId) return undefined;
  return STATES.find((s) => s.id === stateId);
}

export function getDistrictById(
  districtId: string | null | undefined,
  stateId?: string | null
): DistrictNode | undefined {
  if (!districtId) return undefined;
  if (stateId) {
    const s = getStateById(stateId);
    return s?.districts.find((d) => d.id === districtId);
  }
  for (const s of STATES) {
    const found = s.districts.find((d) => d.id === districtId);
    if (found) return found;
  }
  return undefined;
}

export function getPhcById(
  phcId: string | null | undefined,
  districtId?: string | null
): PhcNode | undefined {
  if (!phcId) return undefined;
  if (districtId) {
    const d = getDistrictById(districtId);
    return d?.phcs.find((p) => p.id === phcId);
  }
  for (const s of STATES) {
    for (const d of s.districts) {
      const found = d.phcs.find((p) => p.id === phcId);
      if (found) return found;
    }
  }
  return undefined;
}

export function getDistrictsForState(stateId: string | null | undefined): DistrictNode[] {
  if (!stateId) return [];
  const state = getStateById(stateId);
  return state?.districts ?? [];
}

export function getPhcsForDistrict(districtId: string | null | undefined): PhcNode[] {
  if (!districtId) return [];
  const district = getDistrictById(districtId);
  return district?.phcs ?? [];
}
