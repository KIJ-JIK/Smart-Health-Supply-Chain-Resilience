import { create } from 'zustand';

export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const PHC_TRANSLATIONS: TranslationDictionary = {
  // Brand & Header
  'brand.title': { en: 'AURA Point', hi: 'ऑरा पॉइंट' },
  'brand.subtitle': { en: 'Primary Health Centre Node', hi: 'प्राथमिक स्वास्थ्य केंद्र नोड' },
  'header.live': { en: 'LIVE', hi: 'लाइव' },
  'header.offline': { en: 'OFFLINE', hi: 'ऑफलाइन' },
  'header.simulatedOffline': { en: 'Simulated Offline', hi: 'सिम्युलेटेड ऑफलाइन' },
  'header.online': { en: 'Online', hi: 'ऑनलाइन' },
  'header.syncing': { en: 'Syncing...', hi: 'सिंक हो रहा है...' },
  'header.syncSuccess': { en: 'Synced with Central Grid', hi: 'केंद्रीय ग्रिड से सिंक हुआ' },
  'header.emergencySos': { en: 'EMERGENCY SOS', hi: 'आपातकालीन एसओएस' },
  'header.switchPortal': { en: 'Switch Portal', hi: 'पोर्टल बदलें' },
  'header.logout': { en: 'Sign Out', hi: 'लॉग आउट' },
  'header.greetingMorning': { en: 'Good morning', hi: 'शुभ प्रभात' },
  'header.greetingAfternoon': { en: 'Good afternoon', hi: 'शुभ दोपहर' },
  'header.greetingEvening': { en: 'Good evening', hi: 'शुभ संध्या' },
  'header.language': { en: 'Language', hi: 'भाषा' },
  'header.english': { en: 'English', hi: 'English' },
  'header.hindi': { en: 'हिन्दी', hi: 'हिन्दी' },

  // Navigation Tabs
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.facility': { en: 'Facility Profile', hi: 'सुविधा विवरण' },
  'nav.inventory': { en: 'Medicine Inventory', hi: 'दवा भंडार' },
  'nav.billing': { en: 'Billing & FEFO', hi: 'बिलिंग एवं वितरण' },
  'nav.beds': { en: 'Beds & Capacity', hi: 'बेड एवं क्षमता' },
  'nav.oxygen': { en: 'Oxygen Telemetry', hi: 'ऑक्सीजन टेलीमेट्री' },
  'nav.equipment': { en: 'Biomedical Assets', hi: 'बायोमेडिकल उपकरण' },
  'nav.staff': { en: 'Staff & Roster', hi: 'स्टाफ एवं रोस्टर' },
  'nav.footfall': { en: 'Patient Footfall', hi: 'रोगी उपस्थिति' },
  'nav.requests': { en: 'Resource Requests', hi: 'संसाधन अनुरोध' },
  'nav.alerts': { en: 'Clinical Alerts', hi: 'सक्रिय अलर्ट' },
  'nav.emergency': { en: 'Emergency Mode', hi: 'आपातकालीन मोड' },
  'nav.sync': { en: 'Sync & Conflict Engine', hi: 'सिंक एवं विवाद इंजन' },
  'nav.testing': { en: 'Resilience Testing', hi: 'सिस्टम परीक्षण' },
  'nav.settings': { en: 'Facility Settings', hi: 'सुविधा सेटिंग्स' },

  // Navigation Categories
  'nav.catCore': { en: 'CORE OPERATIONS', hi: 'मुख्य संचालन' },
  'nav.catClinical': { en: 'CLINICAL CAPACITY', hi: 'चिकित्सा क्षमता' },
  'nav.catLogistics': { en: 'LOGISTICS & RESILIENCE', hi: 'लॉजिस्टिक्स एवं आपदा प्रबंधन' },
  'nav.catDev': { en: 'DIAGNOSTICS & AUDIT', hi: 'निरीक्षण एवं ऑडिट' },

  // Inventory Sub-tabs
  'inv.currentStock': { en: 'Current Stock', hi: 'वर्तमान स्टॉक' },
  'inv.batches': { en: 'Batch Master', hi: 'बैच मास्टर' },
  'inv.expiry': { en: 'Expiry Tracker', hi: 'समाप्ति ट्रैकर' },
  'inv.consumption': { en: 'Consumption Velocity', hi: 'दैनिक खपत गति' },
  'inv.movements': { en: 'Stock Movements', hi: 'स्टॉक आवागमन' },
  'inv.receiveStock': { en: 'Receive Stock', hi: 'स्टॉक प्राप्त करें' },
  'inv.adjustStock': { en: 'Adjust Buffer', hi: 'स्टॉक समायोजित करें' },

  // Metrics & Stats
  'metric.totalBeds': { en: 'Total Beds', hi: 'कुल बेड्स' },
  'metric.occupiedBeds': { en: 'Occupied Beds', hi: 'भरे हुए बेड्स' },
  'metric.availableBeds': { en: 'Available Vacant Beds', hi: 'उपलब्ध खाली बेड्स' },
  'metric.occupancyRate': { en: 'Occupancy Rate', hi: 'ऑक्यूपेंसी दर' },
  'metric.oxygenCylinders': { en: 'Oxygen Cylinders', hi: 'ऑक्सीजन सिलेंडर' },
  'metric.criticalStockouts': { en: 'Critical Stockouts', hi: 'स्टॉक समाप्त दवाएं' },
  'metric.lowStockItems': { en: 'Low Stock Warnings', hi: 'कम स्टॉक चेतावनियां' },
  'metric.dailyFootfall': { en: 'Daily Patient Visits', hi: 'दैनिक रोगी उपस्थिति' },
  'metric.activeStaff': { en: 'Staff On Duty', hi: 'ड्यूटी पर तैनात स्टाफ' },
  'metric.openAlerts': { en: 'Open Alerts', hi: 'सक्रिय चेतावनियां' },

  // Status Terms
  'status.active': { en: 'Active', hi: 'सक्रिय' },
  'status.optimal': { en: 'Optimal', hi: 'संतोषजनक' },
  'status.lowStock': { en: 'Low Stock', hi: 'कम स्टॉक' },
  'status.stockout': { en: 'Stockout', hi: 'स्टॉक समाप्त' },
  'status.critical': { en: 'Critical', hi: 'गंभीर' },
  'status.warning': { en: 'Warning', hi: 'चेतावनी' },
  'status.operational': { en: 'Operational', hi: 'कार्यरत' },
  'status.underMaintenance': { en: 'Maintenance', hi: 'रखरखाव में' },
  'status.present': { en: 'Present', hi: 'उपस्थित' },
  'status.absent': { en: 'Absent', hi: 'अनुपस्थित' },
  'status.onLeave': { en: 'On Leave', hi: 'अवकाश पर' },

  // Actions & Buttons
  'action.search': { en: 'Search medicines, patients, staff...', hi: 'दवा, मरीज, या स्टाफ खोजें...' },
  'action.filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'action.export': { en: 'Export Report', hi: 'रिपोर्ट डाउनलोड करें' },
  'action.save': { en: 'Save Changes', hi: 'सुरक्षित करें' },
  'action.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'action.confirm': { en: 'Confirm', hi: 'पुष्टि करें' },
  'action.dispense': { en: 'Dispense Medicine (FEFO)', hi: 'दवा वितरण करें (FEFO)' },
  'action.requestStock': { en: 'Request Emergency Stock', hi: 'आपातकालीन स्टॉक मांगें' },
  'action.viewDetails': { en: 'View Details', hi: 'विवरण देखें' },

  // Dynamic Data Dictionaries
  'role.doctor': { en: 'Doctor / Medical Officer', hi: 'डॉक्टर / चिकित्सा अधिकारी' },
  'role.medicalOfficer': { en: 'Medical Officer', hi: 'चिकित्सा अधिकारी' },
  'role.nurse': { en: 'Staff Nurse / ANM', hi: 'स्टाफ नर्स / एएनएम' },
  'role.anm': { en: 'Auxiliary Nurse Midwife (ANM)', hi: 'एएनएम नर्स' },
  'role.pharmacist': { en: 'Pharmacist', hi: 'फार्मासिस्ट' },
  'role.labTechnician': { en: 'Lab Technician', hi: 'लैब तकनीशियन' },
  'role.technician': { en: 'Biomedical Technician', hi: 'बायोमेडिकल तकनीशियन' },

  'cat.analgesic': { en: 'Analgesic & Antipyretic', hi: 'दर्द व बुखार निवारक' },
  'cat.antibiotic': { en: 'Broad-Spectrum Antibiotic', hi: 'एंटीबायोटिक' },
  'cat.rehydration': { en: 'Oral Rehydration Solution', hi: 'ओआरएस घोल' },
  'cat.antimalarial': { en: 'Antimalarial', hi: 'मलेरिया रोधी' },
  'cat.antidiabetic': { en: 'Antidiabetic / Insulin', hi: 'मधुमेह रोधी / इंसुलिन' },
  'cat.antihypertensive': { en: 'Antihypertensive', hi: 'रक्तचाप नियंत्रक' },
  'cat.supplement': { en: 'Nutritional Supplement', hi: 'पोषक सप्लीमेंट' },
  'cat.bronchodilator': { en: 'Respiratory Bronchodilator', hi: 'श्वसन इनहेलर' },
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  translateData: (text: string) => string;
}

