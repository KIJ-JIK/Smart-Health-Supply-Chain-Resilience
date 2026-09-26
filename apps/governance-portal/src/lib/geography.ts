// ─────────────────────────────────────────────────────────────────────────────
// Canonical geography hierarchy for the governance portal
// All states and districts are sourced directly from the PostgreSQL DB.
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

// Generate relative sync times
const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// STATES — All 36 States & Union Territories of India
// IDs match the PostgreSQL `states` table primary keys exactly.
// ─────────────────────────────────────────────────────────────────────────────
export const STATES: StateNode[] = [
  {
    id: '7b5d180c-e6f9-4cd3-9ab9-c751ec15a116',
    name: 'Andhra Pradesh',
    code: 'AP',
    totalDistricts: 5,
    totalPhcs: 15,
    population: 53903393,
    districts: [
      { id: '8c354839-beda-41eb-bdf7-66906a29658f', name: 'Andhra Pradesh Central', code: 'AP-CEN', stateId: '7b5d180c-e6f9-4cd3-9ab9-c751ec15a116', totalPhcs: 3, activePhcs: 3, population: 2800000, phcs: [] },
      { id: '0801cf18-361a-4886-8eab-61fb8f7412c3', name: 'Andhra Pradesh East',    code: 'AP-EST', stateId: '7b5d180c-e6f9-4cd3-9ab9-c751ec15a116', totalPhcs: 3, activePhcs: 3, population: 3200000, phcs: [] },
      { id: '975cbb12-cdcb-42b4-8367-1924e719f478', name: 'Andhra Pradesh North',   code: 'AP-NTH', stateId: '7b5d180c-e6f9-4cd3-9ab9-c751ec15a116', totalPhcs: 3, activePhcs: 3, population: 2900000, phcs: [] },
      { id: '47ddad14-1dfa-48af-afd8-0b58b00b6b72', name: 'Andhra Pradesh South',   code: 'AP-STH', stateId: '7b5d180c-e6f9-4cd3-9ab9-c751ec15a116', totalPhcs: 3, activePhcs: 3, population: 3100000, phcs: [] },
      { id: 'd7f55c5b-78db-46af-934f-eebfc3bb0055', name: 'Andhra Pradesh West',    code: 'AP-WST', stateId: '7b5d180c-e6f9-4cd3-9ab9-c751ec15a116', totalPhcs: 3, activePhcs: 3, population: 2700000, phcs: [] },
    ],
  },
  {
    id: '4a9165cf-5d68-4d58-aef6-dea0c5b5e614',
    name: 'Bihar',
    code: 'BR',
    totalDistricts: 5,
    totalPhcs: 15,
    population: 124799926,
    districts: [
      { id: '9f0e0122-555e-48c5-8b40-11da50a9fb0a', name: 'Bihar Central', code: 'BR-CEN', stateId: '4a9165cf-5d68-4d58-aef6-dea0c5b5e614', totalPhcs: 3, activePhcs: 3, population: 5200000, phcs: [] },
      { id: 'a3775282-2aa6-48f6-8b7e-aeb8760c1616', name: 'Bihar East',    code: 'BR-EST', stateId: '4a9165cf-5d68-4d58-aef6-dea0c5b5e614', totalPhcs: 3, activePhcs: 3, population: 4900000, phcs: [] },
      { id: 'e4f1d230-c16b-45c8-84c2-dfd0682617ec', name: 'Bihar North',   code: 'BR-NTH', stateId: '4a9165cf-5d68-4d58-aef6-dea0c5b5e614', totalPhcs: 3, activePhcs: 3, population: 5400000, phcs: [] },
      { id: 'dea517a5-0d45-4986-964d-36e83b75f813', name: 'Bihar South',   code: 'BR-STH', stateId: '4a9165cf-5d68-4d58-aef6-dea0c5b5e614', totalPhcs: 3, activePhcs: 3, population: 5100000, phcs: [] },
      { id: '9b3aa94f-028d-4594-8b7c-b3d1c3f3273c', name: 'Bihar West',   code: 'BR-WST', stateId: '4a9165cf-5d68-4d58-aef6-dea0c5b5e614', totalPhcs: 3, activePhcs: 3, population: 4800000, phcs: [] },
    ],
  },
  {
    id: '71885ac7-e9e9-4316-a33c-d07f53c8af1a',
    name: 'Gujarat',
    code: 'GJ',
    totalDistricts: 5,
    totalPhcs: 15,
    population: 63872399,
    districts: [
      { id: 'ba537fa3-f375-41a4-a872-1057813aa3ee', name: 'Gujarat Central', code: 'GJ-CEN', stateId: '71885ac7-e9e9-4316-a33c-d07f53c8af1a', totalPhcs: 3, activePhcs: 3, population: 3800000, phcs: [] },
      { id: '207cf80d-1d21-400b-8d5b-45c0d8ea345c', name: 'Gujarat East',    code: 'GJ-EST', stateId: '71885ac7-e9e9-4316-a33c-d07f53c8af1a', totalPhcs: 3, activePhcs: 3, population: 3600000, phcs: [] },
      { id: '60ee5ff4-dde0-498c-b0e1-6a4b9e5f5c72', name: 'Gujarat North',   code: 'GJ-NTH', stateId: '71885ac7-e9e9-4316-a33c-d07f53c8af1a', totalPhcs: 3, activePhcs: 3, population: 4100000, phcs: [] },
      { id: 'ec9bcc21-c670-4d47-83b8-bbc4ec0d8672', name: 'Gujarat South',   code: 'GJ-STH', stateId: '71885ac7-e9e9-4316-a33c-d07f53c8af1a', totalPhcs: 3, activePhcs: 3, population: 3500000, phcs: [] },
      { id: 'd818fe66-054e-4be9-b90b-821193a59dc3', name: 'Gujarat West',    code: 'GJ-WST', stateId: '71885ac7-e9e9-4316-a33c-d07f53c8af1a', totalPhcs: 3, activePhcs: 3, population: 3300000, phcs: [] },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    name: 'Karnataka',
    code: 'KA',
    totalDistricts: 7,
    totalPhcs: 18,
    population: 67562686,
    districts: [
      {
        id: 'b0000002-0000-0000-0000-000000000004',
        name: 'Bengaluru Urban',
        code: 'BLR',
        stateId: 'a0000001-0000-0000-0000-000000000002',
        totalPhcs: 2,
        activePhcs: 2,
        population: 9621551,
        phcs: [
          { id: 'phc-whitefield', name: 'Whitefield Primary Health Centre', code: 'PHC-KA-BLR-001', districtId: 'b0000002-0000-0000-0000-000000000004', type: 'Urban_PHC', population: 58000, lat: 12.9698, lng: 77.75, lastSyncTime: minutesAgo(11) },
          { id: 'phc-jpnagar', name: 'JP Nagar Urban PHC', code: 'PHC-KA-BLR-002', districtId: 'b0000002-0000-0000-0000-000000000004', type: 'Urban_PHC', population: 62000, lat: 12.9063, lng: 77.5857, lastSyncTime: minutesAgo(25) },
        ],
      },
      { id: 'ec0145df-f3fc-4c73-8f2f-c82e474b913b', name: 'Karnataka Central', code: 'KA-CEN', stateId: 'a0000001-0000-0000-0000-000000000002', totalPhcs: 3, activePhcs: 3, population: 2800000, phcs: [] },
      { id: '813227f3-4158-4768-9ff8-9efb5ce3ff32', name: 'Karnataka East',    code: 'KA-EST', stateId: 'a0000001-0000-0000-0000-000000000002', totalPhcs: 3, activePhcs: 3, population: 2600000, phcs: [] },
      { id: 'bf8c2c60-7308-428c-86e5-24742ff30c7c', name: 'Karnataka North',   code: 'KA-NTH', stateId: 'a0000001-0000-0000-0000-000000000002', totalPhcs: 3, activePhcs: 3, population: 3100000, phcs: [] },
      { id: '63bea51e-113c-498a-a6b7-0f414e960f67', name: 'Karnataka South',   code: 'KA-STH', stateId: 'a0000001-0000-0000-0000-000000000002', totalPhcs: 3, activePhcs: 3, population: 2900000, phcs: [] },
      { id: 'e95bb7f0-091e-4f12-924a-7176e7e76c8a', name: 'Karnataka West',    code: 'KA-WST', stateId: 'a0000001-0000-0000-0000-000000000002', totalPhcs: 3, activePhcs: 3, population: 2400000, phcs: [] },
      { id: 'b0000002-0000-0000-0000-000000000005', name: 'Mysuru',            code: 'MYS', stateId: 'a0000001-0000-0000-0000-000000000002', totalPhcs: 1, activePhcs: 1, population: 3240000, phcs: [] },
    ],
  },
  {
    id: '64e1316d-de72-4b1c-911a-049c37d20c26',
    name: 'Madhya Pradesh',
    code: 'MP',
    totalDistricts: 5,
    totalPhcs: 10,
    population: 85358965,
    districts: [
      { id: 'c2a21716-b799-469c-8673-54237ec5967c', name: 'Madhya Pradesh Central', code: 'MP-CEN', stateId: '64e1316d-de72-4b1c-911a-049c37d20c26', totalPhcs: 2, activePhcs: 2, population: 4800000, phcs: [] },
      { id: '99dbdf5b-2492-4280-ad8f-f808c6ed20f9', name: 'Madhya Pradesh East',    code: 'MP-EST', stateId: '64e1316d-de72-4b1c-911a-049c37d20c26', totalPhcs: 2, activePhcs: 2, population: 4500000, phcs: [] },
      { id: '4d3df8d4-3cca-484b-b7ca-96890eb248a1', name: 'Madhya Pradesh North',   code: 'MP-NTH', stateId: '64e1316d-de72-4b1c-911a-049c37d20c26', totalPhcs: 2, activePhcs: 2, population: 5100000, phcs: [] },
      { id: '8b16f776-27e6-42ad-a9ef-1cbfd128e79d', name: 'Madhya Pradesh South',   code: 'MP-STH', stateId: '64e1316d-de72-4b1c-911a-049c37d20c26', totalPhcs: 2, activePhcs: 2, population: 4200000, phcs: [] },
      { id: 'f5d57a48-5a78-4d98-871e-ec48609d6614', name: 'Madhya Pradesh West',    code: 'MP-WST', stateId: '64e1316d-de72-4b1c-911a-049c37d20c26', totalPhcs: 2, activePhcs: 2, population: 3900000, phcs: [] },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Maharashtra',
    code: 'MH',
    totalDistricts: 8,
    totalPhcs: 20,
    population: 125000000,
    districts: [
      { id: 'b0000002-0000-0000-0000-000000000003', name: 'Aurangabad',         code: 'AUR', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 1, activePhcs: 1, population: 3701282, phcs: [] },
      { id: '1515fc97-caed-4b71-b158-d0ffcdceef65', name: 'Maharashtra Central', code: 'MH-CEN', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 2, activePhcs: 2, population: 4200000, phcs: [] },
      { id: 'fd0a9531-77e1-42cb-92f5-946a43421f4c', name: 'Maharashtra East',    code: 'MH-EST', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 2, activePhcs: 2, population: 3900000, phcs: [] },
      { id: '049540a7-44d2-4e3c-92f4-5c6d95c9ce98', name: 'Maharashtra North',   code: 'MH-NTH', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 2, activePhcs: 2, population: 4600000, phcs: [] },
      { id: '2019bfa8-6906-4ea7-865f-fe36195a8b18', name: 'Maharashtra South',   code: 'MH-STH', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 2, activePhcs: 2, population: 3700000, phcs: [] },
      { id: 'c84f2881-1ba4-419d-a403-fb6706b91472', name: 'Maharashtra West',    code: 'MH-WST', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 2, activePhcs: 2, population: 4100000, phcs: [] },
      { id: 'b0000002-0000-0000-0000-000000000002', name: 'Nashik',              code: 'NSK', stateId: 'a0000001-0000-0000-0000-000000000001', totalPhcs: 2, activePhcs: 2, population: 6107187, phcs: [] },
      {
        id: 'b0000002-0000-0000-0000-000000000001',
        name: 'Pune',
        code: 'PUN',
        stateId: 'a0000001-0000-0000-0000-000000000001',
        totalPhcs: 5,
        activePhcs: 5,
        population: 9429408,
        phcs: [
          { id: 'phc-hadapsar',  name: 'Hadapsar PHC',         code: 'PHC-MH-PUN-001', districtId: 'b0000002-0000-0000-0000-000000000001', type: '24x7_PHC',   population: 28400, lat: 18.5018, lng: 73.926,  lastSyncTime: minutesAgo(8) },
          { id: 'phc-shirur',    name: 'Shirur Rural PHC',      code: 'PHC-MH-PUN-002', districtId: 'b0000002-0000-0000-0000-000000000001', type: '24x7_PHC',   population: 34100, lat: 18.8256, lng: 74.3789, lastSyncTime: minutesAgo(24) },
          { id: 'phc-baramati',  name: 'Baramati Model PHC',    code: 'PHC-MH-PUN-003', districtId: 'b0000002-0000-0000-0000-000000000001', type: 'CHC',         population: 46200, lat: 18.1517, lng: 74.577,  lastSyncTime: minutesAgo(48) },
          { id: 'phc-haveli',    name: 'Haveli Sub-Center PHC', code: 'PHC-MH-PUN-004', districtId: 'b0000002-0000-0000-0000-000000000001', type: 'Sub_Center',  population: 18900, lat: 18.4412, lng: 73.8911, lastSyncTime: minutesAgo(185) },
          { id: 'phc-junnar',    name: 'Junnar Tribal PHC',     code: 'PHC-MH-PUN-005', districtId: 'b0000002-0000-0000-0000-000000000001', type: '24x7_PHC',   population: 22700, lat: 19.2064, lng: 73.8764, lastSyncTime: minutesAgo(410) },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000005',
    name: 'Rajasthan',
    code: 'RJ',
    totalDistricts: 6,
    totalPhcs: 12,
    population: 81032689,
    districts: [
      { id: 'b0000002-0000-0000-0000-000000000008', name: 'Jaipur',             code: 'JAI', stateId: 'a0000001-0000-0000-0000-000000000005', totalPhcs: 2, activePhcs: 2, population: 6663971, phcs: [] },
      { id: '7d1d1691-ed4e-425f-b12d-5bb8c4143b6c', name: 'Rajasthan Central',  code: 'RJ-CEN', stateId: 'a0000001-0000-0000-0000-000000000005', totalPhcs: 2, activePhcs: 2, population: 3900000, phcs: [] },
      { id: '64ade9b8-f2b4-4b50-b149-516f6a41d20b', name: 'Rajasthan East',     code: 'RJ-EST', stateId: 'a0000001-0000-0000-0000-000000000005', totalPhcs: 2, activePhcs: 2, population: 4200000, phcs: [] },
      { id: 'e711996e-0482-47df-b36e-6758127484b0', name: 'Rajasthan North',    code: 'RJ-NTH', stateId: 'a0000001-0000-0000-0000-000000000005', totalPhcs: 2, activePhcs: 2, population: 3800000, phcs: [] },
      { id: 'fbdc5a0e-68b8-4fa7-b999-fba2b709ca86', name: 'Rajasthan South',    code: 'RJ-STH', stateId: 'a0000001-0000-0000-0000-000000000005', totalPhcs: 2, activePhcs: 2, population: 3600000, phcs: [] },
      { id: 'c306c678-56e3-4701-ab84-121c25faae67', name: 'Rajasthan West',     code: 'RJ-WST', stateId: 'a0000001-0000-0000-0000-000000000005', totalPhcs: 2, activePhcs: 2, population: 3400000, phcs: [] },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    name: 'Tamil Nadu',
    code: 'TN',
    totalDistricts: 6,
    totalPhcs: 11,
    population: 76481545,
    districts: [
      {
        id: 'b0000002-0000-0000-0000-000000000006',
        name: 'Chennai',
        code: 'CHN',
        stateId: 'a0000001-0000-0000-0000-000000000003',
        totalPhcs: 1,
        activePhcs: 1,
        population: 8653521,
        phcs: [
          { id: 'phc-guindy', name: 'Guindy Urban Health Centre', code: 'PHC-TN-CHN-001', districtId: 'b0000002-0000-0000-0000-000000000006', type: 'Urban_PHC', population: 45000, lat: 13.0067, lng: 80.2025, lastSyncTime: minutesAgo(5) },
        ],
      },
      { id: '45fd9253-f3af-4e90-9454-de5a9a77ebc2', name: 'Tamil Nadu Central', code: 'TN-CEN', stateId: 'a0000001-0000-0000-0000-000000000003', totalPhcs: 2, activePhcs: 2, population: 3800000, phcs: [] },
      { id: 'c1a2a14a-734a-4a98-a402-82e8bc017e3c', name: 'Tamil Nadu East',    code: 'TN-EST', stateId: 'a0000001-0000-0000-0000-000000000003', totalPhcs: 2, activePhcs: 2, population: 3500000, phcs: [] },
      { id: 'f66cc339-e722-47c6-b5b0-593f2ad888a4', name: 'Tamil Nadu North',   code: 'TN-NTH', stateId: 'a0000001-0000-0000-0000-000000000003', totalPhcs: 2, activePhcs: 2, population: 4100000, phcs: [] },
      { id: '81cab09a-cd1b-491b-92de-e958896e722c', name: 'Tamil Nadu South',   code: 'TN-STH', stateId: 'a0000001-0000-0000-0000-000000000003', totalPhcs: 2, activePhcs: 2, population: 3600000, phcs: [] },
      { id: '23d7eaaf-365a-4c73-b670-0fa87c9e419e', name: 'Tamil Nadu West',    code: 'TN-WST', stateId: 'a0000001-0000-0000-0000-000000000003', totalPhcs: 2, activePhcs: 2, population: 3200000, phcs: [] },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    name: 'Uttar Pradesh',
    code: 'UP',
    totalDistricts: 7,
    totalPhcs: 12,
    population: 237882725,
    districts: [
      {
        id: 'b0000002-0000-0000-0000-000000000007',
        name: 'Lucknow',
        code: 'LKO',
        stateId: 'a0000001-0000-0000-0000-000000000004',
        totalPhcs: 1,
        activePhcs: 1,
        population: 4589838,
        phcs: [
          { id: 'phc-malihabad', name: 'Malihabad CHC & PHC', code: 'PHC-UP-LKO-001', districtId: 'b0000002-0000-0000-0000-000000000007', type: 'CHC', population: 42000, lat: 26.9214, lng: 80.7126, lastSyncTime: minutesAgo(14) },
        ],
      },
      { id: 'f5dfd887-f87e-4d39-91ac-913fcfc0ee69', name: 'Uttar Pradesh Central', code: 'UP-CEN', stateId: 'a0000001-0000-0000-0000-000000000004', totalPhcs: 2, activePhcs: 2, population: 6200000, phcs: [] },
      { id: 'f9a62eac-f5ba-4014-bbb7-eaab726099e5', name: 'Uttar Pradesh East',    code: 'UP-EST', stateId: 'a0000001-0000-0000-0000-000000000004', totalPhcs: 2, activePhcs: 2, population: 5800000, phcs: [] },
      { id: '884066be-d4ba-44a6-9052-9ab90398d907', name: 'Uttar Pradesh North',   code: 'UP-NTH', stateId: 'a0000001-0000-0000-0000-000000000004', totalPhcs: 2, activePhcs: 2, population: 6500000, phcs: [] },
      { id: '2f2d430e-190f-47ec-8e2e-50ff21ebad45', name: 'Uttar Pradesh South',   code: 'UP-STH', stateId: 'a0000001-0000-0000-0000-000000000004', totalPhcs: 2, activePhcs: 2, population: 5400000, phcs: [] },
      { id: '0aedef03-15ce-40fa-9a1e-27e64d9e54c6', name: 'Uttar Pradesh West',    code: 'UP-WST', stateId: 'a0000001-0000-0000-0000-000000000004', totalPhcs: 2, activePhcs: 2, population: 5900000, phcs: [] },
      {
        id: '4cc2e47b-bce6-4229-9272-21083e7718eb',
        name: 'Varanasi',
        code: 'VNS',
        stateId: 'a0000001-0000-0000-0000-000000000004',
        totalPhcs: 1,
        activePhcs: 1,
        population: 3676841,
        phcs: [
          { id: 'phc-ramnagar', name: 'Ramnagar Urban PHC', code: 'PHC-UP-VNS-001', districtId: '4cc2e47b-bce6-4229-9272-21083e7718eb', type: 'Urban_PHC', population: 31000, lat: 25.2677, lng: 83.0294, lastSyncTime: minutesAgo(28) },
        ],
      },
    ],
  },
  {
    id: '688c5214-c31f-466b-809a-a90637b92c83',
    name: 'West Bengal',
    code: 'WB',
    totalDistricts: 5,
    totalPhcs: 10,
    population: 91347736,
    districts: [
      { id: 'fcf40421-141b-4307-9381-6626ef33a4da', name: 'West Bengal Central', code: 'WB-CEN', stateId: '688c5214-c31f-466b-809a-a90637b92c83', totalPhcs: 2, activePhcs: 2, population: 5200000, phcs: [] },
      { id: 'e7abc13b-98c8-4b68-967f-89887a0e1e6d', name: 'West Bengal East',    code: 'WB-EST', stateId: '688c5214-c31f-466b-809a-a90637b92c83', totalPhcs: 2, activePhcs: 2, population: 4800000, phcs: [] },
      { id: '8a54d00e-c6ef-42c8-b4de-77a954c1c5da', name: 'West Bengal North',   code: 'WB-NTH', stateId: '688c5214-c31f-466b-809a-a90637b92c83', totalPhcs: 2, activePhcs: 2, population: 5600000, phcs: [] },
      { id: 'f62c7d41-957a-4e80-8038-89ea53598d79', name: 'West Bengal South',   code: 'WB-STH', stateId: '688c5214-c31f-466b-809a-a90637b92c83', totalPhcs: 2, activePhcs: 2, population: 4900000, phcs: [] },
      { id: 'ed70a86c-232a-4d4d-96ce-1ae226be836f', name: 'West Bengal West',    code: 'WB-WST', stateId: '688c5214-c31f-466b-809a-a90637b92c83', totalPhcs: 2, activePhcs: 2, population: 4400000, phcs: [] },
    ],
  },
  // ── Remaining 18 States (28 States total) ──────────────────────────────────
  {
    id: 'a0000001-0000-0000-0000-000000000011',
    name: 'Arunachal Pradesh',
    code: 'AR',
    totalDistricts: 25,
    totalPhcs: 0,
    population: 1570453,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000012',
    name: 'Assam',
    code: 'AS',
    totalDistricts: 35,
    totalPhcs: 0,
    population: 35607039,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000013',
    name: 'Chhattisgarh',
    code: 'CG',
    totalDistricts: 33,
    totalPhcs: 0,
    population: 30007832,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000014',
    name: 'Goa',
    code: 'GA',
    totalDistricts: 2,
    totalPhcs: 0,
    population: 1575000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000015',
    name: 'Haryana',
    code: 'HR',
    totalDistricts: 22,
    totalPhcs: 0,
    population: 28204692,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000016',
    name: 'Himachal Pradesh',
    code: 'HP',
    totalDistricts: 12,
    totalPhcs: 0,
    population: 7451955,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000017',
    name: 'Jharkhand',
    code: 'JH',
    totalDistricts: 24,
    totalPhcs: 0,
    population: 39466000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000018',
    name: 'Kerala',
    code: 'KL',
    totalDistricts: 14,
    totalPhcs: 0,
    population: 35699443,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000019',
    name: 'Manipur',
    code: 'MN',
    totalDistricts: 16,
    totalPhcs: 0,
    population: 3223000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000020',
    name: 'Meghalaya',
    code: 'ML',
    totalDistricts: 12,
    totalPhcs: 0,
    population: 3366710,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000021',
    name: 'Mizoram',
    code: 'MZ',
    totalDistricts: 11,
    totalPhcs: 0,
    population: 1239244,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000022',
    name: 'Nagaland',
    code: 'NL',
    totalDistricts: 16,
    totalPhcs: 0,
    population: 2249695,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000023',
    name: 'Odisha',
    code: 'OD',
    totalDistricts: 30,
    totalPhcs: 0,
    population: 46356334,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000024',
    name: 'Punjab',
    code: 'PB',
    totalDistricts: 23,
    totalPhcs: 0,
    population: 30501026,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000025',
    name: 'Sikkim',
    code: 'SK',
    totalDistricts: 6,
    totalPhcs: 0,
    population: 690251,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000026',
    name: 'Telangana',
    code: 'TS',
    totalDistricts: 33,
    totalPhcs: 0,
    population: 38090000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000027',
    name: 'Tripura',
    code: 'TR',
    totalDistricts: 8,
    totalPhcs: 0,
    population: 4169794,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000028',
    name: 'Uttarakhand',
    code: 'UK',
    totalDistricts: 13,
    totalPhcs: 0,
    population: 11250858,
    districts: [],
  },
  // ── 8 Union Territories ───────────────────────────────────────────────────
  {
    id: 'a0000001-0000-0000-0000-000000000031',
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    totalDistricts: 3,
    totalPhcs: 0,
    population: 434192,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000032',
    name: 'Chandigarh',
    code: 'CH',
    totalDistricts: 1,
    totalPhcs: 0,
    population: 1215000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000033',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DN',
    totalDistricts: 3,
    totalPhcs: 0,
    population: 615729,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000034',
    name: 'Delhi (NCT)',
    code: 'DL',
    totalDistricts: 11,
    totalPhcs: 0,
    population: 21357000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000035',
    name: 'Jammu and Kashmir',
    code: 'JK',
    totalDistricts: 20,
    totalPhcs: 0,
    population: 13606320,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000036',
    name: 'Ladakh',
    code: 'LA',
    totalDistricts: 2,
    totalPhcs: 0,
    population: 297000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000037',
    name: 'Lakshadweep',
    code: 'LD',
    totalDistricts: 1,
    totalPhcs: 0,
    population: 68000,
    districts: [],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000038',
    name: 'Puducherry',
    code: 'PY',
    totalDistricts: 4,
    totalPhcs: 0,
    population: 1596000,
    districts: [],
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
