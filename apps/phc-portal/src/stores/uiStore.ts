import { create } from 'zustand';
import { PHCNavTab, InventorySubTab } from '../types';

interface Toast {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface UIState {
  activeTab: PHCNavTab;
  inventorySubTab: InventorySubTab;
  isEmergencyModalOpen: boolean;
  isReceiveStockModalOpen: boolean;
  isAdjustStockModalOpen: boolean;
  isNewRequestModalOpen: boolean;
  isAutoDraftModalOpen: boolean;
  selectedDraftData: any | null;
  selectedMedicineIdForAdjust: string | null;
  activeReconcileMutationId: string | null;
  toasts: Toast[];

  setActiveTab: (tab: PHCNavTab) => void;
  setInventorySubTab: (subTab: InventorySubTab) => void;
  setEmergencyModalOpen: (open: boolean) => void;
  setReceiveStockModalOpen: (open: boolean) => void;
  setAdjustStockModalOpen: (open: boolean, medicineId?: string) => void;
  setNewRequestModalOpen: (open: boolean) => void;
  setAutoDraftModalOpen: (open: boolean, draftData?: any) => void;
  setActiveReconcileMutationId: (mutationId: string | null) => void;
  addToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  inventorySubTab: 'current_stock',
  isEmergencyModalOpen: false,
  isReceiveStockModalOpen: false,
  isAdjustStockModalOpen: false,
  isNewRequestModalOpen: false,
  isAutoDraftModalOpen: false,
  selectedDraftData: null,
  selectedMedicineIdForAdjust: null,
  activeReconcileMutationId: null,
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setInventorySubTab: (subTab) => set({ inventorySubTab: subTab }),
  setEmergencyModalOpen: (open) => set({ isEmergencyModalOpen: open }),
  setReceiveStockModalOpen: (open) => set({ isReceiveStockModalOpen: open }),
  setAdjustStockModalOpen: (open, medicineId) =>
    set({
      isAdjustStockModalOpen: open,
      selectedMedicineIdForAdjust: medicineId || null,
    }),
  setNewRequestModalOpen: (open) => set({ isNewRequestModalOpen: open }),
  setAutoDraftModalOpen: (open, draftData) =>
    set({
      isAutoDraftModalOpen: open,
      selectedDraftData: draftData || null,
    }),
  setActiveReconcileMutationId: (id) => set({ activeReconcileMutationId: id }),
  addToast: (text, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, text, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
