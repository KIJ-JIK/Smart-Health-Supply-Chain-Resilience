import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'There are no active records matching your filter parameters.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center space-y-3 my-4">
      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#152b4d] text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-[#1e3a5f]">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3 py-1.5 rounded text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all font-mono"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Telemetry Ingestion Error',
  message = 'Failed to communicate with federated coordinator node.',
  onRetry,
}) => {
  return (
    <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
      <div className="flex items-center gap-3 text-left">
        <div className="w-9 h-9 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-500/30 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">{title}</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5 font-mono">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm shrink-0 font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Sync</span>
        </button>
      )}
    </div>
  );
};
