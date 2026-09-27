import React, { useState } from 'react';
import { Shield, FileText, Sparkles, X, Award, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <>
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Attribution */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 text-center">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-[11px] font-medium leading-none">
              Built by <strong className="font-bold text-teal-950 dark:text-teal-100">Ansh, Arya, Sumiya, Abdullah</strong> for{' '}
              <span className="font-semibold text-teal-800 dark:text-teal-300">
                Build with AI: Code for Communities — Second Edition
              </span>
            </span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => { setTab('terms'); setModalOpen(true); }}
              className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium underline-offset-4 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms and Conditions</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => { setTab('privacy'); setModalOpen(true); }}
              className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium underline-offset-4 hover:underline"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-10 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 font-bold text-base">
                {tab === 'terms' ? <FileText className="w-5 h-5 text-teal-600" /> : <Shield className="w-5 h-5 text-teal-600" />}
                <span>{tab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-slate-100/50 dark:bg-slate-950/30 pt-2">
              <button
                onClick={() => setTab('terms')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 ${
                  tab === 'terms' ? 'border-teal-600 text-teal-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'
                }`}
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => setTab('privacy')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 ${
                  tab === 'privacy' ? 'border-teal-600 text-teal-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'
                }`}
              >
                Privacy Policy
              </button>
            </div>

            <div className="mx-6 mt-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-2.5 text-xs text-teal-900 dark:text-teal-200">
              <Award className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Build with AI: Code for Communities — Second Edition</strong>. Built by <strong>Ansh, Arya, Sumiya, Abdullah</strong>.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {tab === 'terms' ? (
                <>
                  <p><strong>1. Operational Support:</strong> AURA Point PHC is an autonomous operational assistant providing FEFO inventory optimization, bed telemetry, and emergency dispatch.</p>
                  <p><strong>2. Clinical Responsibility:</strong> Final clinical and prescription decisions rest with licensed medical officers.</p>
                  <p><strong>3. Auditability:</strong> All stock deductions, offline mutations, and dispatches are cryptographically logged for audit compliance.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Data Sovereignty:</strong> Patient records remain stored locally inside client IndexedDB and encrypted facility storage.</p>
                  <p><strong>2. De-identification:</strong> Clinical footfall and triage telemetry synchronized to state servers undergo mathematical de-identification.</p>
                  <p><strong>3. Compliance:</strong> Aligns with ABDM, DISHA, and HIPAA standards for health privacy protection.</p>
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
