'use client';

import React, { useState } from 'react';
import { colors, typography } from '@/styles/theme';

export interface DisabledCountryButtonProps {
  tooltipText?: string;
}

export const DisabledCountryButton: React.FC<DisabledCountryButtonProps> = ({
  tooltipText = 'Onboarding a new federation participant is an out-of-scope, Phase-5+ operational process requiring legal/data-sovereignty review, not a self-service UI action for this build.',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        disabled
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.bg.surfaceHover,
          color: colors.text.muted,
          border: `1px solid ${colors.bg.border}`,
          borderRadius: 6,
          padding: '9px 16px',
          ...typography.bodySmall,
          fontWeight: 600,
          cursor: 'not-allowed',
          opacity: 0.6,
        }}
        aria-describedby="add-country-tooltip"
      >
        <span>Add Sovereign Country Node</span>
      </button>

      {isHovered && (
        <div
          id="add-country-tooltip"
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            padding: '12px 14px',
            backgroundColor: '#1f2328',
            border: `1px solid ${colors.bg.border}`,
            borderRadius: 6,
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              ...typography.bodySmall,
              fontWeight: 700,
              color: '#58a6ff',
              marginBottom: 4,
            }}
          >
            Consortium Membership Restricted
          </div>
          <p
            style={{
              ...typography.bodySmall,
              fontSize: '0.6875rem',
              color: '#d0d7de',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {tooltipText}
          </p>
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: 6,
              borderStyle: 'solid',
              borderColor: `#1f2328 transparent transparent transparent`,
            }}
          />
        </div>
      )}
    </div>
  );
};
