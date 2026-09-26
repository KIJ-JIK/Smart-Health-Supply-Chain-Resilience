import React from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Activity, Cpu, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import type { FederatedRound } from '@/types/federated';

export interface RoundDetailDrawerProps {
  round: FederatedRound | null;
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  BR: 'Brazil',
  RU: 'Russia',
  CN: 'China',
  ZA: 'South Africa',
};

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

export const RoundDetailDrawer: React.FC<RoundDetailDrawerProps> = ({
  round,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !round) return null;

  const allCountries = round.participatingCountries || ['IN', 'BR', 'RU', 'CN', 'ZA'];
  const submittedSet = new Set(round.submittedCountries || []);

  const getNodeStatus = (countryCode: string): 'submitted' | 'pending' | 'failed' => {
    if (submittedSet.has(countryCode)) {
      return 'submitted';
    }
    if (['approved', 'rejected', 'completed', 'voided'].includes(round.status)) {
      return 'failed';
    }
    return 'pending';
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-white dark:bg-[#0f1f38] border-l border-slate-200 dark:border-[#1e3a5f] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#1e3a5f] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">{round.roundId}</h3>
                <StatusBadge status={round.status} size="sm" pulse={round.status === 'aggregating'} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                Target Model: <span className="text-slate-800 dark:text-slate-200 font-semibold">{round.modelVersion}</span> • Quorum: {round.quorumRequired}/5
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-[#152b4d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metric Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold font-mono">Started At</span>
              <p className="text-slate-800 dark:text-slate-200 font-mono font-bold mt-1">
                <DataFreshnessLabel timestamp={round.startedAt} />
              </p>
            </div>
            <div className="p-3 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold font-mono">Consensus Quorum</span>
              <p className="text-teal-600 dark:text-teal-400 font-mono font-bold mt-1">
                {round.submittedCountries?.length || 0} / 5 Enclaves Verified
              </p>
            </div>
          </div>

          {/* Enclave Submissions List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sovereign Node Gradient Status
            </h4>

            <div className="space-y-2">
              {allCountries.map((code) => {
                const nodeStatus = getNodeStatus(code);
                const flag = COUNTRY_FLAGS[code] || '🌐';
                const name = COUNTRY_NAMES[code] || code;

                return (
                  <div
                    key={code}
                    className="p-3 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{flag}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{name}</p>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Node: BRICS-{code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {nodeStatus === 'submitted' ? (
                        <span className="gov-badge gov-badge-emerald flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : nodeStatus === 'pending' ? (
                        <span className="gov-badge gov-badge-amber flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 animate-spin" /> Training...
                        </span>
                      ) : (
                        <span className="gov-badge gov-badge-rose flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3" /> Excluded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#1e3a5f] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1e3a5f] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e3a5f] text-xs font-semibold transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundDetailDrawer;
