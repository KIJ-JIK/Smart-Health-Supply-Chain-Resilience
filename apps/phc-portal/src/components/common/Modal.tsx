import React, { useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  danger?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  danger = false,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Card */}
      <div
        className={`
          relative w-full ${widths[maxWidth]}
          bg-white dark:bg-[#111827]
          border ${danger ? 'border-rose-300 dark:border-rose-900' : 'border-slate-100 dark:border-[#1e2d3d]'}
          rounded-2xl shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)]
          overflow-hidden flex flex-col max-h-[90vh]
          animate-scale-spring
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className={`h-px bg-gradient-to-r from-transparent ${danger ? 'via-rose-500/60' : 'via-primary-500/50'} to-transparent`} />

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${danger ? 'border-rose-100 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-100 dark:border-[#1e2d3d] bg-slate-50/60 dark:bg-[#0d1929]/40'}`}>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#1e2d3d] transition-all hover:scale-110"
          >
            <X className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
