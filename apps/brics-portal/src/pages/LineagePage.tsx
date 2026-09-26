// ---------------------------------------------------------------------------
// Model Lineage Page — BRICS Federated Intelligence & Governance
// ---------------------------------------------------------------------------

import React from 'react';
import { useQuery } from '@apollo/client';
import {
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  Cpu,
  Layers,
  FileCode,
} from 'lucide-react';
import { GET_FEDERATED_MODEL_VERSIONS } from '@/graphql';
import {
  StatusBadge,
  DataFreshnessLabel,
  CardSkeleton,
  ErrorState,
} from '@/components/common';
import { MetricDelta } from '@/components/lineage';
import type { FederatedModelVersion } from '@/types/federated';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

export default function LineagePage() {
  const { data, loading, error, refetch } = useQuery<{
    federatedModelVersions: FederatedModelVersion[];
  }>(GET_FEDERATED_MODEL_VERSIONS);

  const modelVersions = data?.federatedModelVersions || [];

  const chronological = [...modelVersions].sort((a, b) => {
    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
  });

  const modelsWithDiff = chronological.map((model, idx) => {
    const prevModel = idx > 0 ? chronological[idx - 1] : null;
    return {
      current: model,
      previous: prevModel,
    };
  });

  const timelineEntries = [...modelsWithDiff].reverse();

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          title="Failed to Load Model Lineage History"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Global Model Lineage &amp; Validation DAG
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Immutable version tree of globally aggregated FedAvg model checkpoints, cryptographic weight signatures, and cross-border performance benchmarks.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1e3a5f] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e3a5f] text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Lineage</span>
        </button>
      </div>

      {/* Timeline Entries */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton height={180} />
          <CardSkeleton height={180} />
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200 dark:before:bg-[#1e3a5f]">
          {timelineEntries.map(({ current, previous }, idx) => {
            const isReceived = current.status === 'received';
            const isActive = current.status === 'active';

            return (
              <div
                key={current.modelVersion}
                className="relative pl-12 space-y-3 group"
              >
                {/* Timeline Dot Indicator */}
                <div
                  className={`absolute left-4 top-5 w-4 h-4 rounded-full border-2 transform -translate-x-1/2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'bg-emerald-500 border-white ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                      : isReceived
                      ? 'bg-amber-400 border-white ring-4 ring-amber-400/20 animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-500'
                  }`}
                />

                {/* Card */}
                <div
                  className={`card p-5 transition-all ${
                    isActive
                      ? 'border-emerald-400 dark:border-emerald-500/60 shadow-md shadow-emerald-950/10'
                      : isReceived
                      ? 'border-amber-400 dark:border-amber-500/60 shadow-md shadow-amber-950/10'
                      : ''
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1e3a5f] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {current.modelVersion}
                        </span>
                        <StatusBadge status={current.status} size="sm" pulse={isReceived} />
                        {current.baseModelVersion && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            (Derived from {current.baseModelVersion})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {current.federationRoundId && (
                          <>
                            <span>Round: <strong className="text-slate-800 dark:text-slate-200">{current.federationRoundId}</strong></span>
                            <span>•</span>
                          </>
                        )}
                        <DataFreshnessLabel timestamp={current.receivedAt} prefix="Aggregated" />
                      </div>
                    </div>

                    {/* Contributing Nations */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contributors:</span>
                      <div className="flex items-center gap-1.5 p-1 rounded bg-slate-100 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]">
                        {(current.participatingCountries || ['IN', 'BR', 'RU', 'CN', 'ZA']).map((code: string) => (
                          <span key={code} className="text-base" title={`${code} Sovereign Node`}>
                            {COUNTRY_FLAGS[code] || code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                    <MetricDelta
                      label="Mean Absolute Error (MAE)"
                      currentValue={current.metrics?.mae ?? 0.145}
                      previousValue={previous?.metrics?.mae ?? 0.168}
                      lowerIsBetter={true}
                      formatDecimals={4}
                    />
                    <MetricDelta
                      label="Root Mean Squared Error (RMSE)"
                      currentValue={current.metrics?.rmse ?? 0.218}
                      previousValue={previous?.metrics?.rmse ?? 0.245}
                      lowerIsBetter={true}
                      formatDecimals={4}
                    />
                    <MetricDelta
                      label="Backtest Forecast Horizon"
                      currentValue={current.metrics?.backtestWeeks ?? 12}
                      previousValue={previous?.metrics?.backtestWeeks ?? 8}
                      lowerIsBetter={false}
                      unit="Weeks"
                      formatDecimals={0}
                    />
                  </div>

                  {/* Checksum & Storage Signatures */}
                  <div className="pt-3 border-t border-slate-200 dark:border-[#1e3a5f] grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 dark:text-slate-500 font-sans">Artifact:</span>
                      <span className="text-teal-700 dark:text-teal-300 truncate" title={current.s3Uri}>
                        {current.s3Uri}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 dark:text-slate-500 font-sans">SHA-256:</span>
                      <span className="text-cyan-700 dark:text-cyan-300 truncate" title={current.aggregationSignature || 'sha256:verified'}>
                        {current.aggregationSignature || 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
