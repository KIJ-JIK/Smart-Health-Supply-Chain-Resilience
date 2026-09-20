// ─────────────────────────────────────────────────────────────────────────────
// Resources Domain Data & Classification Models (Masterplan §29)
// Sections: Beds, Oxygen, Equipment
// Classification: SURPLUS / BALANCED / DEFICIT / CRITICAL DEFICIT
// ─────────────────────────────────────────────────────────────────────────────

export type ResourceClassification = 'SURPLUS' | 'BALANCED' | 'DEFICIT' | 'CRITICAL_DEFICIT';

export interface BedCategoryItem {
  id: string;
  categoryName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  utilizationPct: number;
  turnoverIntervalDays: number;
  avgLengthOfStayDays: number;
  trendSparkline: number[];
  forecastNext4Weeks: Array<{ week: string; projectedOccupancyPct: number; projectedBedNeed: number }>;
  classification: ResourceClassification;
  shortageCount: number;
}

export interface OxygenSupplyItem {
  id: string;
  sourceType: 'D_TYPE_CYLINDERS' | 'CONCENTRATORS' | 'PSA_PLANTS' | 'LMO_TANKS';
  displayName: string;
  totalCapacity: number;
  unit: string;
  currentlyAvailable: number;
  inUse: number;
  dailyConsumptionRate: number;
  daysRemaining: number;
  purityPct: number;
  consumptionTrend: number[];
  riskFlag: 'stable' | 'warning' | 'critical';
  classification: ResourceClassification;
  notes: string;
}

export interface ClinicalEquipmentItem {
  id: string;
  equipmentName: string;
  category: 'Cold Chain' | 'Critical Care' | 'Emergency Transport' | 'Diagnostics' | 'Monitoring';
  totalSanctioned: number;
  working: number;
  underMaintenance: number;
  deficit: number;
  operabilityRatePct: number; // working / sanctioned
  trend: 'up' | 'down' | 'flat';
  classification: ResourceClassification;
  replacementUrgency: 'immediate' | 'scheduled' | 'normal';
}

// ─────────────────────────────────────────────────────────────────────────────
// Masterplan §29 Resource Classification Rule:
//  - Beds:
//      utilization < 65%  => SURPLUS
//      utilization 65-80% => BALANCED
//      utilization 80-92% => DEFICIT
//      utilization > 92%  => CRITICAL DEFICIT
//  - Oxygen:
//      daysRemaining > 5.0  => SURPLUS
//      daysRemaining 2.5-5.0 => BALANCED
//      daysRemaining 1.2-2.5 => DEFICIT
//      daysRemaining < 1.2   => CRITICAL DEFICIT
//  - Equipment:
//      deficit <= 0 && working >= total => SURPLUS
//      deficit / sanctioned < 0.10      => BALANCED
//      deficit / sanctioned 0.10 - 0.25 => DEFICIT
//      deficit / sanctioned > 0.25      => CRITICAL DEFICIT
// ─────────────────────────────────────────────────────────────────────────────

export function getBedClassification(utilizationPct: number): ResourceClassification {
  if (utilizationPct > 92) return 'CRITICAL_DEFICIT';
  if (utilizationPct > 80) return 'DEFICIT';
  if (utilizationPct >= 65) return 'BALANCED';
  return 'SURPLUS';
}

export function getOxygenClassification(daysRemaining: number): ResourceClassification {
  if (daysRemaining < 1.2) return 'CRITICAL_DEFICIT';
  if (daysRemaining < 2.5) return 'DEFICIT';
  if (daysRemaining <= 5.0) return 'BALANCED';
  return 'SURPLUS';
}

export function getEquipmentClassification(
  sanctioned: number,
  working: number,
  maintenance: number
): ResourceClassification {
  const deficit = Math.max(0, sanctioned - working);
  const deficitRatio = deficit / (sanctioned || 1);
  if (deficitRatio > 0.25 || working === 0) return 'CRITICAL_DEFICIT';
  if (deficitRatio >= 0.10) return 'DEFICIT';
  if (working >= sanctioned && maintenance === 0) return 'SURPLUS';
  return 'BALANCED';
}

