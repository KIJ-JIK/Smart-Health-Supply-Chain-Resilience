// ─────────────────────────────────────────────────────────────────────────────
// Sync Monitoring & Mutation Queue Data (Dataset 12)
// Masterplan §59 / Dataset 12: Tracks every sync push mutation with:
// - sync_status: accepted | duplicate | rejected | conflict
// - device_id, local_seq, client_timestamp, server_timestamp, error_code
//
// Computed per PHC:
// - lastSync, lastSuccessfulSync, pendingMutationCount, failedMutationCount,
//   conflictCount, offlineDuration, deviceStatus, phcId, phcName, districtId, stateId
// ─────────────────────────────────────────────────────────────────────────────

export type SyncMutationStatus = 'accepted' | 'duplicate' | 'rejected' | 'conflict';

export type PhcDeviceStatus = 'online' | 'degraded_cellular' | 'offline' | 'quarantined';

export interface SyncMutationRecord {
  mutationId: string;
  phcId: string;
  deviceId: string;
  localSeq: number;
  entityType: 'stock_transaction' | 'patient_encounter' | 'bed_admission' | 'oxygen_log' | 'reallocation_ack';
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  clientTimestamp: string;
  serverTimestamp: string;
  syncStatus: SyncMutationStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  payloadSummary: string;
}

export interface PhcSyncTelemetry {
  phcId: string;
  phcName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  deviceId: string;
  appVersion: string;
  lastSync: string; // ISO string of most recent sync attempt
  lastSuccessfulSync: string; // ISO string of most recent accepted sync
  pendingMutationCount: number;
  failedMutationCount: number;
  conflictCount: number;
  offlineDurationMinutes: number;
  deviceStatus: PhcDeviceStatus;
  connectivityType: '4G-VoLTE' | 'VSAT' | 'Fiber-Broadband' | '2G-EDGE' | 'No-Signal';
  batteryLevelPct: number;
  storageUsagePct: number;
}

const now = Date.now();
const minutesAgoIso = (m: number) => new Date(now - m * 60 * 1000).toISOString();

