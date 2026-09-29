import { create } from 'zustand';

export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const BRICS_TRANSLATIONS: TranslationDictionary = {
  // Brand & Header
  'brand.title': { en: 'AURA Sovereign', hi: 'ऑरा सॉवरेन' },
  'brand.subtitle': { en: 'BRICS Federated AI Grid & Multilateral Health Security', hi: 'ब्रिक्स फेडरेटेड एआई ग्रिड एवं बहुपक्षीय स्वास्थ्य सुरक्षा' },
  'header.enclavesActive': { en: '5/5 ENCLAVES ACTIVE', hi: '5/5 संप्रभु नोड्स सक्रिय' },
  'header.sovereignNodes': { en: 'Sovereign Nodes: 🇮🇳 India · 🇧🇷 Brazil · 🇷🇺 Russia · 🇨🇳 China · 🇿🇦 South Africa', hi: 'संप्रभु नोड्स: 🇮🇳 भारत · 🇧🇷 ब्राजील · 🇷🇺 रूस · 🇨🇳 चीन · 🇿🇦 दक्षिण अफ्रीका' },
  'header.aiBriefing': { en: 'Gemini AI Briefing', hi: 'जेमिनी एआई ब्रीफिंग' },
  'header.privacyBudget': { en: 'Privacy Budget', hi: 'गोपनीयता बजट' },
  'header.switchPortal': { en: 'Switch Portal', hi: 'पोर्टल बदलें' },
  'header.logout': { en: 'Sign Out', hi: 'लॉग आउट' },
  'header.language': { en: 'Language', hi: 'भाषा' },

  // Navigation Items
  'nav.overview': { en: 'Sovereign Overview', hi: 'संप्रभु अवलोकन' },
  'nav.rounds': { en: 'Federated Training & AI', hi: 'फेडरेटेड लर्निंग एवं एआई' },
  'nav.privacy': { en: 'Privacy Budget & Ledger', hi: 'गोपनीयता बजट लेजर' },
  'nav.review': { en: 'Model Review Gate', hi: 'मॉडल समीक्षा एवं स्वीकृति' },
  'nav.multilateral': { en: 'Multilateral Intelligence', hi: 'बहुपक्षीय खुफिया जानकारी' },

  // Metrics & Stats
  'metric.participatingNations': { en: 'Participating Sovereign Nations', hi: 'भागीदार संप्रभु राष्ट्र' },
  'metric.activeRound': { en: 'Active Federation Round', hi: 'सक्रिय फेडरेशन राउंड' },
  'metric.modelAccuracy': { en: 'Federated Model Accuracy', hi: 'फेडरेटेड मॉडल सटीकता' },
  'metric.dpBudgetRemaining': { en: 'DP Privacy Budget Remaining', hi: 'शेष अंतर गोपनीयता बजट (ε)' },
  'metric.lossConvergence': { en: 'Global Loss Convergence', hi: 'वैश्विक लॉस कन्वर्जेंस' },
  'metric.consensusStatus': { en: 'Quorum Consensus Status', hi: 'कोरम सहमति स्थिति' },

  // Enclaves
  'enclave.india': { en: 'India (Varanasi Enclave)', hi: 'भारत (वाराणसी एन्क्लेव)' },
  'enclave.brazil': { en: 'Brazil (São Paulo Enclave)', hi: 'ब्राजील (साओ पाउलो एन्क्लेव)' },
  'enclave.russia': { en: 'Russia (Moscow Enclave)', hi: 'रूस (मास्को एन्क्लेव)' },
  'enclave.china': { en: 'China (Shanghai Enclave)', hi: 'चीन (शंघाई एन्क्लेव)' },
  'enclave.southAfrica': { en: 'South Africa (Cape Town)', hi: 'दक्षिण अफ्रीका (केपटाउन)' },

  // Actions
  'action.launchRound': { en: 'Launch Federated Training Round', hi: 'नया फेडरेटेड राउंड शुरू करें' },
  'action.viewAudit': { en: 'Verify Cryptographic Signature', hi: 'क्रिप्टोग्राफिक हस्ताक्षर सत्यापित करें' },
  'action.approveCheckpoint': { en: 'Sign-Off & Approve Model', hi: 'मॉडल स्वीकृति एवं हस्ताक्षर करें' },
  'action.regenerateBriefing': { en: 'Regenerate Multilateral Briefing', hi: 'खुफिया बुलेटिन पुनः उत्पन्न करें' },
  'action.close': { en: 'Close', hi: 'बंद करें' },
};

interface BricsLanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const STORAGE_KEY = 'aura-portal-language';

export const useLanguageStore = create<BricsLanguageState>((set, get) => ({
  language: (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Language)) || 'en',

  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    set({ language: lang });
  },

  toggleLanguage: () => {
    const nextLang = get().language === 'en' ? 'hi' : 'en';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextLang);
    }
    set({ language: nextLang });
  },

  t: (key: string, defaultText?: string) => {
    const lang = get().language;
    const entry = BRICS_TRANSLATIONS[key];
    if (entry) {
      return entry[lang] || entry.en || defaultText || key;
    }
    return defaultText || key;
  },
}));
