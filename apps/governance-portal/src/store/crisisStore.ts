// ─────────────────────────────────────────────────────────────────────────────
// Crisis Store — Zustand
//
// Masterplan Crisis Mode:
// - Only national_admin may activate or deactivate crisis mode.
// - State and district admins see it as read-only.
// - When active, re-prioritizes primary layout across 9 crisis echelons.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface CrisisState {
  isCrisisMode: boolean;
  activatedAt: string | null;
  activatedBy: string | null;
  crisisTitle: string;
  crisisLevel: 'Level-1 (Local)' | 'Level-2 (Statewide)' | 'Level-3 (National Emergency)';

  // Actions
  activateCrisisMode: (user: User, title?: string, level?: CrisisState['crisisLevel']) => boolean;
  deactivateCrisisMode: (user: User) => boolean;
  canManageCrisis: (user: User) => boolean;
}

export const useCrisisStore = create<CrisisState>()(
  persist(
    (set, get) => ({
      isCrisisMode: false,
      activatedAt: null,
      activatedBy: null,
      crisisTitle: 'National Public Health Emergency Protocol',
      crisisLevel: 'Level-3 (National Emergency)',

      canManageCrisis: (user: User) => {
        return user.role === 'national_admin';
      },

      activateCrisisMode: (user: User, title, level) => {
        if (user.role !== 'national_admin') {
          return false; // Forbidden for state/district admins
        }
        set({
          isCrisisMode: true,
          activatedAt: new Date().toISOString(),
          activatedBy: user.name || 'National Command Center',
          crisisTitle: title || 'National Level-3 Public Health Surge Protocol',
          crisisLevel: level || 'Level-3 (National Emergency)',
        });
        return true;
      },

      deactivateCrisisMode: (user: User) => {
        if (user.role !== 'national_admin') {
          return false; // Forbidden for state/district admins
        }
        set({
          isCrisisMode: false,
          activatedAt: null,
          activatedBy: null,
        });
        return true;
      },
    }),
    {
      name: 'governance-portal-crisis-mode',
    },
  ),
);
