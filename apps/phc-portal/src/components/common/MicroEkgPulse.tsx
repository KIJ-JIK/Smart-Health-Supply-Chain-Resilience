import React from 'react';

interface MicroEkgPulseProps {
  status?: 'normal' | 'warning' | 'critical' | 'calm';
  className?: string;
  width?: number;
  height?: number;
}

export const MicroEkgPulse: React.FC<MicroEkgPulseProps> = ({
  status = 'normal',
  className = '',
  width = 120,
  height = 28,
}) => {
  const colors = {
    normal:   'stroke-emerald-400 dark:stroke-emerald-400',
    calm:     'stroke-teal-400 dark:stroke-teal-400',
    warning:  'stroke-amber-400 dark:stroke-amber-400',
    critical: 'stroke-rose-500 dark:stroke-rose-500',
  };

  const strokeColor = colors[status] || colors.normal;

  return (
    <div className={`relative overflow-hidden inline-flex items-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto opacity-75 group-hover:opacity-100 transition-opacity"
      >
        {/* Resting grid background line */}
        <line x1="0" y1="14" x2="120" y2="14" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2 3" />

        {/* EKG waveform path */}
        <path
          d="M 0 14 L 20 14 L 26 8 L 30 20 L 36 2 L 42 26 L 46 12 L 50 16 L 54 14 L 80 14 L 86 9 L 90 19 L 95 3 L 100 25 L 104 13 L 108 15 L 120 14"
          fill="none"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${strokeColor} ekg-path`}
        />
      </svg>
    </div>
  );
};
