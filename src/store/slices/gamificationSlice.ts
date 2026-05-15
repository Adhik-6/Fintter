/**
 * Gamification Slice
 */
import type { StateCreator } from 'zustand';
import type { Streak, Milestone, HealthScore } from '@src/features/gamification/types';
import { streakRepository } from '@src/db/repositories/streakRepository';

export interface GamificationSlice {
  streaks: Streak[];
  milestones: Milestone[];
  financialHealthScore: HealthScore | null;
  isLoadingGamification: boolean;
  fetchGamification: () => Promise<void>;
  markMilestoneShown: (id: number) => Promise<void>;
}

export const createGamificationSlice: StateCreator<GamificationSlice, [], [], GamificationSlice> = (set) => ({
  streaks: [],
  milestones: [],
  financialHealthScore: null,
  isLoadingGamification: false,

  fetchGamification: async () => {
    set({ isLoadingGamification: true });
    try {
      const [streaks, milestones] = await Promise.all([
        streakRepository.getAll(),
        streakRepository.getAllMilestones(),
      ]);
      set({ streaks, milestones, isLoadingGamification: false });
    } catch (error) {
      console.error('[Store] fetchGamification error:', error);
      set({ isLoadingGamification: false });
    }
  },

  markMilestoneShown: async (id) => {
    try {
      await streakRepository.markMilestoneShown(id);
      const milestones = await streakRepository.getAllMilestones();
      set({ milestones });
    } catch (error) { console.error('[Store] markMilestoneShown error:', error); }
  },
});
