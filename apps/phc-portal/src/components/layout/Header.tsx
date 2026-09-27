import React, { useState } from 'react';
import {
  Wifi, WifiOff, RefreshCw, AlertTriangle, Zap, Moon, Sun, UserCircle2, HeartPulse,
  Layers, ChevronDown, LogOut, Building2, Globe2,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { usePhcAuthStore } from '../../stores/authStore';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSyncEngine } from '../../hooks/useSyncEngine';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useThemeStore } from '../../stores/themeStore';
import { AuraLogo } from '../brand/AuraLogo';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const Header: React.FC = () => {
  const { isOnline, simulatedOffline, toggleSimulation } = useNetworkStatus();
  const { pendingCount, conflictCount } = useMutationQueue();
  const { isSyncing, triggerSync } = useSyncEngine(isOnline);
  const { setActiveTab, setEmergencyModalOpen } = useUIStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { currentStaff, selectedFacility, logout, isAuthenticated } = usePhcAuthStore();
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const facility = useLiveQuery(() => db.phc_facilities.toCollection().first());

  const activeFacName = facility?.name || selectedFacility?.name || 'Primary Health Centre';
  const activeDistrict = facility?.district_name || selectedFacility?.district || 'District';
  const activeState = facility?.state_name || selectedFacility?.state || 'State';
  const activeId = facility?.id || selectedFacility?.id || 'PHC-ACTIVE';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#1e2d3d]/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
      {/* Subtle teal gradient top line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Facility Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <AuraLogo size={36} />
          <div className="hidden sm:block min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider font-mono">AURA Point ·</span>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none truncate">
                {activeFacName}
              </h1>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {greeting()} · {activeDistrict}, {activeState} · <span className="font-mono text-[10px]">{activeId}</span>
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Conflict badge */}
          {conflictCount > 0 && (
            <button
              onClick={() => setActiveTab('sync')}
              aria-label={`${conflictCount} conflict${conflictCount > 1 ? 's' : ''} — click to resolve`}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{conflictCount}!</span>
            </button>
          )}

          {/* Network toggle */}
          <button
            onClick={toggleSimulation}
            aria-label={isOnline ? 'Online (click to simulate offline)' : 'Offline (click to restore)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 ring-1 ring-rose-300 dark:ring-rose-800'
            }`}
          >
            {isOnline
              ? <><Wifi    className="w-3.5 h-3.5" /><span className="hidden sm:inline">Online</span></>
              : <><WifiOff className="w-3.5 h-3.5" /><span className="font-bold">Offline{simulatedOffline ? ' (Sim)' : ''}</span></>}
          </button>

          {/* Sync */}
          <button
            onClick={triggerSync}
            disabled={!isOnline || isSyncing}
            aria-label="Sync pending changes"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              pendingCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1e2d3d] hover:bg-slate-100 dark:hover:bg-[#1e2d3d]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary-500' : ''}`} />
            <span className="hidden md:inline">
              {isSyncing ? 'Syncing…' : pendingCount > 0 ? `${pendingCount} Pending` : 'Synced'}
            </span>
            {pendingCount > 0 && (
              <span className="md:hidden text-[10px] font-black px-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-300 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d3d] border border-slate-200 dark:border-[#1e2d3d] transition-all hover:scale-110"
          >
            {isDark
              ? <Sun  className="w-3.5 h-3.5 text-amber-400" />
              : <Moon className="w-3.5 h-3.5" />}
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
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3.5 z-50 text-xs text-left">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    DR
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentStaff?.name || 'Dr. Anjali Sharma'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentStaff?.roleLabel || 'Primary Medical Officer (MO)'}
                    </div>
                  </div>
                </div>
                <div className="pt-2.5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Facility:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{activeFacName}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Jurisdiction:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{activeDistrict}, {activeState}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Session:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Duty · Dexie L2
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
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 text-xs text-left">
                <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1.5">
                  Platform Portals Switcher
                </div>
                <div className="space-y-1">
                  <a
                    href={(import.meta as any).env?.VITE_GOVERNANCE_URL ?? 'http://localhost:3000/'}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">AURA Hub</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Platform Gateway & Overview</div>
                    </div>
                  </a>

                  <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                    <HeartPulse className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold flex items-center justify-between">
                        <span>AURA Point</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-200/70 dark:bg-teal-800/80 font-mono text-teal-900 dark:text-teal-100 font-bold">Active</span>
                      </div>
                      <div className="text-[10px] text-teal-700 dark:text-teal-400/80">Frontline Clinic Workbench</div>
                    </div>
                  </div>

                  <a
                    href="http://localhost:3000/governance"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">AURA Vantage</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Governance Command Center</div>
                    </div>
                  </a>

                  <a
                    href="http://localhost:3001"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Globe2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">AURA Sovereign</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">BRICS Federated AI Grid</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button (Pic 2 Standard: Red Icon with Rounded Border) */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm"
            title="Sign Out (End Clinic Session)"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* EMERGENCY — pulse ring */}
          <button
            onClick={() => setEmergencyModalOpen(true)}
            aria-label="Open emergency incident report"
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_0_16px_rgba(225,29,72,0.5)] hover:shadow-[0_0_20px_rgba(225,29,72,0.7)] active:scale-95 transition-all animate-pulse-ring"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="tracking-wide">EMERGENCY</span>
          </button>
        </div>
      </div>
    </header>
  );
};
