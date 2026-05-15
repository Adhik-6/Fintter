/**
 * Recurring Slice
 */
import type { StateCreator } from 'zustand';
import type { RecurringTemplateWithDetails, CreateRecurringInput, UpdateRecurringInput } from '@src/features/recurring/types';
import { recurringRepository } from '@src/db/repositories/recurringRepository';

export interface RecurringSlice {
  recurringTemplates: RecurringTemplateWithDetails[];
  isLoadingRecurring: boolean;
  fetchRecurring: () => Promise<void>;
  addRecurring: (input: CreateRecurringInput) => Promise<void>;
  updateRecurring: (id: number, input: UpdateRecurringInput) => Promise<void>;
  deleteRecurring: (id: number) => Promise<void>;
}

export const createRecurringSlice: StateCreator<RecurringSlice, [], [], RecurringSlice> = (set) => ({
  recurringTemplates: [],
  isLoadingRecurring: false,

  fetchRecurring: async () => {
    set({ isLoadingRecurring: true });
    try {
      const recurringTemplates = await recurringRepository.getAll();
      set({ recurringTemplates, isLoadingRecurring: false });
    } catch (error) {
      console.error('[Store] fetchRecurring error:', error);
      set({ isLoadingRecurring: false });
    }
  },

  addRecurring: async (input) => {
    try {
      await recurringRepository.create(input);
      const recurringTemplates = await recurringRepository.getAll();
      set({ recurringTemplates });
    } catch (error) { console.error('[Store] addRecurring error:', error); }
  },

  updateRecurring: async (id, input) => {
    try {
      await recurringRepository.update(id, input);
      const recurringTemplates = await recurringRepository.getAll();
      set({ recurringTemplates });
    } catch (error) { console.error('[Store] updateRecurring error:', error); }
  },

  deleteRecurring: async (id) => {
    try {
      await recurringRepository.delete(id);
      const recurringTemplates = await recurringRepository.getAll();
      set({ recurringTemplates });
    } catch (error) { console.error('[Store] deleteRecurring error:', error); }
  },
});
