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
} from 'lucide-react';
import { useAuthStore, DEV_PERSONAS } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { STATES } from '@/lib/geography';
import type { UserRole } from '@/types';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SegmentedControl, SegmentOption } from '@/components/ui/SegmentedControl';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';

export default function GovernanceLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { setNational, setState, setDistrict } = useScopeStore();

  const [selectedLevel, setSelectedLevel] = useState<'national' | 'state' | 'district'>('national');
  const [selectedStateId, setSelectedStateId] = useState<string>('state-mh');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('dist-pune');
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
      performLogin('state', p.stateId || 'state-mh', null, p.email || 'mh-admin@gov.in');
    } else {
      performLogin('district', p.stateId || 'state-mh', p.districtId || 'dist-pune', p.email || 'pune-admin@gov.in');
    }
  };

  // Handle submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(selectedLevel, selectedStateId, selectedDistrictId, email);
  };

  const levelOptions: SegmentOption<'national' | 'state' | 'district'>[] = [
    { value: 'national', label: '🏛️ National', badge: 'Tier 1' },
    { value: 'state', label: '🗺️ State', badge: 'Tier 2' },
    { value: 'district', label: '📍 District', badge: 'Tier 3' },
  ];

  return (
    <div
      style={{ backgroundColor: '#070a12', color: '#f1f5f9' }}
      className="min-h-screen w-full bg-[#070a12] text-slate-100 flex flex-col justify-between font-sans select-none relative overflow-x-hidden"
    >
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-md flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLATFORM HUB</span>
        </Link>
        <div className="flex items-center gap-3">
          <ShimmerBadge className="border-blue-500/30 text-blue-300 text-[11px] font-mono">
            NODE 3000 · GOVERNANCE TERMINAL
          </ShimmerBadge>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center z-10">
        <SpotlightCard
          spotlightColor="rgba(59, 130, 246, 0.14)"
          className="w-full max-w-xl bg-slate-900/80 border-slate-800/90 shadow-2xl p-6 sm:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                GOVERNMENT OF INDIA · MOHFW
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Governance Portal Access
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Status / Jurisdiction Level Selector (National, State, District) using SegmentedControl */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                Choose Status / Administrative Level
              </label>
              <SegmentedControl<'national' | 'state' | 'district'>
                options={levelOptions}
                value={selectedLevel}
                onChange={handleLevelChange}
              />
            </div>

            {/* 2. Dynamic Scope Dropdowns (State / District) */}
            {selectedLevel === 'national' && (
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between text-xs text-blue-200 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>National Health Authority · All 36 States & UTs Jurisdiction</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  TIER-1 ALLOCATOR
                </span>
              </div>
            )}

            {selectedLevel === 'state' && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
                  Select State Jurisdiction
                </label>
                <div className="relative">
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    {STATES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code}) — {st.totalDistricts} Districts · {st.totalPhcs} PHCs
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedLevel === 'district' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Select State
                  </label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  >
                    {STATES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Select District
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  >
                    {availableDistricts.map((dst) => (
                      <option key={dst.id} value={dst.id}>
                        {dst.name} District ({dst.totalPhcs} PHCs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3. Credentials (ID/Email & Password) */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Officer Email / ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@health.gov.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
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
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>1-Click Quick Demo Presets</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('national_admin')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-300 truncate">
                  Dr. Rajesh Kumar
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">National Director</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('state_admin')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-300 truncate">
                  Smt. Priya Sharma
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">State (Maharashtra)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('district_admin')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-300 truncate">
                  Suresh Iyer
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">District (Pune)</div>
              </button>
            </div>
          </div>
        </SpotlightCard>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/80 text-center text-xs font-mono text-slate-500 z-10">
        NIC / MOHFW ENCRYPTED JURISDICTION TERMINAL · SESSION CLAIMS VERIFIED VIA RLS
      </footer>
    </div>
  );
}
