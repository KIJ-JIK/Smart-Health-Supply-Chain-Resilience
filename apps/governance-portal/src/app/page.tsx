'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe2,
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  Layers,
  Cpu,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function PlatformHomePage() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans select-none">
      {/* ── LEFT PANE: High-Tech Command Visual & Live Telemetry (65% width) ── */}
      <div className="relative flex-1 lg:w-[64%] min-h-[420px] lg:min-h-screen bg-[#060913] flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Background Grid & Ambient Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top telemetry bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 p-0.5 shadow-[0_0_20px_rgba(59,130,246,0.35)]">
              <div className="w-full h-full bg-[#090e1f] rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                PLATFORM MESH ONLINE
              </span>
              <h2 className="text-xs text-slate-400 font-medium">
                National Health & Supply Chain Resilience Infrastructure
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CORE SYNC ENGINE: 8000</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-400 font-semibold">
              {currentTime || 'SYNCHRONIZING…'}
            </div>
          </div>
        </div>

        {/* Middle hero artwork / command complex representation */}
        <div className="relative z-10 my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            Unified Health Command Architecture · 3 Integrated Portals
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-2xl leading-[1.15]">
            Smart Health <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Supply Chain Resilience
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            A high-assurance, fault-tolerant healthcare operations ecosystem connecting frontline Primary
            Health Centres, state/national administrative governance, and cross-border sovereign BRICS
            intelligence through real-time telemetry and mathematical optimization.
          </p>

          {/* Real-time Status Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 max-w-2xl">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Clinics Linked</div>
              <div className="text-xl font-bold text-white mt-1">3,682</div>
              <div className="text-[10px] text-teal-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Dexie Sync Active
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-[11px] font-mono text-slate-400 uppercase">FEFO Shipments</div>
              <div className="text-xl font-bold text-white mt-1">14,290</div>
              <div className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Tracked in Transit
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-[11px] font-mono text-slate-400 uppercase">AI Optimization</div>
              <div className="text-xl font-bold text-white mt-1">P90 Guard</div>
              <div className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> MILP PuLP Solver
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-[11px] font-mono text-slate-400 uppercase">BRICS Nations</div>
              <div className="text-xl font-bold text-white mt-1">5 Nodes</div>
              <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> DP-SGD ε = 0.50
              </div>
            </div>
          </div>
        </div>

        {/* Bottom architecture link */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-slate-800/60">
          <span>ENCRYPTION: AES-256-GCM · JWT RLS</span>
          <span className="flex items-center gap-1.5 text-cyan-400/80">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE TELEMETRY MESH
          </span>
        </div>
      </div>

      {/* ── RIGHT PANE: Portals Selector Panel (36% width - matches user reference) ── */}
      <div className="w-full lg:w-[36%] min-h-screen bg-[#0a0f1e] flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        {/* Header Branding */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              <span className="w-2 h-2 rounded bg-cyan-500" />
              GATEWAY AUTHENTICATION
            </div>
            <span className="text-[11px] font-mono text-slate-500">PORTAL SELECTION</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mt-3 tracking-tight">
            Select Access Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            Choose your authorized operational sphere. You will be routed to the respective credential verification terminal.
          </p>
        </div>

        {/* The 3 Stacked Portal Cards (Layout matched to user screenshot) */}
        <div className="my-8 flex flex-col gap-4">
          {/* ── PORTAL 1: Primary Health Centre (PHC) ── */}
          <a
            href="http://localhost:5173/login"
            className="group relative p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-teal-500/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(13,148,136,0.2)] flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-teal-500/20 transition-transform">
                <HeartPulse className="w-6 h-6 text-teal-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                    Primary Health Centre
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Login</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Offline-first clinic triage, OPD/IPD beds & FEFO dispensing
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/60 text-teal-400 border border-teal-800/60">
                    PORT 5173
                  </span>
                  <span className="text-[10px] text-slate-500">Local Facility Node</span>
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800/80 group-hover:bg-teal-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </a>

          {/* ── PORTAL 2: State & National Governance ── */}
          <Link
            href="/login"
            className="group relative p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-blue-500/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500/20 transition-transform">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    State & National Governance
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Login</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Macro supply chain, GIS surveillance, MILP redistribution & early warnings
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
                    PORT 3000
                  </span>
                  <span className="text-[10px] text-slate-500">Multi-Tier Hierarchy</span>
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800/80 group-hover:bg-blue-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* ── PORTAL 3: BRICS Federated Intelligence ── */}
          <a
            href="http://localhost:3001/login"
            className="group relative p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-amber-500/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/20 transition-transform">
                <Globe2 className="w-6 h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    BRICS Federated Intelligence
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Login</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Cross-border surveillance, differential privacy & FedAvg consensus
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                    PORT 3001
                  </span>
                  <span className="text-[10px] text-slate-500">5 Sovereign Nodes</span>
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800/80 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </a>
        </div>

        {/* Footer (matches user screenshot footer note) */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
          <span>| FEDERATED MESH ACTIVE · SECURITY CLEARANCE LEVEL 4</span>
          <span className="text-slate-600">SMART_HEALTH_v2.4</span>
        </div>
      </div>
    </div>
  );
}
