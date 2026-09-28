// ─────────────────────────────────────────────────────────────────────────────
// Canonical geography hierarchy for the governance portal
// Sourced 100% directly from PostgreSQL cloud database
// 36 States & UTs, 129 Districts, 192 PHCs
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
  lastSyncTime: string;
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

export const STATES: StateNode[] = [
  {
    "id": "a0000001-0000-0000-0000-000000000031",
    "name": "Andaman and Nicobar Islands",
    "code": "AN",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 29750,
    "districts": [
      {
        "id": "250fb69a-134f-401f-8d80-e81a2bf1b614",
        "name": "South Andaman (Port Blair)",
        "code": "AN-SOU",
        "stateId": "a0000001-0000-0000-0000-000000000031",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "75c13f6a-4be3-4570-8378-1e39ff880f99",
            "name": "Port Blair Island Health Command",
            "code": "PHC-AN-75C1",
            "districtId": "250fb69a-134f-401f-8d80-e81a2bf1b614",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 11.6234,
            "lng": 92.7265,
            "lastSyncTime": "2026-09-28T11:18:27.263Z"
          }
        ]
      }
    ]
  },
  {
    "id": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
    "name": "Andhra Pradesh",
    "code": "AP",
    "totalDistricts": 10,
    "totalPhcs": 15,
    "population": 446250,
    "districts": [
      {
        "id": "281d36f8-da09-44fc-a0f4-ee123acae372",
        "name": "Anantapur",
        "code": "AP-ANA",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "a743b4fc-3bc7-4c02-a8d1-1defd8eeff81",
            "name": "Anantapur Rayalaseema Health",
            "code": "PHC-AP-A743",
            "districtId": "281d36f8-da09-44fc-a0f4-ee123acae372",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 14.6819,
            "lng": 77.6006,
            "lastSyncTime": "2026-09-28T11:18:27.264Z"
          }
        ]
      },
      {
        "id": "0b057167-9924-4695-810f-1b985a9f1e32",
        "name": "East Godavari",
        "code": "AP-EAS",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "710b4180-a0b9-4c62-9256-48451c837500",
            "name": "Rajahmundry Godavari Clinic",
            "code": "PHC-AP-710B",
            "districtId": "0b057167-9924-4695-810f-1b985a9f1e32",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.0005,
            "lng": 81.804,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "a5f9b3c6-33d7-4455-a5ef-e004d87ed924",
        "name": "Guntur",
        "code": "AP-GUN",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "7fc4a971-ebb6-4d65-8d3e-88d4207c7114",
            "name": "Guntur Mirchi Yard Clinic",
            "code": "PHC-AP-7FC4",
            "districtId": "a5f9b3c6-33d7-4455-a5ef-e004d87ed924",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 16.3067,
            "lng": 80.4365,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "ed41d651-3090-4bb1-851f-e0e6d1f032b0",
            "name": "Tenali Coastal Canal PHC",
            "code": "PHC-AP-ED41",
            "districtId": "a5f9b3c6-33d7-4455-a5ef-e004d87ed924",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 16.243,
            "lng": 80.64,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "41daa3a7-e336-4420-9af4-8ed4fdaf74b8",
        "name": "Kakinada",
        "code": "AP-KAK",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "3533bb3f-ad1f-47f8-80c2-43da608b8a64",
            "name": "Kakinada Port City Health Unit",
            "code": "PHC-AP-3533",
            "districtId": "41daa3a7-e336-4420-9af4-8ed4fdaf74b8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 16.9891,
            "lng": 82.2475,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "28e4e3b4-fa8a-408b-91a8-0000dc67c9b5",
        "name": "Kurnool",
        "code": "AP-KUR",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "57ddef3f-9fae-4588-9e56-9b01ce7e1aba",
            "name": "Kurnool Tungabhadra PHC",
            "code": "PHC-AP-57DD",
            "districtId": "28e4e3b4-fa8a-408b-91a8-0000dc67c9b5",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 15.8281,
            "lng": 78.0373,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "892d97b6-8646-48fe-81c0-886d879556c1",
        "name": "NTR (Vijayawada)",
        "code": "AP-NTR",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "1a8d123f-4f79-4b11-88c0-78efffa1fba3",
            "name": "Benz Circle Urban Health",
            "code": "PHC-AP-1A8D",
            "districtId": "892d97b6-8646-48fe-81c0-886d879556c1",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 16.5,
            "lng": 80.65,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "9cec0974-6371-4af0-a66d-be4a8decb415",
            "name": "Vijayawada Krishna River PHC",
            "code": "PHC-AP-9CEC",
            "districtId": "892d97b6-8646-48fe-81c0-886d879556c1",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 16.5062,
            "lng": 80.648,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "74b92ec6-bbaa-4994-a25e-c3076f39224e",
        "name": "Nellore",
        "code": "AP-NEL",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "80e15296-551d-4501-8331-9773bd628aae",
            "name": "Nellore Coastal Aquaculture PHC",
            "code": "PHC-AP-80E1",
            "districtId": "74b92ec6-bbaa-4994-a25e-c3076f39224e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 14.4426,
            "lng": 79.9865,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "dc617878-65cf-4677-af01-77fcfc395cbb",
        "name": "Tirupati",
        "code": "AP-TIR",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "db85efab-b1b5-4304-9e1a-4d7c1bd36215",
            "name": "Renigunta Airport Clinic",
            "code": "PHC-AP-DB85",
            "districtId": "dc617878-65cf-4677-af01-77fcfc395cbb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.63,
            "lng": 79.52,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "deafb444-e963-4b8a-9ad7-9eed242021ce",
            "name": "Tirupati Pilgrimage Health",
            "code": "PHC-AP-DEAF",
            "districtId": "dc617878-65cf-4677-af01-77fcfc395cbb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.6288,
            "lng": 79.4192,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "ad507e2e-9dd3-440a-8629-e5498876249d",
        "name": "Visakhapatnam",
        "code": "AP-VIS",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 3,
        "activePhcs": 3,
        "population": 89250,
        "phcs": [
          {
            "id": "7aef5a8c-1b37-4606-97eb-887fec185397",
            "name": "Gajuwaka Industrial Clinic",
            "code": "PHC-AP-7AEF",
            "districtId": "ad507e2e-9dd3-440a-8629-e5498876249d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.69,
            "lng": 83.15,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "0498b85f-6fff-4c31-8211-c017bbaf985e",
            "name": "Madhurawada Tech Zone PHC",
            "code": "PHC-AP-0498",
            "districtId": "ad507e2e-9dd3-440a-8629-e5498876249d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.78,
            "lng": 83.35,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "85ce1a44-f59e-4a91-9c89-8e1f2e1bf6bd",
            "name": "Visakhapatnam Beach Road PHC",
            "code": "PHC-AP-85CE",
            "districtId": "ad507e2e-9dd3-440a-8629-e5498876249d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.6868,
            "lng": 83.2185,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "20231f20-2e39-4e60-9728-4147490ae342",
        "name": "YSR Kadapa",
        "code": "AP-YSR",
        "stateId": "7b5d180c-e6f9-4cd3-9ab9-c751ec15a116",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "a8176e34-bff4-458a-a53b-a6a0a85939c9",
            "name": "Kadapa Mining Valley PHC",
            "code": "PHC-AP-A817",
            "districtId": "20231f20-2e39-4e60-9728-4147490ae342",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 14.4673,
            "lng": 78.8242,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000011",
    "name": "Arunachal Pradesh",
    "code": "AR",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 25500,
    "districts": [
      {
        "id": "d4dbedc2-f7f3-4064-bcb7-dbe84f7c25d6",
        "name": "Papum Pare (Itanagar)",
        "code": "AR-PAP",
        "stateId": "a0000001-0000-0000-0000-000000000011",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "c573a91b-023f-4938-b42c-2c6d7dbca145",
            "name": "Itanagar Frontier PHC",
            "code": "PHC-AR-C573",
            "districtId": "d4dbedc2-f7f3-4064-bcb7-dbe84f7c25d6",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 27.0844,
            "lng": 93.6053,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000012",
    "name": "Assam",
    "code": "AS",
    "totalDistricts": 1,
    "totalPhcs": 2,
    "population": 63750,
    "districts": [
      {
        "id": "7ece7480-64d8-4208-b117-c63992968046",
        "name": "Kamrup Metropolitan (Guwahati)",
        "code": "AS-KAM",
        "stateId": "a0000001-0000-0000-0000-000000000012",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 63750,
        "phcs": [
          {
            "id": "380b926a-58e5-46aa-bee2-3e5bc7eea316",
            "name": "Brahmaputra Riverside PHC",
            "code": "PHC-AS-380B",
            "districtId": "7ece7480-64d8-4208-b117-c63992968046",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 26.1445,
            "lng": 91.7362,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "904d7002-89d4-4b31-840c-685b0cadd0d6",
            "name": "Dispur Capital Clinic",
            "code": "PHC-AS-904D",
            "districtId": "7ece7480-64d8-4208-b117-c63992968046",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.1408,
            "lng": 91.7907,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
    "name": "Bihar",
    "code": "BR",
    "totalDistricts": 10,
    "totalPhcs": 15,
    "population": 446250,
    "districts": [
      {
        "id": "528e0c0b-aad6-4945-9ba7-6a413a4e45c8",
        "name": "Begusarai",
        "code": "BR-BEG",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "fbb8a3c6-b8e9-410d-9fc8-0f70b74ce7ac",
            "name": "Begusarai Industrial PHC",
            "code": "PHC-BR-FBB8",
            "districtId": "528e0c0b-aad6-4945-9ba7-6a413a4e45c8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.4182,
            "lng": 86.1272,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "d78993e0-9033-4bac-bfe1-421c6ba64130",
        "name": "Bhagalpur",
        "code": "BR-BHA",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "6c3d482a-6966-42bd-ab95-385cf6189e3c",
            "name": "Bhagalpur Silk City Clinic",
            "code": "PHC-BR-6C3D",
            "districtId": "d78993e0-9033-4bac-bfe1-421c6ba64130",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.2425,
            "lng": 86.9842,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "566e2357-b28f-478d-9836-10999a0f7981",
            "name": "Naugachia Flood Response PHC",
            "code": "PHC-BR-566E",
            "districtId": "d78993e0-9033-4bac-bfe1-421c6ba64130",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.39,
            "lng": 87.1,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "539e29c3-024e-4da3-b8df-fba98b0344ae",
        "name": "Darbhanga",
        "code": "BR-DAR",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "2f710c86-e587-4b00-bcab-7ef6104f0cc7",
            "name": "Darbhanga Mithila Health Unit",
            "code": "PHC-BR-2F71",
            "districtId": "539e29c3-024e-4da3-b8df-fba98b0344ae",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.1542,
            "lng": 85.8918,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "4bfc2e82-c8b6-48f7-b73e-589a8c43a859",
        "name": "Gaya",
        "code": "BR-GAY",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "53736b40-10c5-4650-ba62-34f7f0e994a9",
            "name": "Bodhgaya International Clinic",
            "code": "PHC-BR-5373",
            "districtId": "4bfc2e82-c8b6-48f7-b73e-589a8c43a859",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 24.6961,
            "lng": 84.9869,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "ae8fad02-6fe6-4551-8cf7-9d8b88f4b987",
            "name": "Gaya Bodhi Health Center",
            "code": "PHC-BR-AE8F",
            "districtId": "4bfc2e82-c8b6-48f7-b73e-589a8c43a859",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 24.7914,
            "lng": 85.0002,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "f0e5926c-4ea0-4f39-a126-e2fcc9bcf2bb",
        "name": "Katihar",
        "code": "BR-KAT",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "775d32de-ce39-46b1-88e7-949d3bf1f062",
            "name": "Katihar Junction Health Unit",
            "code": "PHC-BR-775D",
            "districtId": "f0e5926c-4ea0-4f39-a126-e2fcc9bcf2bb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.5541,
            "lng": 87.5719,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "025b12aa-10a1-4eb4-bca7-7a67f617ca4f",
        "name": "Munger",
        "code": "BR-MUN",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "97fa5d0f-5b5e-44e7-8b1e-6c97b8fa313d",
            "name": "Munger Fort Region PHC",
            "code": "PHC-BR-97FA",
            "districtId": "025b12aa-10a1-4eb4-bca7-7a67f617ca4f",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.3757,
            "lng": 86.4744,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "ae3441ef-5367-4fc8-aeb7-b14923409afb",
        "name": "Muzaffarpur",
        "code": "BR-MUZ",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "ba3aca67-693c-47bc-a9ff-9a7a5168e441",
            "name": "Kanti Rural Health Center",
            "code": "PHC-BR-BA3A",
            "districtId": "ae3441ef-5367-4fc8-aeb7-b14923409afb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.1969,
            "lng": 85.3039,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "feffb956-24ff-4e20-9f22-10ec05d872c8",
            "name": "Muzaffarpur Litchi Hub PHC",
            "code": "PHC-BR-FEFF",
            "districtId": "ae3441ef-5367-4fc8-aeb7-b14923409afb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.1209,
            "lng": 85.3647,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "8488af5b-2597-4766-ab0a-c01f16e73184",
        "name": "Nalanda",
        "code": "BR-NAL",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "f5b3799a-e964-44c9-90ba-4167f3815db6",
            "name": "Nalanda Heritage Health",
            "code": "PHC-BR-F5B3",
            "districtId": "8488af5b-2597-4766-ab0a-c01f16e73184",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.1357,
            "lng": 85.445,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "fd22d0ff-8fbf-455a-b913-175f10491471",
        "name": "Patna",
        "code": "BR-PAT",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 3,
        "activePhcs": 3,
        "population": 89250,
        "phcs": [
          {
            "id": "ba504739-7567-4d77-bd96-2f1a4b60c36c",
            "name": "Danapur Cantonment Clinic",
            "code": "PHC-BR-BA50",
            "districtId": "fd22d0ff-8fbf-455a-b913-175f10491471",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.6333,
            "lng": 85.0333,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "140f27a4-849d-4178-9b8f-68000b4ad082",
            "name": "Kankarbagh Urban Health",
            "code": "PHC-BR-140F",
            "districtId": "fd22d0ff-8fbf-455a-b913-175f10491471",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.6,
            "lng": 85.15,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "42edb27d-0758-4021-a5b4-42ce68b5d4a6",
            "name": "Patna Ganga Bank Model PHC",
            "code": "PHC-BR-42ED",
            "districtId": "fd22d0ff-8fbf-455a-b913-175f10491471",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.5941,
            "lng": 85.1376,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "1eb173c4-2209-4dfb-9c0a-fa644ea60943",
        "name": "Purnia",
        "code": "BR-PUR",
        "stateId": "4a9165cf-5d68-4d58-aef6-dea0c5b5e614",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "d96c07f8-0323-4c35-91b4-66021a0b12c1",
            "name": "Purnia Seemanchal Clinic",
            "code": "PHC-BR-D96C",
            "districtId": "1eb173c4-2209-4dfb-9c0a-fa644ea60943",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.7771,
            "lng": 87.4753,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000032",
    "name": "Chandigarh",
    "code": "CH",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 34000,
    "districts": [
      {
        "id": "34db69c4-22f6-41e5-ae41-dfa8a14272ed",
        "name": "Chandigarh City",
        "code": "CH-CHA",
        "stateId": "a0000001-0000-0000-0000-000000000032",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 34000,
        "phcs": [
          {
            "id": "3807b52d-73b8-4fa5-8dee-16a1936d19ab",
            "name": "Sector 16 Model Urban PHC",
            "code": "PHC-CH-3807",
            "districtId": "34db69c4-22f6-41e5-ae41-dfa8a14272ed",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 30.7333,
            "lng": 76.7794,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000013",
    "name": "Chhattisgarh",
    "code": "CG",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 34000,
    "districts": [
      {
        "id": "9c5655f4-f95b-455c-bb29-ea4090c43ebe",
        "name": "Raipur",
        "code": "CG-RAI",
        "stateId": "a0000001-0000-0000-0000-000000000013",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 34000,
        "phcs": [
          {
            "id": "7bee1a1d-fe9e-4be6-bf37-590b3e5c9f7a",
            "name": "Raipur Central Tribal & Rural PHC",
            "code": "PHC-CG-7BEE",
            "districtId": "9c5655f4-f95b-455c-bb29-ea4090c43ebe",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 21.2514,
            "lng": 81.6296,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000033",
    "name": "Dadra and Nagar Haveli and Daman and Diu",
    "code": "DN",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 21250,
    "districts": [
      {
        "id": "1e1dca7c-9b16-460c-ab13-c6844f8a3e71",
        "name": "Daman & Diu",
        "code": "DN-DAM",
        "stateId": "a0000001-0000-0000-0000-000000000033",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 21250,
        "phcs": [
          {
            "id": "5a7debfc-1148-48e3-ad2b-b8d243c64e5b",
            "name": "Daman Coastal Dispensary",
            "code": "PHC-DN-5A7D",
            "districtId": "1e1dca7c-9b16-460c-ab13-c6844f8a3e71",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 20.3974,
            "lng": 72.8328,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000034",
    "name": "Delhi (NCT)",
    "code": "DL",
    "totalDistricts": 2,
    "totalPhcs": 4,
    "population": 131750,
    "districts": [
      {
        "id": "7dc20f10-f585-45da-aba3-ae675ea11a6b",
        "name": "Central Delhi",
        "code": "DL-CEN",
        "stateId": "a0000001-0000-0000-0000-000000000034",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 63750,
        "phcs": [
          {
            "id": "340e9c98-7d7e-43f6-9a27-ccf9f0d281b6",
            "name": "Connaught Place Urban PHC",
            "code": "PHC-DL-340E",
            "districtId": "7dc20f10-f585-45da-aba3-ae675ea11a6b",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 28.6315,
            "lng": 77.2167,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "a04b2a3b-ef10-43d1-8d5d-789372ccdfb0",
            "name": "Karol Bagh Community Health",
            "code": "PHC-DL-A04B",
            "districtId": "7dc20f10-f585-45da-aba3-ae675ea11a6b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 28.6521,
            "lng": 77.1906,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "01ce27a1-b4b1-4322-bd2d-10a6bf71afb2",
        "name": "South Delhi",
        "code": "DL-SOU",
        "stateId": "a0000001-0000-0000-0000-000000000034",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 68000,
        "phcs": [
          {
            "id": "79309133-5605-4b19-beb8-b3d9ddd86921",
            "name": "Hauz Khas Model Health Centre",
            "code": "PHC-DL-7930",
            "districtId": "01ce27a1-b4b1-4322-bd2d-10a6bf71afb2",
            "type": "24x7_PHC",
            "population": 42500,
            "lat": 28.5494,
            "lng": 77.2001,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "600d46fa-2778-4349-8f3d-88696cb6a3ae",
            "name": "Saket Urban Dispensary",
            "code": "PHC-DL-600D",
            "districtId": "01ce27a1-b4b1-4322-bd2d-10a6bf71afb2",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 28.5245,
            "lng": 77.2066,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000014",
    "name": "Goa",
    "code": "GA",
    "totalDistricts": 1,
    "totalPhcs": 2,
    "population": 46750,
    "districts": [
      {
        "id": "4db19c74-3ce6-4a7e-b0e5-704bcf254bc1",
        "name": "North Goa (Panaji)",
        "code": "GA-NOR",
        "stateId": "a0000001-0000-0000-0000-000000000014",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 46750,
        "phcs": [
          {
            "id": "b953f749-5efc-4153-98a6-96bfb301a492",
            "name": "Candolim Beachside Health",
            "code": "PHC-GA-B953",
            "districtId": "4db19c74-3ce6-4a7e-b0e5-704bcf254bc1",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 15.5178,
            "lng": 73.7634,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "9c87d1f6-54dc-43cf-87f0-0bc1ca93452b",
            "name": "Panaji Coastal Urban PHC",
            "code": "PHC-GA-9C87",
            "districtId": "4db19c74-3ce6-4a7e-b0e5-704bcf254bc1",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 15.4909,
            "lng": 73.8278,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
    "name": "Gujarat",
    "code": "GJ",
    "totalDistricts": 13,
    "totalPhcs": 15,
    "population": 446250,
    "districts": [
      {
        "id": "b60221f5-7946-4b61-a463-a35e2c1f5ca6",
        "name": "Ahmedabad",
        "code": "GJ-AHM",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "b0a235a0-b710-44ad-aa31-dbcefe657747",
            "name": "Ahmedabad Sabarmati Urban PHC",
            "code": "PHC-GJ-B0A2",
            "districtId": "b60221f5-7946-4b61-a463-a35e2c1f5ca6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.0525,
            "lng": 72.585,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "abe94735-4f17-4480-aa8c-a52446ca423b",
            "name": "Maninagar Community Health",
            "code": "PHC-GJ-ABE9",
            "districtId": "b60221f5-7946-4b61-a463-a35e2c1f5ca6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.9978,
            "lng": 72.6022,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "2eff8f75-7c7c-4fee-ad9c-0728b3de48c4",
        "name": "Anand",
        "code": "GJ-ANA",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "1faf8f58-1c53-401a-afb4-eeb232d4b58d",
            "name": "Anand Milk City PHC",
            "code": "PHC-GJ-1FAF",
            "districtId": "2eff8f75-7c7c-4fee-ad9c-0728b3de48c4",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.5645,
            "lng": 72.9289,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "3ddd88ea-0167-4d6e-a8fc-55b8312ad182",
        "name": "Bharuch",
        "code": "GJ-BHA",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "ca475398-a4ae-4ee5-8df2-b988de210bd1",
            "name": "Bharuch Narmada Bank Health",
            "code": "PHC-GJ-CA47",
            "districtId": "3ddd88ea-0167-4d6e-a8fc-55b8312ad182",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.7051,
            "lng": 72.9959,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "747d47b4-3465-481b-bfc8-d3edfdf6282f",
        "name": "Bhavnagar",
        "code": "GJ-BHA",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "a3ce92c2-0b21-47d7-9674-22b18683d92d",
            "name": "Bhavnagar Port PHC",
            "code": "PHC-GJ-A3CE",
            "districtId": "747d47b4-3465-481b-bfc8-d3edfdf6282f",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.7645,
            "lng": 72.1519,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "ff0402d3-9e66-4d31-bcc6-e1e56f0786a6",
        "name": "Gandhinagar",
        "code": "GJ-GAN",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "fdd85b00-1a66-4064-84ea-b4658847e884",
            "name": "Gandhinagar Capital Health Center",
            "code": "PHC-GJ-FDD8",
            "districtId": "ff0402d3-9e66-4d31-bcc6-e1e56f0786a6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.2156,
            "lng": 72.6369,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "0fc5e73f-62da-4973-b178-36bd14303a90",
        "name": "Jamnagar",
        "code": "GJ-JAM",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "fad6ecc6-d8fe-49ae-a513-345bd1727ad8",
            "name": "Jamnagar Brass City Clinic",
            "code": "PHC-GJ-FAD6",
            "districtId": "0fc5e73f-62da-4973-b178-36bd14303a90",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.4707,
            "lng": 70.0577,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "ea6ab6b1-531f-4beb-8ca9-b92c4df18e4a",
        "name": "Junagadh",
        "code": "GJ-JUN",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "18a6902e-b9e3-44ed-98f6-24f642593ce1",
            "name": "Junagadh Gir Foothills PHC",
            "code": "PHC-GJ-18A6",
            "districtId": "ea6ab6b1-531f-4beb-8ca9-b92c4df18e4a",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.5222,
            "lng": 70.4579,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "fb006b91-cc60-4d13-89f4-9e507fe6d1d0",
        "name": "Kutch",
        "code": "GJ-KUT",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "abf4dc9b-5352-4d00-979f-91f0bd2b0508",
            "name": "Bhuj Kutch Resilience PHC",
            "code": "PHC-GJ-ABF4",
            "districtId": "fb006b91-cc60-4d13-89f4-9e507fe6d1d0",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.242,
            "lng": 69.6669,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "f17019ed-1388-4e3a-9305-8ed4ad5e57e6",
        "name": "Mehsana",
        "code": "GJ-MEH",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "f506d698-bb4a-4a2c-b44c-59a2c4e2820b",
            "name": "Mehsana Sun Temple Region PHC",
            "code": "PHC-GJ-F506",
            "districtId": "f17019ed-1388-4e3a-9305-8ed4ad5e57e6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.588,
            "lng": 72.3693,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "8c1360d1-27bc-4a58-afad-7968d64329ea",
        "name": "Porbandar",
        "code": "GJ-POR",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "69b64932-ba7c-44fe-96e6-f4f12c24ca9f",
            "name": "Porbandar Coastal Health Unit",
            "code": "PHC-GJ-69B6",
            "districtId": "8c1360d1-27bc-4a58-afad-7968d64329ea",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.6417,
            "lng": 69.6293,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "87ac0c7e-a8f8-4e7c-b871-62afbae9a2b8",
        "name": "Rajkot",
        "code": "GJ-RAJ",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "de9c83af-656e-425c-ad5c-1601aaeccd63",
            "name": "Rajkot Aji River Health Unit",
            "code": "PHC-GJ-DE9C",
            "districtId": "87ac0c7e-a8f8-4e7c-b871-62afbae9a2b8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.3039,
            "lng": 70.8022,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "9e626c68-2d02-4ab8-8b43-c41a0643e369",
        "name": "Surat",
        "code": "GJ-SUR",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "3c8d9647-094d-4449-999b-b5a41845e59a",
            "name": "Rander Coastal Dispensary",
            "code": "PHC-GJ-3C8D",
            "districtId": "9e626c68-2d02-4ab8-8b43-c41a0643e369",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.2167,
            "lng": 72.7933,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "651e2261-370e-47a5-9696-11dc62e71c7a",
            "name": "Surat Diamond City Health Center",
            "code": "PHC-GJ-651E",
            "districtId": "9e626c68-2d02-4ab8-8b43-c41a0643e369",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.1702,
            "lng": 72.8311,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "cb739e7e-b44e-4812-b875-7adbe2c760ac",
        "name": "Vadodara",
        "code": "GJ-VAD",
        "stateId": "71885ac7-e9e9-4316-a33c-d07f53c8af1a",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "2b35fa08-a46b-4f46-a532-712ee473880f",
            "name": "Vadodara Sayaji PHC",
            "code": "PHC-GJ-2B35",
            "districtId": "cb739e7e-b44e-4812-b875-7adbe2c760ac",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.3072,
            "lng": 73.1812,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000015",
    "name": "Haryana",
    "code": "HR",
    "totalDistricts": 1,
    "totalPhcs": 2,
    "population": 68000,
    "districts": [
      {
        "id": "3d9464a1-7fd0-4bf1-9af0-e8feabf566d0",
        "name": "Gurugram",
        "code": "HR-GUR",
        "stateId": "a0000001-0000-0000-0000-000000000015",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 68000,
        "phcs": [
          {
            "id": "1ac3d263-d2b0-49fb-ba02-cc4b2c67ef55",
            "name": "Cyber City Sector 29 Urban PHC",
            "code": "PHC-HR-1AC3",
            "districtId": "3d9464a1-7fd0-4bf1-9af0-e8feabf566d0",
            "type": "24x7_PHC",
            "population": 42500,
            "lat": 28.4595,
            "lng": 77.0266,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "edfd2f7d-4726-4454-8648-539cb69d665a",
            "name": "Sohna Rural Health Centre",
            "code": "PHC-HR-EDFD",
            "districtId": "3d9464a1-7fd0-4bf1-9af0-e8feabf566d0",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 28.2478,
            "lng": 77.062,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000016",
    "name": "Himachal Pradesh",
    "code": "HP",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 25500,
    "districts": [
      {
        "id": "a5dfd02d-6b9b-4837-9eb3-f88aa2e73107",
        "name": "Shimla",
        "code": "HP-SHI",
        "stateId": "a0000001-0000-0000-0000-000000000016",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "91295803-f427-4580-8b96-3bfb972a11f1",
            "name": "Shimla Ridge Model PHC",
            "code": "PHC-HP-9129",
            "districtId": "a5dfd02d-6b9b-4837-9eb3-f88aa2e73107",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 31.1048,
            "lng": 77.1734,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000035",
    "name": "Jammu and Kashmir",
    "code": "JK",
    "totalDistricts": 2,
    "totalPhcs": 2,
    "population": 68000,
    "districts": [
      {
        "id": "0bc723a8-76fa-4d5e-bfc3-b85cb1728355",
        "name": "Jammu",
        "code": "JK-JAM",
        "stateId": "a0000001-0000-0000-0000-000000000035",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 42500,
        "phcs": [
          {
            "id": "d94b5277-ed16-4011-a57b-4e9861203081",
            "name": "Tawi Valley Community Health",
            "code": "PHC-JK-D94B",
            "districtId": "0bc723a8-76fa-4d5e-bfc3-b85cb1728355",
            "type": "24x7_PHC",
            "population": 42500,
            "lat": 32.7266,
            "lng": 74.857,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "cc9841d0-ee6c-488e-9102-b8d17dd4c27c",
        "name": "Srinagar",
        "code": "JK-SRI",
        "stateId": "a0000001-0000-0000-0000-000000000035",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "9300e1c9-dcd6-4ac7-99cf-b4e434849f71",
            "name": "Dal Lake Floating & Island PHC",
            "code": "PHC-JK-9300",
            "districtId": "cc9841d0-ee6c-488e-9102-b8d17dd4c27c",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 34.0837,
            "lng": 74.7973,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000017",
    "name": "Jharkhand",
    "code": "JH",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 38250,
    "districts": [
      {
        "id": "4860e42e-4d51-437b-84c5-0f4eed21d171",
        "name": "Ranchi",
        "code": "JH-RAN",
        "stateId": "a0000001-0000-0000-0000-000000000017",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 38250,
        "phcs": [
          {
            "id": "668b7d6d-778a-4715-9f40-a98f16f07bcb",
            "name": "Ranchi Plateau Community Health",
            "code": "PHC-JH-668B",
            "districtId": "4860e42e-4d51-437b-84c5-0f4eed21d171",
            "type": "24x7_PHC",
            "population": 38250,
            "lat": 23.3441,
            "lng": 85.3096,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000002",
    "name": "Karnataka",
    "code": "KA",
    "totalDistricts": 13,
    "totalPhcs": 21,
    "population": 620500,
    "districts": [
      {
        "id": "2677fbb0-f027-4250-bc21-c49779e5c595",
        "name": "Ballari",
        "code": "KA-BAL",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "63d66324-4c82-4920-a6e6-970cf2b94c1e",
            "name": "Ballari Mining Hub PHC",
            "code": "PHC-KA-63D6",
            "districtId": "2677fbb0-f027-4250-bc21-c49779e5c595",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 15.1394,
            "lng": 76.9214,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "968b50aa-a777-4260-94e8-320db93954be",
        "name": "Belagavi",
        "code": "KA-BEL",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "d490abff-eac0-4983-a461-bea435cb954b",
            "name": "Belagavi Fort Area PHC",
            "code": "PHC-KA-D490",
            "districtId": "968b50aa-a777-4260-94e8-320db93954be",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 15.8497,
            "lng": 74.4977,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "b0000002-0000-0000-0000-000000000004",
        "name": "Bengaluru Urban",
        "code": "KA-BEN",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 6,
        "activePhcs": 6,
        "population": 182750,
        "phcs": [
          {
            "id": "0aa980cf-5f31-4bc1-af4d-2f441c726e82",
            "name": "Indiranagar Urban Health",
            "code": "PHC-KA-0AA9",
            "districtId": "b0000002-0000-0000-0000-000000000004",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.9784,
            "lng": 77.6408,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "24876f45-11d2-49a6-86ef-6cafac187924",
            "name": "Jayanagar Family Health Center",
            "code": "PHC-KA-2487",
            "districtId": "b0000002-0000-0000-0000-000000000004",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.9308,
            "lng": 77.5838,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "11994087-9598-4033-ae88-258dc74c6ee3",
            "name": "Koramangala Community Clinic",
            "code": "PHC-KA-1199",
            "districtId": "b0000002-0000-0000-0000-000000000004",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.9352,
            "lng": 77.6245,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000009",
            "name": "Koramangala PHC",
            "code": "PHC-KA-C000",
            "districtId": "b0000002-0000-0000-0000-000000000004",
            "type": "24x7_PHC",
            "population": 38250,
            "lat": 12.9279,
            "lng": 77.6271,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000010",
            "name": "Whitefield PHC",
            "code": "PHC-KA-C000",
            "districtId": "b0000002-0000-0000-0000-000000000004",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 12.9698,
            "lng": 77.75,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "8e9b61cc-6709-4641-81a3-7e34f4673d61",
            "name": "Whitefield Tech Corridor PHC",
            "code": "PHC-KA-8E9B",
            "districtId": "b0000002-0000-0000-0000-000000000004",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.9698,
            "lng": 77.75,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "a5a60fbc-abd7-4462-be0a-7ff8dcaa77fe",
        "name": "Bidar",
        "code": "KA-BID",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "fbee6e14-34ad-44b1-a557-1c47c55e94b4",
            "name": "Bidar Heritage Border Clinic",
            "code": "PHC-KA-FBEE",
            "districtId": "a5a60fbc-abd7-4462-be0a-7ff8dcaa77fe",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.9104,
            "lng": 77.5199,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "9a28a35c-a57c-4021-9300-69669d75050c",
        "name": "Dakshina Kannada",
        "code": "KA-DAK",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "b9cf0508-1405-4e37-8f1f-57ba3abb1cb0",
            "name": "Mangaluru Coastal 24x7 PHC",
            "code": "PHC-KA-B9CF",
            "districtId": "9a28a35c-a57c-4021-9300-69669d75050c",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.9141,
            "lng": 74.856,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "7eda1d98-4706-4626-b776-3a55618f8458",
        "name": "Davangere",
        "code": "KA-DAV",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "32a61083-e9af-458d-80f9-b8c534ec42aa",
            "name": "Davangere Cotton City PHC",
            "code": "PHC-KA-32A6",
            "districtId": "7eda1d98-4706-4626-b776-3a55618f8458",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 14.4644,
            "lng": 75.9218,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "365277df-d910-452f-8356-15343a531efb",
        "name": "Dharwad",
        "code": "KA-DHA",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "2077f5af-b329-4d1c-9628-638de99fcb34",
            "name": "Dharwad University PHC",
            "code": "PHC-KA-2077",
            "districtId": "365277df-d910-452f-8356-15343a531efb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 15.4589,
            "lng": 75.0078,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "a6cab9db-a111-4e15-bbfb-e43a6407e470",
            "name": "Hubballi City Health Center",
            "code": "PHC-KA-A6CA",
            "districtId": "365277df-d910-452f-8356-15343a531efb",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 15.3647,
            "lng": 75.124,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "0fb1f054-5ef4-4379-b9ef-9b5364d90b8e",
        "name": "Hassan",
        "code": "KA-HAS",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "b060b56c-43c6-4174-8dd0-fe5ebc7bb32b",
            "name": "Hassan Coffee Valley PHC",
            "code": "PHC-KA-B060",
            "districtId": "0fb1f054-5ef4-4379-b9ef-9b5364d90b8e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.0072,
            "lng": 76.1029,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "370d2f1e-ad63-4771-892b-634fc284ddf9",
        "name": "Kalaburagi",
        "code": "KA-KAL",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "236061f1-86f9-4a40-bb8e-d19959d0308d",
            "name": "Kalaburagi Central Dispensary",
            "code": "PHC-KA-2360",
            "districtId": "370d2f1e-ad63-4771-892b-634fc284ddf9",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.3297,
            "lng": 76.8343,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          }
        ]
      },
      {
        "id": "b0000002-0000-0000-0000-000000000005",
        "name": "Mysuru",
        "code": "KA-MYS",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 3,
        "activePhcs": 3,
        "population": 80750,
        "phcs": [
          {
            "id": "33a6e884-e857-4eac-b0c4-8637e15af5d3",
            "name": "Chamundi Foothills Health Unit",
            "code": "PHC-KA-33A6",
            "districtId": "b0000002-0000-0000-0000-000000000005",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.2725,
            "lng": 76.671,
            "lastSyncTime": "2026-09-28T11:18:27.265Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000011",
            "name": "Mysuru North PHC",
            "code": "PHC-KA-C000",
            "districtId": "b0000002-0000-0000-0000-000000000005",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 12.3051,
            "lng": 76.6551,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "26a8e2f8-49fb-4993-acd2-e1724014e6ce",
            "name": "Mysuru Palace Urban PHC",
            "code": "PHC-KA-26A8",
            "districtId": "b0000002-0000-0000-0000-000000000005",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 12.3051,
            "lng": 76.6551,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "f962daf7-d89d-415c-87ae-288d01a59603",
        "name": "Shivamogga",
        "code": "KA-SHI",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "7a96bced-8311-435d-929e-1a81f9e8ad05",
            "name": "Shivamogga Malnad Health Center",
            "code": "PHC-KA-7A96",
            "districtId": "f962daf7-d89d-415c-87ae-288d01a59603",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.9299,
            "lng": 75.5681,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "bdd8aae3-bb94-4e57-9bfd-62bfe597ded8",
        "name": "Tumakuru",
        "code": "KA-TUM",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "9732cbf2-2d8f-4d63-9b6b-b9da90288790",
            "name": "Tumakuru Smart City PHC",
            "code": "PHC-KA-9732",
            "districtId": "bdd8aae3-bb94-4e57-9bfd-62bfe597ded8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.3379,
            "lng": 77.101,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "dffd46fe-e2e7-4e46-ac22-14319c7ab5b8",
        "name": "Udupi",
        "code": "KA-UDU",
        "stateId": "a0000001-0000-0000-0000-000000000002",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "ece0f285-7215-43a2-af2c-2ec4e8c5823d",
            "name": "Udupi Temple Town Health Unit",
            "code": "PHC-KA-ECE0",
            "districtId": "dffd46fe-e2e7-4e46-ac22-14319c7ab5b8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.3409,
            "lng": 74.7421,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000018",
    "name": "Kerala",
    "code": "KL",
    "totalDistricts": 2,
    "totalPhcs": 4,
    "population": 144500,
    "districts": [
      {
        "id": "760f89e0-78d5-4d17-ab97-2e0bac179d0b",
        "name": "Ernakulam",
        "code": "KL-ERN",
        "stateId": "a0000001-0000-0000-0000-000000000018",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 68000,
        "phcs": [
          {
            "id": "8c5c0415-ddfc-481e-a536-e4f79b29952d",
            "name": "Aluva Sub-District PHC",
            "code": "PHC-KL-8C5C",
            "districtId": "760f89e0-78d5-4d17-ab97-2e0bac179d0b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 10.1076,
            "lng": 76.3516,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "79447272-0711-4eaf-af3c-93d74afc9eb2",
            "name": "Kochi Urban Family Health Centre",
            "code": "PHC-KL-7944",
            "districtId": "760f89e0-78d5-4d17-ab97-2e0bac179d0b",
            "type": "24x7_PHC",
            "population": 38250,
            "lat": 9.9312,
            "lng": 76.2673,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "30e57822-2fcb-45dc-9d17-2be89e5130f9",
        "name": "Thiruvananthapuram",
        "code": "KL-THI",
        "stateId": "a0000001-0000-0000-0000-000000000018",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 76500,
        "phcs": [
          {
            "id": "d47c6df2-2488-466f-b2b1-1200d332ee89",
            "name": "Kovalam Coastal 24x7 PHC",
            "code": "PHC-KL-D47C",
            "districtId": "30e57822-2fcb-45dc-9d17-2be89e5130f9",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 8.402,
            "lng": 76.978,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "84ce3b13-1f3d-4a09-b094-99b54a3bbdb7",
            "name": "Nedumangad Taluk Health Centre",
            "code": "PHC-KL-84CE",
            "districtId": "30e57822-2fcb-45dc-9d17-2be89e5130f9",
            "type": "24x7_PHC",
            "population": 51000,
            "lat": 8.601,
            "lng": 77.001,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000036",
    "name": "Ladakh",
    "code": "LA",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 21250,
    "districts": [
      {
        "id": "c23a34c2-7978-4f2c-81ee-700b66926d55",
        "name": "Leh High Altitude",
        "code": "LA-LEH",
        "stateId": "a0000001-0000-0000-0000-000000000036",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 21250,
        "phcs": [
          {
            "id": "d8379a1a-2d4e-4e37-a4d5-60591e45e9f0",
            "name": "Leh Altitude Resilience PHC",
            "code": "PHC-LA-D837",
            "districtId": "c23a34c2-7978-4f2c-81ee-700b66926d55",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 34.1526,
            "lng": 77.5771,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000037",
    "name": "Lakshadweep",
    "code": "LD",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 17000,
    "districts": [
      {
        "id": "0ccd3ee4-174b-41e9-9aa4-80adb51ade9d",
        "name": "Kavaratti Island",
        "code": "LD-KAV",
        "stateId": "a0000001-0000-0000-0000-000000000037",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 17000,
        "phcs": [
          {
            "id": "7c266eed-70c8-431b-a11c-1e1d05ba4659",
            "name": "Kavaratti Lagoon Health Unit",
            "code": "PHC-LD-7C26",
            "districtId": "0ccd3ee4-174b-41e9-9aa4-80adb51ade9d",
            "type": "24x7_PHC",
            "population": 17000,
            "lat": 10.5667,
            "lng": 72.6417,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "64e1316d-de72-4b1c-911a-049c37d20c26",
    "name": "Madhya Pradesh",
    "code": "MP",
    "totalDistricts": 8,
    "totalPhcs": 10,
    "population": 297500,
    "districts": [
      {
        "id": "8f8b3583-67f0-4aed-aa36-3e5fb78f3827",
        "name": "Bhopal",
        "code": "MP-BHO",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "29b0ff37-0787-45a1-8e8d-546db38e29a0",
            "name": "BHEL Industrial Dispensary",
            "code": "PHC-MP-29B0",
            "districtId": "8f8b3583-67f0-4aed-aa36-3e5fb78f3827",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.28,
            "lng": 77.48,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "d4264225-e2ee-4081-9962-7f24d30aecdb",
            "name": "Bhopal Lake View Model PHC",
            "code": "PHC-MP-D426",
            "districtId": "8f8b3583-67f0-4aed-aa36-3e5fb78f3827",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.2599,
            "lng": 77.4126,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "0a30bac7-3e08-4c30-8e6e-1393829f4573",
        "name": "Gwalior",
        "code": "MP-GWA",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "775ec5d0-ba3f-41c7-a1fd-9f5dd25b481d",
            "name": "Gwalior Fort Region Clinic",
            "code": "PHC-MP-775E",
            "districtId": "0a30bac7-3e08-4c30-8e6e-1393829f4573",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.2183,
            "lng": 78.1828,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "55b432f9-8ca1-4e7b-a93e-829cd4a142f6",
        "name": "Indore",
        "code": "MP-IND",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "ecd7ab05-3774-477d-98f4-45f8f743b4a5",
            "name": "Indore Clean City Family Clinic",
            "code": "PHC-MP-ECD7",
            "districtId": "55b432f9-8ca1-4e7b-a93e-829cd4a142f6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.7196,
            "lng": 75.8577,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "0d034b74-a021-480e-887e-8a3168741c4e",
            "name": "Vijay Nagar Model Health",
            "code": "PHC-MP-0D03",
            "districtId": "55b432f9-8ca1-4e7b-a93e-829cd4a142f6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.75,
            "lng": 75.89,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b3c1ff57-3a08-467f-951d-f4a641c5ff7c",
        "name": "Jabalpur",
        "code": "MP-JAB",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "dae5561f-bdc9-4319-b4b7-6ffac242c234",
            "name": "Jabalpur Narmada Valley PHC",
            "code": "PHC-MP-DAE5",
            "districtId": "b3c1ff57-3a08-467f-951d-f4a641c5ff7c",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.1815,
            "lng": 79.9864,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "1d5ecbda-2605-4382-89b8-f5591a32fd6d",
        "name": "Rewa",
        "code": "MP-REW",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "59b81893-6025-47fe-9617-b2747739737b",
            "name": "Rewa White Tiger Region PHC",
            "code": "PHC-MP-59B8",
            "districtId": "1d5ecbda-2605-4382-89b8-f5591a32fd6d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 24.5362,
            "lng": 81.3037,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "1e1296cb-9038-4702-9624-7af3956cd111",
        "name": "Sagar",
        "code": "MP-SAG",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "91c1d0be-7cc0-490f-a8d4-f4257f12981c",
            "name": "Sagar Bundelkhand PHC",
            "code": "PHC-MP-91C1",
            "districtId": "1e1296cb-9038-4702-9624-7af3956cd111",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.8388,
            "lng": 78.7378,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "86c31967-1eb0-4bb5-8070-a7130dd69226",
        "name": "Satna",
        "code": "MP-SAT",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "c38b22af-b7b5-4a32-80d4-1c717ba9aba5",
            "name": "Satna Cement Region Clinic",
            "code": "PHC-MP-C38B",
            "districtId": "86c31967-1eb0-4bb5-8070-a7130dd69226",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 24.6005,
            "lng": 80.8322,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "8140be32-af60-473e-925b-5e4a42128fb2",
        "name": "Ujjain",
        "code": "MP-UJJ",
        "stateId": "64e1316d-de72-4b1c-911a-049c37d20c26",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "ac62ca47-1ef7-41a8-b929-03a49531471e",
            "name": "Ujjain Mahakal Temple Health",
            "code": "PHC-MP-AC62",
            "districtId": "8140be32-af60-473e-925b-5e4a42128fb2",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.1765,
            "lng": 75.7885,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000001",
    "name": "Maharashtra",
    "code": "MH",
    "totalDistricts": 8,
    "totalPhcs": 25,
    "population": 752250,
    "districts": [
      {
        "id": "b0000002-0000-0000-0000-000000000003",
        "name": "Aurangabad",
        "code": "MH-AUR",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 80750,
        "phcs": [
          {
            "id": "c0000003-0000-0000-0000-000000000008",
            "name": "Aurangabad Central",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000003",
            "type": "24x7_PHC",
            "population": 51000,
            "lat": 19.8762,
            "lng": 75.3433,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "57fa4594-6c34-41ab-9fdd-a8e10bda3a30",
            "name": "CIDCO Community Dispensary",
            "code": "PHC-MH-57FA",
            "districtId": "b0000002-0000-0000-0000-000000000003",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.8885,
            "lng": 75.367,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "a6dfcc5c-82fd-4db9-af52-3d28c6dbd02d",
        "name": "Kolhapur",
        "code": "MH-KOL",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "4557112a-03fa-43b2-a93e-a98e807256a5",
            "name": "Kolhapur Mahalaxmi PHC",
            "code": "PHC-MH-4557",
            "districtId": "a6dfcc5c-82fd-4db9-af52-3d28c6dbd02d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 16.705,
            "lng": 74.2433,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "25eead54-da3c-4f63-8aa6-6aab38838c1b",
        "name": "Mumbai Suburban",
        "code": "MH-MUM",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 4,
        "activePhcs": 4,
        "population": 119000,
        "phcs": [
          {
            "id": "e3357b8b-29f7-45f7-981e-7462af82b28c",
            "name": "Andheri East PHC",
            "code": "PHC-MH-E335",
            "districtId": "25eead54-da3c-4f63-8aa6-6aab38838c1b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.1136,
            "lng": 72.8697,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "26c9addb-485f-4ec6-8cf8-79569e260edc",
            "name": "Bandra West Model Clinic",
            "code": "PHC-MH-26C9",
            "districtId": "25eead54-da3c-4f63-8aa6-6aab38838c1b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.0596,
            "lng": 72.8295,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "37713d1c-3821-4080-97a7-fafcf726bc4c",
            "name": "Dharavi Urban Health Clinic",
            "code": "PHC-MH-3771",
            "districtId": "25eead54-da3c-4f63-8aa6-6aab38838c1b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.0434,
            "lng": 72.8567,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "ed31ad12-daeb-4aa0-af9b-83223a9bb056",
            "name": "Kurla Community Health Center",
            "code": "PHC-MH-ED31",
            "districtId": "25eead54-da3c-4f63-8aa6-6aab38838c1b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.0657,
            "lng": 72.8794,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "8d7827b2-adfa-487b-9d48-c48523f1909e",
        "name": "Nagpur",
        "code": "MH-NAG",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 3,
        "activePhcs": 3,
        "population": 89250,
        "phcs": [
          {
            "id": "00621caf-e401-4b84-a376-0ac31dd924ce",
            "name": "Nagpur Central Model PHC",
            "code": "PHC-MH-0062",
            "districtId": "8d7827b2-adfa-487b-9d48-c48523f1909e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.1458,
            "lng": 79.0882,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "317e40aa-8857-48bb-9070-c54726bc46a6",
            "name": "Ramtek Rural Health Center",
            "code": "PHC-MH-317E",
            "districtId": "8d7827b2-adfa-487b-9d48-c48523f1909e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.3975,
            "lng": 79.3292,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "30db98b2-35e6-4ca2-b0fb-b5afd112bd33",
            "name": "Sitabuldi Urban Health Unit",
            "code": "PHC-MH-30DB",
            "districtId": "8d7827b2-adfa-487b-9d48-c48523f1909e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 21.1466,
            "lng": 79.0833,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b0000002-0000-0000-0000-000000000002",
        "name": "Nashik",
        "code": "MH-NAS",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 4,
        "activePhcs": 4,
        "population": 114750,
        "phcs": [
          {
            "id": "f30baa52-07f2-4875-b16f-762df191a161",
            "name": "Malegaon Model Health Clinic",
            "code": "PHC-MH-F30B",
            "districtId": "b0000002-0000-0000-0000-000000000002",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 20.5539,
            "lng": 74.5288,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000006",
            "name": "Malegaon PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000002",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 20.5579,
            "lng": 74.5089,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "15fd294f-ef66-451d-83e0-ea9b656e2693",
            "name": "Nashik Panchavati PHC",
            "code": "PHC-MH-15FD",
            "districtId": "b0000002-0000-0000-0000-000000000002",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 20.0063,
            "lng": 73.7903,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000007",
            "name": "Nashik Rural PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000002",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 19.9975,
            "lng": 73.7898,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b0000002-0000-0000-0000-000000000001",
        "name": "Pune",
        "code": "MH-PUN",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 8,
        "activePhcs": 8,
        "population": 229500,
        "phcs": [
          {
            "id": "c0000003-0000-0000-0000-000000000003",
            "name": "Baramati PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 42500,
            "lat": 18.1517,
            "lng": 74.5769,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000004",
            "name": "Chakan PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 18.7601,
            "lng": 73.8614,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "33c316b1-6d36-494f-bd2f-3cbd6d4206c1",
            "name": "Hadapsar 24x7 PHC",
            "code": "PHC-MH-33C3",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 18.5018,
            "lng": 73.926,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000002",
            "name": "Hadapsar PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 18.5089,
            "lng": 73.9259,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "3918e500-3b65-4922-ba7d-6d4982191d0c",
            "name": "Junnar Mountain PHC",
            "code": "PHC-MH-3918",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.2064,
            "lng": 73.8767,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000001",
            "name": "Kothrud PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 18.5074,
            "lng": 73.8077,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000005",
            "name": "Shirur PHC",
            "code": "PHC-MH-C000",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 17000,
            "lat": 18.8264,
            "lng": 74.3677,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c1826e7f-37a9-4fc1-8c2b-c9be30a54a00",
            "name": "Shirur Rural PHC",
            "code": "PHC-MH-C182",
            "districtId": "b0000002-0000-0000-0000-000000000001",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 18.8256,
            "lng": 74.3789,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "00a99f28-ad0d-4c9c-97b4-2ab699928ca3",
        "name": "Solapur",
        "code": "MH-SOL",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "1f0950ab-d41a-4e18-bcb9-9e889a3a7377",
            "name": "Solapur Textile Hub PHC",
            "code": "PHC-MH-1F09",
            "districtId": "00a99f28-ad0d-4c9c-97b4-2ab699928ca3",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.6599,
            "lng": 75.9064,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "557ffaad-2cc8-4c26-87b0-9b813a29db0b",
        "name": "Thane",
        "code": "MH-THA",
        "stateId": "a0000001-0000-0000-0000-000000000001",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "fe5a32ae-a63d-49d0-afa2-905472ecd76b",
            "name": "Kalyan West PHC",
            "code": "PHC-MH-FE5A",
            "districtId": "557ffaad-2cc8-4c26-87b0-9b813a29db0b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.2437,
            "lng": 73.1355,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "73690b98-33c8-40d0-82f2-ee15a40a5c6c",
            "name": "Thane Central Urban Health",
            "code": "PHC-MH-7369",
            "districtId": "557ffaad-2cc8-4c26-87b0-9b813a29db0b",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.2183,
            "lng": 72.9781,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000019",
    "name": "Manipur",
    "code": "MN",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 25500,
    "districts": [
      {
        "id": "2de42545-8791-49d0-bb5b-4b870e03265f",
        "name": "Imphal West",
        "code": "MN-IMP",
        "stateId": "a0000001-0000-0000-0000-000000000019",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "fc5354f7-4d1d-45e6-835e-129f6930d113",
            "name": "Imphal Valley 24x7 PHC",
            "code": "PHC-MN-FC53",
            "districtId": "2de42545-8791-49d0-bb5b-4b870e03265f",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 24.817,
            "lng": 93.9368,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000020",
    "name": "Meghalaya",
    "code": "ML",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 25500,
    "districts": [
      {
        "id": "7b496f3b-ccb4-4721-8150-c637dddce2d0",
        "name": "East Khasi Hills (Shillong)",
        "code": "ML-EAS",
        "stateId": "a0000001-0000-0000-0000-000000000020",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "21d8131f-e816-45b6-8727-a376e52f48c7",
            "name": "Shillong Pine Hills PHC",
            "code": "PHC-ML-21D8",
            "districtId": "7b496f3b-ccb4-4721-8150-c637dddce2d0",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 25.5788,
            "lng": 91.8933,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000021",
    "name": "Mizoram",
    "code": "MZ",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 21250,
    "districts": [
      {
        "id": "4171182c-64c3-4704-a86f-d176b35f1be1",
        "name": "Aizawl",
        "code": "MZ-AIZ",
        "stateId": "a0000001-0000-0000-0000-000000000021",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 21250,
        "phcs": [
          {
            "id": "babc2c55-4c9e-47a8-97b1-f17089f3b1f5",
            "name": "Aizawl Ridge Primary Clinic",
            "code": "PHC-MZ-BABC",
            "districtId": "4171182c-64c3-4704-a86f-d176b35f1be1",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 23.7271,
            "lng": 92.7176,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000022",
    "name": "Nagaland",
    "code": "NL",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 21250,
    "districts": [
      {
        "id": "90b54a92-4104-4d90-aa48-b7ae27ba2940",
        "name": "Kohima",
        "code": "NL-KOH",
        "stateId": "a0000001-0000-0000-0000-000000000022",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 21250,
        "phcs": [
          {
            "id": "de48c15e-1123-494a-a139-bfcfdcf91dc7",
            "name": "Kohima Highland Health Centre",
            "code": "PHC-NL-DE48",
            "districtId": "90b54a92-4104-4d90-aa48-b7ae27ba2940",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 25.6751,
            "lng": 94.1086,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000023",
    "name": "Odisha",
    "code": "OD",
    "totalDistricts": 1,
    "totalPhcs": 2,
    "population": 63750,
    "districts": [
      {
        "id": "52277c53-78e5-42e3-a2fe-6010a70ca527",
        "name": "Khurda (Bhubaneswar)",
        "code": "OD-KHU",
        "stateId": "a0000001-0000-0000-0000-000000000023",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 63750,
        "phcs": [
          {
            "id": "3cce4123-467c-403d-a65a-39477743add8",
            "name": "Puri Coastal Health Centre",
            "code": "PHC-OD-3CCE",
            "districtId": "52277c53-78e5-42e3-a2fe-6010a70ca527",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 19.8135,
            "lng": 85.8312,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "464e5c45-4b21-4d97-a351-3be527a11410",
            "name": "Saheed Nagar Urban PHC",
            "code": "PHC-OD-464E",
            "districtId": "52277c53-78e5-42e3-a2fe-6010a70ca527",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 20.2961,
            "lng": 85.8245,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000038",
    "name": "Puducherry",
    "code": "PY",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 25500,
    "districts": [
      {
        "id": "58b93688-e2cc-4f88-8a9e-e214316a80e9",
        "name": "Puducherry",
        "code": "PY-PUD",
        "stateId": "a0000001-0000-0000-0000-000000000038",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "f2730de2-d5d0-474f-9e1f-a1d1e55e62aa",
            "name": "French Quarter Coastal Health",
            "code": "PHC-PY-F273",
            "districtId": "58b93688-e2cc-4f88-8a9e-e214316a80e9",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 11.9416,
            "lng": 79.8083,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000024",
    "name": "Punjab",
    "code": "PB",
    "totalDistricts": 2,
    "totalPhcs": 3,
    "population": 93500,
    "districts": [
      {
        "id": "ccb04de1-9c24-4c25-bdaa-ac3edd4c77bb",
        "name": "Amritsar",
        "code": "PB-AMR",
        "stateId": "a0000001-0000-0000-0000-000000000024",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 55250,
        "phcs": [
          {
            "id": "056ef701-4266-479c-8195-df0088a3fb56",
            "name": "Amritsar Heritage Urban PHC",
            "code": "PHC-PB-056E",
            "districtId": "ccb04de1-9c24-4c25-bdaa-ac3edd4c77bb",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 31.634,
            "lng": 74.8723,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "6174348c-805b-43bb-9480-26de1778c73c",
            "name": "Attari Border Rural PHC",
            "code": "PHC-PB-6174",
            "districtId": "ccb04de1-9c24-4c25-bdaa-ac3edd4c77bb",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 31.603,
            "lng": 74.605,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "5f6e9f48-6333-4644-a08c-6501e422f2cd",
        "name": "Ludhiana",
        "code": "PB-LUD",
        "stateId": "a0000001-0000-0000-0000-000000000024",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 38250,
        "phcs": [
          {
            "id": "ce3fbedf-b626-4f1f-8068-1724ebb03ed8",
            "name": "Ludhiana Industrial Area PHC",
            "code": "PHC-PB-CE3F",
            "districtId": "5f6e9f48-6333-4644-a08c-6501e422f2cd",
            "type": "24x7_PHC",
            "population": 38250,
            "lat": 30.901,
            "lng": 75.8573,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000005",
    "name": "Rajasthan",
    "code": "RJ",
    "totalDistricts": 10,
    "totalPhcs": 14,
    "population": 403750,
    "districts": [
      {
        "id": "4c43f4e7-d74f-4ca9-afb9-e6357b8b4018",
        "name": "Ajmer",
        "code": "RJ-AJM",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "313a8c65-3f89-4aab-a8ef-a03ff3748fe1",
            "name": "Ajmer Dargah Region PHC",
            "code": "PHC-RJ-313A",
            "districtId": "4c43f4e7-d74f-4ca9-afb9-e6357b8b4018",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.4499,
            "lng": 74.6399,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "986e84c0-9ba2-44f1-b2f0-bfffe2249458",
        "name": "Alwar",
        "code": "RJ-ALW",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "767f5619-946a-41e0-be79-1a26de4851c6",
            "name": "Alwar Foothills Dispensary",
            "code": "PHC-RJ-767F",
            "districtId": "986e84c0-9ba2-44f1-b2f0-bfffe2249458",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 27.553,
            "lng": 76.6346,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b7b373d8-cec7-40ed-80ac-ecc1bafc9c84",
        "name": "Bhilwara",
        "code": "RJ-BHI",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "7590b0ac-79c3-4059-b924-ad0a1846c6f4",
            "name": "Bhilwara Textile Hub Clinic",
            "code": "PHC-RJ-7590",
            "districtId": "b7b373d8-cec7-40ed-80ac-ecc1bafc9c84",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.3407,
            "lng": 74.6313,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "69b084eb-fbc5-449f-bea2-f935c737ee09",
        "name": "Bikaner",
        "code": "RJ-BIK",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "241054f0-5109-44e3-8d7a-01674839b317",
            "name": "Bikaner Thar Desert Health",
            "code": "PHC-RJ-2410",
            "districtId": "69b084eb-fbc5-449f-bea2-f935c737ee09",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 28.0229,
            "lng": 73.3119,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b0000002-0000-0000-0000-000000000008",
        "name": "Jaipur",
        "code": "RJ-JAI",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 4,
        "activePhcs": 4,
        "population": 106250,
        "phcs": [
          {
            "id": "c0000003-0000-0000-0000-000000000015",
            "name": "Alwar PHC",
            "code": "PHC-RJ-C000",
            "districtId": "b0000002-0000-0000-0000-000000000008",
            "type": "24x7_PHC",
            "population": 17000,
            "lat": 27.553,
            "lng": 76.6346,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000014",
            "name": "Jaipur Central PHC",
            "code": "PHC-RJ-C000",
            "districtId": "b0000002-0000-0000-0000-000000000008",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.9124,
            "lng": 75.7873,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "afdd2513-af8e-4af1-ad54-305336aa1eb1",
            "name": "Jaipur Pink City Urban Health",
            "code": "PHC-RJ-AFDD",
            "districtId": "b0000002-0000-0000-0000-000000000008",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.9124,
            "lng": 75.7873,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "6f277948-9bda-4471-9af5-bc7a87ad766b",
            "name": "Mansarovar Model Dispensary",
            "code": "PHC-RJ-6F27",
            "districtId": "b0000002-0000-0000-0000-000000000008",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.853,
            "lng": 75.76,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "aef7989c-48b1-4ee8-ab18-39e37df71d50",
        "name": "Jaisalmer",
        "code": "RJ-JAI",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "e1e36aa0-c5e6-4f98-b8a7-d25ce178f12d",
            "name": "Jaisalmer Golden Fort Health",
            "code": "PHC-RJ-E1E3",
            "districtId": "aef7989c-48b1-4ee8-ab18-39e37df71d50",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.9157,
            "lng": 70.9083,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "0e57cbe7-4f2d-4f3a-9340-540f846ce019",
        "name": "Jodhpur",
        "code": "RJ-JOD",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "3b3d23cd-c489-41cb-8d8c-254f98858e4d",
            "name": "Jodhpur Sun City PHC",
            "code": "PHC-RJ-3B3D",
            "districtId": "0e57cbe7-4f2d-4f3a-9340-540f846ce019",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.2389,
            "lng": 73.0243,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0d2d542-e28f-44ff-bbda-932c8af76650",
            "name": "Mandore Heritage Health Unit",
            "code": "PHC-RJ-C0D2",
            "districtId": "0e57cbe7-4f2d-4f3a-9340-540f846ce019",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.3575,
            "lng": 73.0422,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "f15b9e23-f2f3-421d-a1fc-e1e6cfe87d94",
        "name": "Kota",
        "code": "RJ-KOT",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "9fcdcc63-de41-4c58-89a3-67a6da548508",
            "name": "Kota Chambal Health Center",
            "code": "PHC-RJ-9FCD",
            "districtId": "f15b9e23-f2f3-421d-a1fc-e1e6cfe87d94",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.1815,
            "lng": 75.8362,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "96706b16-089e-464b-b1e3-4713b7284216",
        "name": "Sikar",
        "code": "RJ-SIK",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "85c0b5b3-e613-4898-80db-db1b0ca24846",
            "name": "Sikar Shekhawati PHC",
            "code": "PHC-RJ-85C0",
            "districtId": "96706b16-089e-464b-b1e3-4713b7284216",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 27.6094,
            "lng": 75.1398,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "94e87421-ee97-4c38-8ac8-a52875f01861",
        "name": "Udaipur",
        "code": "RJ-UDA",
        "stateId": "a0000001-0000-0000-0000-000000000005",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "575300c5-13f1-4bd3-9cd3-774983ed7050",
            "name": "Udaipur Lake City PHC",
            "code": "PHC-RJ-5753",
            "districtId": "94e87421-ee97-4c38-8ac8-a52875f01861",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 24.5854,
            "lng": 73.7125,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000025",
    "name": "Sikkim",
    "code": "SK",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 21250,
    "districts": [
      {
        "id": "8b564cd0-2313-48aa-b7d5-ab2deb778475",
        "name": "East Sikkim (Gangtok)",
        "code": "SK-EAS",
        "stateId": "a0000001-0000-0000-0000-000000000025",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 21250,
        "phcs": [
          {
            "id": "46cffc34-22d5-4a4e-ba44-e100a3011937",
            "name": "Gangtok Mountain View PHC",
            "code": "PHC-SK-46CF",
            "districtId": "8b564cd0-2313-48aa-b7d5-ab2deb778475",
            "type": "24x7_PHC",
            "population": 21250,
            "lat": 27.3389,
            "lng": 88.6065,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000003",
    "name": "Tamil Nadu",
    "code": "TN",
    "totalDistricts": 7,
    "totalPhcs": 12,
    "population": 369750,
    "districts": [
      {
        "id": "b0000002-0000-0000-0000-000000000006",
        "name": "Chennai",
        "code": "TN-CHE",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 4,
        "activePhcs": 4,
        "population": 131750,
        "phcs": [
          {
            "id": "11e32d4a-e7e3-4b2e-86e1-6f86ee24ab28",
            "name": "Guindy Urban Health Centre",
            "code": "PHC-TN-11E3",
            "districtId": "b0000002-0000-0000-0000-000000000006",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.0067,
            "lng": 80.2025,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "b94d8027-aaa5-4fb9-9300-dc72dea661ff",
            "name": "Royapettah Family Care",
            "code": "PHC-TN-B94D",
            "districtId": "b0000002-0000-0000-0000-000000000006",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.0538,
            "lng": 80.2644,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "2f8afd7e-6973-487c-b825-07a44e1a6cb1",
            "name": "T Nagar Community Dispensary",
            "code": "PHC-TN-2F8A",
            "districtId": "b0000002-0000-0000-0000-000000000006",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 13.0418,
            "lng": 80.2341,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "c0000003-0000-0000-0000-000000000012",
            "name": "T. Nagar PHC",
            "code": "PHC-TN-C000",
            "districtId": "b0000002-0000-0000-0000-000000000006",
            "type": "24x7_PHC",
            "population": 42500,
            "lat": 13.0418,
            "lng": 80.2341,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "fa34f3d9-fe6d-48f2-a3a3-d1e999088bac",
        "name": "Coimbatore",
        "code": "TN-COI",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "191b64e3-4a35-4e8f-9ba0-40a545f36519",
            "name": "Coimbatore Model PHC",
            "code": "PHC-TN-191B",
            "districtId": "fa34f3d9-fe6d-48f2-a3a3-d1e999088bac",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 11.0168,
            "lng": 76.9558,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "894ecfe8-f590-41fa-922d-1153dff4979e",
            "name": "Pollachi Rural 24x7 PHC",
            "code": "PHC-TN-894E",
            "districtId": "fa34f3d9-fe6d-48f2-a3a3-d1e999088bac",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 10.6609,
            "lng": 77.0048,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "2ac835e8-0ecd-4ed5-94e9-889c623f53c8",
        "name": "Kanyakumari",
        "code": "TN-KAN",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "2598bc61-4a56-49de-b268-819027933612",
            "name": "Kanyakumari Cape Health Unit",
            "code": "PHC-TN-2598",
            "districtId": "2ac835e8-0ecd-4ed5-94e9-889c623f53c8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 8.0883,
            "lng": 77.5385,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "20a541b9-7c2a-463d-bc1c-ce5e05a342f6",
        "name": "Madurai",
        "code": "TN-MAD",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "8ef87527-ff76-4fea-8ebd-f745e5f9caf1",
            "name": "Madurai Heritage PHC",
            "code": "PHC-TN-8EF8",
            "districtId": "20a541b9-7c2a-463d-bc1c-ce5e05a342f6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 9.9252,
            "lng": 78.1198,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "1a09f10b-752a-4001-b9d4-36f0795372da",
            "name": "Melur Community Health",
            "code": "PHC-TN-1A09",
            "districtId": "20a541b9-7c2a-463d-bc1c-ce5e05a342f6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 10.0334,
            "lng": 78.3378,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "75b51721-aa41-4b92-b35c-295fb5436710",
        "name": "Salem",
        "code": "TN-SAL",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "e4a70e8d-20ef-48e4-bc53-e884431e1230",
            "name": "Salem Steel City PHC",
            "code": "PHC-TN-E4A7",
            "districtId": "75b51721-aa41-4b92-b35c-295fb5436710",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 11.6643,
            "lng": 78.146,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "2eb61a3f-03ab-4fbf-8b7d-3c5b9e5d4427",
        "name": "Tiruchirappalli",
        "code": "TN-TIR",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "6db4b40c-ce4c-4140-a680-f4381aa287f1",
            "name": "Tiruchirappalli Central PHC",
            "code": "PHC-TN-6DB4",
            "districtId": "2eb61a3f-03ab-4fbf-8b7d-3c5b9e5d4427",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 10.7905,
            "lng": 78.7047,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b7dbbbae-8f64-4a29-9841-291dc15ac387",
        "name": "Tirunelveli",
        "code": "TN-TIR",
        "stateId": "a0000001-0000-0000-0000-000000000003",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "419fbe54-b33d-4782-936e-54b6a92cc45a",
            "name": "Tirunelveli Junction PHC",
            "code": "PHC-TN-419F",
            "districtId": "b7dbbbae-8f64-4a29-9841-291dc15ac387",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 8.7139,
            "lng": 77.7567,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000026",
    "name": "Telangana",
    "code": "TS",
    "totalDistricts": 2,
    "totalPhcs": 3,
    "population": 93500,
    "districts": [
      {
        "id": "4268658d-bc90-44f0-9db6-93916ff583b8",
        "name": "Hyderabad",
        "code": "TS-HYD",
        "stateId": "a0000001-0000-0000-0000-000000000026",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 68000,
        "phcs": [
          {
            "id": "0ecb961c-aeaa-4dbf-90e1-cb7761b9fc2f",
            "name": "Charminar Urban Family Health",
            "code": "PHC-TS-0ECB",
            "districtId": "4268658d-bc90-44f0-9db6-93916ff583b8",
            "type": "24x7_PHC",
            "population": 38250,
            "lat": 17.3616,
            "lng": 78.4747,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "36776f8f-7bf3-47e3-81ad-680661e9f293",
            "name": "Gachibowli Tech-Zone PHC",
            "code": "PHC-TS-3677",
            "districtId": "4268658d-bc90-44f0-9db6-93916ff583b8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 17.4401,
            "lng": 78.3489,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "222bb041-3af2-4324-bf07-d79022cfc0d5",
        "name": "Warangal",
        "code": "TS-WAR",
        "stateId": "a0000001-0000-0000-0000-000000000026",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "18656b12-66e5-4a73-8ff5-1cc89b5d6dbe",
            "name": "Kakatiya Heritage PHC",
            "code": "PHC-TS-1865",
            "districtId": "222bb041-3af2-4324-bf07-d79022cfc0d5",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 17.9689,
            "lng": 79.5941,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000027",
    "name": "Tripura",
    "code": "TR",
    "totalDistricts": 1,
    "totalPhcs": 1,
    "population": 25500,
    "districts": [
      {
        "id": "fb1c5a86-34d9-413f-b4cd-804bca757e06",
        "name": "West Tripura (Agartala)",
        "code": "TR-WES",
        "stateId": "a0000001-0000-0000-0000-000000000027",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 25500,
        "phcs": [
          {
            "id": "bafdade4-378f-4c7f-84e4-b98a0c4c8d2c",
            "name": "Agartala Borderline PHC",
            "code": "PHC-TR-BAFD",
            "districtId": "fb1c5a86-34d9-413f-b4cd-804bca757e06",
            "type": "24x7_PHC",
            "population": 25500,
            "lat": 23.8315,
            "lng": 91.2868,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000004",
    "name": "Uttar Pradesh",
    "code": "UP",
    "totalDistricts": 10,
    "totalPhcs": 13,
    "population": 391000,
    "districts": [
      {
        "id": "134159fe-27f5-421e-955c-15fc20042047",
        "name": "Agra",
        "code": "UP-AGR",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "95caa62a-9096-4ba4-9ac6-e80d68c80374",
            "name": "Agra Taj Region Health Unit",
            "code": "PHC-UP-95CA",
            "districtId": "134159fe-27f5-421e-955c-15fc20042047",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 27.1767,
            "lng": 78.0081,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "afc1d02e-1897-46d3-89a4-36ec3e15a2f6",
        "name": "Aligarh",
        "code": "UP-ALI",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "e17eacb2-f1b3-4fc8-a716-83b54f6a4e89",
            "name": "Aligarh Tala Nagri Health",
            "code": "PHC-UP-E17E",
            "districtId": "afc1d02e-1897-46d3-89a4-36ec3e15a2f6",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 27.8974,
            "lng": 78.088,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "ef8eebcf-7fb6-4d8d-bb9a-fc5de2245571",
        "name": "Bareilly",
        "code": "UP-BAR",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "b39266e4-df06-4f29-97bb-6b7f4149e5c1",
            "name": "Bareilly Rohilkhand PHC",
            "code": "PHC-UP-B392",
            "districtId": "ef8eebcf-7fb6-4d8d-bb9a-fc5de2245571",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 28.367,
            "lng": 79.4304,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "72f61f42-8f14-474d-8fe0-72b39277500c",
        "name": "Gorakhpur",
        "code": "UP-GOR",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "6c1f9ea9-c6d1-4bd0-bfdc-9a5d2343e654",
            "name": "Gorakhpur Terai Health Clinic",
            "code": "PHC-UP-6C1F",
            "districtId": "72f61f42-8f14-474d-8fe0-72b39277500c",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.7606,
            "lng": 83.3732,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "20cbf7bc-0075-42cf-acd9-a4c5cc015f93",
        "name": "Kanpur Nagar",
        "code": "UP-KAN",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "b32a6f23-fc12-4010-aeb7-db7aff5ee7a4",
            "name": "Kanpur Industrial Area PHC",
            "code": "PHC-UP-B32A",
            "districtId": "20cbf7bc-0075-42cf-acd9-a4c5cc015f93",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.4499,
            "lng": 80.3319,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "b0000002-0000-0000-0000-000000000007",
        "name": "Lucknow",
        "code": "UP-LUC",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 3,
        "activePhcs": 3,
        "population": 93500,
        "phcs": [
          {
            "id": "c0000003-0000-0000-0000-000000000013",
            "name": "Aminabad PHC",
            "code": "PHC-UP-C000",
            "districtId": "b0000002-0000-0000-0000-000000000007",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 26.8467,
            "lng": 80.9462,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "d661cc9c-daca-4011-b810-a052c037e2e1",
            "name": "Gomti Nagar Urban Health Unit",
            "code": "PHC-UP-D661",
            "districtId": "b0000002-0000-0000-0000-000000000007",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.85,
            "lng": 81,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          },
          {
            "id": "9633ccb0-4629-4699-befc-175484ddab72",
            "name": "Lucknow Hazratganj Model PHC",
            "code": "PHC-UP-9633",
            "districtId": "b0000002-0000-0000-0000-000000000007",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.8467,
            "lng": 80.9462,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "69afb6b0-10ff-4acb-8b98-c83ecd9a1b2f",
        "name": "Meerut",
        "code": "UP-MEE",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "672e99c3-1bc3-4b6e-b0d5-c7e2ca88012b",
            "name": "Meerut Western UP Hub PHC",
            "code": "PHC-UP-672E",
            "districtId": "69afb6b0-10ff-4acb-8b98-c83ecd9a1b2f",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 28.9845,
            "lng": 77.7064,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "c7163b38-963b-4c6f-984a-c93f686e9b5e",
        "name": "Moradabad",
        "code": "UP-MOR",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "de3b6891-269e-419a-be47-7583767112c5",
            "name": "Moradabad Brass Hub PHC",
            "code": "PHC-UP-DE3B",
            "districtId": "c7163b38-963b-4c6f-984a-c93f686e9b5e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 28.8386,
            "lng": 78.7733,
            "lastSyncTime": "2026-09-28T11:18:27.266Z"
          }
        ]
      },
      {
        "id": "9d4ee72a-5650-43e0-bfb9-a229d2f773b8",
        "name": "Prayagraj",
        "code": "UP-PRA",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "92da792c-242f-4195-bf19-e9664a6e38e7",
            "name": "Prayagraj Sangam Health Center",
            "code": "PHC-UP-92DA",
            "districtId": "9d4ee72a-5650-43e0-bfb9-a229d2f773b8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.4358,
            "lng": 81.8463,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "f83e21b3-b60a-418f-a75d-934beb158b9d",
        "name": "Varanasi",
        "code": "UP-VAR",
        "stateId": "a0000001-0000-0000-0000-000000000004",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "ca957058-8c7c-41f7-8e02-a4c2f81ef048",
            "name": "Kashi Vishwanath Region Clinic",
            "code": "PHC-UP-CA95",
            "districtId": "f83e21b3-b60a-418f-a75d-934beb158b9d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.3109,
            "lng": 83.0107,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          },
          {
            "id": "dec38fad-8335-419f-9b7b-764483e357aa",
            "name": "Varanasi Ghats Health Center",
            "code": "PHC-UP-DEC3",
            "districtId": "f83e21b3-b60a-418f-a75d-934beb158b9d",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.3176,
            "lng": 82.9739,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      }
    ]
  },
  {
    "id": "a0000001-0000-0000-0000-000000000028",
    "name": "Uttarakhand",
    "code": "UK",
    "totalDistricts": 1,
    "totalPhcs": 2,
    "population": 63750,
    "districts": [
      {
        "id": "2b09b761-bdb2-40c0-ac3a-56ea371e3933",
        "name": "Dehradun",
        "code": "UK-DEH",
        "stateId": "a0000001-0000-0000-0000-000000000028",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 63750,
        "phcs": [
          {
            "id": "0e606e9b-a95d-4c19-bbda-dd00251a9429",
            "name": "Doon Valley Foothills PHC",
            "code": "PHC-UK-0E60",
            "districtId": "2b09b761-bdb2-40c0-ac3a-56ea371e3933",
            "type": "24x7_PHC",
            "population": 34000,
            "lat": 30.3165,
            "lng": 78.0322,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          },
          {
            "id": "c2a7c687-55fa-4e8b-8f71-c96e25eef9d9",
            "name": "Rishikesh Ganga Health Centre",
            "code": "PHC-UK-C2A7",
            "districtId": "2b09b761-bdb2-40c0-ac3a-56ea371e3933",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 30.0869,
            "lng": 78.2676,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      }
    ]
  },
  {
    "id": "688c5214-c31f-466b-809a-a90637b92c83",
    "name": "West Bengal",
    "code": "WB",
    "totalDistricts": 9,
    "totalPhcs": 10,
    "population": 297500,
    "districts": [
      {
        "id": "82b3ed35-3958-4595-a1d1-802bbc92114e",
        "name": "Darjeeling",
        "code": "WB-DAR",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "d32501a9-ddbc-4ff6-bb7f-a05eb18438b7",
            "name": "Siliguri North Bengal Gateway PHC",
            "code": "PHC-WB-D325",
            "districtId": "82b3ed35-3958-4595-a1d1-802bbc92114e",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 26.7271,
            "lng": 88.4329,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "03647653-40f1-4eda-9077-9ab905bc894c",
        "name": "Howrah",
        "code": "WB-HOW",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "ae14b0af-b6d5-4e91-9916-d2d750a3c75a",
            "name": "Howrah Station Health Unit",
            "code": "PHC-WB-AE14",
            "districtId": "03647653-40f1-4eda-9077-9ab905bc894c",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.5958,
            "lng": 88.2636,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "48758ef5-fab2-428d-805f-601078638164",
        "name": "Kolkata",
        "code": "WB-KOL",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "63cfb239-96a9-42e8-91f5-f59e2c5c4f85",
            "name": "Kolkata Park Street Urban PHC",
            "code": "PHC-WB-63CF",
            "districtId": "48758ef5-fab2-428d-805f-601078638164",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.555,
            "lng": 88.3518,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "0f133db5-3bdc-4e64-99a7-81d845bd5cf7",
        "name": "Malda",
        "code": "WB-MAL",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "826b3cee-7b54-4ba3-970b-2e198ab34945",
            "name": "Malda Mango Belt Health Clinic",
            "code": "PHC-WB-826B",
            "districtId": "0f133db5-3bdc-4e64-99a7-81d845bd5cf7",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 25.0069,
            "lng": 88.1408,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "8ead5614-fefd-49ab-9f08-04cda817ab93",
        "name": "Murshidabad",
        "code": "WB-MUR",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "f7669c35-841a-41f1-882d-e27f8c801475",
            "name": "Murshidabad Silk City PHC",
            "code": "PHC-WB-F766",
            "districtId": "8ead5614-fefd-49ab-9f08-04cda817ab93",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 24.1837,
            "lng": 88.2711,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "58715257-a251-45bc-b9d9-0518c58a78bc",
        "name": "North 24 Parganas",
        "code": "WB-NOR",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "6681bc62-9a43-413e-afcd-ee84ccf586ba",
            "name": "Salt Lake Sector V Tech Clinic",
            "code": "PHC-WB-6681",
            "districtId": "58715257-a251-45bc-b9d9-0518c58a78bc",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.58,
            "lng": 88.43,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "01f5b9a0-9822-47ab-a8a0-b9ee1f7ad099",
        "name": "Paschim Bardhaman",
        "code": "WB-PAS",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 2,
        "activePhcs": 2,
        "population": 59500,
        "phcs": [
          {
            "id": "9fada4b8-0f5f-4747-848d-42782fbab407",
            "name": "Asansol Coalfields Health Center",
            "code": "PHC-WB-9FAD",
            "districtId": "01f5b9a0-9822-47ab-a8a0-b9ee1f7ad099",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.6889,
            "lng": 86.9661,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          },
          {
            "id": "05a4b64d-da10-4765-b31f-6ac0399f6ca7",
            "name": "Durgapur Steel City Dispensary",
            "code": "PHC-WB-05A4",
            "districtId": "01f5b9a0-9822-47ab-a8a0-b9ee1f7ad099",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.5204,
            "lng": 87.3119,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "0fadffe5-d1e2-443d-a9fc-ee9dd0d00eda",
        "name": "Paschim Medinipur",
        "code": "WB-PAS",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "2cefeae8-56d0-43d1-92bc-ab6c77815dc4",
            "name": "Kharagpur Railway Health Hub",
            "code": "PHC-WB-2CEF",
            "districtId": "0fadffe5-d1e2-443d-a9fc-ee9dd0d00eda",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 22.3456,
            "lng": 87.3218,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      },
      {
        "id": "4cad838a-e9b9-4c6b-9151-0369ae1405c8",
        "name": "Purba Bardhaman",
        "code": "WB-PUR",
        "stateId": "688c5214-c31f-466b-809a-a90637b92c83",
        "totalPhcs": 1,
        "activePhcs": 1,
        "population": 29750,
        "phcs": [
          {
            "id": "c7de4693-bfe6-4679-a784-a07b7a4aa416",
            "name": "Bardhaman Rice Bowl Clinic",
            "code": "PHC-WB-C7DE",
            "districtId": "4cad838a-e9b9-4c6b-9151-0369ae1405c8",
            "type": "24x7_PHC",
            "population": 29750,
            "lat": 23.2324,
            "lng": 87.8615,
            "lastSyncTime": "2026-09-28T11:18:27.267Z"
          }
        ]
      }
    ]
  }
];

export function getStateById(stateId: string | null | undefined): StateNode | undefined {
  if (!stateId) return undefined;
  return STATES.find((s) => s.id === stateId || s.code.toLowerCase() === stateId.toLowerCase() || s.name.toLowerCase() === stateId.toLowerCase());
}

export function getDistrictById(districtId: string | null | undefined, stateId?: string | null): DistrictNode | undefined {
  if (!districtId) return undefined;
  if (stateId) {
    const s = getStateById(stateId);
    const found = s?.districts.find((d) => d.id === districtId || d.name.toLowerCase() === districtId.toLowerCase());
    if (found) return found;
  }
  for (const s of STATES) {
    const found = s.districts.find((d) => d.id === districtId || d.name.toLowerCase() === districtId.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

export function getPhcById(phcId: string | null | undefined, districtId?: string | null): PhcNode | undefined {
  if (!phcId) return undefined;
  if (districtId) {
    const d = getDistrictById(districtId);
    const found = d?.phcs.find((p) => p.id === phcId || p.name.toLowerCase() === phcId.toLowerCase());
    if (found) return found;
  }
  for (const s of STATES) {
    for (const d of s.districts) {
      const found = d.phcs.find((p) => p.id === phcId || p.name.toLowerCase() === phcId.toLowerCase());
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