// ── Initial PHC Sync Telemetry Dataset ────────────────────────────────────────
export const INITIAL_PHC_SYNC_TELEMETRY: PhcSyncTelemetry[] = [
  {
    phcId: 'phc-pune-01',
    phcName: 'Kothrud Model PHC',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-PUN-01-A4',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(8),
    lastSuccessfulSync: minutesAgoIso(8),
    pendingMutationCount: 0,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 0,
    deviceStatus: 'online',
    connectivityType: 'Fiber-Broadband',
    batteryLevelPct: 98,
    storageUsagePct: 42,
  },
  {
    phcId: 'phc-pune-02',
    phcName: 'Hadapsar 24x7 PHC',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-PUN-02-B1',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(24),
    lastSuccessfulSync: minutesAgoIso(24),
    pendingMutationCount: 2,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 0,
    deviceStatus: 'online',
    connectivityType: '4G-VoLTE',
    batteryLevelPct: 86,
    storageUsagePct: 55,
  },
  {
    phcId: 'phc-pune-03',
    phcName: 'Baramati Rural PHC',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-PUN-03-C9',
    appVersion: 'v2.8.3-patch1',
    lastSync: minutesAgoIso(48),
    lastSuccessfulSync: minutesAgoIso(65),
    pendingMutationCount: 9,
    failedMutationCount: 2,
    conflictCount: 1,
    offlineDurationMinutes: 48,
    deviceStatus: 'degraded_cellular',
    connectivityType: '2G-EDGE',
    batteryLevelPct: 61,
    storageUsagePct: 68,
  },
  {
    phcId: 'phc-pune-04',
    phcName: 'Haveli Sub-Center PHC',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-PUN-04-E2',
    appVersion: 'v2.7.9',
    lastSync: minutesAgoIso(185), // > 3 hours stale
    lastSuccessfulSync: minutesAgoIso(210),
    pendingMutationCount: 28,
    failedMutationCount: 6,
    conflictCount: 3,
    offlineDurationMinutes: 185,
    deviceStatus: 'offline',
    connectivityType: 'No-Signal',
    batteryLevelPct: 34,
    storageUsagePct: 88,
  },
  {
    phcId: 'phc-pune-05',
    phcName: 'Junnar Tribal Primary Center',
    districtId: 'dist-pune',
    districtName: 'Pune',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-PUN-05-T8',
    appVersion: 'v2.7.9',
    lastSync: minutesAgoIso(410), // > 6 hours stale
    lastSuccessfulSync: minutesAgoIso(490),
    pendingMutationCount: 64,
    failedMutationCount: 14,
    conflictCount: 5,
    offlineDurationMinutes: 410,
    deviceStatus: 'offline',
    connectivityType: 'No-Signal',
    batteryLevelPct: 18,
    storageUsagePct: 94,
  },
  {
    phcId: 'phc-thane-01',
    phcName: 'Thane Central Urban PHC',
    districtId: 'dist-thane',
    districtName: 'Thane',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-THN-01-X1',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(15),
    lastSuccessfulSync: minutesAgoIso(15),
    pendingMutationCount: 1,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 0,
    deviceStatus: 'online',
    connectivityType: 'Fiber-Broadband',
    batteryLevelPct: 92,
    storageUsagePct: 38,
  },
  {
    phcId: 'phc-thane-02',
    phcName: 'Kalyan Sub-District Hospital Clinic',
    districtId: 'dist-thane',
    districtName: 'Thane',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-THN-02-Y4',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(38),
    lastSuccessfulSync: minutesAgoIso(38),
    pendingMutationCount: 4,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 12,
    deviceStatus: 'online',
    connectivityType: '4G-VoLTE',
    batteryLevelPct: 77,
    storageUsagePct: 51,
  },
  {
    phcId: 'phc-mum-01',
    phcName: 'Andheri East Urban Health Center',
    districtId: 'dist-mum',
    districtName: 'Mumbai Suburban',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-MUM-01-M8',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(11),
    lastSuccessfulSync: minutesAgoIso(11),
    pendingMutationCount: 0,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 0,
    deviceStatus: 'online',
    connectivityType: 'Fiber-Broadband',
    batteryLevelPct: 100,
    storageUsagePct: 33,
  },
  {
    phcId: 'phc-mum-02',
    phcName: 'Chembur Dispensary PHC',
    districtId: 'dist-mum',
    districtName: 'Mumbai Suburban',
    stateId: 'state-mh',
    stateName: 'Maharashtra',
    deviceId: 'TAB-MUM-02-C3',
    appVersion: 'v2.8.2',
    lastSync: minutesAgoIso(145), // > 2 hours stale
    lastSuccessfulSync: minutesAgoIso(160),
    pendingMutationCount: 17,
    failedMutationCount: 3,
    conflictCount: 2,
    offlineDurationMinutes: 145,
    deviceStatus: 'offline',
    connectivityType: 'No-Signal',
    batteryLevelPct: 45,
    storageUsagePct: 76,
  },
  {
    phcId: 'phc-bengaluru-01',
    phcName: 'Indiranagar Urban Primary Health Centre',
    districtId: 'dist-bengaluru-urban',
    districtName: 'Bengaluru Urban',
    stateId: 'state-ka',
    stateName: 'Karnataka',
    deviceId: 'TAB-BLR-01-K5',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(6),
    lastSuccessfulSync: minutesAgoIso(6),
    pendingMutationCount: 0,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 0,
    deviceStatus: 'online',
    connectivityType: 'Fiber-Broadband',
    batteryLevelPct: 95,
    storageUsagePct: 29,
  },
  {
    phcId: 'phc-bengaluru-02',
    phcName: 'Anekal Rural Hospital & PHC',
    districtId: 'dist-bengaluru-urban',
    districtName: 'Bengaluru Urban',
    stateId: 'state-ka',
    stateName: 'Karnataka',
    deviceId: 'TAB-BLR-02-A7',
    appVersion: 'v2.8.1',
    lastSync: minutesAgoIso(260), // > 4 hours stale
    lastSuccessfulSync: minutesAgoIso(310),
    pendingMutationCount: 42,
    failedMutationCount: 8,
    conflictCount: 4,
    offlineDurationMinutes: 260,
    deviceStatus: 'offline',
    connectivityType: 'No-Signal',
    batteryLevelPct: 22,
    storageUsagePct: 89,
  },
  {
    phcId: 'phc-lko-01',
    phcName: 'Malihabad Community Health Centre',
    districtId: 'dist-lucknow',
    districtName: 'Lucknow',
    stateId: 'state-up',
    stateName: 'Uttar Pradesh',
    deviceId: 'TAB-LKO-01-U2',
    appVersion: 'v2.8.4-prod',
    lastSync: minutesAgoIso(14),
    lastSuccessfulSync: minutesAgoIso(14),
    pendingMutationCount: 1,
    failedMutationCount: 0,
    conflictCount: 0,
    offlineDurationMinutes: 0,
    deviceStatus: 'online',
    connectivityType: '4G-VoLTE',
    batteryLevelPct: 88,
    storageUsagePct: 47,
  },
];

