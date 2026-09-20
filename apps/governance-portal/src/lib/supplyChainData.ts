import { Shipment, ChainStage } from '@/types';

export interface SupplierPerformance {
  supplierName: string;
  category: string;
  totalShipments: number;
  onTimeRate: number; // e.g. 94.2%
  avgDelayHours: number;
  fillRate: number; // e.g. 98.5%
  qualityScore: number; // 1-5
  totalValueINR: number;
  status: 'preferred' | 'standard' | 'under_review';
}

export interface StageBottleneck {
  stage: ChainStage;
  label: string;
  avgTransitHours: number;
  targetTransitHours: number;
  delayFrequencyPct: number; // e.g. 28.6%
  activeShipments: number;
  bottleneckSeverity: 'normal' | 'moderate' | 'critical';
  primaryRootCause: string;
}

export const CHAIN_STAGES: Array<{ key: ChainStage; label: string; description: string }> = [
  { key: 'manufacturer', label: 'Manufacturer', description: 'Pharmaceutical plant dispatch & batch lot QA' },
  { key: 'warehouse', label: 'Central Warehouse', description: 'Regional medical store depot (RMSD)' },
  { key: 'state', label: 'State Depot', description: 'State central pharmaceutical store' },
  { key: 'district', label: 'District Store', description: 'District drug warehouse & cold chain hub' },
  { key: 'phc', label: 'PHC Facility', description: 'Last-mile primary health centre receipt' },
];

export const MOCK_SHIPMENTS: Shipment[] = [
  {
    shipmentId: 'SHIP-2024-0891',
    orderDate: new Date(Date.now() - 48 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 24 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() + 12 * 3600_000).toISOString(),
    status: 'in_transit',
    stage: 'district',
    supplier: 'District Drug Warehouse Pune',
    sourceLocation: 'Pune DWD Central Store, Swargate',
    destinationPhcId: 'phc-hadapsar',
    destinationPhcName: 'Hadapsar PHC',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: true,
    delayHours: 14,
    delayReason: 'Cold-chain refrigeration van compressor failure on Hadapsar bypass; backup reefer van dispatched.',
    redistributionId: 'REC-PUNE-000-D1', // Linked to redistribution decision!
    items: [
      { medicineId: 'med-002', medicineName: 'Paracetamol 500mg Tablets', quantity: 3000, unit: 'strips' },
    ],
    totalValue: 48000,
    currency: 'INR',
  },
  {
    shipmentId: 'SHIP-2024-0892',
    orderDate: new Date(Date.now() - 28 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 6 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() + 6 * 3600_000).toISOString(),
    status: 'dispatched',
    stage: 'phc',
    supplier: 'Baramati SDH Central Store',
    sourceLocation: 'Baramati SDH Store Room',
    destinationPhcId: 'phc-chakan',
    destinationPhcName: 'Chakan PHC',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: false,
    redistributionId: 'REC-PUNE-000-D2', // Linked to redistribution decision!
    items: [
      { medicineId: 'med-006', medicineName: 'Ceftriaxone 1g Injection', quantity: 450, unit: 'vials' },
    ],
    totalValue: 67500,
    currency: 'INR',
  },
  {
    shipmentId: 'SHIP-2024-0888',
    orderDate: new Date(Date.now() - 72 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 52 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() - 4 * 3600_000).toISOString(),
    actualDelivery: new Date(Date.now() - 2 * 3600_000).toISOString(),
    status: 'delivered',
    stage: 'phc',
    supplier: 'Kothrud PHC Store',
    sourceLocation: 'Kothrud PHC Sub-Depot',
    destinationPhcId: 'phc-wagholi',
    destinationPhcName: 'Wagholi PHC',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: false,
    redistributionId: 'REC-PUNE-000-D4', // Linked to redistribution decision!
    items: [
      { medicineId: 'med-008', medicineName: 'Insulin Regular 40 IU/ml', quantity: 120, unit: 'vials' },
    ],
    totalValue: 21600,
    currency: 'INR',
  },
  {
    shipmentId: 'SHIP-2024-0870',
    orderDate: new Date(Date.now() - 120 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 96 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() + 24 * 3600_000).toISOString(),
    status: 'in_transit',
    stage: 'warehouse',
    supplier: 'Cipla Life Sciences Ltd',
    sourceLocation: 'Kurkumbh Plant Unit 3',
    destinationPhcId: 'phc-baramati',
    destinationPhcName: 'Baramati SDH',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: false,
    items: [
      { medicineId: 'med-001', medicineName: 'Amoxicillin 500mg Tablets', quantity: 25000, unit: 'strips' },
      { medicineId: 'med-005', medicineName: 'Azithromycin 500mg Tablets', quantity: 8000, unit: 'strips' },
    ],
    totalValue: 412000,
    currency: 'INR',
  },
  {
    shipmentId: 'SHIP-2024-0865',
    orderDate: new Date(Date.now() - 90 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 72 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() - 18 * 3600_000).toISOString(),
    status: 'delayed',
    stage: 'phc',
    supplier: 'Pune DWD Central Store',
    sourceLocation: 'Pune DWD Central Store',
    destinationPhcId: 'phc-velhe',
    destinationPhcName: 'Velhe PHC',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: true,
    delayHours: 36,
    delayReason: 'Torrid monsoon rain triggered mudslide on Velhe Ghat road. Medical dispatch vehicle halted at Panshet post.',
    items: [
      { medicineId: 'med-004', medicineName: 'Metformin 500mg Tablets', quantity: 4000, unit: 'strips' },
      { medicineId: 'med-003', medicineName: 'ORS Sachets 20.5g', quantity: 3500, unit: 'sachets' },
    ],
    totalValue: 86000,
    currency: 'INR',
  },
  {
    shipmentId: 'SHIP-2024-0850',
    orderDate: new Date(Date.now() - 160 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 140 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() + 48 * 3600_000).toISOString(),
    status: 'ordered',
    stage: 'manufacturer',
    supplier: 'Sun Pharma Industries',
    sourceLocation: 'Ahmednagar Manufacturing Complex',
    destinationPhcId: 'phc-chakan',
    destinationPhcName: 'Chakan PHC',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: false,
    items: [
      { medicineId: 'med-007', medicineName: 'Rabies Antiserum 1000 IU', quantity: 300, unit: 'vials' },
    ],
    totalValue: 360000,
    currency: 'INR',
  },
  {
    shipmentId: 'SHIP-2024-0842',
    orderDate: new Date(Date.now() - 110 * 3600_000).toISOString(),
    dispatchTime: new Date(Date.now() - 84 * 3600_000).toISOString(),
    expectedDelivery: new Date(Date.now() - 12 * 3600_000).toISOString(),
    actualDelivery: new Date(Date.now() - 10 * 3600_000).toISOString(),
    status: 'delivered',
    stage: 'state',
    supplier: 'Maharashtra State Health Supplies Bureau',
    sourceLocation: 'State Central Depot, Haffkine Compound, Mumbai',
    destinationPhcId: 'phc-kothrud',
    destinationPhcName: 'Kothrud PHC',
    districtId: 'dist-pune',
    stateId: 'state-mh',
    isDelayed: false,
    items: [
      { medicineId: 'med-001', medicineName: 'Amoxicillin 500mg Tablets', quantity: 15000, unit: 'strips' },
    ],
    totalValue: 180000,
    currency: 'INR',
  },
];