// Helper to map classification to RiskBadge props
export function getClassificationBadgeProps(cls: ResourceClassification): {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  label: string;
  pulse?: boolean;
} {
  switch (cls) {
    case 'CRITICAL_DEFICIT':
      return { level: 'CRITICAL', label: 'CRITICAL DEFICIT', pulse: true };
    case 'DEFICIT':
      return { level: 'HIGH', label: 'DEFICIT' };
    case 'BALANCED':
      return { level: 'LOW', label: 'BALANCED' };
    case 'SURPLUS':
      return { level: 'LOW', label: 'SURPLUS' };
  }
}

// ── Mock Dataset Scaled by Scope ─────────────────────────────────────────────

export function getBedDataByScope(level: 'national' | 'state' | 'district' | 'phc'): BedCategoryItem[] {
  // Scale multiplier: national (x300), state (x25), district (x1), phc (fractional)
  const multiplier = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const raw = [
    {
      id: 'bed-general',
      categoryName: 'General Inpatient Wards',
      total: Math.round(1850 * multiplier),
      occupied: Math.round(1440 * multiplier),
      turnover: 1.8,
      alos: 3.4,
      sparkline: [74, 75, 76, 77, 76, 78, 77.8],
      forecast: [
        { week: 'W+1', projectedOccupancyPct: 79.2, projectedBedNeed: Math.round(1465 * multiplier) },
        { week: 'W+2', projectedOccupancyPct: 82.5, projectedBedNeed: Math.round(1526 * multiplier) },
        { week: 'W+3', projectedOccupancyPct: 84.1, projectedBedNeed: Math.round(1555 * multiplier) },
        { week: 'W+4', projectedOccupancyPct: 81.0, projectedBedNeed: Math.round(1498 * multiplier) },
      ],
    },
    {
      id: 'bed-icu',
      categoryName: 'ICU & High-Dependency Beds',
      total: Math.round(220 * multiplier) || 4,
      occupied: Math.round(208 * multiplier) || 4, // 94.5% Critical
      turnover: 0.6,
      alos: 5.8,
      sparkline: [88, 89, 91, 93, 92, 94, 94.5],
      forecast: [
        { week: 'W+1', projectedOccupancyPct: 96.0, projectedBedNeed: Math.round(211 * multiplier) || 4 },
        { week: 'W+2', projectedOccupancyPct: 98.2, projectedBedNeed: Math.round(216 * multiplier) || 4 },
        { week: 'W+3', projectedOccupancyPct: 95.0, projectedBedNeed: Math.round(209 * multiplier) || 4 },
        { week: 'W+4', projectedOccupancyPct: 92.4, projectedBedNeed: Math.round(203 * multiplier) || 4 },
      ],
    },
    {
      id: 'bed-maternity',
      categoryName: 'Maternal & Delivery Beds',
      total: Math.round(480 * multiplier) || 6,
      occupied: Math.round(350 * multiplier) || 4,
      turnover: 1.2,
      alos: 2.1,
      sparkline: [71, 72, 70, 73, 72, 74, 72.9],
      forecast: [
        { week: 'W+1', projectedOccupancyPct: 73.5, projectedBedNeed: Math.round(353 * multiplier) || 4 },
        { week: 'W+2', projectedOccupancyPct: 74.0, projectedBedNeed: Math.round(355 * multiplier) || 4 },
        { week: 'W+3', projectedOccupancyPct: 73.2, projectedBedNeed: Math.round(351 * multiplier) || 4 },
        { week: 'W+4', projectedOccupancyPct: 72.8, projectedBedNeed: Math.round(349 * multiplier) || 4 },
      ],
    },
    {
      id: 'bed-pediatric',
      categoryName: 'Pediatric & Neonatal (SNCU)',
      total: Math.round(340 * multiplier) || 4,
      occupied: Math.round(290 * multiplier) || 3,
      turnover: 1.4,
      alos: 4.2,
      sparkline: [78, 80, 82, 84, 86, 85, 85.3],
      forecast: [
        { week: 'W+1', projectedOccupancyPct: 88.0, projectedBedNeed: Math.round(299 * multiplier) || 4 },
        { week: 'W+2', projectedOccupancyPct: 91.5, projectedBedNeed: Math.round(311 * multiplier) || 4 },
        { week: 'W+3', projectedOccupancyPct: 89.0, projectedBedNeed: Math.round(302 * multiplier) || 4 },
        { week: 'W+4', projectedOccupancyPct: 85.2, projectedBedNeed: Math.round(290 * multiplier) || 3 },
      ],
    },
    {
      id: 'bed-isolation',
      categoryName: 'Infectious Isolation Beds',
      total: Math.round(260 * multiplier) || 2,
      occupied: Math.round(140 * multiplier) || 1, // 53.8% Surplus
      turnover: 2.5,
      alos: 6.0,
      sparkline: [48, 50, 52, 51, 55, 53, 53.8],
      forecast: [
        { week: 'W+1', projectedOccupancyPct: 58.0, projectedBedNeed: Math.round(151 * multiplier) || 1 },
        { week: 'W+2', projectedOccupancyPct: 64.0, projectedBedNeed: Math.round(166 * multiplier) || 2 },
        { week: 'W+3', projectedOccupancyPct: 62.5, projectedBedNeed: Math.round(162 * multiplier) || 2 },
        { week: 'W+4', projectedOccupancyPct: 56.0, projectedBedNeed: Math.round(145 * multiplier) || 1 },
      ],
    },
  ];

  return raw.map((b) => {
    const total = Math.max(1, b.total);
    const occupied = Math.min(total, b.occupied);
    const available = Math.max(0, total - occupied);
    const util = Math.round((occupied / total) * 100);
    const cls = getBedClassification(util);
    const shortage = cls === 'CRITICAL_DEFICIT' ? Math.round(total * 0.15) : cls === 'DEFICIT' ? Math.round(total * 0.05) : 0;

    return {
      id: b.id,
      categoryName: b.categoryName,
      totalBeds: total,
      occupiedBeds: occupied,
      availableBeds: available,
      utilizationPct: util,
      turnoverIntervalDays: b.turnover,
      avgLengthOfStayDays: b.alos,
      trendSparkline: b.sparkline,
      forecastNext4Weeks: b.forecast,
      classification: cls,
      shortageCount: shortage,
    };
  });
}

