import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className={`bg-white dark:bg-[#0f1f38] border rounded-lg w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4 ${
          isDestructive ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-[#1e3a5f]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                isDestructive
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  : 'bg-blue-50 dark:bg-[#152b4d] text-blue-600 dark:text-blue-400 border-blue-200 dark:border-[#1e3a5f]'
              }`}
            >
              {isDestructive ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Sovereign Authorization Required
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#152b4d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>

        {children && <div className="py-1">{children}</div>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1e3a5f]">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#152b4d] dark:hover:bg-[#1c3864] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#1e3a5f] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
