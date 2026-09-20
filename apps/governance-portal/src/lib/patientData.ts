// ─────────────────────────────────────────────────────────────────────────────
// Patient Intelligence Domain Data Models & Surge Detection Engine
// Masterplan §42: Outpatient, Emergency, Inpatient, Referral Trajectories,
// Disease-Category Distributions, and Multi-Tiered Surge Detection
// ─────────────────────────────────────────────────────────────────────────────

export type SurgeClassificationState =
  | 'SUDDEN_SURGE' // Single-PHC anomaly: caution/verify tone, "flagged for review", NOT outbreak
  | 'PERSISTENT_INCREASE' // Sustained multi-day elevation across a facility/block
  | 'REGIONAL_CLUSTER'; // Multiple contiguous PHCs affected: validated outbreak language

export interface PatientFlowTrendPoint {
  date: string;
  dayLabel: string;
  opdVisits: number;
  emergencyTriages: number;
  inpatientAdmissions: number;
  upstreamReferrals: number;
}

export interface DiseaseCategoryTrend {
  id: string;
  categoryName: string;
  shortCode: string;
  currentActiveCases: number;
  sharePct: number;
  weekOverWeekChangePct: number;
  trendSparkline: number[];
  color: string;
  primarySyndrome: string;
  clinicalAdvisory: string;
}

export interface SurgeAnomalyItem {
  id: string;
  syndromeName: string;
  affectedJurisdiction: string;
  phcCount: number;
  phcNames: string[];
  districtName: string;
  stateCode: string;
  state: SurgeClassificationState;
  detectedBaselineVsCurrent: {
    baseline7DayAvg: number;
    currentCount: number;
    pctIncrease: number;
  };
  detectedAt: string;
  statusText: string;
  actionGuidance: string;
  spatialSpreadKm?: number;
}

