'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLanguage = 'en' | 'hi';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

function applyLanguage(lang: AppLanguage) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
  document.documentElement.setAttribute('data-lang', lang);
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => {
        applyLanguage(lang);
        set({ language: lang });
      },
      toggleLanguage: () => {
        const next: AppLanguage = get().language === 'en' ? 'hi' : 'en';
        applyLanguage(next);
        set({ language: next });
      },
    }),
    {
      name: 'governance-language',
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.language);
      },
    }
  )
);

// ── Translations ───────────────────────────────────────────────────────────────
// Minimal flat key→value translation map.  Add more keys as needed.
export const TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  // Nav
  'nav.governance':       { en: 'Governance',            hi: 'शासन' },
  'nav.medicine':         { en: 'Medicine Intelligence', hi: 'दवा आसूचना' },
  'nav.patients':         { en: 'Patient Intelligence',  hi: 'रोगी आसूचना' },
  'nav.workforce':        { en: 'Workforce Intelligence',hi: 'कार्यबल आसूचना' },
  'nav.resources':        { en: 'Resource Capacity',     hi: 'संसाधन क्षमता' },
  'nav.forecasts':        { en: 'AI Forecasts',          hi: 'एआई पूर्वानुमान' },
  'nav.redistribution':   { en: 'Redistribution',        hi: 'पुनर्वितरण' },
  'nav.supply-chain':     { en: 'Supply Chain',          hi: 'आपूर्ति श्रृंखला' },
  'nav.emergency':        { en: 'Emergency / Pandemic',  hi: 'आपातकाल / महामारी' },
  'nav.simulator':        { en: 'Crisis Simulator',      hi: 'संकट सिम्युलेटर' },
  'nav.copilot':          { en: 'AI Copilot',            hi: 'एआई सहयात्री' },
  'nav.analytics':        { en: 'Analytics & Reports',   hi: 'विश्लेषण और रिपोर्ट' },
  'nav.audit':            { en: 'Audit Log',             hi: 'लेखापरीक्षण लॉग' },
  'nav.gis':              { en: 'GIS Health Map',        hi: 'जीआईएस स्वास्थ्य मानचित्र' },

  // Header
  'header.jurisdiction':  { en: 'Jurisdiction Setup',   hi: 'क्षेत्राधिकार सेटअप' },
  'header.crisis_active': { en: 'Crisis Active',        hi: 'संकट सक्रिय' },
  'header.activate_crisis': { en: 'Activate Crisis',    hi: 'संकट सक्रिय करें' },
  'header.normal_mode':   { en: 'Normal Mode',          hi: 'सामान्य मोड' },
  'header.sign_out':      { en: 'Sign Out',             hi: 'साइन आउट' },
  'header.live_alerts':   { en: 'Live Alerts',          hi: 'लाइव अलर्ट' },

  // Common
  'common.loading':       { en: 'Loading…',             hi: 'लोड हो रहा है…' },
  'common.national':      { en: 'National',             hi: 'राष्ट्रीय' },
  'common.state':         { en: 'State',                hi: 'राज्य' },
  'common.district':      { en: 'District',             hi: 'जिला' },
  'common.sanctioned':    { en: 'Sanctioned',           hi: 'स्वीकृत' },
  'common.in_position':   { en: 'In Position',          hi: 'पद पर' },
  'common.vacant':        { en: 'Vacancies',            hi: 'रिक्तियाँ' },
  'common.beds':          { en: 'Beds',                 hi: 'बिस्तर' },
  'common.oxygen':        { en: 'Oxygen',               hi: 'ऑक्सीजन' },
  'common.refresh':       { en: 'Refresh',              hi: 'रीफ्रेश' },
  'common.export':        { en: 'Export',               hi: 'निर्यात' },
  'common.view_details':  { en: 'View Details',         hi: 'विवरण देखें' },
};

/** Helper hook to get a translated string */
export function useT() {
  const lang = useLanguageStore((s) => s.language);
  return (key: string): string => {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[lang] ?? entry['en'];
  };
}
