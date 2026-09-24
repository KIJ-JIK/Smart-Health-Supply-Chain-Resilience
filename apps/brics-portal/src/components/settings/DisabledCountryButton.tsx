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
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed opacity-60"
        aria-describedby="add-country-tooltip"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Add Sovereign Member Enclave</span>
      </button>

      {isHovered && (
        <div
          id="add-country-tooltip"
          role="tooltip"
          className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-80 p-3.5 rounded-xl bg-[#0d1523] border border-slate-700 text-white shadow-2xl z-50 pointer-events-none space-y-1"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Consortium Membership Governed</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">{tooltipText}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-solid border-[#0d1523] border-b-transparent border-x-transparent" />
        </div>
      )}
    </div>
  );
};

export default DisabledCountryButton;
