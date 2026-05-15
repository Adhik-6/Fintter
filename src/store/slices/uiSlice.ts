/**
 * UI Slice — manages UI-only state (no DB interaction).
 */
import type { StateCreator } from 'zustand';

export interface UISlice {
  quickAddVisible: boolean;
  setQuickAddVisible: (v: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  quickAddVisible: false,
  setQuickAddVisible: (v) => set({ quickAddVisible: v }),
  activeTab: 'index',
  setActiveTab: (tab) => set({ activeTab: tab }),
});
