'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface ErrorStateProps {
  title?: string;
  error?: Error | { message: string } | string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Federated Data',
  error,
  onRetry,
  isRetrying = false,
}) => {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'A network error or schema mismatch occurred while resolving federated queries.';

  return (
    <div
      style={{
        backgroundColor: colors.status.red.bg,
        border: `1px solid ${colors.status.red.border}`,
        borderRadius: 8,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <h3
        style={{
          ...typography.titleMedium,
          color: colors.status.red.text,
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          ...typography.body,
          color: colors.text.secondary,
          maxWidth: 520,
          margin: 0,
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {errorMessage}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            marginTop: 4,
            padding: '8px 18px',
            borderRadius: 6,
            border: `1px solid ${colors.status.red.border}`,
            backgroundColor: colors.bg.surface,
            color: colors.text.primary,
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            ...typography.bodySmall,
            fontWeight: 600,
          }}
        >
          {isRetrying ? 'Retrying...' : 'Retry Query'}
        </button>
      )}
    </div>
  );
};
