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

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = usePhcAuthStore();

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('PHC-001');
  const [selectedRole, setSelectedRole] = useState<'medical_officer' | 'pharmacist' | 'staff_nurse'>('medical_officer');
  const [staffId, setStaffId] = useState<string>('dr.sharma@phc.gov.in');
  const [pin, setPin] = useState<string>('clinic@2026');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedFacility = PHC_FACILITY_PRESETS.find((f) => f.id === selectedFacilityId) || PHC_FACILITY_PRESETS[0];

  const handleRoleChange = (role: 'medical_officer' | 'pharmacist' | 'staff_nurse') => {
    setSelectedRole(role);
    setErrorMsg('');
    const persona = PHC_PERSONAS.find((p) => p.role === role);
    if (persona) {
      setStaffId(persona.role === 'medical_officer' ? 'dr.sharma@phc.gov.in' : `${persona.id}@phc.gov.in`);
    }
  };

  const performLogin = (persona: PhcStaffPersona, facId?: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      login(
        {
          ...persona,
          id: staffId.trim() || (persona.role === 'medical_officer' ? 'dr.sharma@phc.gov.in' : `${persona.id}@phc.gov.in`),
          role: selectedRole,
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
          window.history.pushState({}, '', '/');
        }
      }
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 250);
  };

  const applyPreset = (persona: PhcStaffPersona) => {
    setSelectedRole(persona.role);
    setSelectedFacilityId(persona.facilityId);
    setStaffId(persona.role === 'medical_officer' ? 'dr.sharma@phc.gov.in' : `${persona.id}@phc.gov.in`);
    setPin('clinic@2026');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!staffId.trim()) {
      setErrorMsg('Please enter your Staff ID or official email address.');
      return;
    }

    if (!pin || pin.trim().length < 4) {
      setErrorMsg('Please enter a valid Security PIN / Password (minimum 4 characters).');
      return;
    }

    const persona = PHC_PERSONAS.find((p) => p.role === selectedRole) || PHC_PERSONAS[0];
    performLogin(persona, selectedFacility.id);
  };

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      className="min-h-screen w-full text-neutral-900 flex flex-col justify-between font-sans select-none"
    >
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-neutral-200 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLATFORM HUB</span>
        </a>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>NODE 5173 · PRIMARY HEALTH CENTRE (OFFLINE-FIRST)</span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white border border-neutral-200/90 rounded-2xl p-7 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                NATIONAL HEALTH MISSION · FACILITY WORKBENCH
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Primary Health Centre Access
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Facility Selector */}
            <div>
              <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1.5 font-semibold">
                Select Facility Node
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                >
                  {PHC_FACILITY_PRESETS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.district}, {f.state} [{f.id}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Staff Role Selector (Clean segmented pill tabs) */}
            <div>
              <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1.5 font-semibold">
                Clinical Duty Role
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => handleRoleChange('medical_officer')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedRole === 'medical_officer'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>Medical Officer</span>
                  <span className="text-[10px] text-neutral-500 font-mono">OPD / Triage</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('pharmacist')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedRole === 'pharmacist'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>Pharmacist</span>
                  <span className="text-[10px] text-neutral-500 font-mono">FEFO Dispense</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('staff_nurse')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedRole === 'staff_nurse'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>Ward Nurse</span>
                  <span className="text-[10px] text-neutral-500 font-mono">IPD / Beds</span>
                </button>
              </div>
            </div>

            {/* Device Certificate status indicator */}
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-700 shrink-0" />
                <span>Bound Hardware Tablet: <span className="font-mono font-bold text-neutral-900">DEV-TAB-01</span></span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/80 text-neutral-800 font-medium">
                RSA VALID
              </span>
            </div>

            {/* 3. Credentials (Staff ID & PIN) */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Staff ID / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Security PIN / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
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
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              <span>1-Click Clinic Staff Presets</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PHC_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => applyPreset(persona)}
                  className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
                >
                  <div className="text-xs font-semibold text-neutral-900 truncate">
                    {persona.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono truncate">{persona.roleLabel}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-neutral-200 text-center text-xs font-mono text-neutral-500 bg-white/60">
        OFFLINE HEALTH LEDGER · DEXIE INDEXEDDB ACTIVE · WEBSOCKET SYNC GUARANTEE
      </footer>
    </div>
  );
};
export default LoginView;
