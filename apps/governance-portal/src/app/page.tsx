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
import { AuraLogo } from '@/components/brand/AuraLogo';

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

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      className="min-h-screen w-full text-neutral-900 flex flex-col font-sans select-none relative overflow-hidden"
    >
      {/* ── AMBIENT MESH GRADIENT GLOWS (Haikei/Neuform Inspired) ── */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none animate-mesh-slow" />
      <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] rounded-full bg-blue-300/20 blur-3xl pointer-events-none animate-mesh-slow" style={{ animationDelay: '-6s' }} />
      <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-300/15 blur-3xl pointer-events-none animate-mesh-slow" style={{ animationDelay: '-12s' }} />

      {/* ── MINIMALIST FLOATING NAVBAR ── */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto w-[94%] my-2">
        <div className="flex items-center justify-between px-5 py-3 rounded-full bg-white/90 border border-neutral-200/90 backdrop-blur-md shadow-sm hover:border-neutral-300 transition-all">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <AuraLogo size={32} />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-neutral-900">
                AURA
              </span>
              <span className="text-neutral-400 font-mono text-xs">/</span>
              <span className="text-xs text-neutral-600 font-semibold tracking-tight">Health Platform</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-mono text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentTime || 'LIVE SYNC'}
            </span>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Sign In</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 flex flex-col items-center text-center flex-1 w-full relative z-10">
        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 max-w-3xl leading-[1.12]">
          Autonomous Universal Resilience Architecture
        </h1>

        <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
          High-assurance operations connecting frontline clinical care (<span className="font-semibold text-neutral-800">AURA Point</span>), 
          multi-tier state &amp; national governance (<span className="font-semibold text-neutral-800">AURA Vantage</span>),
          and sovereign multilateral intelligence (<span className="font-semibold text-neutral-800">AURA Sovereign</span>).
        </p>

        {/* ── REAL-TIME STATS STRIP (Clean White Bento Cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full mt-10 max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-neutral-200/90 shadow-xs hover:border-neutral-300 hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">Clinics Linked</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono">3,682</div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Dexie Sync Active
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-neutral-200/90 shadow-xs hover:border-neutral-300 hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">FEFO Shipments</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono">14,290</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
              In Transit Tracking
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-neutral-200/90 shadow-xs hover:border-neutral-300 hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">AI Optimization</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono">P90 Guard</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
              MILP PuLP Solver
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-neutral-200/90 shadow-xs hover:border-neutral-300 hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <div className="text-xs font-mono text-neutral-500 uppercase">BRICS Nations</div>
            <div className="text-2xl font-bold text-neutral-900 mt-1 font-mono">5 Nodes</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
              DP-SGD ε = 0.50
            </div>
          </div>
        </div>

        {/* ── PORTAL ACCESS DIRECTORY (The 3 Gateways with ReactBits/SuperDesign Spotlight) ── */}
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
            <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Unified SSO · Zero cross-domain telemetry leakage</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* ═════════ 1. AURA POINT (PHC CLINIC) ═════════ */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ '--spotlight-color': 'rgba(16, 185, 129, 0.12)' } as React.CSSProperties}
              className="spotlight-card flex flex-col justify-between p-6 rounded-2xl bg-white/95 border border-neutral-200 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    AURA Point
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  AURA Point
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-0.5 uppercase tracking-wide">
                  Primary Health Centre &amp; Clinic Workbench
                </p>

                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  Frontline clinic triage, OPD/IPD beds, Google AI Vision Rx scanner, and FEFO medication dispensing with local Dexie synchronization.
                </p>

                <div className="mt-5 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Offline Dexie IndexedDB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Multimodal AI Vision Scanner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>FEFO Expiry Dispensing</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <a
                  href={process.env.NEXT_PUBLIC_PHC_URL ? `${process.env.NEXT_PUBLIC_PHC_URL}/login` : 'http://localhost:5173/login'}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-between transition-all shadow-xs active:scale-[0.98]"
                >
                  <span>Launch AURA Point</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* ═════════ 2. AURA VANTAGE (GOVERNANCE COMMAND) ═════════ */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ '--spotlight-color': 'rgba(14, 159, 110, 0.12)' } as React.CSSProperties}
              className="spotlight-card flex flex-col justify-between p-6 rounded-2xl bg-white/95 border-2 border-neutral-900 shadow-sm hover:shadow-xl transition-all duration-300 group relative cursor-pointer"
            >
              <div className="absolute -top-3 left-6">
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                  AURA Vantage
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-900 text-white font-semibold">
                    Command Core
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900">
                  AURA Vantage
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-0.5 uppercase tracking-wide">
                  State &amp; National Governance Command
                </p>

                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  Macro supply chain oversight, nationwide 36-state GIS epidemic surveillance, PuLP MILP automated redistribution, and Copilot AI.
                </p>

                <div className="mt-5 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>36 States &amp; UTs Unified GIS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>PuLP MILP Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                    <span>Jurisdiction Management</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-between transition-all shadow-xs active:scale-[0.98]"
                >
                  <span>Launch AURA Vantage</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* ═════════ 3. AURA SOVEREIGN (BRICS FEDERATED AI) ═════════ */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ '--spotlight-color': 'rgba(59, 130, 246, 0.12)' } as React.CSSProperties}
              className="spotlight-card flex flex-col justify-between p-6 rounded-2xl bg-white/95 border border-neutral-200 hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    AURA Sovereign
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-700 transition-colors">
                  AURA Sovereign
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-0.5 uppercase tracking-wide">
                  BRICS Federated AI &amp; Cryptographic Ledger
                </p>

                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  Privacy-preserving epidemiological forecasting across 5 sovereign nations with FedAvg consensus and Differential Privacy (DP-SGD).
                </p>

                <div className="mt-5 space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>5 Sovereign Nodes (IN, BR, RU, CN, ZA)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Differential Privacy (ε ≤ 5.0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Multilingual AI Intelligence</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <a
                  href={process.env.NEXT_PUBLIC_BRICS_URL ? `${process.env.NEXT_PUBLIC_BRICS_URL}/login` : 'http://localhost:3001/login'}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-between transition-all shadow-xs active:scale-[0.98]"
                >
                  <span>Launch AURA Sovereign</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="border-t border-neutral-200/80 bg-white/60 py-6 px-6 text-xs text-neutral-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-neutral-700">
            <AuraLogo size={18} />
            <span>AURA Health Platform</span>
          </div>
          <div>Autonomous Universal Resilience Architecture</div>
        </div>
      </footer>
    </div>
  );
}
