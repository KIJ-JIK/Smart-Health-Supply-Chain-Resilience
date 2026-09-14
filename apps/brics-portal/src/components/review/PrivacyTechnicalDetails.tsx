'use client';

import React, { useState } from 'react';
import { colors, typography } from '@/styles/theme';
import type { PrivacyBudgetEntry } from '@/types/federated';

export interface PrivacyTechnicalDetailsProps {
  entries: PrivacyBudgetEntry[];
}

export const PrivacyTechnicalDetails: React.FC<PrivacyTechnicalDetailsProps> = ({
  entries,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${colors.bg.borderSubtle}`,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: colors.bg.surfaceHover,
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          color: colors.text.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          ...typography.bodySmall,
          fontWeight: 600,
        }}
      >
        <span>Technical Details &amp; Mathematical Audit (DP-SGD Ledger)</span>
        <span style={{ fontSize: '0.875rem' }}>{isOpen ? 'Hide' : 'Expand'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${colors.bg.borderSubtle}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundColor: colors.bg.surface,
          }}
        >
          <p
            style={{
              ...typography.bodySmall,
              color: colors.text.muted,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Raw differential privacy telemetry from <code>privacy_budget_ledger</code> (Dataset 25).
            Guarantees \((\epsilon, \delta)\)-differential privacy under Gaussian mechanism with clip norm
            bounding local gradient sensitivities.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...typography.bodySmall }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.bg.border}`,
                    color: colors.text.muted,
                    textAlign: 'left',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '6px 8px' }}>Country</th>
                  <th style={{ padding: '6px 8px' }}>Round ε (Epsilon)</th>
                  <th style={{ padding: '6px 8px' }}>Cumulative ε</th>
                  <th style={{ padding: '6px 8px' }}>Delta (δ)</th>
                  <th style={{ padding: '6px 8px' }}>Noise Multiplier</th>
                  <th style={{ padding: '6px 8px' }}>Clip Norm</th>
                  <th style={{ padding: '6px 8px' }}>Local Samples</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: `1px solid ${colors.bg.borderSubtle}`,
                      fontFamily: 'monospace',
                      color: colors.text.secondary,
                    }}
                  >
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: colors.text.primary }}>
                      {entry.countryId}
                    </td>
                    <td style={{ padding: '6px 8px', color: colors.status.amber.text }}>
                      {entry.epsilonThisRound.toFixed(4)}
                    </td>
                    <td style={{ padding: '6px 8px', color: colors.text.primary, fontWeight: 600 }}>
                      {entry.cumulativeEpsilon.toFixed(4)} / {entry.budgetLimit.toFixed(1)}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{entry.deltaThisRound.toExponential(1)}</td>
                    <td style={{ padding: '6px 8px' }}>{entry.noiseMultiplier?.toFixed(3) || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{entry.clipNorm?.toFixed(2) || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      {entry.localSampleCount?.toLocaleString() || '—'}
                    </td>
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
