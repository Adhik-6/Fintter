/**
 * Analytics Slice — holds computed summaries only.
 */
import type { StateCreator } from 'zustand';
import { analyticsRepository, type MonthlySummary, type CategoryBreakdown, type SpendingVelocity, type MoodSpendCorrelation, type TrendDataPoint, type MerchantSummary, type ImpulseStats } from '@src/db/repositories/analyticsRepository';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface AnalyticsSlice {
  monthlySummary: MonthlySummary | null;
  categoryBreakdown: CategoryBreakdown[];
  spendingVelocity: SpendingVelocity | null;
  moodCorrelation: MoodSpendCorrelation[];
  spendingTrend: TrendDataPoint[];
  heatmapData: Record<string, number>;
  topMerchants: MerchantSummary[];
  impulseStats: ImpulseStats | null;
  isLoadingAnalytics: boolean;
  refreshAnalytics: (month?: string) => Promise<void>;
}

export const createAnalyticsSlice: StateCreator<AnalyticsSlice, [], [], AnalyticsSlice> = (set) => ({
  monthlySummary: null,
  categoryBreakdown: [],
  spendingVelocity: null,
  moodCorrelation: [],
  spendingTrend: [],
  heatmapData: {},
  topMerchants: [],
  impulseStats: null,
  isLoadingAnalytics: false,

  refreshAnalytics: async (month) => {
    set({ isLoadingAnalytics: true });
    try {
      const now = new Date();
      const targetDate = month ? new Date(month + '-01') : now;
      const startDate = format(startOfMonth(targetDate), "yyyy-MM-dd'T'00:00:00");
      const endDate = format(endOfMonth(targetDate), "yyyy-MM-dd'T'23:59:59");
      const today = format(now, "yyyy-MM-dd");
      const cacheKey = `analytics_${format(targetDate, "yyyy_MM")}`;

      const cached = await analyticsRepository.getCached(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          set({ ...parsed, isLoadingAnalytics: false });
        } catch (e) {}
      }

      const [monthlySummary, categoryBreakdown, spendingVelocity, moodCorrelation, spendingTrend, heatmapData, topMerchants, impulseStats] = await Promise.all([
        analyticsRepository.getMonthlySummary(startDate, endDate),
        analyticsRepository.getCategoryBreakdown(startDate, endDate),
        analyticsRepository.getSpendingVelocity(today),
        analyticsRepository.getMoodCorrelation(startDate, endDate),
        analyticsRepository.getSpendingTrend(startDate, endDate),
        analyticsRepository.getHeatmapData(startDate, endDate),
        analyticsRepository.getTopMerchants(startDate, endDate),
        analyticsRepository.getImpulseStats(startDate, endDate),
      ]);

      const stateToSave = { monthlySummary, categoryBreakdown, spendingVelocity, moodCorrelation, spendingTrend, heatmapData, topMerchants, impulseStats };
      await analyticsRepository.setCache(cacheKey, JSON.stringify(stateToSave));

      set({ ...stateToSave, isLoadingAnalytics: false });
    } catch (error) {
      console.error('[Store] refreshAnalytics error:', error);
      set({ isLoadingAnalytics: false });
    }
  },
});