export const SUPPLIER_PERFORMANCE_DATA: SupplierPerformance[] = [
  {
    supplierName: 'Cipla Life Sciences Ltd',
    category: 'Essential Antibiotics & Anti-infectives',
    totalShipments: 84,
    onTimeRate: 96.4,
    avgDelayHours: 3.2,
    fillRate: 99.1,
    qualityScore: 4.8,
    totalValueINR: 24500000,
    status: 'preferred',
  },
  {
    supplierName: 'Sun Pharma Industries',
    category: 'Cardiovascular & Emergency Injectables',
    totalShipments: 62,
    onTimeRate: 93.5,
    avgDelayHours: 5.8,
    fillRate: 97.4,
    qualityScore: 4.6,
    totalValueINR: 18900000,
    status: 'preferred',
  },
  {
    supplierName: 'District Drug Warehouse Pune',
    category: 'District Central Logistics & Cold Chain Hub',
    totalShipments: 142,
    onTimeRate: 88.2,
    avgDelayHours: 11.4,
    fillRate: 94.0,
    qualityScore: 4.2,
    totalValueINR: 32000000,
    status: 'standard',
  },
  {
    supplierName: 'Haffkine Biopharmaceutical Corp',
    category: 'Biologicals, Sera & Vaccine Stocks',
    totalShipments: 38,
    onTimeRate: 79.1,
    avgDelayHours: 24.6,
    fillRate: 86.5,
    qualityScore: 3.9,
    totalValueINR: 14200000,
    status: 'under_review',
  },
];

export const STAGE_BOTTLENECKS: StageBottleneck[] = [
  {
    stage: 'manufacturer',
    label: '1. Manufacturer Plant',
    avgTransitHours: 42.0,
    targetTransitHours: 48.0,
    delayFrequencyPct: 4.8,
    activeShipments: 14,
    bottleneckSeverity: 'normal',
    primaryRootCause: 'Batch quality certification hold (minor)',
  },
  {
    stage: 'warehouse',
    label: '2. Central Warehouse',
    avgTransitHours: 26.5,
    targetTransitHours: 24.0,
    delayFrequencyPct: 6.2,
    activeShipments: 22,
    bottleneckSeverity: 'normal',
    primaryRootCause: 'Cross-docking and barcode sorting latency',
  },
  {
    stage: 'state',
    label: '3. State Depot',
    avgTransitHours: 19.8,
    targetTransitHours: 18.0,
    delayFrequencyPct: 9.4,
    activeShipments: 18,
    bottleneckSeverity: 'moderate',
    primaryRootCause: 'Inter-district haulage dispatch allocation',
  },
  {
    stage: 'district',
    label: '4. District Store',
    avgTransitHours: 16.2,
    targetTransitHours: 12.0,
    delayFrequencyPct: 15.1,
    activeShipments: 35,
    bottleneckSeverity: 'moderate',
    primaryRootCause: 'Cold-chain reefer van fleet scheduling constraints',
  },
  {
    stage: 'phc',
    label: '5. Last-Mile PHC Transit',
    avgTransitHours: 22.4,
    targetTransitHours: 8.0,
    delayFrequencyPct: 28.6,
    activeShipments: 29,
    bottleneckSeverity: 'critical', // IDENTIFIED PRIMARY BOTTLENECK!
    primaryRootCause: 'Rural access road degradation, monsoon weather, single-vehicle dependency per route',
  },
];

export const DELAY_REASONS_DISTRIBUTION = [
  { reason: 'Vehicle & Reefer Breakdown', percentage: 38, count: 19, color: '#EF4444' },
  { reason: 'Road Blockage / Monsoon Weather', percentage: 29, count: 14, color: '#F97316' },
  { reason: 'Cold Chain / Temp Excursion Hold', percentage: 18, count: 9, color: '#EAB308' },
  { reason: 'Gate Documentation Clearance', percentage: 15, count: 7, color: '#6366F1' },
];
