import React from 'react';

export interface AuraLogoProps {
  size?: number;
  className?: string;
  variant?: 'light' | 'dark' | 'emerald' | 'mono';
}

export const AuraLogo: React.FC<AuraLogoProps> = ({
  size = 28,
  className = '',
  variant = 'emerald',
}) => {
  const isDark = variant === 'dark';
  const strokeOuter = isDark ? '#94a3b8' : variant === 'mono' ? '#0f172a' : '#0f172a';
  const strokeInner = isDark ? '#1e293b' : '#e2e8f0';
  const crossColor = variant === 'mono' ? '#0f172a' : '#047857';
  const hubColor = isDark ? '#38bdf8' : '#0f172a';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AURA Point Logo"
    >
      <polygon
        points="100,18 172,59 172,141 100,182 28,141 28,59"
        stroke={strokeOuter}
        strokeWidth="10"
        strokeLinejoin="round"
        fill="none"
      />
      <polygon
        points="100,38 152,68 152,132 100,162 48,132 48,68"
        stroke={strokeInner}
        strokeWidth="4"
        strokeDasharray="6 4"
        fill="none"
      />
      <path d="M100 48 V152" stroke={crossColor} strokeWidth="18" strokeLinecap="round" />
      <path d="M48 100 H152" stroke={crossColor} strokeWidth="18" strokeLinecap="round" />
      <circle cx="100" cy="100" r="22" fill={hubColor} />
      <circle cx="100" cy="100" r="9" fill="#ffffff" />
      <circle cx="100" cy="18" r="7" fill={crossColor} />
      <circle cx="172" cy="59" r="7" fill="#0f766e" />
      <circle cx="172" cy="141" r="7" fill={crossColor} />
      <circle cx="100" cy="182" r="7" fill="#0f766e" />
      <circle cx="28" cy="141" r="7" fill={crossColor} />
      <circle cx="28" cy="59" r="7" fill="#0f766e" />
    </svg>
  );
};

export default AuraLogo;