// ── Mutation Queue (Dataset 12) Item Stream ──────────────────────────────────
export const INITIAL_MUTATION_QUEUE: SyncMutationRecord[] = [
  {
    mutationId: 'mut-20260916-8801',
    phcId: 'phc-pune-04',
    deviceId: 'TAB-PUN-04-E2',
    localSeq: 1042,
    entityType: 'stock_transaction',
    entityId: 'stk-tx-9941',
    operation: 'UPDATE',
    clientTimestamp: minutesAgoIso(185),
    serverTimestamp: minutesAgoIso(184),
    syncStatus: 'conflict',
    errorCode: 'ERR_CONCURRENT_VERSION_CONFLICT',
    errorMessage: 'Batch #PAR-2025-09 stock updated by District Depot during offline period (ETag mismatch)',
    payloadSummary: 'Deduct 120 units Paracetamol 500mg (OPD Dispensation)',
  },
  {
    mutationId: 'mut-20260916-8802',
    phcId: 'phc-pune-04',
    deviceId: 'TAB-PUN-04-E2',
    localSeq: 1043,
    entityType: 'bed_admission',
    entityId: 'adm-9912',
    operation: 'INSERT',
    clientTimestamp: minutesAgoIso(172),
    serverTimestamp: minutesAgoIso(172),
    syncStatus: 'rejected',
    errorCode: 'ERR_SCHEMA_VALIDATION_FAILED',
    errorMessage: 'Bed ID B-04 already marked occupied in National Master Schema',
    payloadSummary: 'Admit Patient IPD-Pune-441 to Female Ward Bed 4',
  },
  {
    mutationId: 'mut-20260916-8803',
    phcId: 'phc-pune-05',
    deviceId: 'TAB-PUN-05-T8',
    localSeq: 840,
    entityType: 'oxygen_log',
    entityId: 'oxy-junnar-41',
    operation: 'INSERT',
    clientTimestamp: minutesAgoIso(410),
    serverTimestamp: minutesAgoIso(409),
    syncStatus: 'rejected',
    errorCode: 'ERR_NETWORK_TIMEOUT_CHUNK_DROP',
    errorMessage: 'VSAT uplink connection dropped before CRC checksum verification completed',
    payloadSummary: 'Log D-Type Oxygen manifold pressure 140 bar (2 cylinders in use)',
  },
  {
    mutationId: 'mut-20260916-8804',
    phcId: 'phc-pune-05',
    deviceId: 'TAB-PUN-05-T8',
    localSeq: 841,
    entityType: 'patient_encounter',
    entityId: 'enc-junnar-980',
    operation: 'INSERT',
    clientTimestamp: minutesAgoIso(390),
    serverTimestamp: minutesAgoIso(390),
    syncStatus: 'conflict',
    errorCode: 'ERR_DUPLICATE_ABHA_RECORD_UPDATED',
    errorMessage: 'Patient health record modified at Civil Hospital while offline',
    payloadSummary: 'Register antenatal care checkup ANC-3 for ABHA 91-4402-1192',
  },
  {
    mutationId: 'mut-20260916-8805',
    phcId: 'phc-pune-03',
    deviceId: 'TAB-PUN-03-C9',
    localSeq: 2210,
    entityType: 'reallocation_ack',
    entityId: 'rec-pune-701',
    operation: 'UPDATE',
    clientTimestamp: minutesAgoIso(48),
    serverTimestamp: minutesAgoIso(47),
    syncStatus: 'conflict',
    errorCode: 'ERR_STALE_PROPOSAL_HASH',
    errorMessage: 'Transfer quantity was modified by District Health Officer in Governance Portal',
    payloadSummary: 'Acknowledge receipt of 450 units Amoxicillin 500mg',
  },
  {
    mutationId: 'mut-20260916-8806',
    phcId: 'phc-pune-01',
    deviceId: 'TAB-PUN-01-A4',
    localSeq: 5120,
    entityType: 'stock_transaction',
    entityId: 'stk-tx-1102',
    operation: 'INSERT',
    clientTimestamp: minutesAgoIso(8),
    serverTimestamp: minutesAgoIso(8),
    syncStatus: 'accepted',
    errorCode: null,
    errorMessage: null,
    payloadSummary: 'Dispense 30 vials Rabies Anti-Serum to casualty triage',
  },
  {
    mutationId: 'mut-20260916-8807',
    phcId: 'phc-pune-02',
    deviceId: 'TAB-PUN-02-B1',
    localSeq: 3411,
    entityType: 'patient_encounter',
    entityId: 'enc-hadapsar-812',
    operation: 'INSERT',
    clientTimestamp: minutesAgoIso(24),
    serverTimestamp: minutesAgoIso(24),
    syncStatus: 'duplicate',
    errorCode: 'ERR_IDEMPOTENCY_KEY_REPLAY',
    errorMessage: 'Mutation with idempotency key already committed; duplicate dropped harmlessly',
    payloadSummary: 'OPD consult for acute viral fever',
  },
  {
    mutationId: 'mut-20260916-8808',
    phcId: 'phc-bengaluru-02',
    deviceId: 'TAB-BLR-02-A7',
    localSeq: 772,
    entityType: 'stock_transaction',
    entityId: 'stk-tx-blr-99',
    operation: 'UPDATE',
    clientTimestamp: minutesAgoIso(260),
    serverTimestamp: minutesAgoIso(259),
    syncStatus: 'conflict',
    errorCode: 'ERR_CONCURRENT_VERSION_CONFLICT',
    errorMessage: 'Medicine stock depleted by central supply-chain reorder while tablet was offline',
    payloadSummary: 'Reserve 100 units Metformin 500mg for NCD clinic',
  },
];
