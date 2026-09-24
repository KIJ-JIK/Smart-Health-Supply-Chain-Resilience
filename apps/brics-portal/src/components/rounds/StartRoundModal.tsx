import React, { useState } from 'react';
import { Play, X, ShieldAlert, Cpu, Sliders, Layers } from 'lucide-react';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import type { StartRoundInput } from '@/types/federated';

export interface StartRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: StartRoundInput) => Promise<void>;
  isSubmitting?: boolean;
}

export const StartRoundModal: React.FC<StartRoundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [targetModel, setTargetModel] = useState('v1.21-resilience-transformer');
  const [minimumNodes, setMinimumNodes] = useState(4);
  const [roundTimeoutHours, setRoundTimeoutHours] = useState(72);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleFinalConfirm = async () => {
    setIsConfirmOpen(false);
    await onSubmit({
      targetModel,
      minimumNodes,
      roundTimeoutHours,
    });
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-[#0d1523] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Configure &amp; Launch Federated Round
                </h3>
                <p className="text-xs text-slate-400">
                  Cross-Border FedAvg Dispatch with DP-SGD Privacy Bounds
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleOpenConfirmation} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Target Model Version &amp; Architecture
              </label>
              <input
                type="text"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                required
              />
              <p className="text-[11px] text-slate-400">
                Base architecture deployed across India, Brazil, Russia, China, and South Africa enclaves.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Minimum Sovereign Quorum
                </label>
                <select
                  value={minimumNodes}
                  onChange={(e) => setMinimumNodes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value={3}>3 of 5 Nations</option>
                  <option value={4}>4 of 5 Nations (Recommended)</option>
                  <option value={5}>5 of 5 Nations (Unanimous)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Round Window Timeout
                </label>
                <select
                  value={roundTimeoutHours}
                  onChange={(e) => setRoundTimeoutHours(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours (Standard)</option>
                  <option value={120}>120 Hours</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
              <span className="font-bold text-teal-400 flex items-center gap-1.5 text-[11px]">
                <Cpu className="w-3.5 h-3.5" /> Privacy &amp; Cryptography Guardrails
              </span>
              <p className="text-[11px] text-slate-400">
                Gaussian differential privacy noise (σ=1.12, ε-budget increment ≤ 0.35) will be enforced on all local node client gradients.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-md shadow-teal-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Review &amp; Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Broadcast Federated Learning Round"
        description={`Initiating this round will broadcast model architecture ${targetModel} to all sovereign enclaves. Minimum quorum is set to ${minimumNodes}/5 nodes with a ${roundTimeoutHours}-hour completion window.`}
        confirmLabel="Broadcast to Enclaves"
        onConfirm={handleFinalConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};

export default StartRoundModal;
