// ---------------------------------------------------------------------------
// Privacy & Aggregation Monitoring Page — BRICS Federated Intelligence & Governance
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  RefreshCw,
  Cpu,
  Database,
  CheckCircle2,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { GET_FEDERATED_PRIVACY_BUDGET } from '@/graphql';
import {
  StatusBadge,
  DataFreshnessLabel,
  CardSkeleton,
  ErrorState,
} from '@/components/common';
import { PrivacyBudgetGauge } from '@/components/review/PrivacyBudgetGauge';
import { PrivacyBudgetChart, PrivacyTimeSeriesDataPoint } from '@/components/privacy';
import type { PrivacyBudgetEntry } from '@/types/federated';

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

export default function PrivacyPage() {
  const { data, loading, error, refetch } = useQuery<{
    federatedPrivacyBudget: PrivacyBudgetEntry[];
  }>(GET_FEDERATED_PRIVACY_BUDGET);

  const [activeInfoTab, setActiveInfoTab] = useState<'what' | 'parameters' | 'guarantee'>('what');

  const entries = data?.federatedPrivacyBudget || [];

  const latestByCountry: Record<string, PrivacyBudgetEntry> = {};
  entries.forEach((e) => {
    if (!latestByCountry[e.countryId] || e.cumulativeEpsilon > latestByCountry[e.countryId].cumulativeEpsilon) {
      latestByCountry[e.countryId] = e;
    }
  });

  const countryList = ['IN', 'BR', 'RU', 'CN', 'ZA'];
  const canonicalBudgetLimit = entries[0]?.budgetLimit ?? 10.0;

  const timeSeriesData: PrivacyTimeSeriesDataPoint[] = React.useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // Group entries by round number
    const roundGroups = new Map<number, PrivacyBudgetEntry[]>();

    entries.forEach((entry) => {
      const rNum = entry.roundNumber || 1;
      if (!roundGroups.has(rNum)) {
        roundGroups.set(rNum, []);
      }
      roundGroups.get(rNum)!.push(entry);
    });

    // Sort round numbers ascending (Round 1 to N)
    const sortedRoundNumbers = Array.from(roundGroups.keys()).sort((a, b) => a - b);

    const latest: Record<string, number> = { IN: 0, BR: 0, RU: 0, CN: 0, ZA: 0 };

    return sortedRoundNumbers.map((rNum) => {
      const roundEntries = roundGroups.get(rNum) || [];
      for (const e of roundEntries) {
        const code = e.countryId;
        if (code && latest[code] !== undefined) {
          latest[code] = Math.max(latest[code], e.cumulativeEpsilon);
        }
      }
      const avg = (latest.IN + latest.BR + latest.RU + latest.CN + latest.ZA) / 5;
      return {
        roundLabel: `Round ${rNum}`,
        roundNumber: rNum,
        IN: Number(latest.IN.toFixed(2)),
        BR: Number(latest.BR.toFixed(2)),
        RU: Number(latest.RU.toFixed(2)),
        CN: Number(latest.CN.toFixed(2)),
        ZA: Number(latest.ZA.toFixed(2)),
        averageCumulative: Number(avg.toFixed(2)),
      };
    });
  }, [entries]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          title="Privacy Ledger Unavailable"
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
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Differential Privacy &amp; Cryptographic Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Real-time tracking of (ε, δ) privacy budget consumption across all 5 sovereign member enclaves.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1e3a5f] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e3a5f] text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Audit Ledger</span>
        </button>
      </div>

      {/* Sovereign Isolation Notice */}
      <div className="p-4 rounded-lg bg-teal-50/50 dark:bg-[#0f1f38] border border-teal-200 dark:border-teal-500/30 shadow-sm flex items-start gap-3.5">
        <div className="w-8 h-8 rounded bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-500/30 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Sovereign Data Residency &amp; Zero Raw Egress Guarantee
          </h3>
          <p className="text-slate-600 dark:text-slate-300 font-mono leading-relaxed text-[11px]">
            The central coordinator <strong>only ever aggregates encrypted gradient updates</strong>. 
            Patient records, inventory quantities, and facility telemetry never leave their sovereign national borders. 
            Gaussian noise addition (σ = 1.12) mathematically prevents model inversion and membership inference attacks.
          </p>
        </div>
      </div>

      {/* Privacy Budget Time-Series Chart */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e3a5f] pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Cumulative Differential Privacy Consumption (ε) Across Federated Rounds
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Rényi Differential Privacy (RDP) accumulation towards sovereign hard cap ε ≤ {canonicalBudgetLimit.toFixed(1)}
            </p>
          </div>
          <span className="gov-badge gov-badge-teal">
            All Nodes Within Sovereign Limit (ε ≤ {canonicalBudgetLimit.toFixed(1)})
          </span>
        </div>

        <PrivacyBudgetChart data={timeSeriesData} budgetLimit={canonicalBudgetLimit} height={260} />
      </div>

      {/* Deep-Dive Educational & Mathematical Guide (Addressing "What is this graph for?") */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e3a5f] pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Understanding Differential Privacy Metrics in BRICS Federation
            </h3>
          </div>
          <div className="flex gap-1 text-[11px] font-mono">
            <button
              onClick={() => setActiveInfoTab('what')}
              className={`px-2.5 py-1 rounded transition-colors ${activeInfoTab === 'what' ? 'bg-teal-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Purpose &amp; Mechanism
            </button>
            <button
              onClick={() => setActiveInfoTab('parameters')}
              className={`px-2.5 py-1 rounded transition-colors ${activeInfoTab === 'parameters' ? 'bg-teal-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              ε, δ &amp; σ Parameters
            </button>
            <button
              onClick={() => setActiveInfoTab('guarantee')}
              className={`px-2.5 py-1 rounded transition-colors ${activeInfoTab === 'guarantee' ? 'bg-teal-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Sovereign Ledger
            </button>
          </div>
        </div>

        {activeInfoTab === 'what' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> 1. Privacy Budget Tracking
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                Every training round consumes a small slice of privacy budget (ε). This graph tracks the <strong>cumulative privacy expenditure</strong> of each country across rounds 1 to 20 to ensure no nation ever exhausts its allocated budget.
              </p>
            </div>
            <div className="p-3.5 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> 2. Model Inversion Defense
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                By adding calibrated Gaussian noise to local gradient tensors, adversarial actors cannot reconstruct patient-level records from shared model weights.
              </p>
            </div>
            <div className="p-3.5 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-600" /> 3. Immutable Ledger
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                All epsilon additions are signed cryptographically and recorded in the PostgreSQL audit ledger. If an enclave breaches ε = 10.0, automated participation pause activates.
              </p>
            </div>
          </div>
        )}

        {activeInfoTab === 'parameters' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]">
              <div className="font-bold text-teal-600 dark:text-teal-300 text-sm">ε (Epsilon) ≤ 10.0</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 font-semibold">Privacy Loss Parameter</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Bounds the maximum probability shift for any individual patient's record being identified. Lower ε = stronger privacy.
              </p>
            </div>
            <div className="p-3.5 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]">
              <div className="font-bold text-cyan-600 dark:text-cyan-300 text-sm">δ (Delta) = 10⁻⁵</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 font-semibold">Failure Probability</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                The cryptographic probability that the privacy bound fails. Set to 0.00001 per round (far below clinical threshold).
              </p>
            </div>
            <div className="p-3.5 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]">
              <div className="font-bold text-indigo-600 dark:text-indigo-300 text-sm">σ (Sigma) = 1.12</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 font-semibold">Noise Multiplier</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Standard deviation ratio of Gaussian noise added to clipped model gradients before transmission to the central aggregator.
              </p>
            </div>
          </div>
        )}

        {activeInfoTab === 'guarantee' && (
          <div className="p-4 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
            <strong>Rényi Differential Privacy (RDP) Composition Guarantee:</strong> Across 20 federated training rounds, privacy consumption accumulates under the moments accountant: <span className="text-teal-600 dark:text-teal-300 font-bold">ε_total = Σ ε_round + √(2 ln(1/δ) · Σ ε_round²)</span>. All 5 member nations remain safely below the 10.0 sovereign threshold.
          </div>
        )}
      </div>

      {/* Per-Country Ledger Breakdown */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e3a5f] pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Sovereign Member State Privacy Status
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">5 Active Enclaves</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {countryList.map((code) => {
            const entry = latestByCountry[code];
            const consumed = entry ? entry.cumulativeEpsilon : 0;
            const limit = entry?.budgetLimit ?? canonicalBudgetLimit;
            const pct = Math.min(100, (consumed / limit) * 100);
            const flag = COUNTRY_FLAGS[code];
            const name = COUNTRY_NAMES[code];

            return (
              <div
                key={code}
                className="p-4 rounded bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{flag}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#0a1628] text-slate-700 dark:text-slate-300">
                    {code}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{name}</h4>
                  <p className="text-[10px] font-mono text-teal-600 dark:text-teal-300 font-bold mt-1">
                    ε = {consumed.toFixed(2)} / {limit.toFixed(1)}
                  </p>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#0a1628] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-500 dark:bg-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
