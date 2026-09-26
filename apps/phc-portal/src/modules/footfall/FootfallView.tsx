import React, { useState, useMemo } from 'react';
import {
  Activity,
  Save,
  History,
  BarChart3,
  Calendar,
  Download,
  Filter,
  Table,
  TrendingUp,
  Layers,
  ArrowUpDown,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { db } from '../../db';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { FootfallCategory, PatientFootfall } from '../../types';
import { Button } from '../../components/common/Button';

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ActiveSubView = 'reports' | 'capture';

interface AggregatedFootfallRow {
  periodKey: string;
  periodLabel: string;
  sortTimestamp: number;
  opd: number;
  emergency: number;
  admission: number;
  referral: number;
  disease_infectious: number;
  disease_chronic: number;
  disease_maternal: number;
  other: number;
  total: number;
}

const CATEGORY_COLORS: Record<FootfallCategory, string> = {
  opd: '#0d9488',
  emergency: '#f43f5e',
  admission: '#8b5cf6',
  referral: '#f59e0b',
  disease_infectious: '#ef4444',
  disease_chronic: '#3b82f6',
  disease_maternal: '#ec4899',
  other: '#64748b',
};

const CATEGORY_LABELS: Record<FootfallCategory, string> = {
  opd: 'OPD Outpatients',
  emergency: 'Emergency / Trauma',
  admission: 'Admissions',
  referral: 'Referrals',
  disease_infectious: 'Infectious Surveillance',
  disease_chronic: 'NCD / Chronic',
  disease_maternal: 'Maternal & Child',
  other: 'Other Services',
};

function getWeekNumber(dateStr: string): { key: string; label: string; timestamp: number } {
  const d = new Date(dateStr);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return {
    key: `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`,
    label: `Week ${weekNo}, ${date.getUTCFullYear()}`,
    timestamp: date.getTime(),
  };
}

export const FootfallView: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const footfallRecords = useLiveQuery(() => db.patient_footfall.toArray()) || [];
  const facility = useLiveQuery(() => db.phc_facilities.toCollection().first());

  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();

  const [activeSubView, setActiveSubView] = useState<ActiveSubView>('reports');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Form capture state
  const [captureDate, setCaptureDate] = useState(today);
  const [opdCount, setOpdCount] = useState<number>(0);
  const [emergencyCount, setEmergencyCount] = useState<number>(0);
  const [admissionCount, setAdmissionCount] = useState<number>(0);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [infectiousCount, setInfectiousCount] = useState<number>(0);
  const [chronicCount, setChronicCount] = useState<number>(0);
  const [maternalCount, setMaternalCount] = useState<number>(0);
  const [otherCount, setOtherCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Sync existing record for selected date into form inputs
  React.useEffect(() => {
    const dayRecords = footfallRecords.filter((r) => r.date === captureDate);
    if (dayRecords.length > 0) {
      setOpdCount(dayRecords.find((r) => r.category === 'opd')?.count || 0);
      setEmergencyCount(dayRecords.find((r) => r.category === 'emergency')?.count || 0);
      setAdmissionCount(dayRecords.find((r) => r.category === 'admission')?.count || 0);
      setReferralCount(dayRecords.find((r) => r.category === 'referral')?.count || 0);
      setInfectiousCount(dayRecords.find((r) => r.category === 'disease_infectious')?.count || 0);
      setChronicCount(dayRecords.find((r) => r.category === 'disease_chronic')?.count || 0);
      setMaternalCount(dayRecords.find((r) => r.category === 'disease_maternal')?.count || 0);
      setOtherCount(dayRecords.find((r) => r.category === 'other')?.count || 0);
    } else {
      setOpdCount(0);
      setEmergencyCount(0);
      setAdmissionCount(0);
      setReferralCount(0);
      setInfectiousCount(0);
      setChronicCount(0);
      setMaternalCount(0);
      setOtherCount(0);
    }
  }, [captureDate, footfallRecords]);

  // Available years in dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(footfallRecords.map((r) => r.date.slice(0, 4)))).filter(Boolean);
    return years.sort().reverse();
  }, [footfallRecords]);

  // Filter records by selected year
  const filteredRecords = useMemo(() => {
    if (selectedYear === 'all') return footfallRecords;
    return footfallRecords.filter((r) => r.date.startsWith(selectedYear));
  }, [footfallRecords, selectedYear]);

  // Aggregate footfall by selected granularity (Daily, Weekly, Monthly, Yearly)
  const aggregatedReport = useMemo(() => {
    const groups: Record<string, AggregatedFootfallRow> = {};

    filteredRecords.forEach((rec) => {
      let key = rec.date;
      let label = rec.date;
      let timestamp = new Date(rec.date).getTime();

      if (granularity === 'daily') {
        key = rec.date;
        const d = new Date(rec.date);
        label = isNaN(d.getTime())
          ? rec.date
          : d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        timestamp = d.getTime();
      } else if (granularity === 'weekly') {
        const wk = getWeekNumber(rec.date);
        key = wk.key;
        label = wk.label;
        timestamp = wk.timestamp;
      } else if (granularity === 'monthly') {
        key = rec.date.slice(0, 7); // YYYY-MM
        const d = new Date(rec.date.slice(0, 7) + '-01');
        label = isNaN(d.getTime())
          ? key
          : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        timestamp = d.getTime();
      } else if (granularity === 'yearly') {
        key = rec.date.slice(0, 4); // YYYY
        label = `Year ${key}`;
        timestamp = new Date(`${key}-01-01`).getTime();
      }

      if (!groups[key]) {
        groups[key] = {
          periodKey: key,
          periodLabel: label,
          sortTimestamp: timestamp,
          opd: 0,
          emergency: 0,
          admission: 0,
          referral: 0,
          disease_infectious: 0,
          disease_chronic: 0,
          disease_maternal: 0,
          other: 0,
          total: 0,
        };
      }

      const cat = rec.category as FootfallCategory;
      const count = Number(rec.count) || 0;
      if (groups[key][cat] !== undefined) {
        groups[key][cat] += count;
      } else {
        groups[key].other += count;
      }
      groups[key].total += count;
    });

    const rows = Object.values(groups);
    rows.sort((a, b) => (sortOrder === 'desc' ? b.sortTimestamp - a.sortTimestamp : a.sortTimestamp - b.sortTimestamp));
    return rows;
  }, [filteredRecords, granularity, sortOrder]);

  // Overall Summary Metrics
  const summaryTotals = useMemo(() => {
    const totals = {
      grandTotal: 0,
      opd: 0,
      emergency: 0,
      admission: 0,
      referral: 0,
      disease_infectious: 0,
      disease_chronic: 0,
      disease_maternal: 0,
      other: 0,
      peakPeriod: null as AggregatedFootfallRow | null,
    };

    aggregatedReport.forEach((row) => {
      totals.grandTotal += row.total;
      totals.opd += row.opd;
      totals.emergency += row.emergency;
      totals.admission += row.admission;
      totals.referral += row.referral;
      totals.disease_infectious += row.disease_infectious;
      totals.disease_chronic += row.disease_chronic;
      totals.disease_maternal += row.disease_maternal;
      totals.other += row.other;

      if (!totals.peakPeriod || row.total > totals.peakPeriod.total) {
        totals.peakPeriod = row;
      }
    });

    return totals;
  }, [aggregatedReport]);

  // Top Category Determination
  const topCategory = useMemo(() => {
    const cats: { key: FootfallCategory; count: number }[] = [
      { key: 'opd', count: summaryTotals.opd },
      { key: 'emergency', count: summaryTotals.emergency },
      { key: 'admission', count: summaryTotals.admission },
      { key: 'referral', count: summaryTotals.referral },
      { key: 'disease_infectious', count: summaryTotals.disease_infectious },
      { key: 'disease_chronic', count: summaryTotals.disease_chronic },
      { key: 'disease_maternal', count: summaryTotals.disease_maternal },
      { key: 'other', count: summaryTotals.other },
    ];
    cats.sort((a, b) => b.count - a.count);
    return cats[0] || { key: 'opd', count: 0 };
  }, [summaryTotals]);

  // Chart data (sorted chronologically for chart display)
  const chartData = useMemo(() => {
    const copy = [...aggregatedReport];
    copy.sort((a, b) => a.sortTimestamp - b.sortTimestamp);
    return copy.slice(-15); // Show latest 15 periods for clean readability
  }, [aggregatedReport]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (aggregatedReport.length === 0) {
      addToast('No footfall data available to export.', 'warning');
      return;
    }

    const headers = [
      'Period',
      'OPD Outpatients',
      'Emergency',
      'Admissions',
      'Referrals',
      'Infectious Disease',
      'Chronic NCD',
      'Maternal & Child',
      'Other Services',
      'Total Patients',
    ];

    const csvRows = [
      headers.join(','),
      ...aggregatedReport.map((r) =>
        [
          `"${r.periodLabel}"`,
          r.opd,
          r.emergency,
          r.admission,
          r.referral,
          r.disease_infectious,
          r.disease_chronic,
          r.disease_maternal,
          r.other,
          r.total,
        ].join(',')
      ),
      [
        '"TOTAL"',
        summaryTotals.opd,
        summaryTotals.emergency,
        summaryTotals.admission,
        summaryTotals.referral,
        summaryTotals.disease_infectious,
        summaryTotals.disease_chronic,
        summaryTotals.disease_maternal,
        summaryTotals.other,
        summaryTotals.grandTotal,
      ].join(','),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `footfall_report_${facility?.name || 'phc'}_${granularity}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Footfall report exported as CSV successfully!', 'success');
  };

  const categoriesConfig: { key: FootfallCategory; label: string; count: number; setter: (val: number) => void }[] = [
    { key: 'opd', label: 'OPD General Outpatients', count: opdCount, setter: setOpdCount },
    { key: 'emergency', label: 'Emergency / Trauma Cases', count: emergencyCount, setter: setEmergencyCount },
    { key: 'admission', label: 'Inpatient Admissions', count: admissionCount, setter: setAdmissionCount },
    { key: 'referral', label: 'Higher Center Referrals', count: referralCount, setter: setReferralCount },
    { key: 'disease_infectious', label: 'Infectious / Communicable (Fever/Flu/TB)', count: infectiousCount, setter: setInfectiousCount },
    { key: 'disease_chronic', label: 'NCD / Chronic (Hypertension/Diabetes)', count: chronicCount, setter: setChronicCount },
    { key: 'disease_maternal', label: 'Maternal & Child Health (ANC/PNC)', count: maternalCount, setter: setMaternalCount },
    { key: 'other', label: 'Other Clinical Services', count: otherCount, setter: setOtherCount },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      for (const cat of categoriesConfig) {
        await enqueue('footfall_entry', {
          id: generateUUID(),
          category: cat.key,
          count: Number(cat.count),
          date: captureDate,
        });
      }

      addToast(`Patient footfall for ${captureDate} enqueued as append-only time-series!`, 'success');
    } catch (err) {
      addToast('Failed to save patient footfall', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalCapturePatients = opdCount + emergencyCount + admissionCount + referralCount + infectiousCount + chronicCount + maternalCount + otherCount;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Top Banner & View Switcher */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Patient Footfall & Epidemiology Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                LIVE POSTGRES DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {facility?.name || 'Active PHC Facility'} · Comprehensive day-wise, week-wise, month-wise, and yearly epidemiology analytics
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#0a0f1a] rounded-xl border border-slate-200 dark:border-[#1e2d3d] self-start md:self-auto">
          <button
            onClick={() => setActiveSubView('reports')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubView === 'reports'
                ? 'bg-white dark:bg-[#1e293b] text-primary-700 dark:text-primary-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Category-Wise Reports</span>
          </button>
          <button
            onClick={() => setActiveSubView('capture')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubView === 'capture'
                ? 'bg-white dark:bg-[#1e293b] text-primary-700 dark:text-primary-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Daily Telemetry</span>
          </button>
        </div>
      </div>

      {activeSubView === 'reports' && (
        <div className="space-y-6">
          {/* Controls Bar: Granularity, Year Filter, Export */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs flex flex-wrap items-center justify-between gap-4">
            {/* Granularity Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0a0f1a] rounded-xl border border-slate-200 dark:border-[#1e2d3d]">
              {(['daily', 'weekly', 'monthly', 'yearly'] as Granularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    granularity === g
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {g === 'daily'
                    ? 'Day-Wise'
                    : g === 'weekly'
                    ? 'Week-Wise'
                    : g === 'monthly'
                    ? 'Month-Wise'
                    : 'Yearly'}
                </button>
              ))}
            </div>

            {/* Filter & Actions Row */}
            <div className="flex items-center gap-2.5">
              {availableYears.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                title="Toggle Chronological Sort"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Patients Recorded
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {summaryTotals.grandTotal.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Across {aggregatedReport.length} {granularity === 'daily' ? 'days' : granularity === 'weekly' ? 'weeks' : granularity === 'monthly' ? 'months' : 'years'}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Leading Clinical Domain
              </span>
              <div className="text-2xl font-black text-primary-700 dark:text-primary-400 mt-1">
                {CATEGORY_LABELS[topCategory.key] || 'OPD'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-bold">{topCategory.count} cases</span> (
                {summaryTotals.grandTotal > 0
                  ? Math.round((topCategory.count / summaryTotals.grandTotal) * 100)
                  : 0}
                % of all patient volume)
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Peak Footfall Period
              </span>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 truncate">
                {summaryTotals.peakPeriod ? summaryTotals.peakPeriod.periodLabel : 'N/A'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Peak volume: <span className="font-bold">{summaryTotals.peakPeriod?.total || 0} cases</span>
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Period Average
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {aggregatedReport.length > 0
                  ? Math.round(summaryTotals.grandTotal / aggregatedReport.length)
                  : 0}{' '}
                <span className="text-sm font-normal text-slate-500">cases / period</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Computed across active periods
              </p>
            </div>
          </div>

          {/* Stacked Recharts Visual Trend */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {granularity === 'daily'
                    ? 'Day-Wise'
                    : granularity === 'weekly'
                    ? 'Week-Wise'
                    : granularity === 'monthly'
                    ? 'Month-Wise'
                    : 'Yearly'}{' '}
                  Epidemiological Category Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparing all 8 medical categories over chronological reporting buckets
                </p>
              </div>

              {/* Category Legend Pill Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(CATEGORY_LABELS) as FootfallCategory[]).map((cat) => (
                  <div key={cat} className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <span>{CATEGORY_LABELS[cat].split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="periodLabel"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#0a0f1a] border border-[#1e2d3d] rounded-xl p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200 border-b border-[#1e2d3d] pb-1 mb-1.5">
                            {label}
                          </p>
                          {payload.map((p: any) => (
                            <div key={p.dataKey} className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1 text-slate-400">
                                <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                                {CATEGORY_LABELS[p.dataKey as FootfallCategory] || p.dataKey}:
                              </span>
                              <span className="font-bold text-slate-100">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="opd" stackId="a" fill={CATEGORY_COLORS.opd} />
                  <Bar dataKey="emergency" stackId="a" fill={CATEGORY_COLORS.emergency} />
                  <Bar dataKey="admission" stackId="a" fill={CATEGORY_COLORS.admission} />
                  <Bar dataKey="referral" stackId="a" fill={CATEGORY_COLORS.referral} />
                  <Bar dataKey="disease_infectious" stackId="a" fill={CATEGORY_COLORS.disease_infectious} />
                  <Bar dataKey="disease_chronic" stackId="a" fill={CATEGORY_COLORS.disease_chronic} />
                  <Bar dataKey="disease_maternal" stackId="a" fill={CATEGORY_COLORS.disease_maternal} />
                  <Bar dataKey="other" stackId="a" fill={CATEGORY_COLORS.other} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full Category-Wise Breakdown Table */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#1e2d3d] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Comprehensive Category-Wise Footfall Report Table
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detailed breakdown by clinical department across all recorded periods
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400">
                {aggregatedReport.length} periods listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#0a0f1a] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-[#1e2d3d]">
                  <tr>
                    <th className="py-3 px-4">Reporting Period</th>
                    <th className="py-3 px-3 text-right">OPD</th>
                    <th className="py-3 px-3 text-right">Emergency</th>
                    <th className="py-3 px-3 text-right">Admissions</th>
                    <th className="py-3 px-3 text-right">Referrals</th>
                    <th className="py-3 px-3 text-right">Infectious</th>
                    <th className="py-3 px-3 text-right">Chronic NCD</th>
                    <th className="py-3 px-3 text-right">Maternal</th>
                    <th className="py-3 px-3 text-right">Other</th>
                    <th className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">Total Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d3d] text-slate-800 dark:text-slate-200">
                  {aggregatedReport.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No footfall records found for this period filter.
                      </td>
                    </tr>
                  ) : (
                    aggregatedReport.map((row) => (
                      <tr key={row.periodKey} className="hover:bg-slate-50/80 dark:hover:bg-[#1e293b]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {row.periodLabel}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{row.opd || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {row.emergency || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{row.admission || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono">{row.referral || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono">{row.disease_infectious || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono">{row.disease_chronic || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono">{row.disease_maternal || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono">{row.other || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-primary-700 dark:text-primary-400 bg-slate-50/50 dark:bg-[#0a0f1a]/50">
                          {row.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {aggregatedReport.length > 0 && (
                  <tfoot className="bg-slate-100/90 dark:bg-[#0a0f1a] font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-[#1e2d3d]">
                    <tr>
                      <td className="py-3 px-4 uppercase tracking-wider text-[11px]">Grand Total ({granularity})</td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.opd.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {summaryTotals.emergency.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.admission.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.referral.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.disease_infectious.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.disease_chronic.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.disease_maternal.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{summaryTotals.other.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-primary-700 dark:text-primary-400">
                        {summaryTotals.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'capture' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3: Footfall Entry Form */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daily Footfall Capture Form</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Server check constraint enum strictly enforced. Total patients: <span className="font-bold text-primary-700 dark:text-primary-400">{totalCapturePatients}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Record Date:</span>
                <input
                  type="date"
                  value={captureDate}
                  onChange={(e) => setCaptureDate(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-xl font-semibold bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 shadow-xs"
                />
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoriesConfig.map((cat) => (
                  <div key={cat.key} className="p-3 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {cat.label}
                      </label>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.key] }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={cat.count}
                        onChange={(e) => cat.setter(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg font-bold bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100"
                        required
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">cases</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {isSaving ? 'Submitting...' : 'Save Append-Only Footfall'}
                </Button>
              </div>
            </form>
          </div>

          {/* Right 1/3: Historical Log Preview */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Footfall Logs</h3>
              <History className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {footfallRecords.slice(0, 20).map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0d1929]/70 border border-slate-200 dark:border-[#1e2d3d] text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[f.category as FootfallCategory] || '#94a3b8' }}
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                        {CATEGORY_LABELS[f.category as FootfallCategory] || f.category}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Date: {f.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
