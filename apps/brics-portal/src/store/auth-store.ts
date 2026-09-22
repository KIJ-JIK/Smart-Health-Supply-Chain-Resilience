import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@/types/federated';

export interface CountryNodeInfo {
  code: string;
  name: string;
  flag: string;
  organization: string;
  endpoint: string;
}

export const BRICS_COUNTRIES: CountryNodeInfo[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    organization: 'Indian Council of Medical Research (ICMR) & MoHFW',
    endpoint: 'https://fed-coordinator.in.smarthealth.gov/api',
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    organization: 'Oswaldo Cruz Foundation (Fiocruz) & SUS',
    endpoint: 'https://fed-coordinator.br.smarthealth.gov/api',
  },
  {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    organization: 'Rospotrebnadzor & Federal Research Institute',
    endpoint: 'https://fed-coordinator.ru.smarthealth.gov/api',
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    organization: 'Chinese Center for Disease Control and Prevention (CCDC)',
    endpoint: 'https://fed-coordinator.cn.smarthealth.gov/api',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    organization: 'National Institute for Communicable Diseases (NICD)',
    endpoint: 'https://fed-coordinator.za.smarthealth.gov/api',
  },
];

export const BRICS_PERSONAS: Record<string, CurrentUser> = {
  IN: {
    id: 'usr-in-001',
    name: 'Sumaiya Khan',
    email: 'sumaiya.khan@smarthealth.gov.in',
    role: 'national_admin',
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
  },
  BR: {
    id: 'usr-br-002',
    name: 'Dr. Carlos Silva',
    email: 'carlos.silva@fiocruz.br',
    role: 'national_admin',
    countryCode: 'BR',
    countryName: 'Brazil',
    flag: '🇧🇷',
  },
  RU: {
    id: 'usr-ru-003',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@rospotrebnadzor.ru',
    role: 'national_admin',
    countryCode: 'RU',
    countryName: 'Russia',
    flag: '🇷🇺',
  },
  CN: {
    id: 'usr-cn-004',
    name: 'Prof. Wei Zhang',
    email: 'wei.zhang@chinacdc.cn',
    role: 'national_admin',
    countryCode: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
  },
  ZA: {
    id: 'usr-za-005',
    name: 'Thabo Mthembu',
    email: 'thabo.mthembu@nicd.ac.za',
    role: 'national_admin',
    countryCode: 'ZA',
    countryName: 'South Africa',
    flag: '🇿🇦',
  },
};

interface BricsAuthState {
  isAuthenticated: boolean;
  selectedCountry: CountryNodeInfo;
  currentUser: CurrentUser;
  login: (countryCode: string, customUser?: Partial<CurrentUser>) => void;
  logout: () => void;
  setCountry: (countryCode: string) => void;
}

export const useBricsAuthStore = create<BricsAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true, // Default to true with India for seamless dev, but allows logout & country switching
      selectedCountry: BRICS_COUNTRIES[0], // India
      currentUser: BRICS_PERSONAS['IN'],

      login: (countryCode: string, customUser?: Partial<CurrentUser>) => {
        const country = BRICS_COUNTRIES.find((c) => c.code === countryCode) || BRICS_COUNTRIES[0];
        const persona = BRICS_PERSONAS[countryCode] || BRICS_PERSONAS['IN'];
        set({
          isAuthenticated: true,
          selectedCountry: country,
          currentUser: {
            ...persona,
            ...customUser,
            countryCode: country.code,
            countryName: country.name,
            flag: country.flag,
          },
        });
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      setCountry: (countryCode: string) => {
        const country = BRICS_COUNTRIES.find((c) => c.code === countryCode) || BRICS_COUNTRIES[0];
        const persona = BRICS_PERSONAS[countryCode] || BRICS_PERSONAS['IN'];
        set({
          selectedCountry: country,
          currentUser: persona,
        });
      },
    }),
    {
      name: 'brics-portal-auth',
    }
  )
);
