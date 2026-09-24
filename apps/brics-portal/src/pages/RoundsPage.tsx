// ---------------------------------------------------------------------------
// Training Rounds Page — BRICS Federated Intelligence & Governance
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Activity,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Cpu,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  GET_FEDERATED_ROUNDS,
  START_FEDERATED_ROUND,
} from '@/graphql';
import {
  StatusBadge,
  DataFreshnessLabel,
  TableSkeleton,
  ErrorState,
} from '@/components/common';
import {
  RoundDetailDrawer,
  StartRoundModal,
} from '@/components/rounds';
import type { FederatedRound, StartRoundInput } from '@/types/federated';

function calculateDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (!completedAt) {
    return `${hours}h ${minutes}m (Active)`;
  }
  return `${hours}h ${minutes}m`;
}

export default function RoundsPage() {
  const [selectedRound, setSelectedRound] = useState<FederatedRound | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{
    federatedRounds: FederatedRound[];
  }>(GET_FEDERATED_ROUNDS);

  const [startRound, { loading: startingRound }] = useMutation(
    START_FEDERATED_ROUND,
    {
      onCompleted: (result) => {
        refetch();
        const newRound = result.startFederatedRound;
        setSuccessBanner(
          `Successfully initiated ${newRound.roundId} for model ${newRound.modelVersion}.`
        );
        setTimeout(() => setSuccessBanner(null), 6000);
      },
    }
  );

  const rounds = [...(data?.federatedRounds || [])].reverse();

  const handleRowClick = (round: FederatedRound) => {
    setSelectedRound(round);
    setIsDrawerOpen(true);
  };

  const handleStartRoundSubmit = async (config: StartRoundInput) => {
    await startRound({
      variables: {
        config,
      },
    });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          title="Failed to Load Training Rounds"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Federated Training Rounds &amp; Aggregation Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit FedAvg training rounds, gradient norms, convergence checkpoints, and participating sovereign nations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Rounds</span>
          </button>
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Training Round</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Training Rounds Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Federation Execution Log</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {rounds.length} Total Rounds Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Round ID</th>
                  <th className="py-2.5 px-3">Target Model</th>
                  <th className="py-2.5 px-3">Start Timestamp</th>
                  <th className="py-2.5 px-3">Consensus Quorum</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Stage Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                {rounds.map((round) => {
                  const submittedCount = round.submittedCountries?.length || 0;
                  const totalCount = round.participatingCountries?.length || 5;
                  const isCurrent = round.status === 'aggregating' || round.status === 'collecting_updates';

                  return (
                    <tr
                      key={round.roundId}
                      onClick={() => handleRowClick(round)}
                      className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-semibold text-white font-sans flex items-center gap-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                        <span className="group-hover:text-teal-300 transition-colors">{round.roundId}</span>
                      </td>
                      <td className="py-3 px-3 text-cyan-300">{round.modelVersion}</td>
                      <td className="py-3 px-3">
                        <DataFreshnessLabel timestamp={round.startedAt} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-teal-300 font-bold">{submittedCount}</span>
                        <span className="text-slate-500"> / {totalCount} Nations</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {calculateDuration(round.startedAt, round.completedAt)}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={round.status} size="sm" pulse={isCurrent} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(round);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-teal-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Start Round Modal */}
      {isStartModalOpen && (
        <StartRoundModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          onSubmit={handleStartRoundSubmit}
          isSubmitting={startingRound}
        />
      )}

      {/* Round Detail Drawer */}
      <RoundDetailDrawer
        round={selectedRound}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
