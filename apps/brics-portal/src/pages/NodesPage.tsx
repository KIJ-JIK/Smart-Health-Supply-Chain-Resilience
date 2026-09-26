// ---------------------------------------------------------------------------
// Nodes Registry & Detail View — BRICS Federated Intelligence & Governance
// Aligned with the Institutional Government & Healthcare theme of PHC Portal.
// ---------------------------------------------------------------------------

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Server,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Database,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
} from 'lucide-react';
import {
  GET_FEDERATED_NODES,
  TOGGLE_COUNTRY_PARTICIPATION,
} from '@/graphql';
import {
  SimpleLineChart,
  ConfirmationDialog,
  StatusBadge,
  CardSkeleton,
  ErrorState,
} from '@/components/common';
import { mockNodeHistories, NodeSubmissionLog } from '@/graphql/mock-node-details';
import type { FederatedNode } from '@/types/federated';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

const COUNTRY_STATS: Record<string, { samples: number; dpSpent: number; latency: number; encryption: string }> = {
  IN: { samples: 1420000, dpSpent: 1.24, latency: 24, encryption: 'Paillier SMPC (2048-bit)' },
  BR: { samples: 890000, dpSpent: 1.45, latency: 142, encryption: 'Paillier SMPC (2048-bit)' },
  RU: { samples: 620000, dpSpent: 1.18, latency: 98, encryption: 'Paillier SMPC (2048-bit)' },
  CN: { samples: 2100000, dpSpent: 1.30, latency: 65, encryption: 'Paillier SMPC (2048-bit)' },
  ZA: { samples: 410000, dpSpent: 1.50, latency: 185, encryption: 'Paillier SMPC (2048-bit)' },
};

function NodesContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCountry = searchParams.get('country') || searchParams.get('node') || 'IN';
  const [selectedCountry, setSelectedCountry] = useState<string>(urlCountry);

  useEffect(() => {
    if (urlCountry) {
      setSelectedCountry(urlCountry.toUpperCase());
    }
  }, [urlCountry]);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [targetToggleState, setTargetToggleState] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const {
    data: nodesData,
    loading: nodesLoading,
    error: nodesError,
    refetch,
  } = useQuery<{ federatedNodes: FederatedNode[] }>(GET_FEDERATED_NODES);

  const [toggleParticipation, { loading: toggling }] = useMutation(
    TOGGLE_COUNTRY_PARTICIPATION,
    {
      onCompleted: () => {
        refetch();
        setActionSuccessMessage(
          `Sovereign participation status updated for ${selectedCountry}. Network consensus state synchronized.`
        );
      },
    }
  );

  const nodes = nodesData?.federatedNodes || [];
  const activeNode = nodes.find((n) => n.countryCode === selectedCountry) || nodes[0];
  const nodeDetails = mockNodeHistories[selectedCountry] || mockNodeHistories['IN'];
  const stats = COUNTRY_STATS[selectedCountry] || { samples: 1000000, dpSpent: 1.35, latency: 50, encryption: 'Paillier SMPC' };

  const chartData = nodeDetails.trainingHistory.map((item) => ({
    label: item.round,
    value1: item.loss,
    value2: item.accuracy,
  }));

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    navigate(`/nodes?country=${code}`);
  };

  const handleOpenToggleDialog = (newActiveState: boolean) => {
    setTargetToggleState(newActiveState);
    setIsDialogOpen(true);
  };

  const handleConfirmToggle = () => {
    toggleParticipation({
      variables: {
        countryCode: selectedCountry,
        enabled: targetToggleState,
      },
    });
    setIsDialogOpen(false);
  };

  if (nodesError) {
    return (
      <div className="py-4">
        <ErrorState
          title="Node Telemetry Failed"
          message={nodesError.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  const isParticipating = activeNode?.status === 'participating';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Sovereign Enclave Registry &amp; Node Diagnostics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time diagnostics, local convergence curves, and cryptographic delta verification for member states.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-[#1e3a5f] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Enclaves</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Country Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {nodes.map((node) => {
          const isSelected = node.countryCode === selectedCountry;
          const flag = COUNTRY_FLAGS[node.countryCode] || '🌐';
          return (
            <button
              key={node.countryCode}
              onClick={() => handleSelectCountry(node.countryCode)}
              className={`p-3.5 rounded-lg border text-left transition-colors flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-[#152b4d] border-blue-500 dark:border-blue-400 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-white dark:bg-[#0f1f38] border-slate-200 dark:border-[#1e3a5f] hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{flag}</span>
                <StatusBadge status={node.status} size="sm" pulse={node.status === 'participating'} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{node.countryName}</h3>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Enclave: {node.countryCode}-01</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Node Detail Card & Charts */}
      {nodesLoading || !activeNode ? (
        <CardSkeleton height={320} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Diagnostics & Controls */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{COUNTRY_FLAGS[activeNode.countryCode]}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeNode.countryName}</h3>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Node ID: BRICS-{activeNode.countryCode}-NODE-ALPHA</p>
                </div>
              </div>
              <StatusBadge status={activeNode.status} size="sm" />
            </div>

            {/* Spec Metrics */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Ground Data Volume
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {stats.samples.toLocaleString()} Records
                </span>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> DP Spent (Total)
                </span>
                <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                  ε = {stats.dpSpent.toFixed(2)} / 5.0
                </span>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Encryption Protocol
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {stats.encryption}
                </span>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Latency to Coordinator
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {stats.latency}ms
                </span>
              </div>
            </div>

            {/* Sovereign Governance Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a5f] space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Sovereign Federation Governance
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                National administrators can toggle local gradient contribution or audit DP noise budgets.
              </p>

              {isParticipating ? (
                <button
                  onClick={() => handleOpenToggleDialog(false)}
                  disabled={toggling}
                  className="w-full py-2 rounded-md text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Pause Node Participation</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenToggleDialog(true)}
                  disabled={toggling}
                  className="w-full py-2 rounded-md text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Resume Sovereign Contribution</span>
                </button>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Convergence Chart & Cryptographic Signatures */}
          <div className="lg:col-span-2 space-y-5">
            {/* Training Convergence */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Local Model Convergence &amp; Loss Curve ({activeNode.countryName})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#152b4d] px-2 py-0.5 rounded border border-slate-200 dark:border-[#1e3a5f]">
                  Last 5 Training Rounds
                </span>
              </div>
              <SimpleLineChart
                data={chartData}
                line1Label="Local Loss (MSE)"
                line2Label="Validation Accuracy"
                height={200}
              />
            </div>

            {/* Cryptographic Submissions Audit */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Cryptographic Gradient Delta Signatures
                  </h3>
                </div>
                <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                  ZERO RAW SAMPLES
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3a5f] bg-slate-50 dark:bg-[#152b4d]">
                    <tr>
                      <th className="py-2 px-3">Round</th>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Gradient Hash (SHA-256)</th>
                      <th className="py-2 px-3">Samples</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a5f]/60 text-slate-700 dark:text-slate-300 text-[11px]">
                    {nodeDetails.submissions.map((sub: NodeSubmissionLog, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#152b4d]/40">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">{sub.roundId}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{sub.submittedAt.slice(0, 10)}</td>
                        <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 truncate max-w-[140px]" title={sub.weightDeltaHash}>
                          {sub.weightDeltaHash}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{sub.sampleCount.toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span className="gov-badge bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px] uppercase">
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        title={targetToggleState ? `Resume Sovereign Node (${selectedCountry})` : `Pause Sovereign Node (${selectedCountry})`}
        description={
          targetToggleState
            ? `Are you sure you want to enable gradient contributions from ${activeNode?.countryName}? Local dataset batches will be aggregated into the next FedAvg round.`
            : `Pausing ${activeNode?.countryName} will exclude its local weights from upcoming federated aggregation rounds. The sovereign quorum threshold requires at least 4 active nodes.`
        }
        confirmLabel={targetToggleState ? 'Authorize Resume' : 'Confirm Exclusion'}
        isDestructive={!targetToggleState}
        onConfirm={handleConfirmToggle}
        onCancel={() => setIsDialogOpen(false)}
      />
    </div>
  );
}

export default function NodesPage() {
  return (
    <Suspense fallback={<CardSkeleton height={400} />}>
      <NodesContent />
    </Suspense>
  );
}
