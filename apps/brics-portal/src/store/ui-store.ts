// ---------------------------------------------------------------------------
// Zustand store for local UI state.
// Manages sidebar collapse, active navigation, and any ephemeral UI state
// that doesn't belong in the GraphQL cache.
// ---------------------------------------------------------------------------

import { create } from 'zustand';

export interface UIState {
  /** Whether the left sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Currently active navigation item key */
  activeNavItem: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveNavItem: (item: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeNavItem: 'overview',

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setActiveNavItem: (item) =>
    set({ activeNavItem: item }),
}));
