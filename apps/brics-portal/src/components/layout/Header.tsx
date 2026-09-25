// ---------------------------------------------------------------------------
// Top header bar for the BRICS Federated Intelligence & Governance Command Portal.
// Aligned with PHC Portal & Governance Institutional Standard (Navy #0a1628 / #0f1f38 / #0b1e36).
// ---------------------------------------------------------------------------

import React from 'react';
import {
  Globe2,
  ShieldCheck,
  Activity,
  ExternalLink,
  Lock,
  Cpu,
  Building2,
  Radio,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks';

export function Header() {
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0f1f38] border-b border-slate-200 dark:border-[#1e3a5f] shadow-sm shrink-0">
      {/* Top Institutional Tricolor & Alliance Department Strip */}
      <div className="bg-[#0b1e36] text-white px-4 lg:px-6 py-1.5 flex items-center justify-between text-[11px] font-medium border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          {/* Emblem representation */}
          <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[9px] font-bold text-amber-300">
            🌐
          </div>
          <span className="font-semibold tracking-wide text-slate-200">
            BRICS Health Alliance · Joint Epidemiological Intelligence Council
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            Cross-Border Federated AI Network · Differential Privacy &amp; Data Residency
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paillier SMPC Certified · Zero Raw Data Egress</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ID: COORD-BRICS-HQ-01
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Organization Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-md bg-[#0b1e36] dark:bg-blue-900 text-white flex items-center justify-center border border-slate-300 dark:border-blue-700">
            <Globe2 className="w-5 h-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                BRICS Federated AI Governance Command Center
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                5/5 ENCLAVES ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Sovereign Nodes: 🇮🇳 India (Varanasi) · 🇧🇷 Brazil (São Paulo) · 🇷🇺 Russia (Moscow) · 🇨🇳 China (Shanghai) · 🇿🇦 South Africa (Cape Town)
            </p>
          </div>
        </div>

        {/* Right: Telemetry Badges & Cross-Portal Navigation */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Privacy Protocol Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] text-xs font-mono">
            <span className="text-teal-600 dark:text-teal-300 flex items-center gap-1 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>DP-SGD (ε=1.42 / 5.0)</span>
            </span>
          </div>

          {/* Cross-Portal Switchers */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800 transition-colors"
              title="Open District & State Governance Portal"
            >
              <span>Gov Portal (3000)</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 dark:text-teal-300 dark:border-teal-800 transition-colors"
              title="Open PHC Field Edge Application"
            >
              <span>PHC Portal (5173)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* User Identity Chip */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-[#1e3a5f]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user.name}</p>
              <span className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-semibold">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-[#152b4d] border border-slate-300 dark:border-[#1e3a5f] flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
