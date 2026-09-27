import React from 'react';
import { SearchX, AlertCircle, Database, WifiOff, FileX } from 'lucide-react';

type EmptyVariant = 'no-data' | 'no-results' | 'error' | 'offline' | 'no-records';

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

const VARIANT_CONFIG: Record<EmptyVariant, { icon: React.ComponentType<{ className?: string }>; defaultTitle: string; defaultMessage: string }> = {
  'no-data': {
    icon: Database,
    defaultTitle: 'No data available',
    defaultMessage: 'There is no data to display for the current scope and filters.',
  },
  'no-results': {
    icon: SearchX,
    defaultTitle: 'No results found',
    defaultMessage: 'Try adjusting your filters or changing the jurisdiction scope.',
  },
  'error': {
    icon: AlertCircle,
    defaultTitle: 'Failed to load',
    defaultMessage: 'Could not fetch data from the backend. Check your connection and try again.',
  },
  'offline': {
    icon: WifiOff,
    defaultTitle: 'Backend unreachable',
    defaultMessage: 'The data service is not responding. Showing cached values where available.',
  },
  'no-records': {
    icon: FileX,
    defaultTitle: 'No records',
    defaultMessage: 'No records have been created yet.',
  },
};

export function EmptyState({
  variant = 'no-data',
  title,
  message,
  action,
  compact = false,
}: EmptyStateProps) {
  const { icon: Icon, defaultTitle, defaultMessage } = VARIANT_CONFIG[variant];

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-6 px-4 text-left">
        <Icon className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title ?? defaultTitle}</p>
          {message && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{message}</p>
          )}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--color-text-muted)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{title ?? defaultTitle}</p>
      <p className="text-xs text-[var(--color-text-muted)] max-w-xs leading-relaxed">{message ?? defaultMessage}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
