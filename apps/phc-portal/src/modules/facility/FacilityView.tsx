import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  BedDouble,
  Wind,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';

export const FacilityView: React.FC = () => {
  const facility = useLiveQuery(() => db.phc_facilities.toCollection().first());
  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();

  const [totalBeds, setTotalBeds] = useState(24);
  const [occupiedBeds, setOccupiedBeds] = useState(19);
  const [emergencyBeds, setEmergencyBeds] = useState(6);
  const [isolationBeds, setIsolationBeds] = useState(4);
  const [oxygenCylinders, setOxygenCylinders] = useState(12);
  const [oxygenConcentrators, setOxygenConcentrators] = useState(4);
  const [operationalStatus, setOperationalStatus] = useState<'operational' | 'partial' | 'closed'>('operational');
  const [emergencyCapability, setEmergencyCapability] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (facility) {
      setTotalBeds(facility.total_beds);
      setOccupiedBeds(facility.occupied_beds);
      setEmergencyBeds(facility.emergency_beds);
      setIsolationBeds(facility.isolation_beds);
      setOxygenCylinders(facility.oxygen_cylinders);
      setOxygenConcentrators(facility.oxygen_concentrators);
      setOperationalStatus(facility.operational_status || 'operational');
      setEmergencyCapability(facility.emergency_capability ?? true);
    }
  }, [facility]);

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await enqueue('facility_update', {
        total_beds: Number(totalBeds),
        occupied_beds: Number(occupiedBeds),
        emergency_beds: Number(emergencyBeds),
        isolation_beds: Number(isolationBeds),
        oxygen_cylinders: Number(oxygenCylinders),
        oxygen_concentrators: Number(oxygenConcentrators),
        operational_status: operationalStatus,
        emergency_capability: emergencyCapability,
      });
      addToast('Facility capacity updated and enqueued for sync!', 'success');
    } catch (err: any) {
      addToast('Failed to save facility update', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{facility?.name || 'Primary Health Centre Rampur'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Facility Master Identity &amp; Operational Capacity Registry</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={facility?.operational_status || 'operational'} />
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-[#0d1929] text-slate-700 dark:text-slate-300">
            ID: {facility?.id || 'PHC-001'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1/3: Read-Only Backend Managed Facility Identity */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Facility Identity</h3>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-100 dark:bg-[#0d1929]/60 text-slate-600 dark:text-slate-400 rounded">
              Read-Only
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Facility Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{facility?.name}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Jurisdiction</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                District: {facility?.district_name || 'Varanasi'} • State: {facility?.state_name || 'Uttar Pradesh'}
              </span>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Address &amp; Coordinates</span>
                <p className="text-slate-700 dark:text-slate-300">{facility?.address}</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  Lat: {facility?.latitude}° N, Lon: {facility?.longitude}° E
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Contact Phone</span>
                <span className="text-slate-700 dark:text-slate-300">{facility?.contact_phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Official Email</span>
                <span className="text-slate-700 dark:text-slate-300">{facility?.contact_email}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#1e2d3d] flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-medium">District CMO Authorized Health Facility</span>
            </div>
          </div>
        </div>

        {/* Right 2/3: Mutable Operational Capacity Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Operational Capacity &amp; Clinical Resources</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Every change enqueues an offline mutation committed instantly to local storage.</p>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Saving...' : 'Save Capacity'}
              </Button>
            </div>

            {/* Computed Available Banner */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-[#0d1929]/60 p-3.5 rounded-xl border border-slate-200 dark:border-[#1e2d3d] text-center">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Capacity</span>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalBeds} Beds</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Occupied</span>
                <div className="text-xl font-black text-amber-600 mt-0.5">{occupiedBeds} Beds</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Computed Available</span>
                <div className="text-xl font-black text-emerald-600 mt-0.5">{availableBeds} Free</div>
              </div>
            </div>

            {/* Beds Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-primary-600" />
                <span>Bed Capacities &amp; Utilization ({occupancyPct}% Occupancy)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Total Beds</label>
                  <input
                    type="number" min="1" value={totalBeds}
                    onChange={(e) => setTotalBeds(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold bg-white dark:bg-[#0d1929] dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Occupied Beds</label>
                  <input
                    type="number" min="0" max={totalBeds} value={occupiedBeds}
                    onChange={(e) => setOccupiedBeds(Math.min(totalBeds, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold bg-white dark:bg-[#0d1929] dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Emergency Beds</label>
                  <input
                    type="number" min="0" value={emergencyBeds}
                    onChange={(e) => setEmergencyBeds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#0d1929] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Isolation Beds</label>
                  <input
                    type="number" min="0" value={isolationBeds}
                    onChange={(e) => setIsolationBeds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#0d1929] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Oxygen Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1e2d3d]">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-600" />
                <span>Oxygen Infrastructure</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Oxygen Cylinders (D-Type / High Pressure)</label>
                  <input
                    type="number" min="0" value={oxygenCylinders}
                    onChange={(e) => setOxygenCylinders(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold bg-white dark:bg-[#0d1929] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Oxygen Concentrators (10L / 5L)</label>
                  <input
                    type="number" min="0" value={oxygenConcentrators}
                    onChange={(e) => setOxygenConcentrators(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold bg-white dark:bg-[#0d1929] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Operational Status & Capability */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1e2d3d]">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Clinical Capabilities</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Operational Mode</label>
                  <select
                    value={operationalStatus}
                    onChange={(e) => setOperationalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#0d1929] dark:text-slate-100"
                  >
                    <option value="operational">Fully Operational</option>
                    <option value="partial">Partial Capacity / Maintenance</option>
                    <option value="closed">Temporary Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox" id="emgCapability" checked={emergencyCapability}
                    onChange={(e) => setEmergencyCapability(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="emgCapability" className="text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                    24x7 Emergency Resuscitation &amp; Trauma Capable
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
