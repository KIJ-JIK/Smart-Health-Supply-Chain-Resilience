'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, AlertOctagon, LucideIcon } from 'lucide-react';

export type RiskLevel =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical';

export interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface RiskConfig {
  displayName: string;
  color: string;
  bg: string;
  border: string;
  dotColor: string;
  icon: LucideIcon;
}

const RISK_CONFIGS: Record<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL', RiskConfig> = {
  LOW: {
    displayName: 'LOW RISK',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    dotColor: '#10b981',
    icon: ShieldCheck,
  },
  MODERATE: {
    displayName: 'MODERATE',
    color: '#854d0e',
    bg: '#fefce8',
    border: '#fde047',
    dotColor: '#eab308',
    icon: AlertCircle,
  },
  HIGH: {
    displayName: 'HIGH RISK',
    color: '#9a3412',
    bg: '#fff7ed',
    border: '#fed7aa',
    dotColor: '#f97316',
    icon: AlertTriangle,
  },
  CRITICAL: {
    displayName: 'CRITICAL',
    color: '#991b1b',
    bg: '#fef2f2',
    border: '#fecaca',
    dotColor: '#ef4444',
    icon: AlertOctagon,
  },
};

export function RiskBadge({
  level,
  size = 'md',
  showIcon = true,
  pulse = false,
  label,
  className = '',
  style,
}: RiskBadgeProps) {
  const normalizedLevel = (level?.toUpperCase() ?? 'LOW') as 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  const config = RISK_CONFIGS[normalizedLevel] || RISK_CONFIGS.LOW;
  const IconComponent = config.icon;

  const sizeStyles = {
    sm: {
      padding: '2px 7px',
      fontSize: '10px',
      iconSize: 11,
      dotSize: 5,
      gap: '4px',
    },
    md: {
      padding: '3px 10px',
      fontSize: '11px',
      iconSize: 13,
      dotSize: 6,
      gap: '5px',
    },
    lg: {
      padding: '5px 13px',
      fontSize: '12px',
      iconSize: 15,
      dotSize: 7,
      gap: '6px',
    },
  }[size];

  const shouldPulse = pulse || normalizedLevel === 'CRITICAL';

  return (
    <span
      className={`risk-badge risk-${normalizedLevel.toLowerCase()} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        lineHeight: 1.2,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        boxShadow: normalizedLevel === 'CRITICAL' ? '0 1px 2px rgba(220, 38, 38, 0.15)' : 'none',
        ...style,
      }}
      title={`Risk Level: ${config.displayName} (Masterplan §35)`}
    >
      {/* Animated pulse dot */}
      {shouldPulse && (
        <span
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '180%',
              height: '180%',
              borderRadius: '50%',
              backgroundColor: config.dotColor,
              opacity: 0.6,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          <span
            style={{
              position: 'relative',
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
              borderRadius: '50%',
              backgroundColor: config.dotColor,
            }}
          />
        </span>
      )}

      {showIcon && !shouldPulse && (
        <IconComponent size={sizeStyles.iconSize} />
      )}

      <span>{label ?? config.displayName}</span>
    </span>
  );
}
