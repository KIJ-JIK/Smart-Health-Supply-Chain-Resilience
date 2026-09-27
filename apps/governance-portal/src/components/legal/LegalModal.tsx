'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, CheckCircle2, Award, ExternalLink } from 'lucide-react';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from './legalContent';

export type LegalTab = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export function LegalModal({ isOpen, initialTab = 'terms', onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = activeTab === 'terms' ? TERMS_AND_CONDITIONS : PRIVACY_POLICY;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#0c1524] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden z-10 text-neutral-900 dark:text-neutral-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/75 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              {activeTab === 'terms' ? <FileText className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy & Data Sovereignty'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>Version {content.version}</span>
                <span>•</span>
                <span>Updated {content.lastUpdated}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'terms'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 bg-white dark:bg-[#0c1524]'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'privacy'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 bg-white dark:bg-[#0c1524]'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Hackathon Callout Banner */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-3">
          <Award className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
            <strong className="font-semibold">Build with AI: Code for Communities — Second Edition</strong>
            <p className="mt-0.5 text-teal-800/90 dark:text-teal-300/80">
              Architected and built by <strong>Ansh, Arya, Sumiya, Abdullah</strong> for public health resilience and autonomous supply chain governance.
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {content.sections.map((sec, idx) => (
            <section key={idx} className="space-y-2">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                {sec.title}
              </h3>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 pl-3.5">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/75 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Legally binding system charter & compliance agreement</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-all shadow-xs active:scale-95"
            >
              I Understand
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
