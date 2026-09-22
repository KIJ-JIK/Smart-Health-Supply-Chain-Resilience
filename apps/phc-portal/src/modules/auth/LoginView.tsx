import React, { useState } from 'react';
import {
  HeartPulse,
  Lock,
  User,
  Building,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  usePhcAuthStore,
  PHC_FACILITY_PRESETS,
  PHC_PERSONAS,
  PhcStaffPersona,
} from '../../stores/authStore';

export const LoginView: React.FC = () => {
  const { login } = usePhcAuthStore();

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('PHC-001');
  const [selectedRole, setSelectedRole] = useState<'medical_officer' | 'pharmacist' | 'staff_nurse'>('medical_officer');
  const [staffId, setStaffId] = useState<string>('dr.sharma@phc.gov.in');
  const [pin, setPin] = useState<string>('••••••••');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedFacility = PHC_FACILITY_PRESETS.find((f) => f.id === selectedFacilityId) || PHC_FACILITY_PRESETS[0];

  const handleRoleChange = (role: 'medical_officer' | 'pharmacist' | 'staff_nurse') => {
    setSelectedRole(role);
    const persona = PHC_PERSONAS.find((p) => p.role === role);
    if (persona) {
      setStaffId(persona.role === 'medical_officer' ? 'dr.sharma@phc.gov.in' : `${persona.id}@phc.gov.in`);
    }
  };

  const performLogin = (persona: PhcStaffPersona, facId?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      login(
        {
          ...persona,
          id: persona.role === 'medical_officer' ? 'dr.sharma@phc.gov.in' : `${persona.id}@phc.gov.in`,
          facilityId: facId || selectedFacility.id,
          facilityName: selectedFacility.name,
          district: selectedFacility.district,
          state: selectedFacility.state,
        },
        facId || selectedFacility.id
      );
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/login' || window.location.hash === '#login') {
          window.location.assign('/');
        }
      }
    }, 200);
  };

  const applyPreset = (persona: PhcStaffPersona) => {
    setSelectedRole(persona.role);
    setSelectedFacilityId(persona.facilityId);
    setStaffId(persona.role === 'medical_officer' ? 'dr.sharma@phc.gov.in' : `${persona.id}@phc.gov.in`);
    performLogin(persona, persona.facilityId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const persona = PHC_PERSONAS.find((p) => p.role === selectedRole) || PHC_PERSONAS[0];
    performLogin(persona, selectedFacility.id);
  };

  return (
    <div className="min-h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col justify-between font-sans select-none">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#060913]/80 backdrop-blur-md flex items-center justify-between">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLATFORM HUB</span>
        </a>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">NODE 5173 · PRIMARY HEALTH CENTRE (OFFLINE-FIRST)</span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Teal Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(13,148,136,0.25)] shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                NATIONAL HEALTH MISSION · FACILITY WORKBENCH
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Primary Health Centre Access
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Facility Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                Select Facility Node
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  {PHC_FACILITY_PRESETS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.district}, {f.state} [{f.id}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Staff Role Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                Clinical Duty Role
              </label>
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRoleChange('medical_officer')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'medical_officer'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>🩺 Medical Officer</span>
                  <span className="text-[10px] opacity-80 font-mono">OPD / Triage</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('pharmacist')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'pharmacist'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>💊 Pharmacist</span>
                  <span className="text-[10px] opacity-80 font-mono">FEFO Dispense</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('staff_nurse')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'staff_nurse'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>🩹 Ward Nurse</span>
                  <span className="text-[10px] opacity-80 font-mono">IPD / Beds</span>
                </button>
              </div>
            </div>

            {/* Device Certificate status indicator */}
            <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-800/40 flex items-center justify-between text-xs text-teal-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Bound Hardware Tablet: <span className="font-mono font-bold">DEV-TAB-01</span></span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-900/60 text-teal-300">
                RSA SIGNATURE VALID
              </span>
            </div>

            {/* 3. Credentials (Staff ID & PIN) */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Staff ID / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Security PIN / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Unlocking Facility Offline Ledger…</span>
              ) : (
                <>
                  <span>Sign In to Clinical Workbench</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Personas */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>1-Click Clinic Staff Presets</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PHC_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => applyPreset(persona)}
                  className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-teal-300 truncate">
                    {persona.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{persona.roleLabel}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/80 text-center text-xs font-mono text-slate-500">
        OFFLINE HEALTH LEDGER · DEXIE INDEXEDDB ACTIVE · WEBSOCKET SYNC GUARANTEE
      </footer>
    </div>
  );
};
export default LoginView;
