// ─────────────────────────────────────────────────────────────────────────────
// Medicine Intelligence Domain Data & Forecast Models
// Masterplan §88.9: Visual uncertainty bands (predicted, lower_bound, upper_bound)
// ─────────────────────────────────────────────────────────────────────────────

export interface StockMovement {
  id: string;
  timestamp: string;
  type: 'INBOUND' | 'OUTBOUND' | 'REDISTRIBUTION' | 'EXPIRED';
  quantity: number;
  unit: string;
  sourceDestination: string;
  status: 'completed' | 'in_transit' | 'approved';
  batchNumber: string;
}

export interface MedicineBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  manufacturingDate: string;
  status: 'valid' | 'expiring_soon' | 'critical_expiry';
  wastageRatePct: number;
  temperatureRequired: string;
}

export interface MedicineForecastPoint {
  period: string; // e.g. "Week +1", "Week +2"
  date: string;
  predictedValue: number;
  lowerBound: number; // 90% CI lower
  upperBound: number; // 90% CI upper
  historicalActual?: number;
}

export interface MedicineDetailItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: 'Essential' | 'Maternal & Child' | 'Chronic Disease' | 'Infectious Disease' | 'Emergency';
  dosageForm: string;
  unit: string;

  // Stock figures by echelon
  stockNational: number;
  stockState: number;
  stockDistrict: number;
  stockPhc: number;

  reorderLevel: number;
  criticalLevel: number;

  // Days remaining & shortage
  coverageDaysPhc: number;
  coverageDaysDistrict: number;
  coverageDaysState: number;
  coverageDaysNational: number;

  projectedShortageDays: number; // Days until complete stockout
  status: 'adequate' | 'low' | 'critical' | 'stockout' | 'expiring_soon';

  // Expiry & wastage
  nearestExpiry: string;
  wastageUnits: number;
  wastageRatePct: number;

  // Trend & historical consumption
  consumptionSparkline: number[]; // 7-day sparkline
  consumptionHistory12Weeks: Array<{ week: string; actualDispensed: number; wastage: number }>;

  // AI Forecast with uncertainty band (Masterplan §88.9)
  forecastHorizonWeeks: number;
  forecastModel: string;
  forecastConfidencePct: number;
  forecastPoints: MedicineForecastPoint[];

  // Batches & recent movements
  batches: MedicineBatch[];
  recentMovements: StockMovement[];
}

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
const daysAhead = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000).toISOString();

