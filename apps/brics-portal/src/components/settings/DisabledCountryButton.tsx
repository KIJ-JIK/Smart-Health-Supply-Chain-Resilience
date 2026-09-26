import React, { useState } from 'react';
import { Plus, Lock, ShieldAlert } from 'lucide-react';

export interface DisabledCountryButtonProps {
  tooltipText?: string;
}

export const DisabledCountryButton: React.FC<DisabledCountryButtonProps> = ({
  tooltipText = 'Onboarding a new federation participant requires bilateral treaty and legal data-sovereignty review, not a self-service UI action.',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        disabled
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 dark:bg-[#152b4d] border border-slate-200 dark:border-[#1e3a5f] text-slate-400 dark:text-slate-500 text-xs font-semibold cursor-not-allowed opacity-70"
        aria-describedby="add-country-tooltip"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Add Sovereign Member Enclave</span>
      </button>

      {isHovered && (
        <div
          id="add-country-tooltip"
          role="tooltip"
          className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-80 p-3.5 rounded bg-white dark:bg-[#0f1f38] border border-slate-300 dark:border-[#1e3a5f] text-slate-900 dark:text-white shadow-xl z-50 pointer-events-none space-y-1"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider text-[10px]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Consortium Membership Governed</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono leading-tight">{tooltipText}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-solid border-white dark:border-[#0f1f38] border-b-transparent border-x-transparent" />
        </div>
      )}
    </div>
  );
};

export default DisabledCountryButton;
