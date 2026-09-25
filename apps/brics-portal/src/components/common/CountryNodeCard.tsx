import React from 'react';
import { StatusBadge } from './StatusBadge';
import { DataFreshnessLabel } from './DataFreshnessLabel';
import { Server, ShieldCheck, Database, ArrowRight } from 'lucide-react';
import type { NodeParticipationStatus } from '@/types/federated';

export interface CountryNodeCardProps {
  countryCode: string;
  countryName: string;
  status: NodeParticipationStatus;
  lastLocalTraining?: string | null;
  lastModelUpload?: string | null;
  healthIndicator?: string;
  lastRoundParticipation?: boolean | string;
  onClick?: () => void;
  compact?: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

const COUNTRY_DATA_METRICS: Record<string, { rows: string; latency: string; dpEpsilon: string }> = {
  IN: { rows: '1.42M Records', latency: '24ms', dpEpsilon: '1.24' },
  BR: { rows: '890k Records', latency: '142ms', dpEpsilon: '1.45' },
  RU: { rows: '620k Records', latency: '98ms', dpEpsilon: '1.18' },
  CN: { rows: '2.10M Records', latency: '65ms', dpEpsilon: '1.30' },
  ZA: { rows: '410k Records', latency: '185ms', dpEpsilon: '1.50' },
};

export const CountryNodeCard: React.FC<CountryNodeCardProps> = ({
  countryCode,
  countryName,
  status,
  lastLocalTraining,
  lastModelUpload,
  healthIndicator,
  lastRoundParticipation,
  onClick,
  compact = false,
}) => {
  const code = countryCode.toUpperCase();
  const flag = COUNTRY_FLAGS[code] || '🌐';
  const metrics = COUNTRY_DATA_METRICS[code] || { rows: '500k Records', latency: '80ms', dpEpsilon: '1.35' };

  const isParticipating = status === 'participating';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#0f1f38] border rounded-lg shadow-sm p-4 flex flex-col justify-between transition-colors ${
        onClick ? 'cursor-pointer hover:border-blue-500 dark:hover:border-blue-400' : ''
      } ${
        isParticipating
          ? 'border-slate-200 dark:border-[#1e3a5f]'
          : status === 'paused'
          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
          : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
      }`}
    >
      {/* Header: Flag, Name & Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0 select-none">{flag}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {countryName}
              </h3>
              <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-[#152b4d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e3a5f]">
                {code}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sovereign Enclave</p>
          </div>
        </div>

        <StatusBadge status={status} size="sm" pulse={isParticipating} />
      </div>

      {/* Metrics Subcard */}
      <div className="my-3 p-2.5 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Database className="w-3 h-3 text-blue-500 dark:text-blue-400" /> Ground Rows
          </span>
          <p className="font-mono text-slate-800 dark:text-slate-200 font-bold mt-0.5">{metrics.rows}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" /> DP Spent
          </span>
          <p className="font-mono text-teal-700 dark:text-teal-300 font-bold mt-0.5">ε = {metrics.dpEpsilon}</p>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1e3a5f]/60 space-y-1 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">Last Sync:</span>
          <DataFreshnessLabel timestamp={lastModelUpload || lastLocalTraining} />
        </div>

        {onClick && (
          <div className="pt-1 flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <span>Inspect Enclave</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryNodeCard;
