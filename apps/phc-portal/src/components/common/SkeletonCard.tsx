import React from 'react';

interface SkeletonCardProps {
  lines?: number;
  showIcon?: boolean;
  className?: string;
}

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] ${className}`}
    style={{
      animation: 'shimmer 1.5s infinite',
      backgroundSize: '200% 100%',
      backgroundImage:
        'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)',
    }}
  />
);

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 2,
  showIcon = true,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm animate-pulse ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          {lines > 2 && (
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          )}
        </div>
        {showIcon && (
          <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 ml-3 shrink-0" />
        )}
      </div>
    </div>
  );
};

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <div
        key={i}
        className="h-3 bg-slate-200 dark:bg-slate-700 rounded"
        style={{ flex: i === 0 ? '1.5' : '1' }}
      />
    ))}
  </div>
);
