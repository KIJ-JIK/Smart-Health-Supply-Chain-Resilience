import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PhcStaffPersona {
  id: string;
  name: string;
  role: 'medical_officer' | 'pharmacist' | 'staff_nurse';
  roleLabel: string;
  facilityId: string;
  facilityName: string;
  district: string;
  state: string;
}

export const PHC_FACILITY_PRESETS = [
  {
    id: 'PHC-001',
    name: 'PHC Rampur',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    type: '24x7_PHC',
  },
  {
    id: 'PHC-MH-PUN-001',
    name: 'Hadapsar PHC',
    district: 'Pune',
    state: 'Maharashtra',
    type: '24x7_PHC',
  },
  {
    id: 'PHC-MH-PUN-002',
    name: 'Shirur Rural PHC',
    district: 'Pune',
    state: 'Maharashtra',
    type: '24x7_PHC',
  },
  {
    id: 'PHC-MH-PUN-003',
    name: 'Baramati Model PHC',
    district: 'Pune',
    state: 'Maharashtra',
    type: 'CHC',
  },
];

export const PHC_PERSONAS: PhcStaffPersona[] = [
  {
    id: 'staff-mo-001',
    name: 'Dr. Sharma',
    role: 'medical_officer',
    roleLabel: 'Primary Medical Officer (MO)',
    facilityId: 'PHC-001',
    facilityName: 'PHC Rampur',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
  },
  {
    id: 'staff-ph-002',
    name: 'Anil Verma',
    role: 'pharmacist',
    roleLabel: 'Chief Pharmacist',
    facilityId: 'PHC-001',
    facilityName: 'PHC Rampur',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
  },
  {
    id: 'staff-nr-003',
    name: 'Sister Sunita',
    role: 'staff_nurse',
    roleLabel: 'In-Charge Staff Nurse',
    facilityId: 'PHC-001',
    facilityName: 'PHC Rampur',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
  },
];

interface PhcAuthState {
  isAuthenticated: boolean;
  currentStaff: PhcStaffPersona;
  selectedFacility: typeof PHC_FACILITY_PRESETS[0];
  login: (staff: PhcStaffPersona, facilityId?: string) => void;
  logout: () => void;
  setFacility: (facilityId: string) => void;
}

export const usePhcAuthStore = create<PhcAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true, // Default active for development, can be toggled by user or logout
      currentStaff: PHC_PERSONAS[0],
      selectedFacility: PHC_FACILITY_PRESETS[0],

      login: (staff, facilityId) => {
        const fac = PHC_FACILITY_PRESETS.find((f) => f.id === (facilityId || staff.facilityId)) || PHC_FACILITY_PRESETS[0];
        set({
          isAuthenticated: true,
          currentStaff: {
            ...staff,
            facilityId: fac.id,
            facilityName: fac.name,
            district: fac.district,
            state: fac.state,
          },
          selectedFacility: fac,
        });
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      setFacility: (facilityId) => {
        const fac = PHC_FACILITY_PRESETS.find((f) => f.id === facilityId);
        if (fac) {
          const { currentStaff } = get();
          set({
            selectedFacility: fac,
            currentStaff: {
              ...currentStaff,
              facilityId: fac.id,
              facilityName: fac.name,
              district: fac.district,
              state: fac.state,
            },
          });
        }
      },
    }),
    {
      name: 'phc-portal-auth',
    }
  )
);
