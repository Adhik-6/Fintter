/**
 * Gamification Types
 */

export type StreakType = 'no_spend_day' | 'under_budget' | 'daily_log';

export interface Streak {
  id: number;
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastAchieved: string | null;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  type: string;
  label: string;
  achievedAt: string | null;
  isShown: number; // SQLite boolean
}

export interface CreateMilestoneInput {
  type: string;
  label: string;
}

/** Financial Health Score breakdown */
export interface HealthScore {
  total: number; // 0-100
  budgetAdherence: number; // 0-100
  savingsRate: number; // 0-100
  noSpendDays: number; // 0-100
  streakBonus: number; // 0-100
}

/** Predefined milestone types */
export const milestoneTypes = {
  FIRST_TRANSACTION: 'first_transaction',
  TEN_TRANSACTIONS: 'ten_transactions',
  HUNDRED_TRANSACTIONS: 'hundred_transactions',
  FIRST_BUDGET: 'first_budget',
  SEVEN_DAY_STREAK: 'seven_day_streak',
  THIRTY_DAY_STREAK: 'thirty_day_streak',
  FIRST_NO_SPEND_DAY: 'first_no_spend_day',
  WEEK_UNDER_BUDGET: 'week_under_budget',
  MONTH_UNDER_BUDGET: 'month_under_budget',
} as const;

export type MilestoneType = (typeof milestoneTypes)[keyof typeof milestoneTypes];
