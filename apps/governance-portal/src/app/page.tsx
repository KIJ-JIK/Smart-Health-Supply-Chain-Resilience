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
  ChevronRight,
  Sparkles,
  Server,
  Database,
  Lock,
  Compass,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { InteractiveGridMesh } from '@/components/ui/InteractiveGridMesh';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';

export default function PlatformHomePage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'phc' | 'governance' | 'brics'>('all');

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
      style={{ backgroundColor: '#05070e', color: '#f1f5f9' }}
      className="min-h-screen w-full bg-[#05070e] text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden"
    >
      {/* ── BACKGROUND: Interactive 60fps Canvas Mesh & Subtle Vignette ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <InteractiveGridMesh
          className="w-full h-full pointer-events-auto opacity-60"
          nodeCount={65}
          connectionDistance={145}
          dotColor="rgba(56, 189, 248, 0.22)"
          lineColor="rgba(99, 102, 241, 0.08)"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(14,165,233,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070e]/40 via-transparent to-[#05070e]" />
      </div>

      {/* ── FLOATING GLASS CAPSULE NAVBAR ── */}
      <header className="sticky top-4 z-40 max-w-7xl mx-auto w-[94%] my-2">
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-[#090d1a]/85 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
          {/* Brand Logo & Platform Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#080d19] rounded-[11px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  SMART HEALTH NETWORK
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Supply Chain Resilience & Multi-Tier Governance Architecture
              </p>
            </div>
          </div>

          {/* Center Telemetry Pills */}
          <div className="hidden md:flex items-center gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-300">
              <Server className="w-3 h-3 text-cyan-400" />
              <span>CORE SYNC: 8000</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>RLS VERIFIED</span>
            </div>
          </div>

          {/* Right Action / Clock */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium hidden sm:block">
              {currentTime || 'SYNCHRONIZING…'}
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <span>Sign In</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 pt-10 pb-8 px-4 sm:px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Shimmer Announcement Pill */}
        <ShimmerBadge
          icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
          className="mb-5 border-cyan-500/30 bg-cyan-950/30 text-cyan-300 font-mono text-[11px] tracking-wide shadow-lg shadow-cyan-500/10"
        >
          UNIFIED HEALTH COMMAND SYSTEM · 3 COMPLEMENTARY SPHERES
        </ShimmerBadge>

        {/* Dynamic Title with Decrypted Text */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12]">
          Smart Health <br />
          <DecryptedText
            text="Supply Chain Resilience"
            className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent font-extrabold"
            speed={25}
            maxIterations={14}
          />
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-300/90 max-w-2xl leading-relaxed">
          High-assurance operations connecting frontline clinical care, national governance,
          and sovereign BRICS intelligence through mathematical optimization and real-time telemetry.
        </p>

        {/* Live Operational Metrics Bento Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full mt-10">
          <SpotlightCard
            spotlightColor="rgba(20, 184, 166, 0.14)"
            className="p-4 bg-slate-900/50 border-slate-800/80 hover:border-teal-500/40 text-left"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>FACILITY NODES</span>
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">3,682</div>
            <div className="text-[10px] text-teal-400 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Offline-First Active
            </div>
          </SpotlightCard>

          <SpotlightCard
            spotlightColor="rgba(59, 130, 246, 0.14)"
            className="p-4 bg-slate-900/50 border-slate-800/80 hover:border-blue-500/40 text-left"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>FEFO IN TRANSIT</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">14,290</div>
            <div className="text-[10px] text-blue-400 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Real-Time Telemetry
            </div>
          </SpotlightCard>

          <SpotlightCard
            spotlightColor="rgba(99, 102, 241, 0.14)"
            className="p-4 bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/40 text-left"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>AI OPTIMIZER</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">P90 Guard</div>
            <div className="text-[10px] text-indigo-400 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> MILP PuLP Active
            </div>
          </SpotlightCard>

          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.14)"
            className="p-4 bg-slate-900/50 border-slate-800/80 hover:border-amber-500/40 text-left"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>BRICS NODES</span>
              <Globe2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">5 Nations</div>
            <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> DP-SGD ε = 0.50
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ── 3-PORTAL COMMAND BENTO SHOWCASE (Dynamic Interactive Gateways) ── */}
      <section className="relative z-10 py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              INTEGRATED GATEWAYS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Choose Authorized Operational Sphere
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono max-w-sm">
            Each portal routes to its dedicated cryptographic authentication node with zero telemetry leakage.
          </p>
        </div>

        {/* The 3 Major Interactive Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* ═════════ 1. PRIMARY HEALTH CENTRE (PHC PORTAL) ═════════ */}
          <SpotlightCard
            spotlightColor="rgba(20, 184, 166, 0.18)"
            className="group flex flex-col justify-between p-6 sm:p-7 bg-[#0b101c]/90 border-slate-800 hover:border-teal-500/50 transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)] rounded-3xl"
          >
            <div>
              {/* Header Badge & Port */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md group-hover:scale-110 group-hover:bg-teal-500/20 transition-all">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-teal-950/70 text-teal-300 border border-teal-800/60 font-semibold">
                  NODE 5173
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                Primary Health Centre
              </h3>
              <p className="text-xs font-mono text-teal-400/90 mt-1 uppercase tracking-wider">
                Frontline Facility Workbench
              </p>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Offline-first clinical triage for Medical Officers, bed management for Ward Nurses,
                and FEFO barcode-validated pharmaceutical dispensing with automatic Dexie synchronization.
              </p>

              {/* Feature Micro-Badges */}
              <div className="mt-5 space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Offline Dexie.js IndexedDB</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>OPD & IPD Bed Allocation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>FEFO Expiry Batch Tracing</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-7 pt-4 border-t border-slate-800/60">
              <a
                href="http://localhost:5173/login"
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 group-hover:shadow-teal-500/30 transition-all hover:scale-[1.02]"
              >
                <span>Launch Clinic Portal</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </SpotlightCard>

          {/* ═════════ 2. STATE & NATIONAL GOVERNANCE (FEATURED CENTER CARD) ═════════ */}
          <SpotlightCard
            spotlightColor="rgba(59, 130, 246, 0.22)"
            className="group flex flex-col justify-between p-6 sm:p-7 bg-[#0d1428]/95 border-blue-500/40 hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_45px_rgba(59,130,246,0.25)] rounded-3xl relative overflow-hidden"
          >
            {/* Top Recommended / Core Indicator */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

            <div>
              {/* Header Badge & Port */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold">
                    PRIMARY HUB
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold">
                    NODE 3000
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                State & National Governance
              </h3>
              <p className="text-xs font-mono text-blue-400/90 mt-1 uppercase tracking-wider">
                Multi-Tier Health Authority
              </p>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Comprehensive supply chain oversight with interactive GIS surveillance, MILP-driven
                automated stockout prevention, early warning alarms, and hierarchical approval workflows.
              </p>

              {/* Feature Micro-Badges */}
              <div className="mt-5 space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>National, State & District Scopes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>PuLP MILP Redistribution Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>GIS Heatmaps & Deck.gl Geospatial</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-7 pt-4 border-t border-slate-800/60">
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 group-hover:shadow-blue-500/40 transition-all hover:scale-[1.02]"
              >
                <span>Access Governance Portal</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </SpotlightCard>

          {/* ═════════ 3. BRICS FEDERATED INTELLIGENCE ═════════ */}
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.18)"
            className="group flex flex-col justify-between p-6 sm:p-7 bg-[#0b101c]/90 border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(245,158,11,0.15)] rounded-3xl"
          >
            <div>
              {/* Header Badge & Port */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                  <Globe2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold">
                  NODE 3001
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                BRICS Federated AI
              </h3>
              <p className="text-xs font-mono text-amber-400/90 mt-1 uppercase tracking-wider">
                Cross-Border Sovereign Mesh
              </p>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Privacy-preserving epidemiological surveillance across 5 sovereign member nations
                (IN, BR, RU, CN, ZA) with FedAvg consensus and Differential Privacy noise guarantees.
              </p>

              {/* Feature Micro-Badges */}
              <div className="mt-5 space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>5 Sovereign Nodes (IN, BR, RU, CN, ZA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Differential Privacy (DP-SGD ε = 0.50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Secure FedAvg Weight Aggregation</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-7 pt-4 border-t border-slate-800/60">
              <a
                href="http://localhost:3001/login"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-400/30 transition-all hover:scale-[1.02]"
              >
                <span>Enter BRICS Federation</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ── ARCHITECTURAL SECURITY FOOTER STRIP ── */}
      <footer className="mt-auto relative z-10 border-t border-slate-800/80 bg-[#060913]/90 backdrop-blur-md py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> FEDERATED MESH ACTIVE
            </span>
            <span>·</span>
            <span>AES-256-GCM ENCRYPTION</span>
            <span>·</span>
            <span>JWT ROW-LEVEL SECURITY</span>
          </div>

          <div className="text-slate-500 text-[11px]">
            SMART HEALTH PLATFORM v2.4 · NATIONAL HEALTH INITIATIVE
          </div>
        </div>
      </footer>
    </div>
  );
}
