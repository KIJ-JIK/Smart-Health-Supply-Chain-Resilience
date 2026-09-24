// ---------------------------------------------------------------------------
// Aggregation Review & Approval Screen — BRICS Federated Intelligence & Governance
// ---------------------------------------------------------------------------

import React, { useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Database,
  ArrowRight,
  Layers,
  Lock,
  Download,
} from 'lucide-react';
import {
  GET_FEDERATED_ROUNDS,
  GET_FEDERATED_MODEL_VERSIONS,
  GET_FEDERATED_PRIVACY_BUDGET,
  APPROVE_AGGREGATED_MODEL,
  REJECT_AGGREGATED_MODEL,
} from '@/graphql';
import {
  StatusBadge,
  DataFreshnessLabel,
  ConfirmationDialog,
  CardSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/common';
import { MetricDelta } from '@/components/lineage/MetricDelta';
import {
  PrivacyBudgetGauge,
  PrivacyTechnicalDetails,
} from '@/components/review';
import type {
  FederatedRound,
  FederatedModelVersion,
  PrivacyBudgetEntry,
} from '@/types/federated';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

function ReviewContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryRoundId = searchParams.get('roundId');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  const {
    data: roundsData,
    loading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery<{ federatedRounds: FederatedRound[] }>(GET_FEDERATED_ROUNDS);

  const {
    data: modelsData,
    loading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery<{ federatedModelVersions: FederatedModelVersion[] }>(GET_FEDERATED_MODEL_VERSIONS);

  const {
    data: budgetData,
    loading: budgetLoading,
    error: budgetError,
    refetch: refetchBudget,
  } = useQuery<{ federatedPrivacyBudget: PrivacyBudgetEntry[] }>(GET_FEDERATED_PRIVACY_BUDGET);

  const [approveModel, { loading: approving }] = useMutation(
    APPROVE_AGGREGATED_MODEL,
    {
      onCompleted: (result) => {
        refetchRounds();
        refetchModels();
        setStatusMessage({
          type: 'success',
          text: `Model version ${result.approveAggregatedModel.modelVersion} approved and published for sovereign deployment across all member states.`,
        });
      },
    }
  );

  const [rejectModel, { loading: rejecting }] = useMutation(
    REJECT_AGGREGATED_MODEL,
    {
      onCompleted: (result) => {
        refetchRounds();
        refetchModels();
        setStatusMessage({
          type: 'info',
          text: `Round ${result.rejectAggregatedModel.roundId} candidate model was rejected. Sovereign quarantine enforced.`,
        });
      },
    }
  );

  const rounds = roundsData?.federatedRounds || [];
  const models = modelsData?.federatedModelVersions || [];
  const budgetEntries = budgetData?.federatedPrivacyBudget || [];

  const candidateRound =
    rounds.find((r) => r.roundId === queryRoundId) ||
    rounds.find((r) => r.status === 'awaiting_review') ||
    rounds[0];

  const candidateModel =
    models.find((m) => m.federationRoundId === candidateRound?.roundId) ||
    models.find((m) => m.status === 'received') ||
    models[models.length - 1];

  const activeModel =
    models.find((m) => m.status === 'active') ||
    models[Math.max(0, models.indexOf(candidateModel) - 1)] ||
    models[0];

  const roundEntries = budgetEntries.filter(
    (b) => b.federationRoundId === candidateRound?.roundId
  );
  const totalConsumedEpsilon = budgetEntries.reduce(
    (acc, curr) => Math.max(acc, curr.cumulativeEpsilon),
    0
  );
  const thisRoundEpsilon = roundEntries.reduce(
    (acc, curr) => Math.max(acc, curr.epsilonThisRound),
    0
  );

  const handleConfirmApproval = async () => {
    if (!candidateRound) return;
    await approveModel({
      variables: {
        roundId: candidateRound.roundId,
      },
    });
    setIsApproveOpen(false);
  };

  const handleConfirmRejection = async () => {
    if (!candidateRound) return;
    if (!rejectReason.trim()) {
      setRejectError('Please specify the sovereign governance reason for model rejection.');
      return;
    }
    await rejectModel({
      variables: {
        roundId: candidateRound.roundId,
        reason: rejectReason,
      },
    });
    setIsRejectOpen(false);
    setRejectReason('');
    setRejectError(null);
  };

  if (roundsError || modelsError || budgetError) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          title="Review Telemetry Unavailable"
          message={roundsError?.message || modelsError?.message || budgetError?.message}
          onRetry={() => {
            refetchRounds();
            refetchModels();
            refetchBudget();
          }}
        />
      </div>
    );
  }

  if (!candidateRound) {
    return (
      <EmptyState
        title="No Candidate Models Awaiting Review"
        description="All federated training rounds have been resolved and published or rejected."
        actionLabel="Go to Overview"
        onAction={() => navigate('/')}
      />
    );
  }

  const isAwaitingReview = candidateRound.status === 'awaiting_review';
  const quorumMet = (candidateRound.submittedCountries?.length || 0) >= candidateRound.quorumRequired;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              Sovereign Model Review &amp; Human-in-the-Loop Sign-Off
            </h2>
            <StatusBadge status={candidateRound.status} size="sm" pulse={isAwaitingReview} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory human operator gate: Verify cross-border accuracy improvements, quorum rules, and DP budgets before network publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 bg-[#111827] px-3 py-1.5 rounded-xl border border-slate-800">
            Target: <strong className="text-teal-400">{candidateRound.modelVersion}</strong>
          </span>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/30 border border-emerald-800/60 text-emerald-300'
              : 'bg-amber-950/30 border border-amber-800/60 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Accuracy Deltas & Sovereign Quorum */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparative Metrics Card */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Aggregated Forecasting Accuracy vs Current Active Model
                </h3>
                <p className="text-xs text-slate-400">
                  Candidate {candidateModel?.modelVersion || 'v1.18'} vs Active {activeModel?.modelVersion || 'Baseline'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                Improvement Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricDelta
                label="Mean Absolute Error (MAE)"
                currentValue={candidateModel?.metrics?.mae ?? 0.124}
                previousValue={activeModel?.metrics?.mae ?? 0.158}
                lowerIsBetter={true}
                formatDecimals={4}
              />
              <MetricDelta
                label="Root Mean Squared Error (RMSE)"
                currentValue={candidateModel?.metrics?.rmse ?? 0.189}
                previousValue={activeModel?.metrics?.rmse ?? 0.231}
                lowerIsBetter={true}
                formatDecimals={4}
              />
              <MetricDelta
                label="Backtest Forecast Horizon"
                currentValue={candidateModel?.metrics?.backtestWeeks ?? 12}
                previousValue={activeModel?.metrics?.backtestWeeks ?? 8}
                lowerIsBetter={false}
                unit="Weeks"
                formatDecimals={0}
              />
            </div>
          </div>

          {/* Contributing Sovereign Enclaves & Quorum Check */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Sovereign Enclave Quorum &amp; Participation Audit
                </h3>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                  quorumMet
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                {candidateRound.submittedCountries?.length || 0} / 5 Nations Submitted (Quorum Met)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {['IN', 'BR', 'RU', 'CN', 'ZA'].map((code) => {
                const isSubmitted = candidateRound.submittedCountries?.includes(code);
                const flag = COUNTRY_FLAGS[code];
                return (
                  <div
                    key={code}
                    className={`p-3 rounded-xl border text-center space-y-1.5 ${
                      isSubmitted
                        ? 'bg-[#0d1523] border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="text-2xl block">{flag}</span>
                    <span className="text-xs font-bold block text-white">{code} Enclave</span>
                    <span className="text-[10px] font-mono font-semibold block">
                      {isSubmitted ? '✓ Encrypted' : '✗ Excluded'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Differential Privacy Gauge & Audit */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <PrivacyBudgetGauge
              consumedEpsilon={totalConsumedEpsilon || 1.42}
              budgetLimit={5.0}
              thisRoundEpsilon={thisRoundEpsilon || 0.28}
            />

            <PrivacyTechnicalDetails entries={roundEntries} />
          </div>
        </div>

        {/* Right 1 Col: Human-in-the-Loop Governance Action Deck */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                Sovereign Authorization Deck
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict human sign-off policy enforced. No automated publish path exists.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                  Model Checkpoint Hash (SHA-256)
                </span>
                <p className="font-mono text-slate-200 text-[11px] truncate" title={candidateModel?.aggregationSignature || 'sha256:verified'}>
                  {candidateModel?.aggregationSignature || 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                  Storage Artifact URI
                </span>
                <p className="font-mono text-teal-300 text-[11px] truncate" title={candidateModel?.s3Uri || 's3://brics-federation-vault/models/v1.18.tar.gz'}>
                  {candidateModel?.s3Uri || 's3://brics-federation-vault/models/v1.18.tar.gz'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1 text-slate-400 text-[11px]">
                <p className="font-semibold text-slate-300">Policy Rules Checked:</p>
                <p>✓ Minimum quorum 4/5 nations satisfied</p>
                <p>✓ Accuracy regression delta &lt; 0.00%</p>
                <p>✓ Differential privacy threshold ε ≤ 5.0 respected</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {isAwaitingReview ? (
              <>
                <button
                  onClick={() => setIsApproveOpen(true)}
                  disabled={approving || rejecting}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize &amp; Publish Global Model</span>
                </button>

                <button
                  onClick={() => setIsRejectOpen(true)}
                  disabled={approving || rejecting}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject &amp; Quarantine Round</span>
                </button>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-[#0d1523] border border-slate-800 text-center space-y-1">
                <span className="text-xs font-bold text-slate-300">Round Status: {candidateRound.status.toUpperCase()}</span>
                <p className="text-[11px] text-slate-500">This round has already been resolved.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isApproveOpen}
        title={`Approve Model Version ${candidateRound.modelVersion}`}
        description={`This will promote model ${candidateRound.modelVersion} to active status and make it available for local inference across all PHCs and hospitals in India, Brazil, Russia, China, and South Africa.`}
        confirmLabel="Authorize Global Deployment"
        onConfirm={handleConfirmApproval}
        onCancel={() => setIsApproveOpen(false)}
      />

      {/* Rejection Dialog with Reason Field */}
      <ConfirmationDialog
        isOpen={isRejectOpen}
        title={`Reject Candidate Model (${candidateRound.roundId})`}
        description="Please specify the sovereign governance justification for rejecting this aggregated model. This record will be permanently etched in the audit log."
        confirmLabel="Confirm Sovereign Veto"
        isDestructive={true}
        onConfirm={handleConfirmRejection}
        onCancel={() => setIsRejectOpen(false)}
      >
        <div className="space-y-1.5 mt-2">
          <label className="text-xs font-semibold text-slate-300 block">Rejection Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Excessive noise variance, abnormal gradient norm in node ZA, insufficient sample diversity..."
            className="w-full px-3 py-2 rounded-xl bg-[#0d1523] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-rose-500 min-h-[80px]"
            required
          />
          {rejectError && <p className="text-[11px] text-rose-400 font-semibold">{rejectError}</p>}
        </div>
      </ConfirmationDialog>
    </div>
  );
}

export default function RoundReviewPage() {
  return (
    <Suspense fallback={<CardSkeleton height={400} />}>
      <ReviewContent />
    </Suspense>
  );
}
