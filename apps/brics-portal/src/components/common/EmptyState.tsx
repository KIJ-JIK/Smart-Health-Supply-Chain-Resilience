'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        backgroundColor: colors.bg.surface,
        border: `1px dashed ${colors.bg.border}`,
        borderRadius: 8,
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {icon && <div style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</div>}
      <h3
        style={{
          ...typography.titleMedium,
          color: colors.text.primary,
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          ...typography.body,
          color: colors.text.muted,
          margin: 0,
          maxWidth: 480,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: 8,
            padding: '8px 18px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: colors.brand.primary,
            color: '#ffffff',
            cursor: 'pointer',
            ...typography.bodySmall,
            fontWeight: 600,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
