/**
 * Wallet Slice
 */
import type { StateCreator } from 'zustand';
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@src/features/wallets/types';
import { walletRepository } from '@src/db/repositories/walletRepository';

export interface WalletSlice {
  wallets: Wallet[];
  activeWalletId: number | null;
  isLoadingWallets: boolean;
  fetchWallets: () => Promise<void>;
  setActiveWallet: (id: number) => void;
  addWallet: (input: CreateWalletInput) => Promise<void>;
  updateWallet: (id: number, input: UpdateWalletInput) => Promise<void>;
  deleteWallet: (id: number) => Promise<void>;
  setDefaultWallet: (id: number) => Promise<void>;
}

export const createWalletSlice: StateCreator<WalletSlice, [], [], WalletSlice> = (set) => ({
  wallets: [],
  activeWalletId: null,
  isLoadingWallets: false,

  fetchWallets: async () => {
    set({ isLoadingWallets: true });
    try {
      const wallets = await walletRepository.getAll();
      const defaultWallet = wallets.find((w) => w.isDefault === 1);
      set({ wallets, activeWalletId: defaultWallet?.id ?? wallets[0]?.id ?? null, isLoadingWallets: false });
    } catch (error) {
      console.error('[Store] fetchWallets error:', error);
      set({ isLoadingWallets: false });
    }
  },

  setActiveWallet: (id) => set({ activeWalletId: id }),

  addWallet: async (input) => {
    try {
      await walletRepository.create(input);
      const wallets = await walletRepository.getAll();
      set({ wallets });
    } catch (error) {
      console.error('[Store] addWallet error:', error);
    }
  },

  updateWallet: async (id, input) => {
    try {
      await walletRepository.update(id, input);
      const wallets = await walletRepository.getAll();
      set({ wallets });
    } catch (error) {
      console.error('[Store] updateWallet error:', error);
    }
  },

  deleteWallet: async (id) => {
    try {
      await walletRepository.delete(id);
      const wallets = await walletRepository.getAll();
      set({ wallets });
    } catch (error) {
      console.error('[Store] deleteWallet error:', error);
    }
  },

  setDefaultWallet: async (id) => {
    try {
      await walletRepository.setDefault(id);
      const wallets = await walletRepository.getAll();
      set({ wallets, activeWalletId: id });
    } catch (error) {
      console.error('[Store] setDefaultWallet error:', error);
    }
  },
});
