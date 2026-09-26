import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  X,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Lock,
  Globe2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import type { StartRoundInput } from '@/types/federated';

export interface StartRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: StartRoundInput) => Promise<void>;
  isSubmitting?: boolean;
}

interface NodeSimulationState {
  code: string;
  name: string;
  flag: string;
  records: string;
  progress: number;
  status: 'dispatching' | 'training' | 'dp_noise' | 'signed';
}

const INITIAL_NODES: NodeSimulationState[] = [
  { code: 'IN', name: 'India (Varanasi Enclave)', flag: '🇮🇳', records: '45,200 records', progress: 0, status: 'dispatching' },
  { code: 'BR', name: 'Brazil (São Paulo Enclave)', flag: '🇧🇷', records: '38,400 records', progress: 0, status: 'dispatching' },
  { code: 'RU', name: 'Russia (Moscow Enclave)', flag: '🇷🇺', records: '32,100 records', progress: 0, status: 'dispatching' },
  { code: 'CN', name: 'China (Shanghai Enclave)', flag: '🇨🇳', records: '51,800 records', progress: 0, status: 'dispatching' },
  { code: 'ZA', name: 'South Africa (Cape Town)', flag: '🇿🇦', records: '29,500 records', progress: 0, status: 'dispatching' },
];

export const StartRoundModal: React.FC<StartRoundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const [targetModel, setTargetModel] = useState('v1.21-resilience-transformer');
  const [minimumNodes, setMinimumNodes] = useState(4);
  const [roundTimeoutHours, setRoundTimeoutHours] = useState(72);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<'dispatch' | 'training' | 'aggregation' | 'completed'>('dispatch');
  const [simNodes, setSimNodes] = useState<NodeSimulationState[]>(INITIAL_NODES);
  const [createdRoundId, setCreatedRoundId] = useState<string>('');

  if (!isOpen) return null;

  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleFinalConfirm = async () => {
    setIsConfirmOpen(false);
    setIsSimulating(true);
    setSimStep('dispatch');
    setSimNodes(INITIAL_NODES.map((n) => ({ ...n, progress: 15, status: 'dispatching' })));

    // Trigger GraphQL mutation in background
    await onSubmit({
      targetModel,
      minimumNodes,
      roundTimeoutHours,
    });

    // Step 1: Dispatch -> Training (after 1s)
    setTimeout(() => {
      setSimStep('training');
      setSimNodes((prev) =>
        prev.map((n, i) => ({
          ...n,
          progress: 40 + i * 12,
          status: 'training',
        }))
      );
    }, 1000);

    // Step 2: Training -> DP Noise & Sign (after 2.2s)
    setTimeout(() => {
      setSimNodes((prev) =>
        prev.map((n) => ({
          ...n,
          progress: 85,
          status: 'dp_noise',
        }))
      );
    }, 2200);

    // Step 3: Central Aggregation (after 3.2s)
    setTimeout(() => {
      setSimStep('aggregation');
      setSimNodes((prev) =>
        prev.map((n) => ({
          ...n,
          progress: 100,
          status: 'signed',
        }))
      );
    }, 3200);

    // Step 4: Complete & Ready for Review (after 4.2s)
    setTimeout(() => {
      setSimStep('completed');
      setCreatedRoundId(targetModel);
    }, 4200);
  };

  const handleGoToReview = () => {
    setIsSimulating(false);
    onClose();
    navigate('/review');
  };

  const handleCloseAll = () => {
    setIsSimulating(false);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={isSimulating ? undefined : onClose}
      >
        <div
          className="bg-white dark:bg-[#0f1f38] border border-slate-200 dark:border-[#1e3a5f] rounded-xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1e3a5f] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                {isSimulating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {isSimulating ? 'Live Cross-Border Federated Training' : 'Configure & Launch Federated Round'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isSimulating
                    ? 'Real-time telemetry streaming from sovereign member enclaves'
                    : 'Cross-Border FedAvg Dispatch with DP-SGD Privacy Bounds'}
                </p>
              </div>
            </div>
            {!isSimulating && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#152b4d] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* SIMULATION ACTIVE VIEW */}
          {isSimulating ? (
            <div className="space-y-4 py-1">
              {/* Step indicator pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-[#152b4d] border border-blue-200 dark:border-[#1e3a5f] text-xs">
                <span className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  {simStep === 'dispatch' && 'Stage 1/4: Dispatching Architecture to 5 Enclaves...'}
                  {simStep === 'training' && 'Stage 2/4: Computing Local PyTorch Gradients...'}
                  {simStep === 'aggregation' && 'Stage 3/4: Enforcing DP-SGD Noise & Central FedAvg...'}
                  {simStep === 'completed' && 'Stage 4/4: Checkpoint Created! Ready for Human Sign-Off'}
                </span>
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {simStep === 'completed' ? '100% DONE' : 'IN PROGRESS'}
                </span>
              </div>

              {/* 5 Enclaves Live Progress */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {simNodes.map((node) => (
                  <div
                    key={node.code}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0a1628] border border-slate-200 dark:border-[#1e3a5f] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{node.flag}</span>
                          <span>{node.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{node.records}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-[10px]">
                      {node.status === 'signed' ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Signed
                        </span>
                      ) : node.status === 'dp_noise' ? (
                        <span className="text-teal-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> DP σ=1.12
                        </span>
                      ) : (
                        <span className="text-blue-400 font-medium">Training {node.progress}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer CTA for Simulation */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a5f] flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {simStep === 'completed'
                    ? 'Candidate v1.21 checkpoint aggregated with +36.8% accuracy gain.'
                    : 'Encrypted weight transfer strictly adheres to national data residency.'}
                </span>
                {simStep === 'completed' ? (
                  <button
                    onClick={handleGoToReview}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 animate-bounce"
                  >
                    <span>Go to Model Review Gate &amp; Sign-Off</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1.5 cursor-wait"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Aggregating Enclaves...</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* CONFIGURATION FORM VIEW */
            <form onSubmit={handleOpenConfirmation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  Target Model Version &amp; Architecture
                </label>
                <input
                  type="text"
                  value={targetModel}
                  onChange={(e) => setTargetModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0a1628] border border-slate-300 dark:border-[#1e3a5f] text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Base architecture dispatched across India, Brazil, Russia, China, and South Africa enclaves.
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0a1628] border border-slate-300 dark:border-[#1e3a5f] text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0a1628] border border-slate-300 dark:border-[#1e3a5f] text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours (Standard)</option>
                    <option value={120}>120 Hours</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f]/80 space-y-1">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 text-[11px]">
                  <Cpu className="w-3.5 h-3.5" /> Privacy &amp; Cryptography Guardrails
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gaussian differential privacy noise (σ=1.12, ε-budget increment ≤ 0.35) and Paillier SMPC will be enforced on all local node client gradients. Zero raw records leave any country.
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1e3a5f]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#1e3a5f] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Review &amp; Broadcast</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Broadcast Federated Learning Round"
        description={`Initiating this round will broadcast model architecture ${targetModel} to all 5 sovereign enclaves. Minimum quorum is set to ${minimumNodes}/5 nodes with a ${roundTimeoutHours}-hour completion window.`}
        confirmLabel="Broadcast to Enclaves"
        onConfirm={handleFinalConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};

export default StartRoundModal;
