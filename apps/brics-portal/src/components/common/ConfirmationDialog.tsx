'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${isDestructive ? colors.status.red.border : colors.bg.border}`,
          borderRadius: 10,
          width: '100%',
          maxWidth: 480,
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3
            style={{
              ...typography.titleMedium,
              color: colors.text.primary,
              margin: 0,
            }}
          >
            {title}
          </h3>
          <div
            style={{
              ...typography.bodySmall,
              color: isDestructive ? colors.status.red.text : colors.text.muted,
              marginTop: 4,
              fontWeight: isDestructive ? 600 : 400,
            }}
          >
            National Admin Authorization Required
          </div>
        </div>

        <p
          style={{
            ...typography.body,
            color: colors.text.secondary,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>

        {children && <div style={{ margin: '4px 0' }}>{children}</div>}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 8,
            borderTop: `1px solid ${colors.bg.borderSubtle}`,
            paddingTop: 16,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
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
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: isDestructive
                ? colors.status.red.dot
                : colors.brand.primary,
              color: '#ffffff',
              cursor: 'pointer',
              ...typography.bodySmall,
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
