import React, { useState, useEffect } from 'react';
import {
  Wind,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { usePhcAuthStore } from '../../stores/authStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';

export const OxygenView: React.FC = () => {
  const facility = useLiveQuery(() => db.phc_facilities.toCollection().first());
  const { selectedFacility } = usePhcAuthStore();
  const systemConfigs = useLiveQuery(() => db.system_config.toArray()) || [];
  const { enqueue } = useMutationQueue();
  const { addToast, setNewRequestModalOpen } = useUIStore();

  const [cylinders, setCylinders] = useState(facility?.oxygen_cylinders || selectedFacility?.oxygen_cylinders || 15);
  const [concentrators, setConcentrators] = useState(facility?.oxygen_concentrators || 4);
  const [inUseCylinders, setInUseCylinders] = useState(4);
  const [emptyCylinders, setEmptyCylinders] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (facility) {
      setCylinders(facility.oxygen_cylinders);
      setConcentrators(facility.oxygen_concentrators);
    } else if (selectedFacility) {
      setCylinders(selectedFacility.oxygen_cylinders ?? 15);
    }
  }, [facility, selectedFacility]);

  // Critical threshold from synced system_config
  const criticalThreshold =
    (systemConfigs.find((c) => c.key === 'oxygen_critical_threshold')?.value as number) || 5;

  const availableCylinders = Math.max(0, cylinders - inUseCylinders - emptyCylinders);
  const isCritical = availableCylinders <= criticalThreshold;

  // Daily consumption velocity (estimated ~2 cylinders per day)
  const dailyVelocity = 2.0;
  const estimatedDaysRemaining =
    dailyVelocity > 0 ? (availableCylinders / dailyVelocity).toFixed(1) : '10+';

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await enqueue('facility_update', {
        oxygen_cylinders: Number(cylinders),
        oxygen_concentrators: Number(concentrators),
      });
      addToast('Oxygen levels updated and queued offline!', 'success');
    } catch (err) {
      addToast('Failed to update oxygen levels', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold shadow-sm">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Medical Oxygen Supply & Infrastructure</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cylinder manifold status, bedside concentrators, consumption telemetry, and buffer alerts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={isCritical ? 'CRITICAL' : 'NORMAL'} />
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0d1929] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e2d3d]">
            Critical Threshold: {criticalThreshold} Cylinders
          </span>
        </div>
      </div>

      {/* Critical Alert Banner if below threshold */}
      {isCritical && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                CRITICAL OXYGEN DEFICIT: Only {availableCylinders} full cylinders available!
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300">
                Available oxygen is estimated to last ~{estimatedDaysRemaining} days at current consumption rate.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setNewRequestModalOpen(true)}
          >
            Emergency Oxygen Request
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Cylinders</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{cylinders} Units</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">D-Type High Pressure Medical Grade</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Full & Available</span>
          <div className={`text-2xl font-black mt-1 ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {availableCylinders} Ready
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Immediate manifold connection</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">In Use / Active</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inUseCylinders} Connected</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Bedside flow active</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Days of Estimated Oxygen</span>
          <div className={`text-2xl font-black mt-1 ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
            ~{estimatedDaysRemaining} Days
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Based on ~{dailyVelocity} cyl/day burn rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oxygen Update Form */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#1e2d3d] pb-2">
            Oxygen Inventory Controller
          </h3>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Cylinders On-Site
                </label>
                <input
                  type="number"
                  min="0"
                  value={cylinders}
                  onChange={(e) => setCylinders(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Active Concentrators
                </label>
                <input
                  type="number"
                  min="0"
                  value={concentrators}
                  onChange={(e) => setConcentrators(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cylinders Currently Connected
                </label>
                <input
                  type="number"
                  min="0"
                  value={inUseCylinders}
                  onChange={(e) => setInUseCylinders(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Empty / Awaiting Refill
                </label>
                <input
                  type="number"
                  min="0"
                  value={emptyCylinders}
                  onChange={(e) => setEmptyCylinders(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Saving...' : 'Update Oxygen Status'}
              </Button>
            </div>
          </form>
        </div>

        {/* Concentrators & Backup Protocol */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#1e2d3d] pb-2">
            Oxygen Concentrator Fleet (Continuous 10L/min)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d]">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Concentrator Fleet Total:</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">3 Operational • 1 Under Filter Service</p>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{concentrators} Units</span>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-300 text-[11px] space-y-1">
              <span className="font-bold">National Oxygen Grid Protocol:</span>
              <p>
                When local available cylinders breach critical threshold (&lt;5), an automated requirement trigger is queued to the District Oxygen Refill Center.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
