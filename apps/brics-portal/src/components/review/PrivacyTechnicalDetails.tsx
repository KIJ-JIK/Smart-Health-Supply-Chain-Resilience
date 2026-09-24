import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import type { PrivacyBudgetEntry } from '@/types/federated';

export interface PrivacyTechnicalDetailsProps {
  entries: PrivacyBudgetEntry[];
}

export const PrivacyTechnicalDetails: React.FC<PrivacyTechnicalDetailsProps> = ({
  entries,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d1523]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-teal-400" />
          <span>Differential Privacy Technical Audit Ledger (DP-SGD Parameters)</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <span>{isOpen ? 'Collapse' : 'Expand Ledger'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800 bg-[#111827] space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Cryptographic ledger logs from <code className="font-mono text-teal-300">privacy_budget_ledger</code>.
            Guarantees \((\epsilon, \delta)\)-differential privacy under Gaussian noise mechanisms bounding local gradient sensitivities.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Country</th>
                  <th className="py-2 px-3">Round ε</th>
                  <th className="py-2 px-3">Cumulative ε</th>
                  <th className="py-2 px-3">Delta (δ)</th>
                  <th className="py-2 px-3">Noise Multiplier</th>
                  <th className="py-2 px-3">Clip Norm</th>
                  <th className="py-2 px-3">Local Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">{entry.countryId}</td>
                    <td className="py-2.5 px-3 text-teal-400">{entry.epsilonThisRound.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{entry.cumulativeEpsilon.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{entry.deltaThisRound.toExponential(1)}</td>
                    <td className="py-2.5 px-3 text-slate-300">σ = {(entry.noiseMultiplier ?? 1.12).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{(entry.clipNorm ?? 1.0).toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{(entry.localSampleCount ?? 15000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyTechnicalDetails;
