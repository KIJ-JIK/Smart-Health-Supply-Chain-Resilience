import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PhcFacilityBackendItem } from '../services/phcBackendService';

export interface PhcStaffPersona {
  id: string;
  name: string;
  role: 'medical_officer' | 'pharmacist' | 'staff_nurse' | string;
  roleLabel: string;
  facilityId: string;
  facilityName: string;
  district: string;
  state: string;
}

const DEFAULT_FACILITY: PhcFacilityBackendItem = {
  id: 'c0000003-0000-0000-0000-000000000001',
  name: 'Kothrud PHC',
  district: 'Pune',
  state: 'Maharashtra',
  total_beds: 30,
  occupied_beds: 27,
  emergency_beds: 5,
  isolation_beds: 3,
  oxygen_cylinders: 12,
  operational_status: 'active',
};

const DEFAULT_STAFF: PhcStaffPersona = {
  id: 'dr.anjali@phc.gov.in',
  name: 'Dr. Anjali Sharma',
  role: 'medical_officer',
  roleLabel: 'Primary Medical Officer (MO)',
  facilityId: DEFAULT_FACILITY.id,
  facilityName: DEFAULT_FACILITY.name,
  district: DEFAULT_FACILITY.district,
  state: DEFAULT_FACILITY.state,
};

interface PhcAuthState {
  isAuthenticated: boolean;
  token: string | null;
  currentStaff: PhcStaffPersona;
  selectedFacility: PhcFacilityBackendItem;
  login: (staff: PhcStaffPersona, facility: PhcFacilityBackendItem, token?: string) => void;
  logout: () => void;
  setFacility: (facility: PhcFacilityBackendItem) => void;
}

export const usePhcAuthStore = create<PhcAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: true, // Direct access enabled for instant walkthrough
      token: 'demo-phc-bearer-token-2026',
      currentStaff: DEFAULT_STAFF,
      selectedFacility: DEFAULT_FACILITY,

      login: (staff, facility, token) => {
        set({
          isAuthenticated: true,
          token: token || 'demo-phc-bearer-token-2026',
          currentStaff: {
            ...staff,
            facilityId: facility.id,
            facilityName: facility.name,
            district: facility.district,
            state: facility.state,
          },
          selectedFacility: facility,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('phc_auth_token');
          localStorage.removeItem('current_phc_id');
        }
        set({
          isAuthenticated: false,
          token: null,
        });
      },

      setFacility: (facility) => {
        set((state) => ({
          selectedFacility: facility,
          currentStaff: {
            ...state.currentStaff,
            facilityId: facility.id,
            facilityName: facility.name,
            district: facility.district,
            state: facility.state,
          },
        }));
      },
    }),
    {
      name: 'phc-portal-auth-v2',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = true;
          if (!state.token) state.token = 'demo-phc-bearer-token-2026';
          if (!state.selectedFacility?.id) state.selectedFacility = DEFAULT_FACILITY;
          if (!state.currentStaff?.id) state.currentStaff = DEFAULT_STAFF;
        }
      },
    }
  )
);
