import React from 'react';

interface ShimmerBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const ShimmerBadge: React.FC<ShimmerBadgeProps> = ({
  children,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md transition-colors hover:border-white/[0.22] hover:text-white ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
        style={{
          transform: 'skewX(-20deg)',
        }}
      />
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </div>
  );
};