const STORAGE_KEY = 'aura-portal-language';

export const useLanguageStore = create<LanguageState>((set, get) => ({
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
    const entry = PHC_TRANSLATIONS[key];
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
    if (clean.includes('technician')) return 'लैब तकनीशियन';

    // Statuses
    if (clean === 'active') return 'सक्रिय';
    if (clean === 'stockout') return 'स्टॉक समाप्त (0)';
    if (clean === 'low stock' || clean === 'low_stock') return 'कम स्टॉक';
    if (clean === 'critical') return 'गंभीर';
    if (clean === 'warning') return 'चेतावनी';
    if (clean === 'operational') return 'कार्यरत';
    if (clean === 'maintenance') return 'रखरखाव';

    // Categories
    if (clean.includes('analgesic')) return 'दर्द निवारक';
    if (clean.includes('antibiotic')) return 'एंटीबायोटिक';
    if (clean.includes('rehydration')) return 'ओआरएस घोल';
    if (clean.includes('antimalarial')) return 'मलेरिया रोधी';
    if (clean.includes('antidiabetic')) return 'इंसुलिन / मधुमेह';
    if (clean.includes('supplement')) return 'सप्लीमेंट / विटामिन';

    // Diseases
    if (clean === 'opd') return 'ओपीडी (OPD)';
    if (clean.includes('dengue')) return 'डेंगू बुखार';
    if (clean.includes('malaria')) return 'मलेरिया';
    if (clean.includes('anc')) return 'प्रसव पूर्व जांच (ANC)';
    if (clean.includes('immunisation') || clean.includes('immunization')) return 'टीकाकरण';

    return text;
  },
}));
