/**
 * Fintter Root Store — composed from domain slices.
 * Components should use granular selectors to avoid unnecessary re-renders.
 *
 * Usage:
 *   const wallets = useStore((s) => s.wallets);
 *   const addTransaction = useStore((s) => s.addTransaction);
 */

import { create } from 'zustand';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createWalletSlice, type WalletSlice } from './slices/walletSlice';
import { createCategorySlice, type CategorySlice } from './slices/categorySlice';
import { createTransactionSlice, type TransactionSlice } from './slices/transactionSlice';
import { createBudgetSlice, type BudgetSlice } from './slices/budgetSlice';
import { createRecurringSlice, type RecurringSlice } from './slices/recurringSlice';
import { createAnalyticsSlice, type AnalyticsSlice } from './slices/analyticsSlice';
import { createGamificationSlice, type GamificationSlice } from './slices/gamificationSlice';

export type FintterStore =
  UISlice &
  WalletSlice &
  CategorySlice &
  TransactionSlice &
  BudgetSlice &
  RecurringSlice &
  AnalyticsSlice &
  GamificationSlice;

export const useStore = create<FintterStore>()((...args) => ({
  ...createUISlice(...args),
  ...createWalletSlice(...args),
  ...createCategorySlice(...args),
  ...createTransactionSlice(...args),
  ...createBudgetSlice(...args),
  ...createRecurringSlice(...args),
  ...createAnalyticsSlice(...args),
  ...createGamificationSlice(...args),
}));
