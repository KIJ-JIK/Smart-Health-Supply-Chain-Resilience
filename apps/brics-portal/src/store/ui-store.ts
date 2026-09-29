// ---------------------------------------------------------------------------
// Zustand store for local UI state.
// Manages sidebar collapse, mobile drawer, active navigation, and ephemeral UI state
// ---------------------------------------------------------------------------

import { create } from 'zustand';

export interface UIState {
  /** Whether the desktop left sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether the mobile off-canvas drawer is open */
  mobileSidebarOpen: boolean;
  /** Currently active navigation item key */
  activeNavItem: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setActiveNavItem: (item: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeNavItem: 'overview',

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  toggleMobileSidebar: () =>
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

  setMobileSidebarOpen: (open) =>
    set({ mobileSidebarOpen: open }),

  setActiveNavItem: (item) =>
    set({ activeNavItem: item }),
}));