export function getOxygenDataByScope(level: 'national' | 'state' | 'district' | 'phc'): OxygenSupplyItem[] {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const raw = [
    {
      id: 'ox-cylinders',
      sourceType: 'D_TYPE_CYLINDERS' as const,
      displayName: 'Type-D High-Pressure Cylinders (46.7L)',
      totalCapacity: Math.round(1200 * mult),
      unit: 'Cylinders',
      available: Math.round(410 * mult),
      inUse: Math.round(790 * mult),
      burnRate: Math.round(280 * mult),
      daysRemaining: 1.46, // DEFICIT
      purityPct: 99.2,
      trend: [220, 240, 250, 270, 260, 275, 280],
      notes: 'Turnover cycle delayed from regional refilling plant; buffer below 48h safety threshold.',
    },
    {
      id: 'ox-concentrators',
      sourceType: 'CONCENTRATORS' as const,
      displayName: '10 LPM / 5 LPM Medical Concentrators',
      totalCapacity: Math.round(380 * mult) || 4,
      unit: 'Units',
      available: Math.round(310 * mult) || 3,
      inUse: Math.round(70 * mult) || 1,
      burnRate: Math.round(45 * mult) || 1,
      daysRemaining: 6.8, // SURPLUS
      purityPct: 94.5,
      trend: [38, 40, 42, 44, 45, 43, 45],
      notes: 'Sufficient ambient air generation units deployed for mild-to-moderate oxygen therapy.',
    },
    {
      id: 'ox-psa',
      sourceType: 'PSA_PLANTS' as const,
      displayName: 'On-Site PSA Generation Plants',
      totalCapacity: Math.round(2500 * mult),
      unit: 'Nm³/hr',
      available: Math.round(2200 * mult),
      inUse: Math.round(1950 * mult),
      burnRate: Math.round(720 * mult),
      daysRemaining: 3.05, // BALANCED
      purityPct: 95.8,
      trend: [680, 690, 705, 715, 720, 718, 720],
      notes: 'Continuous pressure-swing adsorption active; zeolite filter maintenance due in 12 days.',
    },
    {
      id: 'ox-lmo',
      sourceType: 'LMO_TANKS' as const,
      displayName: 'Cryogenic Liquid Medical Oxygen (LMO)',
      totalCapacity: Math.round(8000 * mult),
      unit: 'Litres',
      available: Math.round(1800 * mult),
      inUse: Math.round(6200 * mult),
      burnRate: Math.round(1950 * mult),
      daysRemaining: 0.92, // CRITICAL DEFICIT
      purityPct: 99.6,
      trend: [1600, 1720, 1800, 1850, 1900, 1930, 1950],
      notes: 'Bulk storage vessel level at 22%; tanker refilling convoy en route via NH-48 Express corridor.',
    },
  ];

  return raw.map((item) => {
    const cls = getOxygenClassification(item.daysRemaining);
    const risk = cls === 'CRITICAL_DEFICIT' ? 'critical' : cls === 'DEFICIT' ? 'warning' : 'stable';

    return {
      id: item.id,
      sourceType: item.sourceType,
      displayName: item.displayName,
      totalCapacity: item.totalCapacity,
      unit: item.unit,
      currentlyAvailable: item.available,
      inUse: item.inUse,
      dailyConsumptionRate: item.burnRate,
      daysRemaining: item.daysRemaining,
      purityPct: item.purityPct,
      consumptionTrend: item.trend,
      riskFlag: risk,
      classification: cls,
      notes: item.notes,
    };
  });
}

