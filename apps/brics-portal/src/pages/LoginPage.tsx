import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe2,
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Server,
  Eye,
  EyeOff,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { useBricsAuthStore, BRICS_COUNTRIES, BRICS_PERSONAS } from '@/store/auth-store';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useBricsAuthStore();

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IN');
  const [delegateId, setDelegateId] = useState<string>('sumaiya.khan@smarthealth.gov.in');
  const [passphrase, setPassphrase] = useState<string>('••••••••••••');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedCountry = BRICS_COUNTRIES.find((c) => c.code === selectedCountryCode) || BRICS_COUNTRIES[0];

  const handleCountrySelect = (code: string) => {
    setSelectedCountryCode(code);
    const persona = BRICS_PERSONAS[code];
    if (persona) {
      setDelegateId(persona.email);
    }
    setErrorMsg('');
  };

  const applyPreset = (code: string) => {
    handleCountrySelect(code);
    setPassphrase('brics-fedavg-2026');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      login(selectedCountryCode, {
        email: delegateId,
      });
      setIsLoading(false);
      navigate('/');
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-[#070a12] text-slate-100 flex flex-col justify-between font-sans select-none relative overflow-x-hidden">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-md flex items-center justify-between z-10">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLATFORM HUB</span>
        </a>
        <div className="flex items-center gap-3">
          <ShimmerBadge className="border-amber-500/30 text-amber-300 text-[11px] font-mono">
            NODE 3001 · BRICS FEDERATED AI MESH
          </ShimmerBadge>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center z-10">
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.14)"
          className="w-full max-w-xl bg-slate-900/80 border-slate-800/90 shadow-2xl p-6 sm:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                SOVEREIGN FEDERATION PORTAL
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                BRICS Intelligence Access
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Choose Sovereign Country / Nation */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                Choose Sovereign Nation Node
              </label>
              <div className="grid grid-cols-5 gap-2">
                {BRICS_COUNTRIES.map((country) => {
                  const isSelected = selectedCountryCode === country.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country.code)}
                      className={`py-3 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/80 shadow-md shadow-amber-500/20 text-white scale-[1.02]'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="text-xs font-bold">{country.name}</span>
                      <span className="text-[9px] font-mono opacity-70">[{country.code}]</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Country Details Card */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.organization}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 text-[10px] border border-amber-700/50">
                  ACTIVE NODE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Coordinator: {selectedCountry.endpoint}
              </div>
            </div>

            {/* 2. Delegate Credentials */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Delegate ID / Official Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={delegateId}
                    onChange={(e) => setDelegateId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Cryptographic Clearance Passphrase
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
            >
              {isLoading ? (
                <span>Validating Sovereign Node Token…</span>
              ) : (
                <>
                  <span>Sign In as {selectedCountry.name} Delegate</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Personas */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Sovereign Delegate Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('IN')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                  🇮🇳 Sumaiya Khan
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">India Coordinator</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('BR')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                  🇧🇷 Dr. Carlos Silva
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">Brazil (SUS Lead)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('RU')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                  🇷🇺 Dr. Elena Rostova
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">Russia (Rospotrebnadzor)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('CN')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                  🇨🇳 Prof. Wei Zhang
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">China (CCDC)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('ZA')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                  🇿🇦 Thabo Mthembu
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">South Africa (NICD)</div>
              </button>
            </div>
          </div>
        </SpotlightCard>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/80 text-center text-xs font-mono text-slate-500 z-10">
        BRICS FEDERATED CONSENSUS NETWORK · DIFFERENTIAL PRIVACY ε=0.50 · SHA-256 HASH CHAIN PROTECTED
      </footer>
    </div>
  );
}
export default LoginPage;
