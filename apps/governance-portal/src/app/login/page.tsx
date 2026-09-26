'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ChevronRight,
  Sparkles,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore, DEV_PERSONAS } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { STATES } from '@/lib/geography';
import type { UserRole } from '@/types';

export default function GovernanceLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { setNational, setState, setDistrict } = useScopeStore();

  const [selectedLevel, setSelectedLevel] = useState<'national' | 'state' | 'district'>('national');
  const [selectedStateId, setSelectedStateId] = useState<string>('a0000001-0000-0000-0000-000000000001');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('b0000002-0000-0000-0000-000000000001');
  const [email, setEmail] = useState<string>('nat-admin@gov.in');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
    const s = STATES.find((st) => st.id === selectedStateId);
    return s?.districts || [];
  }, [selectedStateId]);

  // Handle tier change
  const handleLevelChange = (lvl: 'national' | 'state' | 'district') => {
    setSelectedLevel(lvl);
    setErrorMsg('');
    if (lvl === 'national') {
      setEmail('nat-admin@gov.in');
    } else if (lvl === 'state') {
      setEmail('mh-admin@gov.in');
    } else {
      setEmail('pune-admin@gov.in');
    }
  };

  // Handle state change
  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    const s = STATES.find((st) => st.id === stateId);
    if (s && s.districts.length > 0) {
      setSelectedDistrictId(s.districts[0].id);
    }
  };

  // Execute authentication and navigate to /governance
  const performLogin = (
    lvl: 'national' | 'state' | 'district',
    stId: string | null,
    distId: string | null,
    userEmail: string
  ) => {
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      let role: UserRole = 'national_admin';
      let stateId: string | null = null;
      let districtId: string | null = null;
      let userName = 'National Health Director';

      if (lvl === 'national') {
        role = 'national_admin';
        userName = 'Dr. Rajesh Kumar (National Director)';
        setNational();
      } else if (lvl === 'state') {
        role = 'state_admin';
        stateId = stId || selectedStateId;
        const s = STATES.find((st) => st.id === (stId || selectedStateId));
        userName = `Smt. Priya Sharma (${s?.name || 'State'} Directorate)`;
        setState(stId || selectedStateId);
      } else {
        role = 'district_admin';
        stateId = stId || selectedStateId;
        districtId = distId || selectedDistrictId;
        const d = availableDistricts.find((dst) => dst.id === (distId || selectedDistrictId));
        userName = `Suresh Iyer (${d?.name || 'District'} Health Officer)`;
        setDistrict(distId || selectedDistrictId);
      }

      login({
        id: `usr-${role}-${Date.now().toString().slice(-4)}`,
        name: userName,
        role,
        stateId,
        districtId,
        email: userEmail,
      });

      setIsLoading(false);
      window.location.assign('/governance');
    }, 200);
  };

  // Preset quick fill & immediate login
  const applyPreset = (personaKey: 'national_admin' | 'state_admin' | 'district_admin') => {
    const p = DEV_PERSONAS[personaKey];
    if (personaKey === 'national_admin') {
      performLogin('national', null, null, p.email || 'nat-admin@gov.in');
    } else if (personaKey === 'state_admin') {
      performLogin('state', p.stateId || 'a0000001-0000-0000-0000-000000000001', null, p.email || 'mh-admin@gov.in');
    } else {
      performLogin('district', p.stateId || 'a0000001-0000-0000-0000-000000000001', p.districtId || 'b0000002-0000-0000-0000-000000000001', p.email || 'pune-admin@gov.in');
    }
  };

  // Handle submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(selectedLevel, selectedStateId, selectedDistrictId, email);
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLATFORM HUB</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>STATE & NATIONAL GOVERNANCE</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white border border-neutral-200/90 rounded-2xl p-7 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                GOVERNMENT OF INDIA · MOHFW
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Governance Portal Access
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Administrative Tier Segmented Selector (Clean Origin UI style) */}
            <div>
              <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1.5 font-semibold">
                Jurisdiction Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => handleLevelChange('national')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedLevel === 'national'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>National</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Tier-1 All-India</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelChange('state')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedLevel === 'state'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>State</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Tier-2 Directorate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelChange('district')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedLevel === 'district'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>District</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Tier-3 DHO</span>
                </button>
              </div>
            </div>

            {/* 2. Dynamic Scope Dropdowns (State / District) */}
            {selectedLevel === 'national' && (
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-neutral-900 shrink-0" />
                  <span>National Authority · All 36 States & UTs Oversight</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/80 text-neutral-800 font-medium">
                  FULL SCOPE
                </span>
              </div>
            )}

            {selectedLevel === 'state' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider font-semibold">
                  Select State Jurisdiction
                </label>
                <select
                  value={selectedStateId}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                >
                  {STATES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code}) — {st.totalDistricts} Districts · {st.totalPhcs} PHCs
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedLevel === 'district' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                    Select State
                  </label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs sm:text-sm focus:outline-none focus:border-neutral-900"
                  >
                    {STATES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                    Select District
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs sm:text-sm focus:outline-none focus:border-neutral-900"
                  >
                    {availableDistricts.map((dst) => (
                      <option key={dst.id} value={dst.id}>
                        {dst.name} ({dst.totalPhcs} PHCs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3. Credentials (ID & Password) */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Officer ID / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@health.gov.in"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <span>Authenticating Officer Credentials…</span>
              ) : (
                <>
                  <span>Sign In to Governance Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Personas */}
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              <span>1-Click Quick Demo Presets</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('national_admin')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  Dr. Rajesh Kumar
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">National Director</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('state_admin')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  Smt. Priya Sharma
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">State (Maharashtra)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('district_admin')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  Suresh Iyer
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">District (Pune)</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-neutral-200 text-center text-xs font-mono text-neutral-500 bg-white/60">
        NIC / MOHFW ENCRYPTED JURISDICTION TERMINAL · SESSION CLAIMS VERIFIED VIA RLS
      </footer>
    </div>
  );
}

