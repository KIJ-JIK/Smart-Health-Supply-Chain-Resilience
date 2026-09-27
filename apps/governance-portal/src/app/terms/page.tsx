'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, Award, Shield } from 'lucide-react';
import { TERMS_AND_CONDITIONS } from '@/components/legal/legalContent';
import { AuraLogo } from '@/components/brand/AuraLogo';
import { SiteFooter } from '@/components/layout/SiteFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#070e1b] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0c1524]/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <AuraLogo size={28} />
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                  AURA
                </span>
                <span className="text-neutral-300 dark:text-neutral-700 font-mono text-xs">/</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium tracking-tight">
                  Terms & Conditions
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 py-10">
          {/* Title Card */}
          <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0c1524] border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {TERMS_AND_CONDITIONS.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Version {TERMS_AND_CONDITIONS.version} • Last updated {TERMS_AND_CONDITIONS.lastUpdated}
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-3">
              <Award className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-900 dark:text-teal-200">
                <strong className="font-semibold">Build with AI: Code for Communities — Second Edition</strong>
                <p className="mt-0.5 text-teal-800/90 dark:text-teal-300/80">
                  Built by <strong>Ansh, Arya, Sumiya, Abdullah</strong> to safeguard community public health and supply chain integrity.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {TERMS_AND_CONDITIONS.sections.map((section, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#0c1524] border border-neutral-200 dark:border-neutral-800 shadow-xs"
              >
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  {section.title}
                </h2>
                <div className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
