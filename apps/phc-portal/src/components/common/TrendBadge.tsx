import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  delta: number;     // positive = up, negative = down, 0 = flat
  unit?: string;     // e.g. '%' or 'pts'
  size?: 'xs' | 'sm';
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  delta,
  unit = '%',
  size = 'xs',
}) => {
  const isUp = delta > 0;
  const isDown = delta < 0;
  const isFlat = delta === 0;

  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';

  if (isFlat) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${textSize} font-semibold text-slate-400 dark:text-slate-500`}>
        <Minus className="w-3 h-3" />
        <span>0{unit}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${textSize} font-bold ${
        isUp
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{isDown ? '' : '+'}{delta}{unit}</span>
    </span>
  );
};
