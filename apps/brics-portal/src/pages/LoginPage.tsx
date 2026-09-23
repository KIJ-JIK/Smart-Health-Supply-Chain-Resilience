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
    }, 250);
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
          <span>NODE 3001 · BRICS FEDERATED AI MESH</span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white border border-neutral-200/90 rounded-2xl p-7 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                SOVEREIGN FEDERATION NETWORK
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                BRICS Intelligence Access
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Sovereign Nation Selector (Clean white cards) */}
            <div>
              <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1.5 font-semibold">
                Sovereign Nation Node
              </label>
              <div className="grid grid-cols-5 gap-2">
                {BRICS_COUNTRIES.map((country) => {
                  const isSelected = selectedCountryCode === country.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country.code)}
                      className={`py-2.5 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-xs font-bold">{country.name}</span>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        [{country.code}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Country Details Card */}
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
              <div className="flex items-center justify-between font-mono text-[11px] mb-0.5">
                <span className="font-semibold flex items-center gap-1.5 text-neutral-900">
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.organization}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-200/80 text-neutral-800 text-[10px] font-medium">
                  SOVEREIGN NODE
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono truncate">
                Endpoint: {selectedCountry.endpoint}
              </div>
            </div>

            {/* 2. Delegate Credentials */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Delegate ID / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={delegateId}
                    onChange={(e) => setDelegateId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Cryptographic Clearance Passphrase
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              <span>1-Click Sovereign Delegate Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('IN')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  🇮🇳 Sumaiya Khan
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">India Coordinator</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('BR')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  🇧🇷 Dr. Carlos Silva
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">Brazil (SUS)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('RU')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  🇷🇺 Dr. Elena Rostova
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">Russia Node</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('CN')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  🇨🇳 Prof. Wei Zhang
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">China (CCDC)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('ZA')}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  🇿🇦 Thabo Mthembu
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">South Africa</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-neutral-200 text-center text-xs font-mono text-neutral-500 bg-white/60">
        BRICS FEDERATED CONSENSUS NETWORK · DIFFERENTIAL PRIVACY ε=0.50 · SHA-256 HASH CHAIN PROTECTED
      </footer>
    </div>
  );
}
export default LoginPage;
