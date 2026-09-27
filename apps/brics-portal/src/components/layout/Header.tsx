// ---------------------------------------------------------------------------
// Top header bar for the BRICS Federated Intelligence & Governance Command Portal.
// Aligned with PHC Portal & Governance Institutional Standard (Navy #0a1628 / #0f1f38 / #0b1e36).
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  Globe2,
  ShieldCheck,
  Activity,
  ExternalLink,
  Lock,
  Cpu,
  Building2,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useCurrentUser, useMemberPrivacyBudget } from '@/hooks';
import { BricsAiBriefingModal } from '../intelligence/BricsAiBriefingModal';
import { AuraLogo } from '../brand/AuraLogo';

export function Header() {
  const user = useCurrentUser();
  const { cumulativeEpsilon, budgetLimit } = useMemberPrivacyBudget('ZA');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm shrink-0">
      {/* Compact institutional identity strip */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 lg:px-6 py-1 flex items-center justify-between text-[11px] font-medium">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="font-semibold text-slate-700">
            AURA Sovereign · BRICS Federated Intelligence Council
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-400">
            Differential Privacy & Data Residency
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
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
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                AURA Sovereign — BRICS Federated AI Grid
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                5/5 ENCLAVES ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Sovereign Nodes: 🇮🇳 India · 🇧🇷 Brazil · 🇷🇺 Russia · 🇨🇳 China · 🇿🇦 South Africa
            </p>
          </div>
        </div>

        {/* Right: Telemetry Badges & Cross-Portal Navigation */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Privacy Protocol Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono">
            <span className="text-slate-600 flex items-center gap-1 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>DP-SGD (ε={cumulativeEpsilon.toFixed(2)} / {budgetLimit.toFixed(1)})</span>
            </span>
          </div>

          {/* Cross-Portal Switchers */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={(import.meta as any).env?.VITE_GOVERNANCE_URL ?? 'http://localhost:3000'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="Open AURA Vantage Governance Command"
            >
              <span>Vantage</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={(import.meta as any).env?.VITE_PHC_URL ?? 'http://localhost:5173'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="Open AURA Point Clinic Workbench"
            >
              <span>Point</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* AI Briefing Button — neutral, not gradient */}
          <button
            type="button"
            onClick={() => setIsBriefingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Briefing</span>
          </button>

          {/* User Identity Chip */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
      <BricsAiBriefingModal isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
    </header>
  );
}

export default Header;
