// ---------------------------------------------------------------------------
// Training Rounds Page — BRICS Federated Intelligence & Governance
// Aligned with the Institutional Government & Healthcare theme of PHC Portal.
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
      <div className="py-4">
        <ErrorState
          title="Failed to Load Training Rounds"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Federated Training Rounds &amp; Aggregation Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit FedAvg training rounds, gradient norms, convergence checkpoints, and participating sovereign nations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-[#1e3a5f] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Rounds</span>
          </button>
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Training Round</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Training Rounds Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Federation Execution Log</h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {rounds.length} Total Rounds Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3a5f] font-mono bg-slate-50 dark:bg-[#152b4d]">
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
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a5f]/60 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                {rounds.map((round) => {
                  const submittedCount = round.submittedCountries?.length || 0;
                  const totalCount = round.participatingCountries?.length || 5;
                  const isCurrent = round.status === 'aggregating' || round.status === 'collecting_updates';

                  return (
                    <tr
                      key={round.roundId}
                      onClick={() => handleRowClick(round)}
                      className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 font-sans flex items-center gap-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{round.roundId}</span>
                      </td>
                      <td className="py-3 px-3 text-blue-700 dark:text-blue-300">{round.modelVersion}</td>
                      <td className="py-3 px-3">
                        <DataFreshnessLabel timestamp={round.startedAt} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-teal-700 dark:text-teal-300 font-bold">{submittedCount}</span>
                        <span className="text-slate-400 dark:text-slate-500"> / {totalCount} Nations</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
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
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-[#1e3a5f] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
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
