// ---------------------------------------------------------------------------
// Top header bar for the BRICS Federated Intelligence & Governance Command Portal.
// Aligned with PHC Portal & Governance Institutional Standard (Navy #0a1628 / #0f1f38 / #0b1e36).
// Standardized Pic 2 Universal Controls: User Avatar (DR), Portals Switcher, Theme Toggle, Red Exit.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe2,
  ShieldCheck,
  Activity,
  ExternalLink,
  Lock,
  Building2,
  Sparkles,
  Layers,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  HeartPulse,
} from 'lucide-react';
import { useCurrentUser, useMemberPrivacyBudget } from '@/hooks';
import { useBricsAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/themeStore';
import { BricsAiBriefingModal } from '../intelligence/BricsAiBriefingModal';
import { AuraLogo } from '../brand/AuraLogo';

export function Header() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const logout = useBricsAuthStore((state) => state.logout);
  const { isDark, toggleTheme } = useThemeStore();
  const { cumulativeEpsilon, budgetLimit } = useMemberPrivacyBudget('ZA');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0b1424] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-colors">
      {/* Compact institutional identity strip */}
      <div className="bg-slate-50 dark:bg-[#070d18] border-b border-slate-100 dark:border-slate-800/80 px-4 lg:px-6 py-1 flex items-center justify-between text-[11px] font-medium transition-colors">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            AURA Sovereign · BRICS Federated Intelligence Council
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400 dark:text-slate-500">
            Differential Privacy & Data Residency
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Enclaves Online</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Organization Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <AuraLogo size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                AURA Sovereign — BRICS Federated AI Grid
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                5/5 ENCLAVES ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Sovereign Nodes: 🇮🇳 India · 🇧🇷 Brazil · 🇷🇺 Russia · 🇨🇳 China · 🇿🇦 South Africa
            </p>
          </div>
        </div>

        {/* Right: Telemetry Badges & Universal Controls (Pic 2 Standard) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Privacy Protocol Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>DP-SGD (ε={cumulativeEpsilon.toFixed(2)} / {budgetLimit.toFixed(1)})</span>
            </span>
          </div>

          {/* AI Briefing Button */}
          <button
            type="button"
            onClick={() => setIsBriefingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Briefing</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Slate Mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* User Avatar Circle with Hover/Click Expansion (Pic 2 Standard) */}
          <div
            className="relative"
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-label="User profile and session details"
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-500/20 shadow-sm transition-all focus:outline-none"
            >
              DR
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3.5 z-50 text-xs text-left animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    DR
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.role.replace('_', ' ').toUpperCase()} · Sovereign Delegate
                    </div>
                  </div>
                </div>
                <div className="pt-2.5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Node:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">🇮🇳 India Sovereign Enclave</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Consortium:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">BRICS Health Alliance</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Privacy Budget:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ε={cumulativeEpsilon.toFixed(2)} / {budgetLimit.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Session:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Enclave Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Global Platform Switcher with Hover/Click Expansion (Pic 2 Standard) */}
          <div
            className="relative"
            onMouseEnter={() => setPortalMenuOpen(true)}
            onMouseLeave={() => setPortalMenuOpen(false)}
          >
            <button
              onClick={() => setPortalMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
              title="Switch Platform Portals"
            >
              <Layers className="w-4 h-4 text-cyan-500" />
              <span className="hidden sm:inline">Portals</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {portalMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 text-xs text-left animate-in fade-in duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1.5">
                  Platform Portals Switcher
                </div>
                <div className="space-y-1">
                  <a
                    href="http://localhost:3000/"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                  >
                    <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>AURA Hub</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-cyan-500 transition-colors">Gateway →</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Platform Gateway & Overview</div>
                    </div>
                  </a>

                  <a
                    href="http://localhost:5173/login"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                  >
                    <HeartPulse className="w-4 h-4 text-teal-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>AURA Point</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Login Tab →</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Frontline Clinic Workbench</div>
                    </div>
                  </a>

                  <a
                    href="http://localhost:3000/login"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                  >
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>AURA Vantage</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Login Tab →</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Governance Command Center</div>
                    </div>
                  </a>

                  <a
                    href="/login"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    <Globe2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center justify-between">
                        <span>AURA Sovereign</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-800/80 font-mono text-amber-900 dark:text-amber-100 font-bold">Active · Login Tab →</span>
                      </div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400/80">BRICS Federated AI Grid</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button (Pic 2 Standard: Red Icon with Rounded Border) */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm"
            title="Sign Out (Terminate Enclave Session)"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      <BricsAiBriefingModal isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
    </header>
  );
}

export default Header;