export const MEDICINE_CATALOG: MedicineDetailItem[] = [
  {
    medicineId: 'med-amox-500',
    medicineName: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Essential',
    dosageForm: 'Capsule',
    unit: 'capsules',
    stockNational: 14200000,
    stockState: 1140000,
    stockDistrict: 48500,
    stockPhc: 0, // Critical stockout at target PHC Hadapsar
    reorderLevel: 2500,
    criticalLevel: 800,
    coverageDaysNational: 42,
    coverageDaysState: 36,
    coverageDaysDistrict: 18,
    coverageDaysPhc: 0.0,
    projectedShortageDays: 0, // Already stockout
    status: 'stockout',
    nearestExpiry: daysAhead(180),
    wastageUnits: 240,
    wastageRatePct: 1.2,
    consumptionSparkline: [620, 580, 510, 430, 280, 110, 0],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 3200, wastage: 40 },
      { week: 'W-10', actualDispensed: 3450, wastage: 35 },
      { week: 'W-9', actualDispensed: 3600, wastage: 45 },
      { week: 'W-8', actualDispensed: 3900, wastage: 50 },
      { week: 'W-7', actualDispensed: 4200, wastage: 60 },
      { week: 'W-6', actualDispensed: 4500, wastage: 70 },
      { week: 'W-5', actualDispensed: 4800, wastage: 80 },
      { week: 'W-4', actualDispensed: 4600, wastage: 65 },
      { week: 'W-3', actualDispensed: 4100, wastage: 50 },
      { week: 'W-2', actualDispensed: 3200, wastage: 40 },
      { week: 'W-1', actualDispensed: 1800, wastage: 30 },
      { week: 'Current', actualDispensed: 900, wastage: 20 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'DeepAR + Hierarchical Poisson Ensemble',
    forecastConfidencePct: 94.2,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 4600, lowerBound: 3800, upperBound: 5500 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 5100, lowerBound: 4100, upperBound: 6300 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 5400, lowerBound: 4200, upperBound: 6800 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 5200, lowerBound: 3900, upperBound: 6700 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 4800, lowerBound: 3500, upperBound: 6400 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 4400, lowerBound: 3100, upperBound: 6000 },
    ],
    batches: [
      { batchNumber: 'AMX-2025-08A', quantity: 0, expiryDate: daysAhead(180), manufacturingDate: daysAgo(200), status: 'valid', wastageRatePct: 1.1, temperatureRequired: 'Ambient (<25°C)' },
      { batchNumber: 'AMX-2025-11B', quantity: 0, expiryDate: daysAhead(240), manufacturingDate: daysAgo(120), status: 'valid', wastageRatePct: 0.9, temperatureRequired: 'Ambient (<25°C)' },
    ],
    recentMovements: [
      { id: 'mov-1', timestamp: daysAgo(1), type: 'REDISTRIBUTION', quantity: 2500, unit: 'capsules', sourceDestination: 'Dispatched from Mumbai Depot to Hadapsar PHC', status: 'in_transit', batchNumber: 'AMX-2026-01' },
      { id: 'mov-2', timestamp: daysAgo(3), type: 'OUTBOUND', quantity: 850, unit: 'capsules', sourceDestination: 'Dispensed to OPD Patients', status: 'completed', batchNumber: 'AMX-2025-08A' },
      { id: 'mov-3', timestamp: daysAgo(6), type: 'OUTBOUND', quantity: 1200, unit: 'capsules', sourceDestination: 'Dispensed to OPD Patients', status: 'completed', batchNumber: 'AMX-2025-08A' },
    ],
  },
  {
    medicineId: 'med-ors-zinc',
    medicineName: 'ORS Sachets & Zinc 20mg',
    genericName: 'Oral Rehydration Salts + Zinc Sulfate',
    category: 'Maternal & Child',
    dosageForm: 'Oral Sachet / Tablet',
    unit: 'kits',
    stockNational: 8400000,
    stockState: 640000,
    stockDistrict: 24500,
    stockPhc: 120,
    reorderLevel: 500,
    criticalLevel: 200,
    coverageDaysNational: 38,
    coverageDaysState: 32,
    coverageDaysDistrict: 14,
    coverageDaysPhc: 1.8,
    projectedShortageDays: 1.8,
    status: 'critical',
    nearestExpiry: daysAhead(90),
    wastageUnits: 110,
    wastageRatePct: 0.8,
    consumptionSparkline: [180, 210, 240, 280, 310, 290, 320],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 1200, wastage: 15 },
      { week: 'W-10', actualDispensed: 1350, wastage: 18 },
      { week: 'W-9', actualDispensed: 1420, wastage: 14 },
      { week: 'W-8', actualDispensed: 1600, wastage: 20 },
      { week: 'W-7', actualDispensed: 1900, wastage: 25 },
      { week: 'W-6', actualDispensed: 2300, wastage: 30 },
      { week: 'W-5', actualDispensed: 2600, wastage: 35 },
      { week: 'W-4', actualDispensed: 2800, wastage: 40 },
      { week: 'W-3', actualDispensed: 3100, wastage: 45 },
      { week: 'W-2', actualDispensed: 3300, wastage: 48 },
      { week: 'W-1', actualDispensed: 3450, wastage: 50 },
      { week: 'Current', actualDispensed: 3500, wastage: 52 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'Spatial-Temporal Vector Autoregression',
    forecastConfidencePct: 91.8,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 3800, lowerBound: 3100, upperBound: 4600 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 4200, lowerBound: 3300, upperBound: 5200 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 4400, lowerBound: 3400, upperBound: 5600 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 4100, lowerBound: 3000, upperBound: 5300 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 3600, lowerBound: 2500, upperBound: 4800 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 3100, lowerBound: 2100, upperBound: 4200 },
    ],
    batches: [
      { batchNumber: 'ORS-2025-06', quantity: 120, expiryDate: daysAhead(90), manufacturingDate: daysAgo(270), status: 'valid', wastageRatePct: 0.8, temperatureRequired: 'Dry & Cool (<30°C)' },
    ],
    recentMovements: [
      { id: 'mov-ors-1', timestamp: daysAgo(2), type: 'REDISTRIBUTION', quantity: 4000, unit: 'kits', sourceDestination: 'Dispatched from Baramati to Shirur PHC', status: 'in_transit', batchNumber: 'ORS-2026-02' },
      { id: 'mov-ors-2', timestamp: daysAgo(5), type: 'OUTBOUND', quantity: 450, unit: 'kits', sourceDestination: 'Distributed at Pediatric Diarrhea Camp', status: 'completed', batchNumber: 'ORS-2025-06' },
    ],
  },
  {
    medicineId: 'med-paracetamol',
    medicineName: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Essential',
    dosageForm: 'Tablet',
    unit: 'tablets',
    stockNational: 28500000,
    stockState: 2350000,
    stockDistrict: 84000,
    stockPhc: 1850,
    reorderLevel: 2000,
    criticalLevel: 600,
    coverageDaysNational: 48,
    coverageDaysState: 44,
    coverageDaysDistrict: 32,
    coverageDaysPhc: 9.2,
    projectedShortageDays: 9.2,
    status: 'low',
    nearestExpiry: daysAhead(320),
    wastageUnits: 450,
    wastageRatePct: 0.5,
    consumptionSparkline: [2100, 2250, 2400, 2600, 2550, 2700, 2800],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 18000, wastage: 80 },
      { week: 'W-10', actualDispensed: 19200, wastage: 90 },
      { week: 'W-9', actualDispensed: 19800, wastage: 85 },
      { week: 'W-8', actualDispensed: 21000, wastage: 100 },
      { week: 'W-7', actualDispensed: 22500, wastage: 110 },
      { week: 'W-6', actualDispensed: 23800, wastage: 120 },
      { week: 'W-5', actualDispensed: 24500, wastage: 130 },
      { week: 'W-4', actualDispensed: 25000, wastage: 125 },
      { week: 'W-3', actualDispensed: 26200, wastage: 140 },
      { week: 'W-2', actualDispensed: 27100, wastage: 145 },
      { week: 'W-1', actualDispensed: 28000, wastage: 150 },
      { week: 'Current', actualDispensed: 28500, wastage: 155 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'Epidemic Surge Regression',
    forecastConfidencePct: 96.1,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 30000, lowerBound: 26500, upperBound: 34000 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 32000, lowerBound: 27800, upperBound: 36800 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 31500, lowerBound: 26900, upperBound: 36500 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 29000, lowerBound: 24200, upperBound: 34200 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 26500, lowerBound: 21500, upperBound: 32000 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 24000, lowerBound: 19000, upperBound: 29500 },
    ],
    batches: [
      { batchNumber: 'PCM-2025-10', quantity: 1850, expiryDate: daysAhead(320), manufacturingDate: daysAgo(100), status: 'valid', wastageRatePct: 0.5, temperatureRequired: 'Ambient (<30°C)' },
    ],
    recentMovements: [
      { id: 'mov-pcm-1', timestamp: daysAgo(2), type: 'INBOUND', quantity: 5000, unit: 'tablets', sourceDestination: 'Received from District Medical Store', status: 'completed', batchNumber: 'PCM-2025-10' },
      { id: 'mov-pcm-2', timestamp: daysAgo(4), type: 'OUTBOUND', quantity: 3150, unit: 'tablets', sourceDestination: 'OPD Dispensary', status: 'completed', batchNumber: 'PCM-2025-10' },
    ],
  },
  {
    medicineId: 'med-metformin',
    medicineName: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Chronic Disease',
    dosageForm: 'Tablet',
    unit: 'tablets',
    stockNational: 18200000,
    stockState: 1450000,
    stockDistrict: 52000,
    stockPhc: 3200,
    reorderLevel: 2500,
    criticalLevel: 1000,
    coverageDaysNational: 54,
    coverageDaysState: 48,
    coverageDaysDistrict: 36,
    coverageDaysPhc: 24.5,
    projectedShortageDays: 24.5,
    status: 'adequate',
    nearestExpiry: daysAhead(260),
    wastageUnits: 180,
    wastageRatePct: 0.6,
    consumptionSparkline: [1250, 1280, 1310, 1290, 1320, 1300, 1310],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 8800, wastage: 40 },
      { week: 'W-10', actualDispensed: 8950, wastage: 42 },
      { week: 'W-9', actualDispensed: 9100, wastage: 45 },
      { week: 'W-8', actualDispensed: 9050, wastage: 40 },
      { week: 'W-7', actualDispensed: 9200, wastage: 48 },
      { week: 'W-6', actualDispensed: 9350, wastage: 50 },
      { week: 'W-5', actualDispensed: 9400, wastage: 52 },
      { week: 'W-4', actualDispensed: 9300, wastage: 48 },
      { week: 'W-3', actualDispensed: 9450, wastage: 55 },
      { week: 'W-2', actualDispensed: 9500, wastage: 52 },
      { week: 'W-1', actualDispensed: 9550, wastage: 54 },
      { week: 'Current', actualDispensed: 9600, wastage: 55 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'SARIMA Baseline',
    forecastConfidencePct: 97.4,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 9700, lowerBound: 9100, upperBound: 10300 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 9800, lowerBound: 9150, upperBound: 10500 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 9850, lowerBound: 9180, upperBound: 10600 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 9900, lowerBound: 9200, upperBound: 10700 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 9950, lowerBound: 9220, upperBound: 10800 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 10000, lowerBound: 9250, upperBound: 10900 },
    ],
    batches: [
      { batchNumber: 'MET-2025-04', quantity: 3200, expiryDate: daysAhead(260), manufacturingDate: daysAgo(160), status: 'valid', wastageRatePct: 0.6, temperatureRequired: 'Ambient (<25°C)' },
    ],
    recentMovements: [
      { id: 'mov-met-1', timestamp: daysAgo(7), type: 'INBOUND', quantity: 5000, unit: 'tablets', sourceDestination: 'Routine NCD Program Allocation', status: 'completed', batchNumber: 'MET-2025-04' },
      { id: 'mov-met-2', timestamp: daysAgo(10), type: 'OUTBOUND', quantity: 1800, unit: 'tablets', sourceDestination: 'Dispensed to Diabetic Cohort', status: 'completed', batchNumber: 'MET-2025-04' },
    ],
  },
  {
    medicineId: 'med-artemether',
    medicineName: 'Artemether-Lumefantrine',
    genericName: 'ACT Anti-Malarial Co-formulation',
    category: 'Infectious Disease',
    dosageForm: 'Tablet',
    unit: 'courses',
    stockNational: 1250000,
    stockState: 98000,
    stockDistrict: 3200,
    stockPhc: 18,
    reorderLevel: 100,
    criticalLevel: 40,
    coverageDaysNational: 28,
    coverageDaysState: 22,
    coverageDaysDistrict: 11,
    coverageDaysPhc: 2.1,
    projectedShortageDays: 2.1,
    status: 'critical',
    nearestExpiry: daysAhead(110),
    wastageUnits: 42,
    wastageRatePct: 2.4,
    consumptionSparkline: [8, 12, 16, 21, 28, 34, 38],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 120, wastage: 4 },
      { week: 'W-10', actualDispensed: 140, wastage: 5 },
      { week: 'W-9', actualDispensed: 160, wastage: 6 },
      { week: 'W-8', actualDispensed: 210, wastage: 8 },
      { week: 'W-7', actualDispensed: 290, wastage: 10 },
      { week: 'W-6', actualDispensed: 380, wastage: 14 },
      { week: 'W-5', actualDispensed: 490, wastage: 18 },
      { week: 'W-4', actualDispensed: 580, wastage: 22 },
      { week: 'W-3', actualDispensed: 670, wastage: 26 },
      { week: 'W-2', actualDispensed: 740, wastage: 30 },
      { week: 'W-1', actualDispensed: 810, wastage: 32 },
      { week: 'Current', actualDispensed: 890, wastage: 35 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'Vector Outbreak Wave Prophet',
    forecastConfidencePct: 89.6,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 1050, lowerBound: 820, upperBound: 1350 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 1200, lowerBound: 900, upperBound: 1580 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 1280, lowerBound: 920, upperBound: 1720 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 1150, lowerBound: 790, upperBound: 1600 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 980, lowerBound: 620, upperBound: 1410 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 790, lowerBound: 450, upperBound: 1200 },
    ],
    batches: [
      { batchNumber: 'ACT-2025-05', quantity: 18, expiryDate: daysAhead(110), manufacturingDate: daysAgo(210), status: 'valid', wastageRatePct: 2.4, temperatureRequired: 'Ambient (<30°C)' },
    ],
    recentMovements: [
      { id: 'mov-act-1', timestamp: daysAgo(1), type: 'REDISTRIBUTION', quantity: 200, unit: 'courses', sourceDestination: 'Emergency request submitted to District Depot', status: 'approved', batchNumber: 'ACT-2026-01' },
      { id: 'mov-act-2', timestamp: daysAgo(3), type: 'OUTBOUND', quantity: 22, unit: 'courses', sourceDestination: 'Dispensed for Falciparum Cases', status: 'completed', batchNumber: 'ACT-2025-05' },
    ],
  },
  {
    medicineId: 'med-rabies-vaccine',
    medicineName: 'Anti-Rabies Vaccine (ARV)',
    genericName: 'Purified Chick Embryo Cell / Vero Rabies Vaccine',
    category: 'Emergency',
    dosageForm: 'Injectable Vial',
    unit: 'vials',
    stockNational: 950000,
    stockState: 74000,
    stockDistrict: 2100,
    stockPhc: 8,
    reorderLevel: 50,
    criticalLevel: 20,
    coverageDaysNational: 22,
    coverageDaysState: 18,
    coverageDaysDistrict: 8,
    coverageDaysPhc: 1.5,
    projectedShortageDays: 1.5,
    status: 'critical',
    nearestExpiry: daysAhead(45),
    wastageUnits: 28,
    wastageRatePct: 3.1,
    consumptionSparkline: [5, 6, 8, 7, 9, 8, 10],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 85, wastage: 3 },
      { week: 'W-10', actualDispensed: 90, wastage: 4 },
      { week: 'W-9', actualDispensed: 92, wastage: 4 },
      { week: 'W-8', actualDispensed: 105, wastage: 5 },
      { week: 'W-7', actualDispensed: 115, wastage: 6 },
      { week: 'W-6', actualDispensed: 110, wastage: 5 },
      { week: 'W-5', actualDispensed: 125, wastage: 6 },
      { week: 'W-4', actualDispensed: 130, wastage: 7 },
      { week: 'W-3', actualDispensed: 140, wastage: 8 },
      { week: 'W-2', actualDispensed: 145, wastage: 8 },
      { week: 'W-1', actualDispensed: 155, wastage: 9 },
      { week: 'Current', actualDispensed: 160, wastage: 10 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'Cold Chain Poisson Horizon',
    forecastConfidencePct: 93.4,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 170, lowerBound: 135, upperBound: 215 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 175, lowerBound: 138, upperBound: 225 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 180, lowerBound: 140, upperBound: 235 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 175, lowerBound: 132, upperBound: 230 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 165, lowerBound: 120, upperBound: 220 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 155, lowerBound: 110, upperBound: 210 },
    ],
    batches: [
      { batchNumber: 'ARV-2025-02', quantity: 8, expiryDate: daysAhead(45), manufacturingDate: daysAgo(300), status: 'expiring_soon', wastageRatePct: 3.1, temperatureRequired: 'Cold-Chain (+2°C to +8°C)' },
    ],
    recentMovements: [
      { id: 'mov-arv-1', timestamp: daysAgo(2), type: 'OUTBOUND', quantity: 6, unit: 'vials', sourceDestination: 'Post-Exposure Animal Bite Prophylaxis', status: 'completed', batchNumber: 'ARV-2025-02' },
      { id: 'mov-arv-2', timestamp: daysAgo(5), type: 'REDISTRIBUTION', quantity: 40, unit: 'vials', sourceDestination: 'Emergency cold-box request to Sub-district Hospital', status: 'in_transit', batchNumber: 'ARV-2026-01' },
    ],
  },
  {
    medicineId: 'med-iron-folic',
    medicineName: 'Iron & Folic Acid (IFA)',
    genericName: 'Ferrous Sulfate + Folic Acid',
    category: 'Maternal & Child',
    dosageForm: 'Tablet',
    unit: 'tablets',
    stockNational: 42000000,
    stockState: 3400000,
    stockDistrict: 128000,
    stockPhc: 8200,
    reorderLevel: 4000,
    criticalLevel: 1500,
    coverageDaysNational: 62,
    coverageDaysState: 56,
    coverageDaysDistrict: 45,
    coverageDaysPhc: 32.0,
    projectedShortageDays: 32.0,
    status: 'adequate',
    nearestExpiry: daysAhead(410),
    wastageUnits: 210,
    wastageRatePct: 0.4,
    consumptionSparkline: [2400, 2450, 2500, 2480, 2520, 2560, 2550],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 16000, wastage: 60 },
      { week: 'W-10', actualDispensed: 16500, wastage: 65 },
      { week: 'W-9', actualDispensed: 16800, wastage: 62 },
      { week: 'W-8', actualDispensed: 17200, wastage: 70 },
      { week: 'W-7', actualDispensed: 17500, wastage: 72 },
      { week: 'W-6', actualDispensed: 17800, wastage: 75 },
      { week: 'W-5', actualDispensed: 18100, wastage: 78 },
      { week: 'W-4', actualDispensed: 18400, wastage: 80 },
      { week: 'W-3', actualDispensed: 18600, wastage: 82 },
      { week: 'W-2', actualDispensed: 18900, wastage: 85 },
      { week: 'W-1', actualDispensed: 19100, wastage: 88 },
      { week: 'Current', actualDispensed: 19300, wastage: 90 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'MCH Anemia Cohort Model',
    forecastConfidencePct: 98.2,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 19500, lowerBound: 18800, upperBound: 20200 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 19700, lowerBound: 18900, upperBound: 20500 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 19900, lowerBound: 19000, upperBound: 20800 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 20100, lowerBound: 19100, upperBound: 21100 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 20300, lowerBound: 19200, upperBound: 21400 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 20500, lowerBound: 19300, upperBound: 21700 },
    ],
    batches: [
      { batchNumber: 'IFA-2025-12', quantity: 8200, expiryDate: daysAhead(410), manufacturingDate: daysAgo(50), status: 'valid', wastageRatePct: 0.4, temperatureRequired: 'Ambient (<25°C)' },
    ],
    recentMovements: [
      { id: 'mov-ifa-1', timestamp: daysAgo(5), type: 'INBOUND', quantity: 10000, unit: 'tablets', sourceDestination: 'National Iron Plus Initiative (NIPI)', status: 'completed', batchNumber: 'IFA-2025-12' },
      { id: 'mov-ifa-2', timestamp: daysAgo(8), type: 'OUTBOUND', quantity: 1800, unit: 'tablets', sourceDestination: 'Antenatal Care Clinic (ANC)', status: 'completed', batchNumber: 'IFA-2025-12' },
    ],
  },
  {
    medicineId: 'med-amlodipine',
    medicineName: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    category: 'Chronic Disease',
    dosageForm: 'Tablet',
    unit: 'tablets',
    stockNational: 15400000,
    stockState: 1220000,
    stockDistrict: 44000,
    stockPhc: 2100,
    reorderLevel: 2200,
    criticalLevel: 900,
    coverageDaysNational: 46,
    coverageDaysState: 42,
    coverageDaysDistrict: 30,
    coverageDaysPhc: 14.8,
    projectedShortageDays: 14.8,
    status: 'low',
    nearestExpiry: daysAhead(280),
    wastageUnits: 120,
    wastageRatePct: 0.5,
    consumptionSparkline: [950, 980, 1010, 1000, 1020, 1040, 1050],
    consumptionHistory12Weeks: [
      { week: 'W-11', actualDispensed: 6800, wastage: 30 },
      { week: 'W-10', actualDispensed: 6900, wastage: 32 },
      { week: 'W-9', actualDispensed: 7050, wastage: 35 },
      { week: 'W-8', actualDispensed: 7100, wastage: 34 },
      { week: 'W-7', actualDispensed: 7250, wastage: 38 },
      { week: 'W-6', actualDispensed: 7300, wastage: 40 },
      { week: 'W-5', actualDispensed: 7420, wastage: 42 },
      { week: 'W-4', actualDispensed: 7500, wastage: 40 },
      { week: 'W-3', actualDispensed: 7610, wastage: 44 },
      { week: 'W-2', actualDispensed: 7700, wastage: 45 },
      { week: 'W-1', actualDispensed: 7800, wastage: 46 },
      { week: 'Current', actualDispensed: 7900, wastage: 48 },
    ],
    forecastHorizonWeeks: 6,
    forecastModel: 'Hypertension Cohort Trajectory',
    forecastConfidencePct: 95.8,
    forecastPoints: [
      { period: 'W+1', date: daysAhead(7), predictedValue: 8000, lowerBound: 7400, upperBound: 8600 },
      { period: 'W+2', date: daysAhead(14), predictedValue: 8100, lowerBound: 7450, upperBound: 8750 },
      { period: 'W+3', date: daysAhead(21), predictedValue: 8200, lowerBound: 7500, upperBound: 8900 },
      { period: 'W+4', date: daysAhead(28), predictedValue: 8300, lowerBound: 7550, upperBound: 9050 },
      { period: 'W+5', date: daysAhead(35), predictedValue: 8400, lowerBound: 7600, upperBound: 9200 },
      { period: 'W+6', date: daysAhead(42), predictedValue: 8500, lowerBound: 7650, upperBound: 9350 },
    ],
    batches: [
      { batchNumber: 'AML-2025-07', quantity: 2100, expiryDate: daysAhead(280), manufacturingDate: daysAgo(140), status: 'valid', wastageRatePct: 0.5, temperatureRequired: 'Ambient (<25°C)' },
    ],
    recentMovements: [
      { id: 'mov-aml-1', timestamp: daysAgo(6), type: 'OUTBOUND', quantity: 1400, unit: 'tablets', sourceDestination: 'Hypertension Patient Refills', status: 'completed', batchNumber: 'AML-2025-07' },
      { id: 'mov-aml-2', timestamp: daysAgo(12), type: 'INBOUND', quantity: 3500, unit: 'tablets', sourceDestination: 'District Medical Warehouse Delivery', status: 'completed', batchNumber: 'AML-2025-07' },
    ],
  },
];

// Helper to resolve medicine stock & coverage based on current jurisdiction level
export function getMedicineScopeMetrics(
  item: MedicineDetailItem,
  level: 'national' | 'state' | 'district' | 'phc'
) {
  switch (level) {
    case 'phc':
      return {
        stock: item.stockPhc,
        coverageDays: item.coverageDaysPhc,
        status: item.status,
        projectedDays: item.projectedShortageDays,
      };
    case 'district':
      return {
        stock: item.stockDistrict,
        coverageDays: item.coverageDaysDistrict,
        status: item.coverageDaysDistrict < 7 ? (item.coverageDaysDistrict < 3 ? 'critical' : 'low') : 'adequate',
        projectedDays: item.coverageDaysDistrict,
      };
    case 'state':
      return {
        stock: item.stockState,
        coverageDays: item.coverageDaysState,
        status: item.coverageDaysState < 10 ? 'low' : 'adequate',
        projectedDays: item.coverageDaysState,
      };
    default:
      return {
        stock: item.stockNational,
        coverageDays: item.coverageDaysNational,
        status: item.coverageDaysNational < 15 ? 'low' : 'adequate',
        projectedDays: item.coverageDaysNational,
      };
  }
}
