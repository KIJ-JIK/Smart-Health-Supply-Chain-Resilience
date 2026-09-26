import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Smartphone,
  HardDrive,
  Moon,
  Sun,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { CURRENT_DEVICE_ID, CURRENT_PHC_ID, getCurrentPhcId, initializeDatabase } from '../../db/seedData';
import { useUIStore } from '../../stores/uiStore';
import { useThemeStore } from '../../stores/themeStore';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { PhcBackendService } from '../../services/phcBackendService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';

export const SettingsView: React.FC = () => {
  const systemConfigs = useLiveQuery(() => db.system_config.toArray()) || [];
  const { addToast } = useUIStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { enqueue } = useMutationQueue();

  const [minStockPct,          setMinStockPct]          = useState(20);
  const [criticalStockPct,     setCriticalStockPct]     = useState(10);
  const [nearExpiryDays,       setNearExpiryDays]       = useState(45);
  const [bedOccupancyAlertPct, setBedOccupancyAlertPct] = useState(80);
  const [oxygenThreshold,      setOxygenThreshold]      = useState(5);
  const [safetyBufferPct,      setSafetyBufferPct]      = useState(15);
  const [isSaving,             setIsSaving]             = useState(false);

  React.useEffect(() => {
    systemConfigs.forEach((c) => {
      if (c.key === 'min_stock_threshold_pct')     setMinStockPct(Number(c.value));
      if (c.key === 'critical_stock_threshold_pct') setCriticalStockPct(Number(c.value));
      if (c.key === 'near_expiry_days')            setNearExpiryDays(Number(c.value));
      if (c.key === 'bed_occupancy_alert_pct')     setBedOccupancyAlertPct(Number(c.value));
      if (c.key === 'oxygen_critical_threshold')   setOxygenThreshold(Number(c.value));
      if (c.key === 'safety_buffer_pct')           setSafetyBufferPct(Number(c.value));
    });
  }, [systemConfigs]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const configs = [
        { key: 'min_stock_threshold_pct',      value: Number(minStockPct) },
        { key: 'critical_stock_threshold_pct', value: Number(criticalStockPct) },
        { key: 'near_expiry_days',             value: Number(nearExpiryDays) },
        { key: 'bed_occupancy_alert_pct',      value: Number(bedOccupancyAlertPct) },
        { key: 'oxygen_critical_threshold',    value: Number(oxygenThreshold) },
        { key: 'safety_buffer_pct',            value: Number(safetyBufferPct) },
      ];

      // 1. Commit to local IndexedDB
      await db.system_config.bulkPut(configs.map(c => ({ ...c, updated_at: now })));

      // 2. Enqueue offline mutation
      await enqueue('system_config', { configs });

      // 3. Attempt direct push to PostgreSQL backend
      const phcId = getCurrentPhcId();
      await PhcBackendService.saveConfig(phcId, configs);

      addToast('Threshold configuration saved to PostgreSQL and synced!', 'success');
    } catch {
      addToast('Failed to update config', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Reset local IndexedDB and restore clean initial PHC dataset?')) {
      await db.delete();
      await db.open();
      await initializeDatabase();
      addToast('Database reset to clean operational state!', 'info');
      window.location.reload();
    }
  };

  const SliderField = ({
    label, value, onChange, min, max, unit
  }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <span className="text-sm font-black text-primary-600 dark:text-primary-400 tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">System Parameters & Device Config</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Threshold settings synced down via /sync/pull and client-side device profiles
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Profile */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              Edge Device Identity
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { label: 'Registered Device ID', value: CURRENT_DEVICE_ID, mono: true },
                { label: 'Assigned Facility ID', value: CURRENT_PHC_ID, mono: true },
                { label: 'Local Database Storage', value: 'IndexedDB via Dexie.js (PHC_Portal_DB)' },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase text-[10px] tracking-wider">{label}</span>
                  <span className={`font-bold text-slate-900 dark:text-slate-100 ${mono ? 'font-mono' : ''}`}>{value}</span>
                </div>
              ))}
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase text-[10px] tracking-wider">PWA Service Worker</span>
                <StatusBadge status="ACTIVE" size="sm" />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={handleResetDatabase}
                  className="w-full justify-center"
                >
                  Reset Database to Initial State
                </Button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Appearance</h3>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Moon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${isDark ? 'bg-primary-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Thresholds Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Operational Policy Thresholds</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Config keys arrive from central server as <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1 rounded">threshold_config_update</code> deltas.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SliderField label="Warning Stock Threshold" value={minStockPct}          onChange={setMinStockPct}          min={5}   max={50}  unit="%" />
              <SliderField label="Critical Stockout Threshold" value={criticalStockPct} onChange={setCriticalStockPct}     min={1}   max={30}  unit="%" />
              <SliderField label="Near Expiry Warning Window"  value={nearExpiryDays}   onChange={setNearExpiryDays}       min={7}   max={180} unit=" days" />
              <SliderField label="Bed Occupancy Alert Level"   value={bedOccupancyAlertPct} onChange={setBedOccupancyAlertPct} min={50}  max={100} unit="%" />
              <SliderField label="Oxygen Critical Limit (Cylinders)" value={oxygenThreshold} onChange={setOxygenThreshold} min={1}   max={20}  />
              <SliderField label="Auto-Draft Safety Buffer"    value={safetyBufferPct}  onChange={setSafetyBufferPct}      min={5}   max={50}  unit="%" />
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-700">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Saving…' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
