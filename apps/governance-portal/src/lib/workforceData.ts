// ─────────────────────────────────────────────────────────────────────────────
// Workforce Intelligence Domain Data & Analytics Models
// Masterplan §31 & §88: Staffing Composition, Attendance, Demand Correlation,
// District Cross-Comparison, and Cadre Shortage Breakdowns
// ─────────────────────────────────────────────────────────────────────────────

export type ShortageLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type DemandStrainLevel = 'OPTIMAL' | 'MANAGEABLE' | 'HIGH_STRAIN' | 'OVERBURDENED';

export interface WorkforceSummary {
  totalSanctioned: number;
  inPosition: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  vacancies: number;
  vacancyRate: number;
  attendanceRate: number;
  shortageClassification: ShortageLevel;
}

export interface RoleWorkforceItem {
  roleId: string;
  roleName: string;
  shortLabel: string;
  category: 'Doctors' | 'Nurses' | 'Pharmacists' | 'Technicians' | 'Specialists' | 'CHOs';
  sanctioned: number;
  inPosition: number;
  present: number;
  absent: number;
  onLeave: number;
  vacancies: number;
  vacancyRate: number;
  trainingDue: number;
  shortageSeverity: ShortageLevel;
  criticalDutyImpact: string;
}

export interface StaffToDemandMetric {
  currentDailyPatientLoad: number;
  activeStaffOnDuty: number;
  staffToPatientRatio: string;
  patientsPerStaff: number;
  idealPatientsPerStaff: number;
  strainIndex: number; // 0 - 100
  strainLevel: DemandStrainLevel;
  hourlyTrend: Array<{
    hour: string;
    patientLoad: number;
    activeStaff: number;
    ratio: number;
    recommendedStaff: number;
  }>;
}

