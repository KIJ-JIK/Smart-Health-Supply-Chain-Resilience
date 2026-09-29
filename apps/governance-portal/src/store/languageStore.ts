'use client';

import { create } from 'zustand';

function applyLanguage(lang: 'en' | 'hi') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
  document.documentElement.setAttribute('data-lang', lang);
}

export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const GOV_TRANSLATIONS: TranslationDictionary = {
  // Brand & Header
  'brand.title': { en: 'AURA Vantage', hi: 'ऑरा वांटेज' },
  'brand.subtitle': { en: 'Health Supply Chain Resilience Command', hi: 'स्वास्थ्य आपूर्ति श्रृंखला कमांड सेंटर' },
  'header.nationalGrid': { en: 'NATIONAL HEALTH GRID', hi: 'राष्ट्रीय स्वास्थ्य ग्रिड' },
  'header.switchPortal': { en: 'Switch Portal', hi: 'पोर्टल बदलें' },
  'header.liveStream': { en: 'LIVE TELEMETRY', hi: 'लाइव टेलीमेट्री' },
  'header.liveAlerts': { en: 'Live Alerts', hi: 'सक्रिय चेतावनियां' },
  'header.unacknowledged': { en: 'unacknowledged', hi: 'अनिस्तारित' },
  'header.devPersona': { en: 'Active Role / Persona', hi: 'सक्रिय पद / भूमिका' },
  'header.logout': { en: 'Sign Out', hi: 'लॉग आउट' },
  'header.copilot': { en: 'AURA AI Copilot', hi: 'ऑरा एआई कोपायलट' },
  'header.language': { en: 'Language', hi: 'भाषा' },
  'header.english': { en: 'English', hi: 'English' },
  'header.hindi': { en: 'हिन्दी', hi: 'हिन्दी' },

  // Navigation Links & Breadcrumbs
  'nav.overview': { en: 'Platform Overview', hi: 'प्लेटफ़ॉर्म अवलोकन' },
  'nav.governance': { en: 'National Command Center', hi: 'राष्ट्रीय कमांड सेंटर' },
  'nav.jurisdiction': { en: 'Manage Jurisdiction', hi: 'क्षेत्राधिकार प्रबंधन' },
  'nav.gis': { en: 'GIS Health Map', hi: 'जीआईएस स्वास्थ्य मानचित्र' },
  'nav.medicine': { en: 'Medicine Intelligence', hi: 'दवा आपूर्ति विश्लेषण' },
  'nav.resources': { en: 'Resource Management', hi: 'संसाधन प्रबंधन' },
  'nav.workforce': { en: 'Workforce & Staff', hi: 'स्वास्थ्य कार्यबल' },
  'nav.patients': { en: 'Patient Intelligence', hi: 'रोगी विश्लेषण' },
  'nav.forecasts': { en: 'AI Forecasts', hi: 'एआई पूर्वानुमान' },
  'nav.earlyWarnings': { en: 'Early Warnings', hi: 'पूर्व चेतावनी प्रणाली' },
  'nav.redistribution': { en: 'Redistribution Hub', hi: 'दवा पुनर्वितरण' },
  'nav.supplyChain': { en: 'Supply Chain Audit', hi: 'आपूर्ति श्रृंखला ऑडिट' },
  'nav.emergency': { en: 'Emergency / Crisis Mode', hi: 'आपातकालीन / महामारी मोड' },
  'nav.simulator': { en: 'Crisis Simulator', hi: 'संकट सिम्युलेटर' },
  'nav.copilot': { en: 'Autonomous AI Copilot', hi: 'स्वायत्त एआई कोपायलट' },
  'nav.analytics': { en: 'Analytics & Reports', hi: 'विश्लेषण एवं रिपोर्ट' },
  'nav.audit': { en: 'Tamper-Evident Audit Log', hi: 'ऑडिट लॉग' },
  'nav.admin': { en: 'System Administration', hi: 'सिस्टम प्रशासन' },

  // Navigation Groups
  'nav.groupMain': { en: 'COMMAND & CONTROL', hi: 'कमांड एवं नियंत्रण' },
  'nav.groupSurveillance': { en: 'INTELLIGENCE & SURVEILLANCE', hi: 'निगरानी एवं पूर्वानुमान' },
  'nav.groupLogistics': { en: 'LOGISTICS & CRISIS', hi: 'लॉजिस्टिक्स एवं आपदा' },
  'nav.groupGovernance': { en: 'GOVERNANCE & AUDIT', hi: 'शासन एवं ऑडिट' },

  // National Key Performance Indicators (KPIs)
  'kpi.nationalFacilities': { en: 'Monitored PHC Facilities', hi: 'कुल मॉनिटर किए गए PHC केंद्र' },
  'kpi.totalBeds': { en: 'National Bed Capacity', hi: 'राष्ट्रीय बेड क्षमता' },
  'kpi.bedOccupancy': { en: 'Bed Occupancy Rate', hi: 'बेड ऑक्यूपेंसी दर' },
  'kpi.oxygenReserves': { en: 'Standby Oxygen Cylinders', hi: 'स्टैंडबाय ऑक्सीजन बैकअप' },
  'kpi.criticalStockouts': { en: 'Critical Medicine Stockouts', hi: 'गंभीर दवा स्टॉकआउट' },
  'kpi.activeSurges': { en: 'Active Outbreak Surges', hi: 'सक्रिय प्रकोप एवं अलर्ट' },
  'kpi.transfers': { en: 'Inter-PHC Transfers Active', hi: 'सक्रिय पुनर्वितरण ट्रांसफर' },
  'kpi.totalDoctors': { en: 'Registered Medical Officers', hi: 'पंजीकृत चिकित्सा अधिकारी' },

  // Roles & Personas
  'persona.nationalAdmin': { en: 'National Public Health Director', hi: 'राष्ट्रीय सार्वजनिक स्वास्थ्य निदेशक' },
  'persona.stateAdmin': { en: 'State Health Secretary', hi: 'राज्य स्वास्थ्य सचिव' },
  'persona.districtAdmin': { en: 'District Chief Medical Officer', hi: 'जिला मुख्य चिकित्सा अधिकारी' },
  'persona.phcDoctor': { en: 'Frontline PHC Medical Officer', hi: 'प्राथमिक स्वास्थ्य केंद्र डॉक्टर' },
  'persona.supplyOfficer': { en: 'Supply Chain Logistics Officer', hi: 'आपूर्ति श्रृंखला नोडल अधिकारी' },

  // AI Copilot
  'copilot.title': { en: 'AURA Autonomous Health Copilot', hi: 'ऑरा स्वायत्त स्वास्थ्य कोपायलट' },
  'copilot.subtitle': { en: 'Text-to-SQL Clinical Reasoning & Multi-Model Intelligence', hi: 'टेक्स्ट-टू-एसक्यूएल क्लिनिकल एवं डेटा विश्लेषण इंजन' },
  'copilot.placeholder': { en: 'Ask anything about PHCs, doctors, medicine stockouts, beds, or alerts...', hi: 'PHC, डॉक्टर, दवा स्टॉकआउट, बेड, या अलर्ट के बारे में पूछें...' },
  'copilot.send': { en: 'Send', hi: 'पूछें' },
  'copilot.clearChat': { en: 'Clear Chat', hi: 'चैट साफ़ करें' },
  'copilot.quickPrompts': { en: 'Suggested Inquiries', hi: 'सुझाए गए प्रश्न' },
  'copilot.promptWorkforce': { en: 'How many doctors and staff are in Bihar?', hi: 'बिहार में कितने डॉक्टर्स और स्टाफ हैं?' },
  'copilot.promptStockouts': { en: 'Which medicines are in critical stockout?', hi: 'कौन सी दवाएं स्टॉक समाप्त (Stockout) हो गई हैं?' },
  'copilot.promptBeds': { en: 'Show bed occupancy across facilities', hi: 'सभी PHC केंद्रों में बेड ऑक्यूपेंसी की स्थिति दिखाएं' },
  'copilot.promptAlerts': { en: 'What are the active clinical outbreak alerts?', hi: 'वर्तमान में सक्रिय महामारी एवं क्लिनिकल अलर्ट क्या हैं?' },
  'copilot.promptNationwide': { en: 'How many PHCs are listed throughout India?', hi: 'पूरे भारत में कुल कितने PHC केंद्र पंजीकृत हैं?' },

  // Common Actions
  'action.search': { en: 'Search...', hi: 'खोजें...' },
  'action.filter': { en: 'Apply Filters', hi: 'फ़िल्टर लगाएं' },
  'action.export': { en: 'Export CSV', hi: 'CSV डाउनलोड करें' },
  'action.refresh': { en: 'Refresh Data', hi: 'डेटा रिफ्रेश करें' },
  'action.close': { en: 'Close', hi: 'बंद करें' },
  'action.view': { en: 'View Analysis', hi: 'विश्लेषण देखें' },
  'action.approve': { en: 'Authorize Transfer', hi: 'ट्रांसफर स्वीकृत करें' },
  'action.dispatch': { en: 'Emergency Dispatch', hi: 'आपातकालीन प्रेषण' },
};