export interface PatientIntelligenceSummary {
  totalOpdToday: number;
  emergencyCasesToday: number;
  admissionsToday: number;
  referralsToday: number;
  referralRatePct: number;
  admissionRatePct: number;
  activeSurgeAlertsCount: number;
  regionalClusterCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset Generation Scaled by Scope (National, State, District, PHC)
// ─────────────────────────────────────────────────────────────────────────────

export function getPatientSummaryByScope(
  level: 'national' | 'state' | 'district' | 'phc'
): PatientIntelligenceSummary {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const totalOpd = Math.round(38400 * mult) || 320;
  const emergency = Math.round(3200 * mult) || 28;
  const admissions = Math.round(1850 * mult) || 16;
  const referrals = Math.round(1120 * mult) || 9;

  const referralRatePct = totalOpd > 0 ? Number(((referrals / totalOpd) * 100).toFixed(1)) : 2.9;
  const admissionRatePct = totalOpd > 0 ? Number(((admissions / totalOpd) * 100).toFixed(1)) : 4.8;

  return {
    totalOpdToday: totalOpd,
    emergencyCasesToday: emergency,
    admissionsToday: admissions,
    referralsToday: referrals,
    referralRatePct,
    admissionRatePct,
    activeSurgeAlertsCount: 4,
    regionalClusterCount: 1,
  };
}

export function getPatientFlowTrendsByScope(
  level: 'national' | 'state' | 'district' | 'phc'
): PatientFlowTrendPoint[] {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const days = [
    { date: '2026-09-10', dayLabel: 'Thu (D-6)', opd: 34200, emg: 2890, adm: 1650, ref: 980 },
    { date: '2026-09-11', dayLabel: 'Fri (D-5)', opd: 35800, emg: 2950, adm: 1720, ref: 1040 },
    { date: '2026-09-12', dayLabel: 'Sat (D-4)', opd: 37400, emg: 3410, adm: 1810, ref: 1150 },
    { date: '2026-09-13', dayLabel: 'Sun (D-3)', opd: 26100, emg: 3820, adm: 1480, ref: 1220 }, // weekend emergency bump
    { date: '2026-09-14', dayLabel: 'Mon (D-2)', opd: 41200, emg: 3100, adm: 1940, ref: 1180 }, // Monday OPD surge
    { date: '2026-09-15', dayLabel: 'Tue (D-1)', opd: 39500, emg: 3050, adm: 1890, ref: 1090 },
    { date: '2026-09-16', dayLabel: 'Today', opd: 38400, emg: 3200, adm: 1850, ref: 1120 },
  ];

  return days.map((d) => ({
    date: d.date,
    dayLabel: d.dayLabel,
    opdVisits: Math.round(d.opd * mult) || 280,
    emergencyTriages: Math.round(d.emg * mult) || 24,
    inpatientAdmissions: Math.round(d.adm * mult) || 14,
    upstreamReferrals: Math.round(d.ref * mult) || 8,
  }));
}

export function getDiseaseCategoryBreakdownByScope(
  level: 'national' | 'state' | 'district' | 'phc'
): DiseaseCategoryTrend[] {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const raw = [
    {
      id: 'dis-ari',
      categoryName: 'Acute Respiratory Infections (ARI / ILI)',
      shortCode: 'ARI / ILI',
      baseCases: 14200,
      sharePct: 37.0,
      changePct: 18.4,
      trend: [28, 30, 31, 33, 35, 36, 37],
      color: '#3b82f6',
      primarySyndrome: 'Fever, cough, dyspnea, sore throat',
      clinicalAdvisory: 'Seasonal viral bronchitis spike; prioritize Azithromycin and pediatric nebulization kits.',
    },
    {
      id: 'dis-vector',
      categoryName: 'Vector-Borne (Dengue, Malaria, Chikungunya)',
      shortCode: 'Vector-Borne',
      baseCases: 7800,
      sharePct: 20.3,
      changePct: 42.6, // Rapid spike
      trend: [12, 14, 15, 17, 18, 20, 20.3],
      color: '#ef4444',
      primarySyndrome: 'High-grade fever, retro-orbital pain, thrombocytopenia',
      clinicalAdvisory: 'Cluster identified in Eastern riverine belt; platelet stock reservation and NS1 Ag kits mobilized.',
    },
    {
      id: 'dis-enteric',
      categoryName: 'Enteric & Water-Borne (Diarrhea, Typhoid)',
      shortCode: 'Enteric & Water',
      baseCases: 5900,
      sharePct: 15.4,
      changePct: -6.2,
      trend: [18, 17, 16, 16, 15, 15.4, 15.4],
      color: '#f59e0b',
      primarySyndrome: 'Acute watery diarrhea, dehydration, abdominal cramps',
      clinicalAdvisory: 'Chlorination drives in municipal wards stabilizing gastroenteritis presentations.',
    },
    {
      id: 'dis-ncd',
      categoryName: 'Non-Communicable Diseases (HTN, Diabetes, CVD)',
      shortCode: 'NCD & Chronic',
      baseCases: 6400,
      sharePct: 16.7,
      changePct: 3.1,
      trend: [16, 16, 17, 16, 17, 16.7, 16.7],
      color: '#10b981',
      primarySyndrome: 'Hypertension follow-up, glycemic control, chest tightness',
      clinicalAdvisory: 'Routine refill dispensing stable; afternoon specialized clinics absorbing volume.',
    },
    {
      id: 'dis-mch',
      categoryName: 'Maternal, Neonatal & Child Health (MCH / ANC)',
      shortCode: 'Maternal & Child',
      baseCases: 4100,
      sharePct: 10.6,
      changePct: 1.8,
      trend: [10, 10, 11, 10, 11, 10.6, 10.6],
      color: '#8b5cf6',
      primarySyndrome: 'Antenatal care (ANC) trimester checks, immunization, anemia',
      clinicalAdvisory: 'High-risk pregnancy (HRP) identification active; IFA tablets and TT boosters adequate.',
    },
  ];

  return raw.map((d) => ({
    id: d.id,
    categoryName: d.categoryName,
    shortCode: d.shortCode,
    currentActiveCases: Math.round(d.baseCases * mult) || 35,
    sharePct: d.sharePct,
    weekOverWeekChangePct: d.changePct,
    trendSparkline: d.trend,
    color: d.color,
    primarySyndrome: d.primarySyndrome,
    clinicalAdvisory: d.clinicalAdvisory,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Surge Detection Panel — Distinct States per Masterplan §42
//  1. SUDDEN SURGE: Single-PHC anomaly (caution/verify tone, "flagged for review", NEVER "outbreak")
//  2. PERSISTENT INCREASE: Multi-day elevation across a facility/block
//  3. REGIONAL CLUSTER: Multiple neighboring PHCs affected (validated epidemic/outbreak language)
// ─────────────────────────────────────────────────────────────────────────────

export function getSurgeAnomaliesByScope(
  level: 'national' | 'state' | 'district' | 'phc'
): SurgeAnomalyItem[] {
  return [
    {
      id: 'surge-reg-1',
      syndromeName: 'Acute Febrile Illness / Suspected Dengue Fever',
      affectedJurisdiction: 'Eastern Haveli Riverine Cluster (3 Contiguous PHCs)',
      phcCount: 3,
      phcNames: ['Hadapsar Urban PHC', 'Haveli Sub-Center PHC', 'Wagholi Community PHC'],
      districtName: 'Pune District',
      stateCode: 'MH',
      state: 'REGIONAL_CLUSTER', // State 3
      detectedBaselineVsCurrent: {
        baseline7DayAvg: 42,
        currentCount: 148,
        pctIncrease: 252,
      },
      detectedAt: 'Today, 06:30 IST',
      spatialSpreadKm: 14.5,
      statusText: 'CROSS-CHECKED REGIONAL CLUSTER: OUTBREAK DETECTED',
      actionGuidance:
        '3 contiguous PHCs reporting concurrent thrombocytopenic fever spike (>250% above baseline). Vector control fogging and IV fluid / NS1 Ag emergency buffer transfer triggered automatically.',
    },
    {
      id: 'surge-sud-1',
      syndromeName: 'Acute Gastroenteritis / Diarrheal Symptoms',
      affectedJurisdiction: 'Shirur Rural PHC (Single Facility)',
      phcCount: 1,
      phcNames: ['Shirur Rural PHC'],
      districtName: 'Pune District',
      stateCode: 'MH',
      state: 'SUDDEN_SURGE', // State 1: Sole anomalous PHC
      detectedBaselineVsCurrent: {
        baseline7DayAvg: 16,
        currentCount: 47,
        pctIncrease: 193,
      },
      detectedAt: 'Today, 09:15 IST',
      statusText: 'FLAGGED FOR REVIEW: SINGLE-FACILITY ANOMALY',
      actionGuidance:
        'Isolated surge detected at Shirur Rural PHC only. Surrounding PHCs (Sanaswadi, Shikrapur) report normal enteric baselines. Flagged for field review: verify batch digital entry or local water source before escalation. System explicitly suppresses outbreak declaration.',
    },
    {
      id: 'surge-per-1',
      syndromeName: 'Lower Respiratory Tract Infection / Severe Acute Respiratory (SARI)',
      affectedJurisdiction: 'Baramati Model PHC & CHC Block',
      phcCount: 1,
      phcNames: ['Baramati Model PHC'],
      districtName: 'Pune District',
      stateCode: 'MH',
      state: 'PERSISTENT_INCREASE', // State 2
      detectedBaselineVsCurrent: {
        baseline7DayAvg: 58,
        currentCount: 94,
        pctIncrease: 62,
      },
      detectedAt: 'Recorded over past 8 days',
      statusText: 'PERSISTENT INCREASE: SUSTAINED MULTI-DAY ELEVATION',
      actionGuidance:
        'Sustained +62% growth observed consistently over 8 consecutive days. Clinical triage capacity approaching 85%. Pre-surge protocol active: O2 cylinder buffer replenishment scheduled.',
    },
    {
      id: 'surge-sud-2',
      syndromeName: 'Acute Dermatological Rash with Pruritus',
      affectedJurisdiction: 'Alandi Urban Health Post (Single Facility)',
      phcCount: 1,
      phcNames: ['Alandi Urban Health Post'],
      districtName: 'Pune District',
      stateCode: 'MH',
      state: 'SUDDEN_SURGE', // State 1: Sole anomalous PHC
      detectedBaselineVsCurrent: {
        baseline7DayAvg: 8,
        currentCount: 26,
        pctIncrease: 225,
      },
      detectedAt: 'Today, 11:40 IST',
      statusText: 'FLAGGED FOR REVIEW: SINGLE-FACILITY ANOMALY',
      actionGuidance:
        'Isolated spike logged by a single visiting dermatologist. Awaiting tele-consultation validation. Do not dispatch central pharmaceutical reserves until registry audit completes.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Copy & Styling Configs for the Three States (Masterplan §42 Rule)
// ─────────────────────────────────────────────────────────────────────────────

export function getSurgeStateConfig(state: SurgeClassificationState): {
  badgeLabel: string;
  badgeLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  cardBorder: string;
  cardBg: string;
  accentColor: string;
  headerIconText: string;
  verificationBadge: string;
  pulse: boolean;
} {
  switch (state) {
    case 'SUDDEN_SURGE':
      return {
        badgeLabel: 'FLAGGED FOR REVIEW',
        badgeLevel: 'MODERATE',
        cardBorder: '#fde047', // Warm Amber / Yellow
        cardBg: '#fefce8',
        accentColor: '#ca8a04',
        headerIconText: 'Single-Facility Anomaly (Caution/Verify)',
        verificationBadge: 'Local Register Verification Pending',
        pulse: false,
      };

    case 'PERSISTENT_INCREASE':
      return {
        badgeLabel: 'PERSISTENT INCREASE',
        badgeLevel: 'HIGH',
        cardBorder: '#fed7aa', // Orange / Amber
        cardBg: '#fff7ed',
        accentColor: '#ea580c',
        headerIconText: 'Multi-Day Sustained Growth (Pre-Surge)',
        verificationBadge: '8-Day Trend Cross-Validated',
        pulse: false,
      };

    case 'REGIONAL_CLUSTER':
      return {
        badgeLabel: 'REGIONAL CLUSTER OUTBREAK',
        badgeLevel: 'CRITICAL',
        cardBorder: '#fecaca', // Deep Red
        cardBg: '#fef2f2',
        accentColor: '#dc2626',
        headerIconText: 'Epidemic Cluster Signal (Multi-Facility)',
        verificationBadge: 'Multi-Facility Contiguity Validated',
        pulse: true,
      };
  }
}
