/**
 * Budget Slice
 */
import type { StateCreator } from 'zustand';
import type { BudgetWithDetails, CreateBudgetInput, UpdateBudgetInput, BudgetProgress } from '@src/features/budgets/types';
import { budgetRepository } from '@src/db/repositories/budgetRepository';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfYear, endOfYear, format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns';

export interface BudgetSlice {
  budgets: BudgetWithDetails[];
  budgetProgress: Record<number, BudgetProgress>;
  isLoadingBudgets: boolean;
  fetchBudgets: () => Promise<void>;
  addBudget: (input: CreateBudgetInput) => Promise<void>;
  updateBudget: (id: number, input: UpdateBudgetInput) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
  computeBudgetProgress: () => Promise<void>;
}

function getPeriodDates(budget: BudgetWithDetails): { start: string; end: string } {
  const now = new Date();
  switch (budget.period) {
    case 'daily': return { start: format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'weekly': return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'monthly': return { start: format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'yearly': return { start: format(startOfYear(now), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfYear(now), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'custom': {
      if (budget.resetIntervalValue && budget.resetIntervalUnit) {
        let currentStart = new Date(budget.startDate);
        // Find the active window
        while (true) {
          let nextStart = new Date(currentStart);
          const val = budget.resetIntervalValue;
          switch (budget.resetIntervalUnit) {
            case 'days': nextStart = addDays(nextStart, val); break;
            case 'weeks': nextStart = addWeeks(nextStart, val); break;
            case 'months': nextStart = addMonths(nextStart, val); break;
            case 'years': nextStart = addYears(nextStart, val); break;
            default: nextStart = addMonths(nextStart, 1);
          }
          if (isAfter(nextStart, now)) {
            // We found the window where `now` is between currentStart and nextStart
            // end is nextStart minus 1 second
            const end = new Date(nextStart.getTime() - 1000);
            return { start: format(currentStart, "yyyy-MM-dd'T'HH:mm:ss"), end: format(end, "yyyy-MM-dd'T'HH:mm:ss") };
          }
          currentStart = nextStart;
          // Failsafe in case of bad loop
          if (currentStart.getFullYear() > now.getFullYear() + 10) {
            break;
          }
        }
      }
      return { start: budget.startDate, end: budget.endDate ?? format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss") };
    }
    default: return { start: budget.startDate, end: format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss") };
  }
}

export const createBudgetSlice: StateCreator<BudgetSlice, [], [], BudgetSlice> = (set, get) => ({
  budgets: [],
  budgetProgress: {},
  isLoadingBudgets: false,

  fetchBudgets: async () => {
    set({ isLoadingBudgets: true });
    try {
      const budgets = await budgetRepository.getAll();
      set({ budgets, isLoadingBudgets: false });
    } catch (error) {
      console.error('[Store] fetchBudgets error:', error);
      set({ isLoadingBudgets: false });
    }
  },

  addBudget: async (input) => {
    try {
      await budgetRepository.create(input);
      const budgets = await budgetRepository.getAll();
      set({ budgets });
    } catch (error) { console.error('[Store] addBudget error:', error); }
  },

  updateBudget: async (id, input) => {
    try {
      await budgetRepository.update(id, input);
      const budgets = await budgetRepository.getAll();
      set({ budgets });
    } catch (error) { console.error('[Store] updateBudget error:', error); }
  },

  deleteBudget: async (id) => {
    try {
      await budgetRepository.delete(id);
      const budgets = await budgetRepository.getAll();
      const progress = { ...get().budgetProgress };
      delete progress[id];
      set({ budgets, budgetProgress: progress });
    } catch (error) { console.error('[Store] deleteBudget error:', error); }
  },

  computeBudgetProgress: async () => {
    try {
      const budgets = get().budgets;
      const progress: Record<number, BudgetProgress> = {};
      for (const budget of budgets) {
        const { start, end } = getPeriodDates(budget);
        progress[budget.id] = await budgetRepository.computeProgress(budget, start, end);
      }
      set({ budgetProgress: progress });
    } catch (error) { console.error('[Store] computeBudgetProgress error:', error); }
  },
});
