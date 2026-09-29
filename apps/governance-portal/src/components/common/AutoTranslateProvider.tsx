'use client';

import React, { useEffect } from 'react';
import { useLanguageStore, Language } from '@/store/languageStore';

/**
 * LanguageInitProvider
 *
 * Lightweight provider that:
 * 1. Restores the saved language from localStorage on mount (hydration-safe)
 * 2. Syncs language changes across browser tabs via the 'storage' event
 *
 * This replaces the previous DOM-walking AutoTranslateProvider approach,
 * which was incompatible with React's virtual DOM and caused stale text
 * after language toggling. All translations are now handled via the
 * reactive `useT()` hook inside each component.
 */
export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const { setLanguage } = useLanguageStore();

  useEffect(() => {
    // 1. Restore saved language on mount
    try {
      const saved = localStorage.getItem('aura-portal-language') as Language | null;
      if (saved === 'en' || saved === 'hi') {
        setLanguage(saved);
      }
    } catch {
      // localStorage unavailable (SSR guard)
    }

    // 2. Sync language changes across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'aura-portal-language' && e.newValue) {
        if (e.newValue === 'en' || e.newValue === 'hi') {
          setLanguage(e.newValue as Language);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setLanguage]);

  return <>{children}</>;
}

