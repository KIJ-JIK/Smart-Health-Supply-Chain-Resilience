import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  BedDouble,
  Wind,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Share2,
} from 'lucide-react';

interface RedistributionRecommendation {
  id: string;
  medicine: string;
  quantity: number;
  fromPHC: string;
  toPHC: string;
  estimatedSavingDays: number;
  urgency: 'HIGH' | 'MEDIUM';
}

export function App() {
  const [crisisMode, setCrisisMode] = useState(false);
  const [recommendations, setRecommendations] = useState<RedistributionRecommendation[]>([
    {
      id: 'rec-01',
      medicine: 'Amoxicillin 500mg',
      quantity: 200,
      fromPHC: 'Cholapur CHC (Surplus: 1,400 units)',
      toPHC: 'Rampur PHC (Stockout in 48h)',
      estimatedSavingDays: 14,
      urgency: 'HIGH',
    },
    {
      id: 'rec-02',
      medicine: 'D-Type Oxygen Cylinders',
      quantity: 8,
      fromPHC: 'Pandeypur District Depot (Surplus: 45)',
      toPHC: 'Cholapur CHC (Reserve: 4 left)',
      estimatedSavingDays: 7,
      urgency: 'HIGH',
    },
  ]);

  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0d1523]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">
                District Health Command Center
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                District: Varanasi (UP)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              State Health Resilience & FEFO Resource Allocation Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Crisis Mode Toggle */}
          <button
            onClick={() => setCrisisMode(!crisisMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              crisisMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{crisisMode ? 'CRISIS MODE ACTIVE' : 'Crisis Standby'}</span>
          </button>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all"
          >
            <span>Open Field PHC Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Ribbons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Connected PHCs & CHCs
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">48 / 48</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ground PWA sync active across district</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Critical Stockout Alerts
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-rose-400">2 PHCs</span>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Action Req
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rampur PHC (Insulin & Amoxicillin)</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              District Bed Occupancy
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-amber-400">81%</span>
              <span className="text-xs font-bold text-slate-400">584 / 720 Beds</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cholapur ICU approaching 95% capacity</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              FEFO Savings (This Month)
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-teal-400">₹4.8L</span>
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 0 Batches Expired
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Zero medicine wastage via FEFO dispatch</p>
          </div>
        </div>

        {/* AI Redistribution Approvals Section */}
        <section className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  AI Supply Redistribution Optimizer (OR-Tools MILP)
                </h2>
                <p className="text-xs text-slate-400">
                  Human-in-the-Loop: AI recommends stock reallocations to prevent stockouts before they happen.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {recommendations.length} Pending Actions
            </span>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => {
              const isApproved = approvedIds.includes(rec.id);
              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isApproved
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-[#0d1523] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{rec.medicine}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                        {rec.quantity} Units
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        {rec.urgency} PRIORITY
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>From: <strong className="text-slate-200">{rec.fromPHC}</strong></span>
                      <span>→</span>
                      <span>To: <strong className="text-slate-200">{rec.toPHC}</strong></span>
                    </div>
                    <p className="text-[11px] text-teal-400">
                      Prevents stockout for {rec.estimatedSavingDays} clinical operating days
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isApproved ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" /> Transfer Dispatched
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(rec.id)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md active:scale-95"
                        >
                          Approve Reallocation
                        </button>
                        <button
                          onClick={() => setRecommendations((prev) => prev.filter((r) => r.id !== rec.id))}
                          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* District Facilities Status Table */}
        <section className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Live PHC Facility Telemetry & Triage Status</h2>
            <span className="text-xs text-slate-400">Sync: Connected to Central Backend (Port 8000)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Facility Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Bed Occupancy</th>
                  <th className="py-2.5 px-3">O₂ Reserves</th>
                  <th className="py-2.5 px-3">Sync Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                <tr className="hover:bg-slate-800/20">
                  <td className="py-3 px-3 font-sans font-semibold text-white">
                    Rampur Primary Health Centre
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      OPERATIONAL
                    </span>
                  </td>
                  <td className="py-3 px-3">16 / 24 Beds (67%)</td>
                  <td className="py-3 px-3">12 Cylinders</td>
                  <td className="py-3 px-3 text-emerald-400">12s ago (Real-time)</td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="py-3 px-3 font-sans font-semibold text-white">
                    Cholapur Community Health Centre
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      HIGH SURGE
                    </span>
                  </td>
                  <td className="py-3 px-3 text-rose-400">38 / 40 Beds (95%)</td>
                  <td className="py-3 px-3 text-rose-400">4 Cylinders (Critical)</td>
                  <td className="py-3 px-3 text-emerald-400">45s ago (Real-time)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