export interface DistrictStaffingComparison {
  districtId: string;
  districtName: string;
  stateCode: string;
  sanctionedStaff: number;
  activeStaff: number;
  patientDailyLoad: number;
  patientsPerStaff: number;
  vacancyRatePct: number;
  attendanceRatePct: number;
  shortageLevel: ShortageLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scope-based Workforce Generator
// ─────────────────────────────────────────────────────────────────────────────

export function getWorkforceSummaryByScope(
  level: 'national' | 'state' | 'district' | 'phc'
): WorkforceSummary {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const sanctioned = Math.round(1420 * mult) || 12;
  const inPosition = Math.round(1120 * mult) || 9;
  const vacancies = Math.max(0, sanctioned - inPosition);
  const vacancyRate = Math.round((vacancies / sanctioned) * 100);

  // Daily attendance breakdown among staff in position
  const presentCount = Math.round(inPosition * 0.82); // 82% present
  const leaveCount = Math.round(inPosition * 0.12); // 12% on leave
  const absentCount = inPosition - presentCount - leaveCount; // remainder absent

  const attendanceRate = inPosition > 0 ? Math.round((presentCount / inPosition) * 100) : 0;

  // Shortage classification: >25% vacancy = CRITICAL, 15-25% = HIGH, 8-15% = MODERATE, <8% = LOW
  const shortageClassification: ShortageLevel =
    vacancyRate > 25 ? 'CRITICAL' : vacancyRate > 15 ? 'HIGH' : vacancyRate > 8 ? 'MODERATE' : 'LOW';

  return {
    totalSanctioned: sanctioned,
    inPosition,
    presentCount,
    absentCount,
    leaveCount,
    vacancies,
    vacancyRate,
    attendanceRate,
    shortageClassification,
  };
}

export function getRoleBreakdownByScope(
  level: 'national' | 'state' | 'district' | 'phc'
): RoleWorkforceItem[] {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const roles = [
    {
      roleId: 'role-doctors',
      roleName: 'Medical Officers (MBBS & Specialists)',
      shortLabel: 'Doctors',
      category: 'Doctors' as const,
      baseSanctioned: 220,
      baseInPos: 160,
      trainingDue: 18,
      impact: 'Emergency triage & high-risk OPD diagnosis backlog',
    },
    {
      roleId: 'role-nurses',
      roleName: 'Staff Nurses & Senior GNM / ANMs',
      shortLabel: 'Nurses',
      category: 'Nurses' as const,
      baseSanctioned: 480,
      baseInPos: 395,
      trainingDue: 34,
      impact: '24x7 Inpatient ward coverage & maternal delivery tables',
    },
    {
      roleId: 'role-pharmacists',
      roleName: 'Registered Pharmacists & Dispensers',
      shortLabel: 'Pharmacists',
      category: 'Pharmacists' as const,
      baseSanctioned: 165,
      baseInPos: 148,
      trainingDue: 8,
      impact: 'Medicine inventory audit, dispensing & cold-chain stock',
    },
    {
      roleId: 'role-technicians',
      roleName: 'Laboratory & Diagnostic Technicians',
      shortLabel: 'Technicians',
      category: 'Technicians' as const,
      baseSanctioned: 145,
      baseInPos: 112,
      trainingDue: 14,
      impact: 'CBC, Malaria RDT, and diagnostic specimen turnaround lag',
    },
    {
      roleId: 'role-specialists',
      roleName: 'Clinical Specialists (Pediatrics, O&G, Anesthesia)',
      shortLabel: 'Specialists',
      category: 'Specialists' as const,
      baseSanctioned: 90,
      baseInPos: 54, // Severe shortage (40% vacancy)
      trainingDue: 5,
      impact: 'C-Section referral diversion and pediatric emergency delay',
    },
    {
      roleId: 'role-chos',
      roleName: 'Community Health Officers (CHOs / HWC Staff)',
      shortLabel: 'CHOs',
      category: 'CHOs' as const,
      baseSanctioned: 320,
      baseInPos: 285,
      trainingDue: 26,
      impact: 'NCD screening, hypertension registers, and wellness sessions',
    },
  ];

  return roles.map((r) => {
    const sanctioned = Math.round(r.baseSanctioned * mult) || 2;
    const inPosition = Math.min(sanctioned, Math.round(r.baseInPos * mult) || 1);
    const vacancies = Math.max(0, sanctioned - inPosition);
    const vacancyRate = Math.round((vacancies / sanctioned) * 100);

    const present = Math.round(inPosition * 0.84);
    const onLeave = Math.round(inPosition * 0.11);
    const absent = Math.max(0, inPosition - present - onLeave);

    const shortageSeverity: ShortageLevel =
      vacancyRate > 30 ? 'CRITICAL' : vacancyRate > 18 ? 'HIGH' : vacancyRate > 8 ? 'MODERATE' : 'LOW';

    return {
      roleId: r.roleId,
      roleName: r.roleName,
      shortLabel: r.shortLabel,
      category: r.category,
      sanctioned,
      inPosition,
      present,
      absent,
      onLeave,
      vacancies,
      vacancyRate,
      trainingDue: Math.round(r.trainingDue * mult) || 1,
      shortageSeverity,
      criticalDutyImpact: r.impact,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff-to-Demand Relationship View (Patient Load vs Clinical Staff)
// ─────────────────────────────────────────────────────────────────────────────

export function getStaffToDemandMetric(
  level: 'national' | 'state' | 'district' | 'phc'
): StaffToDemandMetric {
  const mult = level === 'national' ? 300 : level === 'state' ? 25 : level === 'district' ? 1 : 0.08;

  const currentDailyPatientLoad = Math.round(38400 * mult) || 320;
  const activeStaffOnDuty = Math.round(980 * mult) || 8;

  const patientsPerStaff = Math.round((currentDailyPatientLoad / (activeStaffOnDuty || 1)) * 10) / 10;
  const idealPatientsPerStaff = 22; // Benchmark: 1 clinical staff per 22 patients daily

  // Strain Index: (patientsPerStaff / idealPatientsPerStaff) * 50
  const strainIndex = Math.min(100, Math.round((patientsPerStaff / idealPatientsPerStaff) * 50));
  const strainLevel: DemandStrainLevel =
    strainIndex >= 85 ? 'OVERBURDENED' : strainIndex >= 70 ? 'HIGH_STRAIN' : strainIndex >= 50 ? 'MANAGEABLE' : 'OPTIMAL';

  const hourlyTrend = [
    { hour: '08:00', patientLoad: Math.round(1800 * mult), activeStaff: Math.round(820 * mult), ratio: 2.2, recommendedStaff: Math.round(750 * mult) },
    { hour: '10:00', patientLoad: Math.round(5900 * mult), activeStaff: Math.round(980 * mult), ratio: 6.0, recommendedStaff: Math.round(1150 * mult) },
    { hour: '12:00', patientLoad: Math.round(7800 * mult), activeStaff: Math.round(980 * mult), ratio: 8.0, recommendedStaff: Math.round(1350 * mult) },
    { hour: '14:00', patientLoad: Math.round(6200 * mult), activeStaff: Math.round(920 * mult), ratio: 6.7, recommendedStaff: Math.round(1100 * mult) },
    { hour: '16:00', patientLoad: Math.round(4400 * mult), activeStaff: Math.round(780 * mult), ratio: 5.6, recommendedStaff: Math.round(850 * mult) },
    { hour: '18:00', patientLoad: Math.round(2900 * mult), activeStaff: Math.round(650 * mult), ratio: 4.5, recommendedStaff: Math.round(620 * mult) },
    { hour: '20:00', patientLoad: Math.round(1800 * mult), activeStaff: Math.round(510 * mult), ratio: 3.5, recommendedStaff: Math.round(480 * mult) },
  ];

  return {
    currentDailyPatientLoad,
    activeStaffOnDuty,
    staffToPatientRatio: `1 : ${Math.round(patientsPerStaff)}`,
    patientsPerStaff,
    idealPatientsPerStaff,
    strainIndex,
    strainLevel,
    hourlyTrend,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// District Comparison Analytics (Role-Scoped)
// ─────────────────────────────────────────────────────────────────────────────

export function getDistrictStaffingComparison(
  userRole: string,
  stateId: string | null,
  districtId: string | null
): DistrictStaffingComparison[] {
  // If user is district_admin or viewing a district, show Pune sub-districts / blocks
  if (userRole === 'district_admin' || districtId) {
    return [
      {
        districtId: 'block-haveli',
        districtName: 'Haveli Block',
        stateCode: 'MH',
        sanctionedStaff: 185,
        activeStaff: 152,
        patientDailyLoad: 4800,
        patientsPerStaff: 31.6,
        vacancyRatePct: 17.8,
        attendanceRatePct: 83.5,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'block-baramati',
        districtName: 'Baramati Block',
        stateCode: 'MH',
        sanctionedStaff: 210,
        activeStaff: 188,
        patientDailyLoad: 5200,
        patientsPerStaff: 27.7,
        vacancyRatePct: 10.5,
        attendanceRatePct: 89.5,
        shortageLevel: 'MODERATE',
      },
      {
        districtId: 'block-shirur',
        districtName: 'Shirur Block',
        stateCode: 'MH',
        sanctionedStaff: 160,
        activeStaff: 118,
        patientDailyLoad: 4900,
        patientsPerStaff: 41.5,
        vacancyRatePct: 26.3, // Critical shortage
        attendanceRatePct: 78.2,
        shortageLevel: 'CRITICAL',
      },
      {
        districtId: 'block-junnar',
        districtName: 'Junnar Block',
        stateCode: 'MH',
        sanctionedStaff: 145,
        activeStaff: 122,
        patientDailyLoad: 3600,
        patientsPerStaff: 29.5,
        vacancyRatePct: 15.9,
        attendanceRatePct: 84.1,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'block-khed',
        districtName: 'Khed Block',
        stateCode: 'MH',
        sanctionedStaff: 170,
        activeStaff: 136,
        patientDailyLoad: 4300,
        patientsPerStaff: 31.6,
        vacancyRatePct: 20.0,
        attendanceRatePct: 81.2,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'block-daund',
        districtName: 'Daund Block',
        stateCode: 'MH',
        sanctionedStaff: 155,
        activeStaff: 142,
        patientDailyLoad: 3100,
        patientsPerStaff: 21.8,
        vacancyRatePct: 8.4,
        attendanceRatePct: 91.6,
        shortageLevel: 'LOW',
      },
    ];
  }

  // If viewing state (or state_admin), show districts in that state (e.g. Maharashtra)
  if (userRole === 'state_admin' || stateId === 'state-mh' || !stateId) {
    return [
      {
        districtId: 'dist-pune',
        districtName: 'Pune',
        stateCode: 'MH',
        sanctionedStaff: 1420,
        activeStaff: 1180,
        patientDailyLoad: 38400,
        patientsPerStaff: 32.5,
        vacancyRatePct: 16.9,
        attendanceRatePct: 83.1,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'dist-thane',
        districtName: 'Thane',
        stateCode: 'MH',
        sanctionedStaff: 1380,
        activeStaff: 1140,
        patientDailyLoad: 41200,
        patientsPerStaff: 36.1,
        vacancyRatePct: 17.4,
        attendanceRatePct: 82.6,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'dist-nagpur',
        districtName: 'Nagpur',
        stateCode: 'MH',
        sanctionedStaff: 1150,
        activeStaff: 840,
        patientDailyLoad: 35600,
        patientsPerStaff: 42.4, // Critical strain
        vacancyRatePct: 27.0,
        attendanceRatePct: 79.5,
        shortageLevel: 'CRITICAL',
      },
      {
        districtId: 'dist-nashik',
        districtName: 'Nashik',
        stateCode: 'MH',
        sanctionedStaff: 1210,
        activeStaff: 1020,
        patientDailyLoad: 31000,
        patientsPerStaff: 30.4,
        vacancyRatePct: 15.7,
        attendanceRatePct: 84.3,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'dist-aurangabad',
        districtName: 'Chh. Sambhajinagar',
        stateCode: 'MH',
        sanctionedStaff: 980,
        activeStaff: 750,
        patientDailyLoad: 28900,
        patientsPerStaff: 38.5,
        vacancyRatePct: 23.5,
        attendanceRatePct: 80.2,
        shortageLevel: 'HIGH',
      },
      {
        districtId: 'dist-solapur',
        districtName: 'Solapur',
        stateCode: 'MH',
        sanctionedStaff: 890,
        activeStaff: 810,
        patientDailyLoad: 21500,
        patientsPerStaff: 26.5,
        vacancyRatePct: 9.0,
        attendanceRatePct: 91.0,
        shortageLevel: 'LOW',
      },
      {
        districtId: 'dist-kolhapur',
        districtName: 'Kolhapur',
        stateCode: 'MH',
        sanctionedStaff: 920,
        activeStaff: 845,
        patientDailyLoad: 23400,
        patientsPerStaff: 27.7,
        vacancyRatePct: 8.2,
        attendanceRatePct: 91.8,
        shortageLevel: 'LOW',
      },
    ];
  }

  // Fallback Karnataka districts if state is KA
  return [
    {
      districtId: 'dist-bengaluru',
      districtName: 'Bengaluru Urban',
      stateCode: 'KA',
      sanctionedStaff: 1650,
      activeStaff: 1380,
      patientDailyLoad: 49000,
      patientsPerStaff: 35.5,
      vacancyRatePct: 16.4,
      attendanceRatePct: 83.6,
      shortageLevel: 'HIGH',
    },
    {
      districtId: 'dist-mysuru',
      districtName: 'Mysuru',
      stateCode: 'KA',
      sanctionedStaff: 890,
      activeStaff: 810,
      patientDailyLoad: 22000,
      patientsPerStaff: 27.2,
      vacancyRatePct: 9.0,
      attendanceRatePct: 91.0,
      shortageLevel: 'LOW',
    },
    {
      districtId: 'dist-belagavi',
      districtName: 'Belagavi',
      stateCode: 'KA',
      sanctionedStaff: 1050,
      activeStaff: 790,
      patientDailyLoad: 32000,
      patientsPerStaff: 40.5,
      vacancyRatePct: 24.8,
      attendanceRatePct: 80.2,
      shortageLevel: 'CRITICAL',
    },
  ];
}
