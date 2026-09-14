'use client';

import React from 'react';
import { colors } from '@/styles/theme';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: colors.bg.surfaceHover,
        animation: 'pulse 1.5s ease-in-out infinite',
        border: `1px solid ${colors.bg.borderSubtle}`,
        ...style,
      }}
    />
  );
};

export const CardSkeleton: React.FC<{
  count?: number;
  height?: string | number;
  style?: React.CSSProperties;
}> = ({ count = 1, height, style }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.bg.border}`,
            borderRadius: 8,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            height,
            ...style,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="45%" height={20} />
            <Skeleton width="20%" height={20} borderRadius={10} />
          </div>
          <Skeleton width="75%" height={32} />
          <Skeleton width="60%" height={14} />
        </div>
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        backgroundColor: colors.bg.surface,
        borderRadius: 8,
        border: `1px solid ${colors.bg.border}`,
      }}
    >
      <div style={{ display: 'flex', gap: 16, paddingBottom: 10, borderBottom: `1px solid ${colors.bg.borderSubtle}` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} width={`${100 / columns}%`} height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={`cell-${r}-${c}`} width={`${100 / columns}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
};
