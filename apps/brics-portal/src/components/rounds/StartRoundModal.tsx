'use client';

import React, { useState } from 'react';
import { colors, typography } from '@/styles/theme';
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
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 20,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.bg.border}`,
            borderRadius: 10,
            width: '100%',
            maxWidth: 520,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.bg.borderSubtle}`,
              paddingBottom: 14,
            }}
          >
            <div>
              <h3 style={{ ...typography.titleMedium, color: colors.text.primary, margin: 0 }}>
                Configure &amp; Launch Federated Round
              </h3>
              <div style={{ ...typography.bodySmall, color: colors.text.muted, marginTop: 2 }}>
                Cross-Border Federated Learning Dispatch
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.muted,
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleOpenConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label
                style={{
                  ...typography.bodySmall,
                  fontWeight: 600,
                  color: colors.text.secondary,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Target Model Architecture / Identifier
              </label>
              <input
                type="text"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: `1px solid ${colors.bg.border}`,
                  backgroundColor: colors.bg.surfaceHover,
                  color: colors.text.primary,
                  ...typography.body,
                  outline: 'none',
                }}
                placeholder="e.g. v1.21-resilience-transformer"
              />
              <span style={{ fontSize: '0.6875rem', color: colors.text.muted, marginTop: 4, display: 'block' }}>
                Base model weights from which participating national nodes will compute weight deltas.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label
                  style={{
                    ...typography.bodySmall,
                    fontWeight: 600,
                    color: colors.text.secondary,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Minimum Quorum Required
                </label>
                <select
                  value={minimumNodes}
                  onChange={(e) => setMinimumNodes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.bg.border}`,
                    backgroundColor: colors.bg.surfaceHover,
                    color: colors.text.primary,
                    ...typography.body,
                    outline: 'none',
                  }}
                >
                  <option value={3}>3 Sovereign Nodes</option>
                  <option value={4}>4 Sovereign Nodes (Standard)</option>
                  <option value={5}>5 Sovereign Nodes (Full Consensus)</option>
                </select>
                <span style={{ fontSize: '0.6875rem', color: colors.text.muted, marginTop: 4, display: 'block' }}>
                  Default is 4 to permit 1 degraded node without halting aggregation.
                </span>
              </div>

              <div>
                <label
                  style={{
                    ...typography.bodySmall,
                    fontWeight: 600,
                    color: colors.text.secondary,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Round Timeout (Hours)
                </label>
                <input
                  type="number"
                  min={12}
                  max={168}
                  step={12}
                  value={roundTimeoutHours}
                  onChange={(e) => setRoundTimeoutHours(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.bg.border}`,
                    backgroundColor: colors.bg.surfaceHover,
                    color: colors.text.primary,
                    ...typography.body,
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.6875rem', color: colors.text.muted, marginTop: 4, display: 'block' }}>
                  Maximum time window for cross-border local training and upload.
                </span>
              </div>
            </div>

            {/* Cross-border dispatch cost advisory */}
            <div
              style={{
                backgroundColor: colors.status.amber.bg,
                border: `1px solid ${colors.status.amber.border}`,
                borderRadius: 6,
                padding: 12,
                fontSize: '0.75rem',
                color: colors.status.amber.text,
                lineHeight: 1.4,
              }}
            >
              <strong>Oversight Reminder:</strong> Initiating a federated training round consumes
              differential privacy budget across India, Brazil, Russia, China, and South Africa. A confirmation summary is mandatory.
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                borderTop: `1px solid ${colors.bg.borderSubtle}`,
                paddingTop: 16,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${colors.bg.border}`,
                  backgroundColor: 'transparent',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  ...typography.bodySmall,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: colors.brand.primary,
                  color: '#ffffff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  ...typography.bodySmall,
                  fontWeight: 600,
                }}
              >
                Review &amp; Initiate Round
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Summary Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Federated Round Initiation"
        description="Federation rounds are computationally intensive and trigger synchronous DP-SGD local training across 5 sovereign nations. Verify the parameters before final dispatch:"
        confirmLabel="Authorize Round Launch"
        cancelLabel="Back to Configuration"
        isDestructive={false}
        onConfirm={handleFinalConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      >
        <div
          style={{
            backgroundColor: colors.bg.surfaceHover,
            padding: 14,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            border: `1px solid ${colors.bg.borderSubtle}`,
            ...typography.bodySmall,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.text.muted }}>Target Model:</span>
            <strong style={{ color: colors.text.primary }}>{targetModel}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.text.muted }}>Quorum Required:</span>
            <strong style={{ color: colors.text.primary }}>{minimumNodes} of 5 Sovereign Nodes</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.text.muted }}>Window Deadline:</span>
            <strong style={{ color: colors.text.primary }}>{roundTimeoutHours} Hours</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.text.muted }}>Coordinator:</span>
            <strong style={{ color: colors.status.green.text }}>FedAvg + DP-SGD Secure Aggregator</strong>
          </div>
        </div>
      </ConfirmationDialog>
    </>
  );
};
