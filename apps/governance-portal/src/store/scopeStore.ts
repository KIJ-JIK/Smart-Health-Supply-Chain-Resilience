// ─────────────────────────────────────────────────────────────────────────────
// Scope Store (Zustand) — Masterplan §26 Drill-Down & Row-Level Scope
// National → State → District → PHC
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import {
  getStateById,
  getDistrictById,
  getPhcById,
  STATES,
} from '@/lib/geography';

export type ScopeLevel = 'national' | 'state' | 'district' | 'phc';

export interface ScopeState {
  level: ScopeLevel;
  stateId: string | null;
  districtId: string | null;
  phcId: string | null;

  // Actions
  setNational: () => void;
  setState: (stateId: string) => void;
  setDistrict: (districtId: string) => void;
  setPhc: (phcId: string) => void;
  clearDistrict: () => void;
  clearPhc: () => void;
  syncWithUserRole: (user: User) => void;

  // Computed / helpers
  getScopeLabel: () => string;
  isNationalLocked: (user: User) => boolean;
  isStateLocked: (user: User) => boolean;
  isDistrictLocked: (user: User) => boolean;
}

export const useScopeStore = create<ScopeState>()(
  persist(
    (set, get) => ({
      level: 'national',
      stateId: null,
      districtId: null,
      phcId: null,

      setNational: () => {
        set({
          level: 'national',
          stateId: null,
          districtId: null,
          phcId: null,
        });
      },

      setState: (stateId: string) => {
        set({
          level: 'state',
          stateId,
          districtId: null,
          phcId: null,
        });
      },

      setDistrict: (districtId: string) => {
        const dist = getDistrictById(districtId);
        set({
          level: 'district',
          stateId: dist ? dist.stateId : get().stateId,
          districtId,
          phcId: null,
        });
      },

      setPhc: (phcId: string) => {
        const phc = getPhcById(phcId);
        if (phc) {
          const dist = getDistrictById(phc.districtId);
          set({
            level: 'phc',
            stateId: dist ? dist.stateId : get().stateId,
            districtId: phc.districtId,
            phcId,
          });
        } else {
          set({
            level: 'phc',
            phcId,
          });
        }
      },

      clearDistrict: () => {
        const { stateId } = get();
        if (stateId) {
          set({
            level: 'state',
            districtId: null,
            phcId: null,
          });
        } else {
          set({
            level: 'national',
            stateId: null,
            districtId: null,
            phcId: null,
          });
        }
      },

      clearPhc: () => {
        const { districtId, stateId } = get();
        if (districtId) {
          set({
            level: 'district',
            phcId: null,
          });
        } else if (stateId) {
          set({
            level: 'state',
            phcId: null,
          });
        } else {
          set({
            level: 'national',
            phcId: null,
          });
        }
      },

      syncWithUserRole: (user: User) => {
        const current = get();

        if (user.role === 'district_admin') {
          // Locked to user's state and district
          const targetState = user.stateId ?? 'a0000001-0000-0000-0000-000000000001';
          const targetDistrict = user.districtId ?? 'b0000002-0000-0000-0000-000000000001';
          // Check if currently selected PHC is in this district
          const phc = current.phcId ? getPhcById(current.phcId, targetDistrict) : undefined;

          set({
            level: phc ? 'phc' : 'district',
            stateId: targetState,
            districtId: targetDistrict,
            phcId: phc ? current.phcId : null,
          });
        } else if (user.role === 'state_admin') {
          // Locked to user's state
          const targetState = user.stateId ?? 'a0000001-0000-0000-0000-000000000001';
          const dist = current.districtId ? getDistrictById(current.districtId, targetState) : undefined;
          const phc = dist && current.phcId ? getPhcById(current.phcId, dist.id) : undefined;

          set({
            level: phc ? 'phc' : dist ? 'district' : 'state',
            stateId: targetState,
            districtId: dist ? dist.id : null,
            phcId: phc ? phc.id : null,
          });
        } else {
          // national_admin: if stateId was set, verify it exists; otherwise keep or default to national
          if (current.stateId) {
            const stateExists = getStateById(current.stateId);
            if (!stateExists) {
              set({
                level: 'national',
                stateId: null,
                districtId: null,
                phcId: null,
              });
            }
          }
        }
      },

      getScopeLabel: () => {
        const { level, stateId, districtId, phcId } = get();
        if (level === 'phc' && phcId) {
          const phc = getPhcById(phcId);
          return phc ? phc.name : `PHC (${phcId})`;
        }
        if (level === 'district' && districtId) {
          const dist = getDistrictById(districtId);
          return dist ? `${dist.name} District` : `District (${districtId})`;
        }
        if (level === 'state' && stateId) {
          const st = getStateById(stateId);
          return st ? `${st.name} State` : `State (${stateId})`;
        }
        return 'National Overview';
      },

      isNationalLocked: (user: User) => {
        return user.role === 'state_admin' || user.role === 'district_admin';
      },

      isStateLocked: (user: User) => {
        return user.role === 'district_admin';
      },

      isDistrictLocked: (user: User) => {
        return user.role === 'district_admin';
      },
    }),
    {
      name: 'governance-portal-scope',
    }
  )
);