export function getEquipmentDataByScope(level: 'national' | 'state' | 'district' | 'phc'): ClinicalEquipmentItem[] {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const raw = [
    {
      id: 'eq-ilr',
      equipmentName: 'Ice-Lined Refrigerators (ILR) - Cold Chain',
      category: 'Cold Chain' as const,
      sanctioned: Math.round(165 * mult) || 3,
      working: Math.round(158 * mult) || 3,
      maintenance: Math.round(5 * mult) || 0,
      trend: 'flat' as const,
      urgency: 'normal' as const,
    },
    {
      id: 'eq-ventilators',
      equipmentName: 'ICU Mechanical Ventilators (Invasive & NIV)',
      category: 'Critical Care' as const,
      sanctioned: Math.round(85 * mult) || 2,
      working: Math.round(58 * mult) || 1, // Deficit > 25% => CRITICAL DEFICIT
      maintenance: Math.round(14 * mult) || 1,
      trend: 'down' as const,
      urgency: 'immediate' as const,
    },
    {
      id: 'eq-ambulances-als',
      equipmentName: 'ALS Advanced Life Support Ambulances (108)',
      category: 'Emergency Transport' as const,
      sanctioned: Math.round(48 * mult) || 2,
      working: Math.round(42 * mult) || 2,
      maintenance: Math.round(4 * mult) || 0,
      trend: 'up' as const,
      urgency: 'scheduled' as const,
    },
    {
      id: 'eq-analyzers',
      equipmentName: '5-Part Automated Hematology CBC Analyzers',
      category: 'Diagnostics' as const,
      sanctioned: Math.round(145 * mult) || 2,
      working: Math.round(122 * mult) || 1,
      maintenance: Math.round(12 * mult) || 1,
      trend: 'down' as const,
      urgency: 'scheduled' as const,
    },
    {
      id: 'eq-monitors',
      equipmentName: 'Multipara Vital Signs Patient Monitors',
      category: 'Monitoring' as const,
      sanctioned: Math.round(320 * mult) || 4,
      working: Math.round(310 * mult) || 4,
      maintenance: Math.round(8 * mult) || 0,
      trend: 'up' as const,
      urgency: 'normal' as const,
    },
    {
      id: 'eq-deep-freezers',
      equipmentName: 'Deep Freezers (-20°C) for Ice Packs',
      category: 'Cold Chain' as const,
      sanctioned: Math.round(150 * mult) || 2,
      working: Math.round(146 * mult) || 2,
      maintenance: Math.round(3 * mult) || 0,
      trend: 'flat' as const,
      urgency: 'normal' as const,
    },
  ];

  return raw.map((item) => {
    const sanctioned = Math.max(1, item.sanctioned);
    const working = Math.min(sanctioned, item.working);
    const maintenance = item.maintenance;
    const deficit = Math.max(0, sanctioned - working);
    const operability = Math.round((working / sanctioned) * 100);
    const cls = getEquipmentClassification(sanctioned, working, maintenance);

    return {
      id: item.id,
      equipmentName: item.equipmentName,
      category: item.category,
      totalSanctioned: sanctioned,
      working,
      underMaintenance: maintenance,
      deficit,
      operabilityRatePct: operability,
      trend: item.trend,
      classification: cls,
      replacementUrgency: item.urgency,
    };
  });
}
