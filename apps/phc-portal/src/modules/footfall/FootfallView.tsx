import React, { useState } from 'react';
import {
  Activity,
  Save,
  History,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { FootfallCategory } from '../../types';
import { Button } from '../../components/common/Button';

export const FootfallView: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const footfallRecords = useLiveQuery(() => db.patient_footfall.reverse().sortBy('created_at')) || [];
  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();

  const [date, setDate] = useState(today);
  const [opdCount, setOpdCount] = useState<number>(125);
  const [emergencyCount, setEmergencyCount] = useState<number>(9);
  const [admissionCount, setAdmissionCount] = useState<number>(4);
  const [referralCount, setReferralCount] = useState<number>(3);
  const [infectiousCount, setInfectiousCount] = useState<number>(38);
  const [chronicCount, setChronicCount] = useState<number>(45);
  const [maternalCount, setMaternalCount] = useState<number>(18);
  const [otherCount, setOtherCount] = useState<number>(11);
  const [isSaving, setIsSaving] = useState(false);

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
          date,
        });
      }

      addToast(`Patient footfall for ${date} enqueued as append-only time-series!`, 'success');
    } catch (err) {
      addToast('Failed to save patient footfall', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPatients = opdCount + emergencyCount + admissionCount + referralCount;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Patient Footfall & Epidemiology Telemetry</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Append-only time series records across OPD, admissions, and disease surveillance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-xl font-semibold bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Footfall Entry Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daily Footfall Capture</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server check constraint enum strictly enforced. Total patients: <span className="font-bold text-primary-700 dark:text-primary-400">{totalPatients}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoriesConfig.map((cat) => (
                <div key={cat.key} className="p-3 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d]">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {cat.label}
                  </label>
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
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Footfall Logs</h3>
            <History className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {footfallRecords.slice(0, 15).map((f) => (
              <div
                key={f.id}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0d1929]/70 border border-slate-200 dark:border-[#1e2d3d] text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                    {f.category.replace('disease_', 'Surveillance: ')}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Date: {f.date}</p>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
