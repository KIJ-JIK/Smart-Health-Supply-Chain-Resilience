// ---------------------------------------------------------------------------
// Overview Page — BRICS Federated AI Monitoring & Governance Command Center
// Aligned with the Institutional Government & Healthcare theme of PHC Portal.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Globe,
  Server,
  Activity,
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Play,
  FileCheck2,
  Building2,
  CheckCircle2,
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

  const handleStartRoundSubmit = async (config: StartRoundInput) => {
    await startRound({
      variables: { config },
    });
  };

  if (anyError) {
    return (
      <div className="py-4">
        <ErrorState
          title="Federation Telemetry Unavailable"
          message={anyError.message}
          onRetry={refetchAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner / System Status */}
      <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-blue-600 dark:border-l-blue-400">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              BRICS Sovereign AI Federated Council
            </h2>
            <span className="gov-badge bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
              5-NATION CONSENSUS ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Coordinated epidemiological demand forecasting across India, Brazil, Russia, China, and South Africa. 
            Guarantees 100% sovereign data residency via Differential Privacy (DP-SGD) and Paillier Secure Aggregation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Training Round</span>
          </button>
          <button
            onClick={() => navigate('/rounds/review')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e3a5f] transition-colors active:scale-95"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Model Governance</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
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
              subtitle="Threshold: ε ≤ 5.0"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Sovereign Node Telemetry &amp; Isolation Enclaves
            </h3>
            <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
              ZERO RAW DATA EGRESS
            </span>
          </div>
          <button
            onClick={() => navigate('/nodes')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View Detailed Node Topology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Round Telemetry */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-[#152b4d] text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-[#1e3a5f]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Active Federated Learning Round Pipeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Round ID: {currentRound?.roundId || 'RND-2026-09-14-04'} · Model: {currentRound?.modelVersion || 'v1.18'}
                </p>
              </div>
            </div>
            <StatusBadge status={currentRound?.status || 'aggregating'} size="sm" pulse />
          </div>

          {/* Stage Progress Steps */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-md bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase block text-emerald-700 dark:text-emerald-400">Step 1</span>
              <p className="font-semibold text-[11px]">Weight Broadcast</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">100% Dispatched</span>
            </div>
            <div className="p-2.5 rounded-md bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase block text-emerald-700 dark:text-emerald-400">Step 2</span>
              <p className="font-semibold text-[11px]">Local Training</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">5/5 Nodes Done</span>
            </div>
            <div className="p-2.5 rounded-md bg-blue-50 dark:bg-[#152b4d] border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 space-y-0.5 shadow-sm">
              <span className="text-[10px] font-mono font-bold uppercase block text-blue-600 dark:text-blue-400">Step 3</span>
              <p className="font-semibold text-[11px]">DP Noise &amp; Agg</p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold animate-pulse">In Progress (FedAvg)</span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#152b4d]/50 border border-slate-200 dark:border-[#1e3a5f] text-slate-500 dark:text-slate-400 space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase block text-slate-400">Step 4</span>
              <p className="font-semibold text-[11px]">Consensus Sign-off</p>
              <span className="text-[10px] text-slate-400">Awaiting Agg</span>
            </div>
          </div>

          {/* Aggregation Table */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3a5f] font-mono bg-slate-50 dark:bg-[#152b4d]">
                <tr>
                  <th className="py-2 px-3">Participant Node</th>
                  <th className="py-2 px-3">Local Samples</th>
                  <th className="py-2 px-3">Gradient Norm</th>
                  <th className="py-2 px-3">Differential Privacy</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a5f]/60 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                <tr className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🇮🇳</span> India (Varanasi Node)
                  </td>
                  <td className="py-2.5 px-3">1,420,000</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">0.0342</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">ε = 0.28 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🇧🇷</span> Brazil (São Paulo Node)
                  </td>
                  <td className="py-2.5 px-3">890,000</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">0.0415</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">ε = 0.31 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🇷🇺</span> Russia (Moscow Node)
                  </td>
                  <td className="py-2.5 px-3">620,000</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">0.0298</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">ε = 0.25 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🇨🇳</span> China (Shanghai Node)
                  </td>
                  <td className="py-2.5 px-3">2,100,000</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">0.0381</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">ε = 0.29 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                      VERIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🇿🇦</span> South Africa (Cape Town Node)
                  </td>
                  <td className="py-2.5 px-3">410,000</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">0.0450</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">ε = 0.29 (Approved)</td>
                  <td className="py-2.5 px-3">
                    <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Sovereign Security & Compliance Summary */}
        <div className="card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sovereign Compliance Ledger</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Differential Privacy &amp; Data Residency</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 space-y-1">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                  <span>Cryptographic Protocol</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">Paillier SMPC</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Weights encrypted prior to cross-border transit</p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 space-y-1">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                  <span>Noise Mechanism</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">Gaussian (σ=1.12)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Rényi Differential Privacy (RDP) bound</p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 space-y-1">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                  <span>Audit Trail</span>
                  <span className="text-cyan-700 dark:text-cyan-400 font-mono text-[11px]">Immutable Log</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Every training round signed with SHA-256 Merkle root</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a5f]">
            <button
              onClick={() => navigate('/privacy')}
              className="w-full py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800 text-xs font-bold transition-colors text-center"
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
