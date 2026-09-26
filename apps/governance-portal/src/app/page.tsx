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
  CheckCircle2,
  Layers,
  Cpu,
  ChevronRight,
  Server,
  Lock,
  ArrowUpRight,
  Boxes,
  Workflow,
  Radio,
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
    <div
      style={{
        backgroundColor: '#fafafa',
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      className="min-h-screen w-full text-neutral-900 flex flex-col font-sans select-none"
    >
      {/* ── MINIMALIST FLOATING NAVBAR ── */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto w-[94%] my-2">
        <div className="flex items-center justify-between px-5 py-3 rounded-full bg-white/90 border border-neutral-200 backdrop-blur-md shadow-sm">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-neutral-900">
                Smart Health
              </span>
              <span className="text-neutral-400 font-mono text-xs">/</span>
              <span className="text-xs text-neutral-500 font-medium">Resilience Platform</span>
            </div>
          </div>

          {/* Status & Sync Indicator */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-neutral-600">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Core Sync Active</span>
            </div>
            <span className="text-neutral-400">·</span>
            <span>{currentTime || 'SYNCHRONIZING…'}</span>
          </div>

          {/* Action */}
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Sign In</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 flex flex-col items-center text-center flex-1 w-full">
        {/* Minimal pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 text-xs font-medium shadow-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Unified Health Architecture · 3 Integrated Portals</span>
        </div>

        {/* Crisp Headline (No neon gradients, pure typography) */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 max-w-3xl leading-[1.12]">
          Healthcare Supply Chain Resilience
        </h1>

        <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
          High-assurance operations connecting frontline clinical care, multi-tier state & national governance,
          and sovereign BRICS intelligence through real-time telemetry and mathematical optimization.
        </p>

        {/* ── REAL-TIME STATS STRIP (Clean White Bento Cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full mt-10 max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">Clinics Linked</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">3,682</div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Dexie Sync Active
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">FEFO Shipments</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">14,290</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
              In Transit Tracking
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">AI Optimization</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">P90 Guard</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
              MILP PuLP Solver
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">BRICS Nations</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">5 Nodes</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
              DP-SGD ε = 0.50
            </div>
          </div>
        </div>

        {/* ── PORTAL ACCESS DIRECTORY (The 3 Gateways) ── */}
        <section className="w-full mt-14 max-w-5xl text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 mb-6 border-b border-neutral-200 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Access Gateway
              </span>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
                Select Operational Portal
              </h2>
            </div>
            <p className="text-xs text-neutral-500 font-mono">
              Role-based authentication & zero cross-domain telemetry leakage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* ═════════ 1. PRIMARY HEALTH CENTRE ═════════ */}
            <div className="flex flex-col justify-between p-6 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-md transition-all duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                    Clinic Workbench
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                  Primary Health Centre
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-0.5 uppercase tracking-wide">
                  Clinic Operations Workbench
                </p>

                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  Offline-first clinic triage, OPD/IPD beds, and FEFO medication dispensing with local Dexie synchronization.
                </p>

                <div className="mt-5 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>Offline Dexie IndexedDB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>OPD & IPD Bed Allocation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>FEFO Expiry Dispensing</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <a
                  href={process.env.NEXT_PUBLIC_PHC_URL ? `${process.env.NEXT_PUBLIC_PHC_URL}/login` : 'http://localhost:5173/login'}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-between transition-colors shadow-xs"
                >
                  <span>Launch Clinic Portal</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* ═════════ 2. STATE & NATIONAL GOVERNANCE ═════════ */}
            <div className="flex flex-col justify-between p-6 rounded-2xl bg-white border-2 border-neutral-900 shadow-sm hover:shadow-lg transition-all duration-200 group relative">
              <div className="absolute -top-3 left-6">
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Core Portal
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-white font-semibold">
                    Core Portal
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900">
                  State & National Governance
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-0.5 uppercase tracking-wide">
                  Multi-Tier Health Authority
                </p>

                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  Macro supply chain oversight, GIS epidemic surveillance, PuLP MILP automated redistribution, and early warning systems.
                </p>

                <div className="mt-5 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>National, State & District Tiers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>PuLP MILP Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>GIS Deck.gl Heatmaps</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-between transition-colors shadow-xs"
                >
                  <span>Access Governance Portal</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* ═════════ 3. BRICS FEDERATED INTELLIGENCE ═════════ */}
            <div className="flex flex-col justify-between p-6 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-md transition-all duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                    Federated AI
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                  BRICS Federated AI
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-0.5 uppercase tracking-wide">
                  Cross-Border Sovereign Mesh
                </p>

                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  Privacy-preserving epidemiological surveillance across 5 sovereign nations with FedAvg consensus and DP-SGD guarantees.
                </p>

                <div className="mt-5 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>5 Sovereign Nodes (IN, BR, RU, CN, ZA)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>Differential Privacy (DP-SGD ε = 0.50)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>FedAvg Weight Aggregation</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <a
                  href={process.env.NEXT_PUBLIC_BRICS_URL ? `${process.env.NEXT_PUBLIC_BRICS_URL}/login` : 'http://localhost:3001/login'}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-between transition-colors shadow-xs"
                >
                  <span>Enter BRICS Federation</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="border-t border-neutral-200 bg-white/60 py-6 px-6 text-xs font-mono text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-neutral-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mesh Operational
            </span>
            <span>·</span>
            <span>AES-256-GCM</span>
            <span>·</span>
            <span>JWT RLS</span>
          </div>
          <div>Smart Health Platform v2.4 · National Health Infrastructure</div>
        </div>
      </footer>
    </div>
  );
}
