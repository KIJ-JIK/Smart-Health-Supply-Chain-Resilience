'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuraLogo } from '@/components/brand/AuraLogo';
import { LegalModal, LegalTab } from '@/components/legal/LegalModal';
import { Shield, FileText, Heart, Sparkles } from 'lucide-react';

interface SiteFooterProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

export function SiteFooter({ className = '', variant = 'full' }: SiteFooterProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<LegalTab>('terms');

  const openLegal = (tab: LegalTab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <footer
        className={`w-full border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-[#070e1b]/80 backdrop-blur-md py-6 px-4 sm:px-6 text-xs text-neutral-500 dark:text-neutral-400 relative z-20 ${className}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          {/* Top row: Brand + Hackathon Attribution */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand identity */}
            <div className="flex items-center gap-2.5 font-semibold text-neutral-800 dark:text-neutral-200">
              <AuraLogo size={20} />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="tracking-tight text-neutral-900 dark:text-white font-bold">
                  AURA Health Platform
                </span>
                <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600 font-mono">•</span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                  Autonomous Universal Resilience Architecture
                </span>
              </div>
            </div>

            {/* Hackathon Attribution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 text-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-[11px] font-medium leading-none">
                Built by <strong className="font-bold text-teal-950 dark:text-teal-100">Ansh, Arya, Sumiya, Abdullah</strong> for{' '}
                <span className="font-semibold text-teal-800 dark:text-teal-300">
                  Build with AI: Code for Communities — Second Edition
                </span>
              </span>
            </div>
          </div>

          {/* Bottom row: Legal Links & Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
              <span>© {new Date().getFullYear()} AURA Governance. Distributed Healthcare Supply Resilience.</span>
            </div>

            {/* Interactive Terms & Privacy buttons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => openLegal('terms')}
                className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium cursor-pointer underline-offset-4 hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms and Conditions</span>
              </button>

              <span className="text-neutral-300 dark:text-neutral-700">•</span>

              <button
                type="button"
                onClick={() => openLegal('privacy')}
                className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium cursor-pointer underline-offset-4 hover:underline"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>

              <span className="text-neutral-300 dark:text-neutral-700">•</span>

              <Link
                href="/terms"
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                title="Open Terms in dedicated page"
              >
                Full Terms
              </Link>

              <span className="text-neutral-300 dark:text-neutral-700">•</span>

              <Link
                href="/privacy"
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                title="Open Privacy Policy in dedicated page"
              >
                Full Privacy
              </Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Interactive Modal Dialog */}
      <LegalModal
        isOpen={modalOpen}
        initialTab={modalTab}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
