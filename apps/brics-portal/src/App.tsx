import React, { useState } from 'react';
import {
  Globe2,
  ShieldCheck,
  Cpu,
  Lock,
  Activity,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface BricsNode {
  country: string;
  flag: string;
  institution: string;
  status: 'ONLINE' | 'TRAINING' | 'SYNCED';
  localSamples: string;
  lastWeightSync: string;
  latency: string;
}

export function App() {
  const [activeRound, setActiveRound] = useState(18);
  const [isAggregating, setIsAggregating] = useState(false);

  const nodes: BricsNode[] = [
    {
      country: 'India',
      flag: '🇮🇳',
      institution: 'ICMR / National Health Authority (Lead Host)',
      status: 'SYNCED',
      localSamples: '4.8M records',
      lastWeightSync: '2m ago',
      latency: '14ms',
    },
    {
      country: 'Brazil',
      flag: '🇧🇷',
      institution: 'Fiocruz National Institute of Health',
      status: 'TRAINING',
      localSamples: '2.1M records',
      lastWeightSync: '5m ago',
      latency: '148ms',
    },
    {
      country: 'Russia',
      flag: '🇷🇺',
      institution: 'Sechenov University Medical Network',
      status: 'SYNCED',
      localSamples: '1.9M records',
      lastWeightSync: '3m ago',
      latency: '110ms',
    },
    {
      country: 'China',
      flag: '🇨🇳',
      institution: 'CAMS Chinese Academy of Medical Sciences',
      status: 'TRAINING',
      localSamples: '6.4M records',
      lastWeightSync: '4m ago',
      latency: '85ms',
    },
    {
      country: 'South Africa',
      flag: '🇿🇦',
      institution: 'SAMRC South African Medical Research Council',
      status: 'SYNCED',
      localSamples: '1.4M records',
      lastWeightSync: '6m ago',
      latency: '180ms',
    },
  ];

  const triggerAggregation = () => {
    setIsAggregating(true);
    setTimeout(() => {
      setActiveRound((r) => r + 1);
      setIsAggregating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-indigo-950/60 bg-[#0a1020]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">
                BRICS Federated Health Resilience Network
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 5 · FedAvg / Flower
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Privacy-Preserving Cross-Border AI · Zero Patient Records Exported
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerAggregation}
            disabled={isAggregating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAggregating ? 'animate-spin' : ''}`} />
            <span>{isAggregating ? 'Aggregating Weights...' : 'Run FedAvg Round'}</span>
          </button>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
          >
            <span>PHC Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Core Sovereignty Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 border border-indigo-900/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Sovereign Data Protection Active: Differential Privacy (DP)
              </h2>
              <p className="text-xs text-slate-400">
                Only masked weight deltas are communicated across borders. Raw hospital telemetry never leaves sovereign boundaries.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Privacy Budget (ε)</span>
              <strong className="text-emerald-400">0.42 / 1.00</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Noise Scale (δ)</span>
              <strong className="text-indigo-300">10⁻⁵</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Federated Round</span>
              <strong className="text-white">Round #{activeRound}</strong>
            </div>
          </div>
        </div>

        {/* 5 Sovereign BRICS Nodes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Sovereign National Node Health</h2>
            <span className="text-xs text-slate-400">5 / 5 Participating Nations Connected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {nodes.map((n) => (
              <div
                key={n.country}
                className="p-4 rounded-2xl bg-[#0d1525] border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{n.flag}</span>
                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                      n.status === 'SYNCED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 animate-pulse'
                    }`}
                  >
                    {n.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white">{n.country} Node</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{n.institution}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Local Data:</span>
                    <span className="text-slate-200">{n.localSamples}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight Delta:</span>
                    <span className="text-emerald-400">{n.lastWeightSync}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ping:</span>
                    <span className="text-indigo-300">{n.latency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Global Disease Early-Warning & Cross-Border Supply Risks */}
        <section className="p-5 rounded-2xl bg-[#0d1525] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">
                Cross-Border Anomaly Detection & Supply Signals
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Consensus: Verified by 4/5 Nodes</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Global Amoxicillin Active Pharmaceutical Ingredient (API) Stabilization</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    SUPPLY SURPLUS
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  India and China nodes report raw chemical synthesis output up 18% month-over-month. Recommended domestic stock buffers reduced from 60 to 45 days.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Seasonal Respiratory Surge Vector (South America → South Asia)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    PREDICTIVE SIGNAL
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Brazil node telemetry models 24% increase in viral bronchopneumonia cases. Multi-nation model updates dispatched to Indian District Depots for preemptive oxygen refills.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
