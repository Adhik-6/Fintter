/**
 * Transaction Slice — with optimistic updates.
 */
import type { StateCreator } from 'zustand';
import type { TransactionWithDetails, CreateTransactionInput, UpdateTransactionInput, TransactionFilters } from '@src/features/transactions/types';
import { transactionRepository } from '@src/db/repositories/transactionRepository';
import { walletRepository } from '@src/db/repositories/walletRepository';

export interface TransactionSlice {
  transactions: TransactionWithDetails[];
  isLoadingTransactions: boolean;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: number, input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

export const createTransactionSlice: StateCreator<TransactionSlice, [], [], TransactionSlice> = (set, get) => ({
  transactions: [],
  isLoadingTransactions: false,

  fetchTransactions: async (filters) => {
    set({ isLoadingTransactions: true });
    try {
      const transactions = await transactionRepository.getAll(filters);
      set({ transactions, isLoadingTransactions: false });
    } catch (error) {
      console.error('[Store] fetchTransactions error:', error);
      set({ isLoadingTransactions: false });
    }
  },

  addTransaction: async (input) => {
    try {
      await transactionRepository.create(input);
      // Update wallet balance
      if (input.type === 'expense') {
        await walletRepository.updateBalance(input.walletId, -input.amount);
      } else if (input.type === 'income') {
        await walletRepository.updateBalance(input.walletId, input.amount);
      } else if (input.type === 'transfer' && input.toWalletId) {
        await walletRepository.updateBalance(input.walletId, -input.amount);
        await walletRepository.updateBalance(input.toWalletId, input.amount);
      }
      // Refresh
      const transactions = await transactionRepository.getAll({ limit: 50 });
      set({ transactions });
    } catch (error) {
      console.error('[Store] addTransaction error:', error);
    }
  },

  updateTransaction: async (id, input) => {
    try {
      await transactionRepository.update(id, input);
      const transactions = await transactionRepository.getAll({ limit: 50 });
      set({ transactions });
    } catch (error) {
      console.error('[Store] updateTransaction error:', error);
    }
  },

  deleteTransaction: async (id) => {
    // Optimistic delete
    const prev = get().transactions;
    set({ transactions: prev.filter((t) => t.id !== id) });
    try {
      const deleted = await transactionRepository.delete(id);
      if (deleted) {
        // Rollback wallet balance
        if (deleted.type === 'expense') {
          await walletRepository.updateBalance(deleted.walletId, deleted.amount);
        } else if (deleted.type === 'income') {
          await walletRepository.updateBalance(deleted.walletId, -deleted.amount);
        }
      }
    } catch (error) {
      console.error('[Store] deleteTransaction error:', error);
      set({ transactions: prev }); // Rollback
    }
  },
});
