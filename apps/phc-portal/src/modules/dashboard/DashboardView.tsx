import React, { useMemo } from 'react';
import {
  BedDouble, Wind, Users, Pill, Activity, AlertTriangle,
  ArrowRight, PlusCircle, PackagePlus, Zap, TrendingUp, Siren,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../stores/uiStore';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { getDaysUntil } from '../../utils/date';
import { getMedicineStockStatus } from '../../utils/fefo';
import { FootfallBarChart, InventoryStatusDonut, BedOccupancyGauge } from './DashboardCharts';
import { TelemetryDotGrid } from '../../components/common/TelemetryDotGrid';
import { ShinyText } from '../../components/common/ShinyText';
import { MagneticButton } from '../../components/common/MagneticButton';

const lastNDays = (n: number) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return days[d.getDay()];
  });
};

export const DashboardView: React.FC = () => {
  const { setActiveTab, setInventorySubTab, setNewRequestModalOpen, setEmergencyModalOpen } = useUIStore();

  const facility      = useLiveQuery(() => db.phc_facilities.toCollection().first());
  const medicines     = useLiveQuery(() => db.medicines.toArray()) || [];
  const batches       = useLiveQuery(() => db.inventory_batches.toArray()) || [];
  const equipment     = useLiveQuery(() => db.equipment.toArray()) || [];
  const staff         = useLiveQuery(() => db.staff_registry.toArray()) || [];
  const today         = new Date().toISOString().split('T')[0];
  const attendance    = useLiveQuery(() => db.staff_attendance.where('attendance_date').equals(today).toArray()) || [];
  const footfallToday = useLiveQuery(() => db.patient_footfall.where('date').equals(today).toArray()) || [];

  // Beds
  const totalBeds        = facility?.total_beds    || 0;
  const occupiedBeds     = facility?.occupied_beds || 0;
  const availableBeds    = Math.max(0, totalBeds - occupiedBeds);
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const bedAlert         = bedOccupancyRate >= 80;

  // Oxygen
  const cylinders     = facility?.oxygen_cylinders     || 0;
  const concentrators = facility?.oxygen_concentrators || 0;
  const oxygenCritical = cylinders < 5;

  // Staff
  const totalStaff   = staff.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount  = attendance.filter(a => a.status === 'absent').length;
  const leaveCount   = attendance.filter(a => a.status === 'leave').length;
  const staffShortage = absentCount > 0 || (totalStaff > 0 && presentCount / totalStaff < 0.7);
  const staffPct     = totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0;

  // Medicines
  let medNormal = 0, medWarning = 0, medCritical = 0, medNearExpiry = 0;
  medicines.forEach(med => {
    const mb = batches.filter(b => b.medicine_id === med.id);
    const totalRem = mb.reduce((a, b) => a + b.remaining_qty, 0);
    let nearDays = 999;
    mb.forEach(b => { if (b.remaining_qty > 0) { const d = getDaysUntil(b.expiry_date); if (d < nearDays) nearDays = d; } });
    const st = getMedicineStockStatus(totalRem, med.min_threshold, med.critical_threshold, nearDays === 999 ? undefined : nearDays, 45);
    if (st === 'CRITICAL' || st === 'EXPIRED') medCritical++;
    else if (st === 'NEAR_EXPIRY') medNearExpiry++;
    else if (st === 'WARNING') medWarning++;
    else medNormal++;
  });

  const allFootfall   = useLiveQuery(() => db.patient_footfall.toArray()) || [];

  // Footfall (Real DB counts)
  const latestDate = footfallToday.length > 0
    ? today
    : allFootfall.length > 0
      ? [...allFootfall].sort((a, b) => b.date.localeCompare(a.date))[0]?.date
      : today;
  const activeFootfall = footfallToday.length > 0
    ? footfallToday
    : allFootfall.filter((f) => f.date === latestDate);

  const opdCount       = activeFootfall.find(f => f.category === 'opd')?.count       || 0;
  const emergencyCount = activeFootfall.find(f => f.category === 'emergency')?.count || 0;
  const admissionCount = activeFootfall.find(f => f.category === 'admission')?.count || 0;
  const referralCount  = activeFootfall.find(f => f.category === 'referral')?.count  || 0;
  const totalPatientsToday = opdCount + emergencyCount + admissionCount + referralCount;

  // Chart data from real IndexedDB records
  const dayLabels = lastNDays(7);
  const footfallChartData = useMemo(() => {
    return dayLabels.map((name, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dtStr = d.toISOString().split('T')[0];
      const dayRecords = allFootfall.filter(f => f.date === dtStr);

      const opd = dayRecords.find(f => f.category === 'opd')?.count;
      const emg = dayRecords.find(f => f.category === 'emergency')?.count;
      const adm = dayRecords.find(f => f.category === 'admission')?.count;
      const ref = dayRecords.find(f => f.category === 'referral')?.count;

      return {
        name,
        OPD:       opd !== undefined ? opd : (i === 6 ? opdCount : 0),
        Emergency: emg !== undefined ? emg : (i === 6 ? emergencyCount : 0),
        Admission: adm !== undefined ? adm : (i === 6 ? admissionCount : 0),
        Referral:  ref !== undefined ? ref : (i === 6 ? referralCount : 0),
      };
    });
  }, [allFootfall, dayLabels, opdCount, emergencyCount, admissionCount, referralCount]);

  // Attention items
  const attentionItems: { id: string; title: string; subtitle: string; severity: 'critical' | 'high' | 'medium'; targetTab: any; subTab?: any }[] = [];
  if (medCritical > 0)            attentionItems.push({ id: 'att-med-crit', title: `${medCritical} Medicine(s) Critical Stockout`, subtitle: 'Insulin and essentials below safety reserve. Immediate replenishment.', severity: 'critical', targetTab: 'inventory', subTab: 'current_stock' });
  if (oxygenCritical)             attentionItems.push({ id: 'att-o2',       title: `Oxygen Cylinders Critical (${cylinders} left)`, subtitle: 'Below threshold of 5. Urgent refill required.', severity: 'critical', targetTab: 'oxygen' });
  if (medNearExpiry > 0)          attentionItems.push({ id: 'att-exp',       title: `${medNearExpiry} Batch(es) Near Expiry`, subtitle: 'Ensure FEFO auto-selection active for expiring stock.', severity: 'medium', targetTab: 'inventory', subTab: 'expiry' });
  if (absentCount > 0)            attentionItems.push({ id: 'att-staff',     title: `${absentCount} Staff Absent Today`, subtitle: 'Review shift rosters and clinical coverage.', severity: 'medium', targetTab: 'staff' });
  const brokenEq = equipment.filter(e => e.maintenance_status !== 'operational');
  if (brokenEq.length > 0)        attentionItems.push({ id: 'att-eq',        title: `${brokenEq.length} Equipment Under Maintenance`, subtitle: `${brokenEq.map(e => e.equipment_type).slice(0, 2).join(', ')} flagged.`, severity: 'high', targetTab: 'equipment' });
  if (bedAlert)                   attentionItems.push({ id: 'att-bed',        title: `Bed Occupancy at ${bedOccupancyRate}% (${occupiedBeds}/${totalBeds})`, subtitle: 'Approaching capacity. Check discharge pipeline.', severity: 'high', targetTab: 'beds' });

  return (
    <div className="space-y-5">

      {/* ── Header banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-800 via-primary-700 to-teal-700 dark:from-[#0a1526] dark:via-primary-950 dark:to-[#071d24] p-6 rounded-3xl border border-primary-500/20 dark:border-teal-500/20 shadow-[0_8px_32px_rgba(13,148,136,0.25)] scan-line-container">
        {/* Paper Shaders & Haikei Interactive Telemetry Dot Grid */}
        <TelemetryDotGrid dotSpacing={22} dotBaseRadius={1.2} dotColor="rgba(45, 212, 191, 0.22)" glowColor="rgba(94, 234, 212, 0.9)" />

        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            {/* Motionsites-style Iridescent Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full pill-iridescent text-white mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-200">
                LIVE OPERATIONAL · 24/7 SURVEILLANCE
              </span>
            </div>

            {/* ReactBits ShinyText Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              <ShinyText text="PHC Operations Command Center" speed={3.5} />
            </h2>
            <p className="text-xs sm:text-sm text-primary-100/85 mt-1 font-medium leading-relaxed">
              Real-Time Bed Telemetry · Oxygen Reserves · FEFO Pharmacy · Clinical Triage
            </p>

            {/* Neuform-inspired Quick Telemetry Chips */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/30 text-teal-300 border border-teal-500/30 backdrop-blur-md">
                Beds: <strong className="text-white font-bold">{occupiedBeds}/{totalBeds}</strong> ({bedOccupancyRate}%)
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/30 text-teal-300 border border-teal-500/30 backdrop-blur-md">
                O₂ Cylinders: <strong className="text-white font-bold">{cylinders}</strong>
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/30 text-teal-300 border border-teal-500/30 backdrop-blur-md">
                Staff: <strong className="text-white font-bold">{presentCount}/{totalStaff}</strong> On Duty
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-2 rounded-xl text-white shadow-inner">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Telemetry Sync Active · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 backdrop-blur-md transition-all active:scale-95 group"
            >
              <Siren className="w-3.5 h-3.5 text-rose-400 group-hover:animate-bounce" />
              <span>Broadcast Protocol</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard title="Beds Available" value={availableBeds} subtitle={`${occupiedBeds} occupied / ${totalBeds} total`} icon={BedDouble}
          badge={<StatusBadge status={bedAlert ? 'WARNING' : 'NORMAL'} size="sm" />}
          alert={bedAlert} alertText={`High Occupancy ${bedOccupancyRate}%`}
          onClick={() => setActiveTab('beds')} progress={bedOccupancyRate}
          showEkg={true} ekgStatus={bedAlert ? 'warning' : 'calm'} />

        <MetricCard title="Oxygen Cylinders" value={cylinders} subtitle={`${concentrators} concentrators on-site`} icon={Wind}
          badge={<StatusBadge status={oxygenCritical ? 'CRITICAL' : 'NORMAL'} size="sm" />}
          alert={oxygenCritical} alertText="Below Critical Reserve"
          onClick={() => setActiveTab('oxygen')} progress={Math.min(100, cylinders * 4)}
          showEkg={true} ekgStatus={oxygenCritical ? 'critical' : 'normal'} />

        <MetricCard title="Staff Present" value={`${presentCount}/${totalStaff}`} subtitle={`${absentCount} absent · ${leaveCount} on leave`} icon={Users}
          badge={<StatusBadge status={staffShortage ? 'SHORTAGE' : 'FULL'} size="sm" />}
          alert={staffShortage} alertText="Roster Shortage"
          onClick={() => setActiveTab('staff')} progress={staffPct} animateValue={false} />

        <MetricCard title="Medicine Stock" value={medicines.length} subtitle={`${medCritical} crit · ${medWarning} warn · ${medNearExpiry} near exp`} icon={Pill}
          badge={<StatusBadge status={medCritical > 0 ? 'CRITICAL' : medWarning > 0 ? 'WARNING' : 'NORMAL'} size="sm" />}
          alert={medCritical > 0} alertText={`${medCritical} Critical Stockout`}
          onClick={() => setActiveTab('inventory')} />

        <MetricCard title="Today's Patients" value={totalPatientsToday} subtitle={`OPD: ${opdCount} · Emg: ${emergencyCount} · Adm: ${admissionCount}`} icon={Activity}
          badge={<StatusBadge status="ACTIVE" size="sm" />}
          onClick={() => setActiveTab('footfall')}
          showEkg={true} ekgStatus="normal" />
      </div>

      {/* ── Charts row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 7-day footfall */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">7-Day Patient Footfall</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">OPD, Emergency, Admission, Referral</p>
            </div>
            <button onClick={() => setActiveTab('footfall')} className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <FootfallBarChart data={footfallChartData} />
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-4">
          {/* Medicine donut */}
          <div className="flex-1 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Medicine Status</h3>
            <InventoryStatusDonut normal={medNormal} warning={medWarning} critical={medCritical} nearExpiry={medNearExpiry} />
          </div>

          {/* Bed gauge */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)] flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 self-start">Bed Occupancy</h3>
            <BedOccupancyGauge occupancyPct={bedOccupancyRate} />
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">{occupiedBeds} of {totalBeds} occupied</p>
          </div>
        </div>
      </div>

      {/* ── Attention Required ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attention Required</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-500">Click any item to navigate to the source module</p>
            </div>
          </div>
          {attentionItems.length > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30">
              {attentionItems.length}
            </span>
          )}
        </div>

        {attentionItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-600">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-emerald-500 text-lg">✓</span>
            </div>
            All resources within nominal thresholds
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {attentionItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => { setActiveTab(item.targetTab); if (item.subTab) setInventorySubTab(item.subTab); }}
                className="animate-stagger-in group flex items-start justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#1e2d3d] bg-slate-50/60 dark:bg-[#0d1929]/60 hover:bg-white dark:hover:bg-[#111827] hover:border-primary-300 dark:hover:border-primary-800 hover:shadow-sm dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer glow-border"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div className="space-y-1 min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      item.severity === 'critical' ? 'bg-rose-500 animate-pulse' :
                      item.severity === 'high'     ? 'bg-amber-500 animate-pulse' : 'bg-sky-500'
                    }`} />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 pl-4 line-clamp-1">{item.subtitle}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Rapid Action Command HUD ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[
          {
            onClick: () => setActiveTab('facility'),
            icon: PlusCircle,
            gradient: 'from-primary-600 to-primary-700',
            border: 'border-primary-300/40 dark:border-primary-800/60 hover:border-primary-400 dark:hover:border-primary-600',
            bg: 'hover:bg-primary-50/60 dark:hover:bg-primary-950/30',
            textColor: 'text-primary-900 dark:text-primary-200',
            title: 'Update Facility & Capacity',
            desc: 'Edit live bed counts, clinical status & oxygen logs',
            tag: 'Telemetry'
          },
          {
            onClick: () => setNewRequestModalOpen(true),
            icon: PackagePlus,
            gradient: 'from-emerald-600 to-emerald-700',
            border: 'border-emerald-300/40 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600',
            bg: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30',
            textColor: 'text-emerald-900 dark:text-emerald-200',
            title: 'Request Supplies & Medicines',
            desc: 'Draft urgent supply requisition to District Warehouse',
            tag: 'FEFO Order'
          },
          {
            onClick: () => setEmergencyModalOpen(true),
            icon: Siren,
            gradient: 'from-rose-600 to-rose-700',
            border: 'border-rose-300/40 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-600',
            bg: 'hover:bg-rose-50/60 dark:hover:bg-rose-950/30',
            textColor: 'text-rose-900 dark:text-rose-200',
            title: 'Emergency Mass Protocol',
            desc: 'Broadcast hospital surge, mass casualty & divert triage',
            tag: 'Rapid Alert'
          },
        ].map(({ onClick, icon: Icon, gradient, border, bg, textColor, title, desc, tag }) => (
          <MagneticButton
            key={title}
            onClick={onClick}
            strength={0.15}
            className={`w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#111827] border ${border} ${bg} shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)] ${textColor} font-bold text-sm transition-all duration-200 group active:scale-[0.99] glow-border micro-border`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div className="text-xs font-bold truncate">{title}</div>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1e2d3d] text-slate-600 dark:text-slate-400 shrink-0">
                  {tag}
                </span>
              </div>
              <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">{desc}</div>
            </div>
          </MagneticButton>
        ))}
      </div>
    </div>
  );
};
