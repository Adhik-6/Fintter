/**
 * Streak & Milestone Repository
 */
import { getDb } from '../index';
import type { Streak, Milestone } from '@src/features/gamification/types';

export const streakRepository = {
  async getAll(): Promise<Streak[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM streaks');
    return rows.map(mapStreak);
  },

  async getByType(type: Streak['type']): Promise<Streak | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM streaks WHERE type = $type', { $type: type });
    return row ? mapStreak(row) : null;
  },

  async updateStreak(type: Streak['type'], currentCount: number, longestCount: number, lastAchieved: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE streaks SET current_count = $current, longest_count = $longest, last_achieved = $last, updated_at = $now WHERE type = $type',
      { $type: type, $current: currentCount, $longest: longestCount, $last: lastAchieved, $now: now });
  },

  async getAllMilestones(): Promise<Milestone[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM milestones ORDER BY id ASC');
    return rows.map(mapMilestone);
  },

  async getUnshownMilestones(): Promise<Milestone[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM milestones WHERE achieved_at IS NOT NULL AND is_shown = 0');
    return rows.map(mapMilestone);
  },

  async achieveMilestone(type: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE milestones SET achieved_at = $now WHERE type = $type AND achieved_at IS NULL', { $type: type, $now: now });
  },

  async markMilestoneShown(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('UPDATE milestones SET is_shown = 1 WHERE id = $id', { $id: id });
  },
};

function mapStreak(row: Record<string, unknown>): Streak {
  return { id: row.id as number, type: row.type as Streak['type'], currentCount: row.current_count as number, longestCount: row.longest_count as number, lastAchieved: row.last_achieved as string | null, updatedAt: row.updated_at as string };
}

function mapMilestone(row: Record<string, unknown>): Milestone {
  return { id: row.id as number, type: row.type as string, label: row.label as string, achievedAt: row.achieved_at as string | null, isShown: row.is_shown as number };
}
