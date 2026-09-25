import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-[#152b4d] ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
};

export const CardSkeleton: React.FC<{ height?: number }> = ({ height = 140 }) => {
  return (
    <div
      className="card p-5 flex flex-col justify-between animate-pulse"
      style={{ minHeight: height }}
    >
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height={14} />
        <Skeleton width={28} height={28} borderRadius={4} />
      </div>
      <Skeleton width="60%" height={28} />
      <div className="pt-2 border-t border-slate-200 dark:border-[#1e3a5f]/60 flex items-center justify-between">
        <Skeleton width="30%" height={12} />
        <Skeleton width="20%" height={12} />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e3a5f]">
        <Skeleton width="25%" height={16} />
        <Skeleton width="15%" height={14} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#1e3a5f]/40">
          <Skeleton width="35%" height={14} />
          <Skeleton width="20%" height={14} />
          <Skeleton width="15%" height={14} />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