interface GovLanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  translateData: (text: string) => string;
}

const STORAGE_KEY = 'aura-portal-language';

export const useLanguageStore = create<GovLanguageState>((set, get) => ({
  language: (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Language)) || 'en',

  setLanguage: (lang: Language) => {
    applyLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    set({ language: lang });
  },

  toggleLanguage: () => {
    const nextLang = get().language === 'en' ? 'hi' : 'en';
    applyLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextLang);
    }
    set({ language: nextLang });
  },

  t: (key: string, defaultText?: string) => {
    const lang = get().language;
    const entry = GOV_TRANSLATIONS[key];
    if (entry) {
      return entry[lang] || entry.en || defaultText || key;
    }
    return defaultText || key;
  },

  translateData: (text: string) => {
    if (!text || get().language === 'en') return text;
    const clean = text.toLowerCase().trim();

    // Roles
    if (clean.includes('doctor') || clean.includes('medical officer')) return 'चिकित्सा अधिकारी / डॉक्टर';
    if (clean.includes('nurse') || clean.includes('anm')) return 'स्टाफ नर्स / एएनएम';
    if (clean.includes('pharmacist')) return 'फार्मासिस्ट';
    if (clean.includes('technician')) return 'बायोमेडिकल तकनीशियन';
    if (clean.includes('national_admin') || clean.includes('national admin')) return 'राष्ट्रीय निदेशक';
    if (clean.includes('state_admin') || clean.includes('state admin')) return 'राज्य स्वास्थ्य सचिव';
    if (clean.includes('district_admin') || clean.includes('district admin')) return 'जिला मुख्य चिकित्सा अधिकारी';

    // Statuses
    if (clean === 'active') return 'सक्रिय';
    if (clean === 'stockout' || clean === 'critical stockout') return 'स्टॉक समाप्त';
    if (clean === 'low stock' || clean === 'low_stock' || clean === 'warning') return 'कम स्टॉक चेतावनी';
    if (clean === 'critical') return 'गंभीर स्थिति';
    if (clean === 'open') return 'सक्रिय (Open)';
    if (clean === 'resolved') return 'हल किया गया';
    if (clean === 'optimal') return 'संतोषजनक';
    if (clean === 'recommended') return 'सिफारिश की गई';
    if (clean === 'approved') return 'स्वीकृत';
    if (clean === 'in_transit' || clean === 'transit') return 'मार्ग में';
    if (clean === 'completed') return 'पूर्ण';

    // States in Hindi
    if (clean === 'bihar') return 'बिहार';
    if (clean === 'maharashtra') return 'महाराष्ट्र';
    if (clean === 'uttar pradesh' || clean === 'up') return 'उत्तर प्रदेश';
    if (clean === 'karnataka') return 'कर्नाटक';
    if (clean === 'rajasthan') return 'राजस्थान';
    if (clean === 'tamil nadu' || clean === 'tamilnadu') return 'तमिलनाडु';
    if (clean === 'gujarat') return 'गुजरात';
    if (clean === 'madhya pradesh' || clean === 'mp') return 'मध्य प्रदेश';
    if (clean === 'west bengal' || clean === 'bengal') return 'पश्चिम बंगाल';
    if (clean === 'andhra pradesh') return 'आंध्र प्रदेश';
    if (clean === 'kerala') return 'केरल';
    if (clean === 'delhi' || clean.includes('delhi')) return 'दिल्ली (NCT)';
    if (clean === 'punjab') return 'पंजाब';
    if (clean === 'haryana') return 'हरियाणा';
    if (clean === 'odisha' || clean === 'orissa') return 'ओडिशा';
    if (clean === 'assam') return 'असम';
    if (clean === 'telangana') return 'तेलंगाना';

    return text;
  },
}));
