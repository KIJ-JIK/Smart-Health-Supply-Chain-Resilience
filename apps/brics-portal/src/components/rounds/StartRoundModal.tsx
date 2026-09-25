import React, { useState } from 'react';
import { Play, X, ShieldAlert, Cpu } from 'lucide-react';
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
        className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0f1f38] border border-slate-200 dark:border-[#1e3a5f] rounded-lg w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-[#152b4d] text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-[#1e3a5f]">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Configure &amp; Launch Federated Round
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cross-Border FedAvg Dispatch with DP-SGD Privacy Bounds
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#152b4d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleOpenConfirmation} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                Target Model Version &amp; Architecture
              </label>
              <input
                type="text"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="field font-mono"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Base architecture deployed across India, Brazil, Russia, China, and South Africa enclaves.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  Minimum Sovereign Quorum
                </label>
                <select
                  value={minimumNodes}
                  onChange={(e) => setMinimumNodes(Number(e.target.value))}
                  className="field font-mono"
                >
                  <option value={3}>3 of 5 Nations</option>
                  <option value={4}>4 of 5 Nations (Recommended)</option>
                  <option value={5}>5 of 5 Nations (Unanimous)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  Round Window Timeout
                </label>
                <select
                  value={roundTimeoutHours}
                  onChange={(e) => setRoundTimeoutHours(Number(e.target.value))}
                  className="field font-mono"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours (Standard)</option>
                  <option value={120}>120 Hours</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 space-y-1">
              <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 text-[11px]">
                <Cpu className="w-3.5 h-3.5" /> Privacy &amp; Cryptography Guardrails
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gaussian differential privacy noise (σ=1.12, ε-budget increment ≤ 0.35) will be enforced on all local node client gradients.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1e3a5f]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#1e3a5f] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm active:scale-95 flex items-center gap-1.5"
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
