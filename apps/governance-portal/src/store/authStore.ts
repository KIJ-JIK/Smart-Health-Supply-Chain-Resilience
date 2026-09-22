// ─────────────────────────────────────────────────────────────────────────────
// Auth / Session store — Zustand
//
// Holds the current user identity and role. In production this is populated
// from the real auth token (e.g. JWT decoded on page load). In dev mode a
// role-switcher UI writes directly to this store.
//
// RBAC rules enforced here:
//  - national_admin → stateId = null, districtId = null
//  - state_admin    → stateId set, districtId = null
//  - district_admin → stateId set, districtId set
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

// ── Preset personas for dev-mode role switcher ────────────────────────────────
export const DEV_PERSONAS: Record<UserRole, User> = {
  national_admin: {
    id: 'dev-nat-001',
    name: 'Dr. Rajesh Kumar (National)',
    role: 'national_admin',
    stateId: null,
    districtId: null,
    email: 'nat-admin@gov.in',
  },
  state_admin: {
    id: 'dev-state-001',
    name: 'Smt. Priya Sharma (Maharashtra)',
    role: 'state_admin',
    stateId: 'state-mh',
    districtId: null,
    email: 'mh-admin@gov.in',
  },
  district_admin: {
    id: 'dev-dist-001',
    name: 'Suresh Iyer (Pune District)',
    role: 'district_admin',
    stateId: 'state-mh',
    districtId: 'dist-pune',
    email: 'pune-admin@gov.in',
  },
};

interface AuthState {
  user: User;
  isAuthenticated: boolean;
  isDevMode: boolean;
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  /** Convenience helpers */
  canAccessNational: () => boolean;
  canAccessState: (stateId: string) => boolean;
  canAccessDistrict: (districtId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: DEV_PERSONAS.national_admin,
      isAuthenticated: false,
      isDevMode: process.env.NODE_ENV !== 'production',

      setUser: (user) => set({ user }),

      login: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ isAuthenticated: false }),

      switchRole: (role) =>
        set({ user: DEV_PERSONAS[role], isAuthenticated: true }),

      canAccessNational: () => get().user.role === 'national_admin',

      canAccessState: (stateId) => {
        const { user } = get();
        if (user.role === 'national_admin') return true;
        return user.stateId === stateId;
      },

      canAccessDistrict: (districtId) => {
        const { user } = get();
        if (user.role === 'national_admin') return true;
        if (user.role === 'state_admin') return true; // state sees all districts
        return user.districtId === districtId;
      },
    }),
    {
      name: 'governance-portal-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
