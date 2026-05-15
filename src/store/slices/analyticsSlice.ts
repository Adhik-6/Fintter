/**
 * Analytics Slice — holds computed summaries only.
 */
import type { StateCreator } from 'zustand';
import { analyticsRepository, type MonthlySummary, type CategoryBreakdown, type SpendingVelocity, type MoodSpendCorrelation } from '@src/db/repositories/analyticsRepository';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface AnalyticsSlice {
  monthlySummary: MonthlySummary | null;
  categoryBreakdown: CategoryBreakdown[];
  spendingVelocity: SpendingVelocity | null;
  moodCorrelation: MoodSpendCorrelation[];
  isLoadingAnalytics: boolean;
  refreshAnalytics: (month?: string) => Promise<void>;
}

export const createAnalyticsSlice: StateCreator<AnalyticsSlice, [], [], AnalyticsSlice> = (set) => ({
  monthlySummary: null,
  categoryBreakdown: [],
  spendingVelocity: null,
  moodCorrelation: [],
  isLoadingAnalytics: false,

  refreshAnalytics: async (month) => {
    set({ isLoadingAnalytics: true });
    try {
      const now = new Date();
      const targetDate = month ? new Date(month + '-01') : now;
      const startDate = format(startOfMonth(targetDate), "yyyy-MM-dd'T'00:00:00");
      const endDate = format(endOfMonth(targetDate), "yyyy-MM-dd'T'23:59:59");
      const today = format(now, "yyyy-MM-dd");

      const [monthlySummary, categoryBreakdown, spendingVelocity, moodCorrelation] = await Promise.all([
        analyticsRepository.getMonthlySummary(startDate, endDate),
        analyticsRepository.getCategoryBreakdown(startDate, endDate),
        analyticsRepository.getSpendingVelocity(today),
        analyticsRepository.getMoodCorrelation(startDate, endDate),
      ]);

      set({ monthlySummary, categoryBreakdown, spendingVelocity, moodCorrelation, isLoadingAnalytics: false });
    } catch (error) {
      console.error('[Store] refreshAnalytics error:', error);
      set({ isLoadingAnalytics: false });
    }
  },
});
