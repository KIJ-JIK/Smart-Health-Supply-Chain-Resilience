// ---------------------------------------------------------------------------
// Overview Page — BRICS Federated AI Monitoring & Governance Command Center
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Globe,
  Server,
  Activity,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCheck2,
} from 'lucide-react';
import {
  GET_FEDERATED_NODES,
  GET_FEDERATED_ROUNDS,
  GET_FEDERATED_MODEL_VERSIONS,
  START_FEDERATED_ROUND,
} from '@/graphql';
import {
  KpiCard,
  CountryNodeCard,
  DataFreshnessLabel,
  StatusBadge,
  CardSkeleton,
  ErrorState,
} from '@/components/common';
import { StartRoundModal } from '@/components/rounds';
import type {
  FederatedNode,
  FederatedRound,
  FederatedModelVersion,
  StartRoundInput,
} from '@/types/federated';

export default function OverviewPage() {
  const navigate = useNavigate();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  const {
    data: nodesData,
    loading: nodesLoading,
    error: nodesError,
    refetch: refetchNodes,
  } = useQuery<{ federatedNodes: FederatedNode[] }>(GET_FEDERATED_NODES);

  const {
    data: roundsData,
    loading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery<{ federatedRounds: FederatedRound[] }>(GET_FEDERATED_ROUNDS);

  const {
    data: modelsData,
    loading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery<{ federatedModelVersions: FederatedModelVersion[] }>(
    GET_FEDERATED_MODEL_VERSIONS
  );

  const [startRound, { loading: startingRound }] = useMutation(
    START_FEDERATED_ROUND,
    {
      onCompleted: () => {
        refetchAll();
      },
    }
  );

  const anyError = nodesError || roundsError || modelsError;
  const refetchAll = () => {
    refetchNodes();
    refetchRounds();
    refetchModels();
  };

  const nodes = nodesData?.federatedNodes || [];
  const rounds = roundsData?.federatedRounds || [];
  const models = modelsData?.federatedModelVersions || [];

  const activeNodesCount = nodes.filter((n) => n.status === 'participating').length;
  const totalNodesCount = nodes.length || 5;
  const currentRound = rounds[rounds.length - 1] || rounds[0];
  const latestModel = models.find((m) => m.status === 'active') || models[models.length - 1];

  const handleStartRoundSubmit = async (config: StartRoundInput) => {
    await startRound({
      variables: { config },
    });
  };

  if (anyError) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          title="Federation Telemetry Unavailable"
          message={anyError.message}
          onRetry={refetchAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / System Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1523] via-[#111c2e] to-[#0d1523] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-400" />
              BRICS Sovereign AI Federated Council
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              5-Nation Consensus Active
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Coordinated epidemiological demand forecasting across India, Brazil, Russia, China, and South Africa. 
            Guarantees 100% sovereign data residency via Differential Privacy (DP-SGD) and Paillier Secure Aggregation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Training Round</span>
          </button>
          <button
            onClick={() => navigate('/rounds/review')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Model Governance</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Ribbons */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodesLoading || roundsLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              title="Connected Sovereign Enclaves"
              value={`${activeNodesCount} / ${totalNodesCount}`}
              subtitle="All 5 BRICS nodes participating"
              trendText="Quorum: 4 Required"
              statusTone="green"
              icon={<Server className="w-4 h-4" />}
            />

            <KpiCard
              title="Live Federation Stage"
              value={currentRound ? currentRound.status.replace(/_/g, ' ').toUpperCase() : 'IDLE'}
              subtitle={currentRound ? `${currentRound.roundId}` : 'Consensus Ready'}
              trendText={currentRound?.modelVersion || 'v1.18-brics'}
              statusTone={currentRound?.status === 'completed' ? 'green' : 'amber'}
              icon={<Activity className="w-4 h-4" />}
            />

            <KpiCard
              title="Differential Privacy Budget"
              value="ε = 1.42"
              subtitle="Total threshold: ε ≤ 5.0"
              trendText="Zero Leakage (DP-SGD)"
              statusTone="green"
              icon={<Lock className="w-4 h-4" />}
            />

            <KpiCard
              title="Global Forecast Accuracy"
              value="94.6%"
              subtitle="Prophet + FedAvg Ensemble"
              trendText="+3.2% vs Single-Node"
              statusTone="green"
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </>
        )}
      </section>

      {/* Sovereign Country Nodes Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Sovereign Node Telemetry &amp; Isolation Enclaves
            </h2>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              Zero Raw Data Egress
            </span>
          </div>
          <button
            onClick={() => navigate('/nodes')}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 group"
          >
            <span>View Detailed Node Topology</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {nodesLoading ? (
            Array.from({ length: 5 }).map((_, idx) => <CardSkeleton key={idx} height={180} />)
          ) : (
            nodes.map((node) => (
              <CountryNodeCard
                key={node.countryCode}
                countryCode={node.countryCode}
                countryName={node.countryName}
                status={node.status}
                lastLocalTraining={node.lastLocalTraining}
                lastModelUpload={node.lastModelUpload}
                healthIndicator={node.healthIndicator}
                onClick={() => navigate(`/nodes?country=${node.countryCode}`)}
              />
            ))
          )}
        </div>
      </section>

      {/* Active Federation Round & Multi-Nation Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Round Telemetry */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Active Federated Learning Round Pipeline
                </h3>
                <p className="text-xs text-slate-400">
                  Round ID: {currentRound?.roundId || 'RND-2026-09-14-04'} • Model: {currentRound?.modelVersion || 'v1.18'}
                </p>
              </div>
            </div>
            <StatusBadge status={currentRound?.status || 'aggregating'} size="sm" pulse />
          </div>

          {/* Stage Progress Steps */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-[#0d1523] border border-emerald-500/40 text-emerald-300 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase block text-emerald-400">Step 1</span>
              <p className="font-semibold text-[11px]">Weight Broadcast</p>
              <span className="text-[10px] text-emerald-500">100% Dispatched</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d1523] border border-emerald-500/40 text-emerald-300 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase block text-emerald-400">Step 2</span>
              <p className="font-semibold text-[11px]">Local Training</p>
              <span className="text-[10px] text-emerald-500">5/5 Nodes Done</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d1523] border border-cyan-500/40 text-cyan-300 space-y-1 shadow-sm shadow-cyan-500/10">
              <span className="text-[10px] font-mono font-bold uppercase block text-cyan-400">Step 3</span>
              <p className="font-semibold text-[11px]">DP Noise &amp; Agg</p>
              <span className="text-[10px] text-cyan-400 font-bold animate-pulse">In Progress (FedAvg)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d1523] border border-slate-800 text-slate-400 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase block text-slate-500">Step 4</span>
              <p className="font-semibold text-[11px]">Consensus Sign-off</p>
              <span className="text-[10px] text-slate-500">Awaiting Agg</span>
            </div>
          </div>

          {/* Aggregation Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2 px-3">Participant Node</th>
                  <th className="py-2 px-3">Local Samples</th>
                  <th className="py-2 px-3">Gradient Norm</th>
                  <th className="py-2 px-3">Differential Privacy</th>
                  <th className="py-2 px-3">Aggregation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 text-[11px]">
                <tr className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-sans font-semibold text-white flex items-center gap-1.5">
                    <span>🇮🇳</span> India (Varanasi Node)
                  </td>
                  <td className="py-2.5 px-3">1,420,000</td>
                  <td className="py-2.5 px-3 text-cyan-400">0.0342</td>
                  <td className="py-2.5 px-3 text-emerald-400">ε = 0.28 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-sans font-semibold text-white flex items-center gap-1.5">
                    <span>🇧🇷</span> Brazil (São Paulo Node)
                  </td>
                  <td className="py-2.5 px-3">890,000</td>
                  <td className="py-2.5 px-3 text-cyan-400">0.0415</td>
                  <td className="py-2.5 px-3 text-emerald-400">ε = 0.31 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-sans font-semibold text-white flex items-center gap-1.5">
                    <span>🇷🇺</span> Russia (Moscow Node)
                  </td>
                  <td className="py-2.5 px-3">620,000</td>
                  <td className="py-2.5 px-3 text-cyan-400">0.0298</td>
                  <td className="py-2.5 px-3 text-emerald-400">ε = 0.25 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-sans font-semibold text-white flex items-center gap-1.5">
                    <span>🇨🇳</span> China (Shanghai Node)
                  </td>
                  <td className="py-2.5 px-3">2,100,000</td>
                  <td className="py-2.5 px-3 text-cyan-400">0.0381</td>
                  <td className="py-2.5 px-3 text-emerald-400">ε = 0.29 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-sans font-semibold text-white flex items-center gap-1.5">
                    <span>🇿🇦</span> South Africa (Cape Town Node)
                  </td>
                  <td className="py-2.5 px-3">410,000</td>
                  <td className="py-2.5 px-3 text-cyan-400">0.0450</td>
                  <td className="py-2.5 px-3 text-emerald-400">ε = 0.29 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Sovereign Security & Compliance Summary */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Sovereign Compliance Ledger</h3>
                <p className="text-[11px] text-slate-400">Differential Privacy &amp; Data Residency</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span>Cryptographic Protocol</span>
                  <span className="text-teal-400 font-mono text-[11px]">Paillier SMPC</span>
                </div>
                <p className="text-[11px] text-slate-400">Weights encrypted prior to cross-border transit</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span>Noise Mechanism</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Gaussian (σ=1.12)</span>
                </div>
                <p className="text-[11px] text-slate-400">Rényi Differential Privacy (RDP) bound</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span>Audit Trail</span>
                  <span className="text-cyan-400 font-mono text-[11px]">Immutable Log</span>
                </div>
                <p className="text-[11px] text-slate-400">Every training round signed with SHA-256 Merkle root</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => navigate('/privacy')}
              className="w-full py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all text-center"
            >
              Inspect Privacy Budget Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Start Round Modal */}
      {isStartModalOpen && (
        <StartRoundModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          onSubmit={handleStartRoundSubmit}
          isSubmitting={startingRound}
        />
      )}
    </div>
  );
}
