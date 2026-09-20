// ─────────────────────────────────────────────────────────────────────────────
// Forecast Output Contract & Domain Dataset (Masterplan §33)
// 5 Domain Pillars: Medicine Demand, Bed Demand, Oxygen Demand, Staff Requirement, Patient Footfall
// Contract Fields: entity, metric, forecast_start, forecast_end, predicted_value,
//                  lower_bound, upper_bound, model_name, model_version, training_window,
//                  generated_at, confidence indicator.
// Caption Requirement: Permanent "Model: <name> v<version>" caption on every card.
// ─────────────────────────────────────────────────────────────────────────────

export type ForecastDomainCategory = 'medicine' | 'bed' | 'oxygen' | 'staff' | 'patient';

export interface ForecastTimePoint {
  date: string;
  dayLabel: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
}

export interface MasterplanForecastContract {
  id: string;
  category: ForecastDomainCategory;
  categoryLabel: string;
  entityName: string;
  entityId: string;
  entityType: 'national' | 'state' | 'district' | 'phc';
  metricKey: string;
  metricDisplayName: string;
  unit: string;
  forecastStart: string;
  forecastEnd: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  modelName: string;
  modelVersion: string;
  trainingWindow: string;
  generatedAt: string;
  confidenceScorePct: number; // e.g. 94
  qualityIndicator: 'HIGH_ACCURACY' | 'GOOD' | 'MODERATE' | 'LOW_CONFIDENCE';
  actionableInsight: string;
  points: ForecastTimePoint[];
}

