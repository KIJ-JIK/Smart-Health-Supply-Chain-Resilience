// ---------------------------------------------------------------------------
// Top header bar for the BRICS Federated Intelligence & Governance Command Portal.
// Aligned with team design system (Dark slate, neon telemetry, cross-portal switchers).
// ---------------------------------------------------------------------------

import React from 'react';
import {
  Globe2,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks';

export function Header() {
  const user = useCurrentUser();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1523]/90 backdrop-blur-md px-6 sticky top-0 z-30 flex items-center justify-between shrink-0">
      {/* Left: Branding & Scope */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-1 ring-white/10">
          <Globe2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2">
              BRICS Federated AI Governance
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Sovereign FedAvg Network
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Cross-Border Epidemiological Intelligence &amp; Differential Privacy Oversight
          </p>
        </div>
      </div>

      {/* Right: Telemetry Badges, Cross-Portal Switchers & Current User */}
      <div className="flex items-center gap-3">
        {/* Live Privacy & Security Protocol Badges */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">DP-SGD (ε=1.42)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">5/5 Nodes Synced</span>
          </div>
        </div>

        {/* Cross-Portal Switchers */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
            title="Open District & State Governance Portal"
          >
            <span>Gov Portal (3000)</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all active:scale-95"
            title="Open PHC Field Edge Application"
          >
            <span>PHC Portal (5173)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* User Identity Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200 leading-none">{user.name}</p>
            <span className="text-[10px] font-mono uppercase text-teal-400 font-medium">
              {user.role.replace('_', ' ')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
