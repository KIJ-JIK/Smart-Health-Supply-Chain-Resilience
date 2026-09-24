import React from 'react';
import { StatusBadge } from './StatusBadge';
import { DataFreshnessLabel } from './DataFreshnessLabel';
import { Server, ShieldCheck, Activity, Database, ArrowRight } from 'lucide-react';
import type { NodeParticipationStatus } from '@/types/federated';

export interface CountryNodeCardProps {
  /** Country code (ISO 2-letter: IN, BR, RU, CN, ZA) */
  countryCode: string;
  /** Full country name */
  countryName: string;
  /** Node participation status: participating | paused | excluded */
  status: NodeParticipationStatus;
  /** ISO timestamp of last successful local training */
  lastLocalTraining?: string | null;
  /** ISO timestamp of last successful model upload */
  lastModelUpload?: string | null;
  /** Single line health indicator or status note */
  healthIndicator?: string;
  /** Participation indicator for the last federated round */
  lastRoundParticipation?: boolean | string;
  /** Optional click handler for navigating to node detail view */
  onClick?: () => void;
  /** Compact card variation */
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
      className={`p-5 rounded-2xl bg-[#111827] border transition-all duration-200 flex flex-col justify-between group ${
        onClick ? 'cursor-pointer hover:border-teal-500/60 hover:bg-[#151f33] shadow-md hover:shadow-teal-500/10' : 'border-slate-800'
      } ${
        isParticipating ? 'border-slate-800' : status === 'paused' ? 'border-amber-800/40 bg-amber-950/10' : 'border-rose-900/40 bg-rose-950/10'
      }`}
    >
      {/* Top Header: Flag, Name & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow select-none">{flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white group-hover:text-teal-300 transition-colors">
                {countryName}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Sovereign Data Enclave</p>
          </div>
        </div>

        <StatusBadge status={status} size="sm" pulse={isParticipating} />
      </div>

      {/* Node Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[#0d1523] border border-slate-800/80 text-[11px]">
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Database className="w-3 h-3 text-cyan-400" /> Local Dataset
          </span>
          <p className="font-mono text-slate-200 font-bold mt-0.5">{metrics.rows}</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-400" /> DP Budget Spent
          </span>
          <p className="font-mono text-teal-300 font-bold mt-0.5">ε = {metrics.dpEpsilon} / 5.0</p>
        </div>
      </div>

      {/* Footer Info: Freshness & Round Status */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Model Upload:</span>
          <DataFreshnessLabel timestamp={lastModelUpload || lastLocalTraining} />
        </div>

        {healthIndicator && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Health:</span>
            <span className="text-slate-300 font-medium truncate max-w-[140px]" title={healthIndicator}>
              {healthIndicator}
            </span>
          </div>
        )}

        {onClick && (
          <div className="pt-2 flex items-center justify-between text-teal-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Inspect Sovereign Node</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryNodeCard;