export function getQualityBadgeProps(quality: MasterplanForecastContract['qualityIndicator']): {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  label: string;
} {
  switch (quality) {
    case 'HIGH_ACCURACY':
      return { level: 'LOW', label: 'HIGH CONFIDENCE (90%+)' };
    case 'GOOD':
      return { level: 'LOW', label: 'GOOD CONFIDENCE (80%-90%)' };
    case 'MODERATE':
      return { level: 'MODERATE', label: 'MODERATE CONFIDENCE (70%-80%)' };
    case 'LOW_CONFIDENCE':
      return { level: 'HIGH', label: 'WIDE UNCERTAINTY BAND (<70%)' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator for Scope-Reactive Masterplan §33 Forecast Cards
// ─────────────────────────────────────────────────────────────────────────────

export function getForecastCardsByScope(
  level: 'national' | 'state' | 'district' | 'phc',
  selectedCategory: 'all' | ForecastDomainCategory = 'all'
): MasterplanForecastContract[] {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;
  const scopeEntityName =
    level === 'phc'
      ? 'Hadapsar Urban PHC (PHC-MH-PUN-001)'
      : level === 'district'
      ? 'Pune District Health Jurisdiction'
      : level === 'state'
      ? 'Maharashtra State Directorate'
      : 'National Health Mission Central Grid';

  const scopeEntityId =
    level === 'phc' ? 'phc-hadapsar' : level === 'district' ? 'dist-pune' : level === 'state' ? 'state-mh' : 'national-grid';

  const rawCards: MasterplanForecastContract[] = [
    // ── 1. MEDICINE DEMAND ───────────────────────────────────────────────────
    {
      id: 'fc-med-paracetamol',
      category: 'medicine',
      categoryLabel: 'Medicine Demand',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'med_paracetamol_demand',
      metricDisplayName: 'Paracetamol 500mg Tablet Consumption (14-Day)',
      unit: 'tablets',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(18500 * mult) || 150,
      lowerBound: Math.round(16200 * mult) || 130,
      upperBound: Math.round(21400 * mult) || 175,
      modelName: 'LSTM-Ensemble',
      modelVersion: '2.4.1',
      trainingWindow: '180 days (2026-03-20 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 94,
      qualityIndicator: 'HIGH_ACCURACY',
      actionableInsight: 'Monsoon viral fever influx expected to increase demand by 28%. Safety buffer allocation recommended.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(17200 * mult) || 138, lowerBound: Math.round(15500 * mult) || 124, upperBound: Math.round(19100 * mult) || 153 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(18900 * mult) || 151, lowerBound: Math.round(16800 * mult) || 134, upperBound: Math.round(21200 * mult) || 169 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(20100 * mult) || 161, lowerBound: Math.round(17600 * mult) || 141, upperBound: Math.round(22900 * mult) || 183 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(18500 * mult) || 148, lowerBound: Math.round(16200 * mult) || 130, upperBound: Math.round(21400 * mult) || 175 },
      ],
    },
    {
      id: 'fc-med-ors',
      category: 'medicine',
      categoryLabel: 'Medicine Demand',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'med_ors_sachets',
      metricDisplayName: 'ORS Electrolyte Sachet Demand (14-Day)',
      unit: 'sachets',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(6200 * mult) || 50,
      lowerBound: Math.round(5100 * mult) || 41,
      upperBound: Math.round(7450 * mult) || 60,
      modelName: 'NeuralProphet-X',
      modelVersion: '3.1.0',
      trainingWindow: '90 days (2026-06-18 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 89,
      qualityIndicator: 'GOOD',
      actionableInsight: 'Enteric diarrhea presentations stabilizing; current buffer coverage is 18 days.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(5900 * mult) || 47, lowerBound: Math.round(4900 * mult) || 39, upperBound: Math.round(7000 * mult) || 56 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(6100 * mult) || 49, lowerBound: Math.round(5000 * mult) || 40, upperBound: Math.round(7300 * mult) || 58 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(6400 * mult) || 51, lowerBound: Math.round(5200 * mult) || 42, upperBound: Math.round(7700 * mult) || 62 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(6200 * mult) || 50, lowerBound: Math.round(5100 * mult) || 41, upperBound: Math.round(7450 * mult) || 60 },
      ],
    },

    // ── 2. BED DEMAND ────────────────────────────────────────────────────────
    {
      id: 'fc-bed-icu',
      category: 'bed',
      categoryLabel: 'Bed Demand',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'bed_icu_occupancy',
      metricDisplayName: 'ICU & High-Dependency Bed Occupancy Need',
      unit: 'beds',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(212 * mult) || 4,
      lowerBound: Math.round(198 * mult) || 4,
      upperBound: Math.round(228 * mult) || 5,
      modelName: 'DeepAR-Clinical',
      modelVersion: '1.8.2',
      trainingWindow: '365 days (2025-09-16 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 92,
      qualityIndicator: 'HIGH_ACCURACY',
      actionableInsight: 'ICU occupancy projected at 96.3% capacity in Week 2. Initiate step-down transfer protocols.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(205 * mult) || 4, lowerBound: Math.round(195 * mult) || 3, upperBound: Math.round(218 * mult) || 4 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(216 * mult) || 4, lowerBound: Math.round(202 * mult) || 4, upperBound: Math.round(230 * mult) || 5 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(210 * mult) || 4, lowerBound: Math.round(196 * mult) || 4, upperBound: Math.round(225 * mult) || 5 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(203 * mult) || 4, lowerBound: Math.round(190 * mult) || 3, upperBound: Math.round(216 * mult) || 4 },
      ],
    },
    {
      id: 'fc-bed-general',
      category: 'bed',
      categoryLabel: 'Bed Demand',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'bed_general_ward',
      metricDisplayName: 'Inpatient General Ward Bed Demand',
      unit: 'beds',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(1526 * mult) || 12,
      lowerBound: Math.round(1410 * mult) || 11,
      upperBound: Math.round(1680 * mult) || 14,
      modelName: 'XGBoost-Demand',
      modelVersion: '4.0.2',
      trainingWindow: '180 days (2026-03-20 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 86,
      qualityIndicator: 'GOOD',
      actionableInsight: 'General ward bed occupancy projected to reach 82.5% (Deficit threshold). Elective admission controls advised.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(1465 * mult) || 11, lowerBound: Math.round(1380 * mult) || 10, upperBound: Math.round(1560 * mult) || 12 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(1526 * mult) || 12, lowerBound: Math.round(1410 * mult) || 11, upperBound: Math.round(1680 * mult) || 14 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(1555 * mult) || 13, lowerBound: Math.round(1430 * mult) || 11, upperBound: Math.round(1710 * mult) || 14 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(1498 * mult) || 12, lowerBound: Math.round(1390 * mult) || 11, upperBound: Math.round(1620 * mult) || 13 },
      ],
    },

    // ── 3. OXYGEN DEMAND ─────────────────────────────────────────────────────
    {
      id: 'fc-ox-cylinders',
      category: 'oxygen',
      categoryLabel: 'Oxygen Demand',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'ox_cylinder_burn',
      metricDisplayName: 'Type-D Oxygen Cylinder Daily Burn Rate',
      unit: 'cylinders/day',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(310 * mult) || 3,
      lowerBound: Math.round(270 * mult) || 2,
      upperBound: Math.round(360 * mult) || 4,
      modelName: 'Temporal-Fusion-Transformer',
      modelVersion: '1.2.0',
      trainingWindow: '120 days (2026-05-19 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 91,
      qualityIndicator: 'HIGH_ACCURACY',
      actionableInsight: 'Cylinder burn rate increasing by +11% due to respiratory presentations. Buffer days remaining at 1.46 days.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(285 * mult) || 2, lowerBound: Math.round(250 * mult) || 2, upperBound: Math.round(330 * mult) || 3 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(310 * mult) || 3, lowerBound: Math.round(270 * mult) || 2, upperBound: Math.round(360 * mult) || 4 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(325 * mult) || 3, lowerBound: Math.round(280 * mult) || 2, upperBound: Math.round(380 * mult) || 4 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(295 * mult) || 2, lowerBound: Math.round(260 * mult) || 2, upperBound: Math.round(340 * mult) || 3 },
      ],
    },

    // ── 4. STAFF REQUIREMENT ─────────────────────────────────────────────────
    {
      id: 'fc-staff-doctors',
      category: 'staff',
      categoryLabel: 'Staff Requirement',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'staff_doctor_shifts',
      metricDisplayName: 'On-Duty Medical Officer Shift Requirement',
      unit: 'clinicians/day',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(184 * mult) || 2,
      lowerBound: Math.round(168 * mult) || 2,
      upperBound: Math.round(204 * mult) || 3,
      modelName: 'HRMS-Workload-LSTM',
      modelVersion: '2.1.0',
      trainingWindow: '90 days (2026-06-18 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 88,
      qualityIndicator: 'GOOD',
      actionableInsight: 'Peak OPD footfall requires 184 active clinicians. Current in-position gap is 18 posts.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(175 * mult) || 2, lowerBound: Math.round(160 * mult) || 2, upperBound: Math.round(192 * mult) || 3 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(184 * mult) || 2, lowerBound: Math.round(168 * mult) || 2, upperBound: Math.round(204 * mult) || 3 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(190 * mult) || 2, lowerBound: Math.round(172 * mult) || 2, upperBound: Math.round(210 * mult) || 3 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(180 * mult) || 2, lowerBound: Math.round(164 * mult) || 2, upperBound: Math.round(198 * mult) || 3 },
      ],
    },

    // ── 5. PATIENT FOOTFALL ──────────────────────────────────────────────────
    {
      id: 'fc-patient-opd',
      category: 'patient',
      categoryLabel: 'Patient Footfall',
      entityName: scopeEntityName,
      entityId: scopeEntityId,
      entityType: level,
      metricKey: 'patient_opd_influx',
      metricDisplayName: 'Daily Outpatient (OPD) Influx Forecast',
      unit: 'patients/day',
      forecastStart: '2026-09-17',
      forecastEnd: '2026-10-01',
      predictedValue: Math.round(41200 * mult) || 340,
      lowerBound: Math.round(37500 * mult) || 310,
      upperBound: Math.round(45800 * mult) || 380,
      modelName: 'Epidemic-Footfall-Prophet',
      modelVersion: '3.4.0',
      trainingWindow: '365 days (2025-09-16 to 2026-09-15)',
      generatedAt: '2026-09-16 06:00 IST',
      confidenceScorePct: 93,
      qualityIndicator: 'HIGH_ACCURACY',
      actionableInsight: 'Monday morning OPD influx expected to hit peak 41,200 visits. Staggered triage registration active.',
      points: [
        { date: '2026-09-17', dayLabel: 'W+1', predictedValue: Math.round(39000 * mult) || 320, lowerBound: Math.round(36000 * mult) || 295, upperBound: Math.round(43000 * mult) || 355 },
        { date: '2026-09-20', dayLabel: 'W+2', predictedValue: Math.round(41200 * mult) || 340, lowerBound: Math.round(37500 * mult) || 310, upperBound: Math.round(45800 * mult) || 380 },
        { date: '2026-09-24', dayLabel: 'W+3', predictedValue: Math.round(42500 * mult) || 350, lowerBound: Math.round(38500 * mult) || 320, upperBound: Math.round(47200 * mult) || 390 },
        { date: '2026-09-28', dayLabel: 'W+4', predictedValue: Math.round(39800 * mult) || 330, lowerBound: Math.round(36500 * mult) || 300, upperBound: Math.round(4400 * mult) || 365 },
      ],
    },
  ];

  if (selectedCategory === 'all') return rawCards;
  return rawCards.filter((c) => c.category === selectedCategory);
}
