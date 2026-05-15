/**
 * Gamification Engine
 *
 * Computes streaks, milestones, and the Financial Health Score.
 * Called after every transaction and on app open.
 */

import { streakRepository } from '@src/db/repositories/streakRepository';
import { transactionRepository } from '@src/db/repositories/transactionRepository';
import { budgetRepository } from '@src/db/repositories/budgetRepository';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { config } from '@src/constants/config';
import type { HealthScore, StreakType } from '@src/features/gamification/types';
import { milestoneTypes } from '@src/features/gamification/types';

/**
 * Update all streaks based on today's activity.
 */
export async function updateStreaks(): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  await updateDailyLogStreak(today, yesterday);
  await updateNoSpendStreak(today, yesterday);
  await updateUnderBudgetStreak(today);
}

async function updateDailyLogStreak(today: string, yesterday: string): Promise<void> {
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;
  const count = await transactionRepository.getCount({ startDate: todayStart, endDate: todayEnd });

  if (count === 0) return; // No transactions today, don't update

  const streak = await streakRepository.getByType('daily_log');
  if (!streak) return;

  // Check if last achieved was yesterday → continue streak
  const isConsecutive = streak.lastAchieved?.startsWith(yesterday) ?? false;
  const newCount = isConsecutive ? streak.currentCount + 1 : 1;
  const newLongest = Math.max(newCount, streak.longestCount);

  await streakRepository.updateStreak('daily_log', newCount, newLongest, `${today}T23:59:59`);

  // Check milestone thresholds
  if (newCount >= 7) await streakRepository.achieveMilestone(milestoneTypes.SEVEN_DAY_STREAK);
  if (newCount >= 30) await streakRepository.achieveMilestone(milestoneTypes.THIRTY_DAY_STREAK);
}

async function updateNoSpendStreak(today: string, yesterday: string): Promise<void> {
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;
  const expenses = await transactionRepository.getCount({
    startDate: todayStart, endDate: todayEnd, type: 'expense',
  });

  const streak = await streakRepository.getByType('no_spend_day');
  if (!streak) return;

  if (expenses === 0) {
    // No expenses today! Continue or start streak
    const isConsecutive = streak.lastAchieved?.startsWith(yesterday) ?? false;
    const newCount = isConsecutive ? streak.currentCount + 1 : 1;
    const newLongest = Math.max(newCount, streak.longestCount);
    await streakRepository.updateStreak('no_spend_day', newCount, newLongest, `${today}T23:59:59`);

    if (newCount === 1) await streakRepository.achieveMilestone(milestoneTypes.FIRST_NO_SPEND_DAY);
  } else {
    // Streak broken
    await streakRepository.updateStreak('no_spend_day', 0, streak.longestCount, streak.lastAchieved ?? '');
  }
}

async function updateUnderBudgetStreak(today: string): Promise<void> {
  const streak = await streakRepository.getByType('under_budget');
  if (!streak) return;

  // Check all budgets for compliance
  const budgets = await budgetRepository.getAll();
  if (budgets.length === 0) return;

  let allUnder = true;
  for (const budget of budgets) {
    const start = budget.startDate;
    const end = `${today}T23:59:59`;
    const progress = await budgetRepository.computeProgress(budget, start, end);
    if (progress.percentUsed > 100) {
      allUnder = false;
      break;
    }
  }

  if (allUnder) {
    const newCount = streak.currentCount + 1;
    const newLongest = Math.max(newCount, streak.longestCount);
    await streakRepository.updateStreak('under_budget', newCount, newLongest, `${today}T23:59:59`);

    if (newCount >= 7) await streakRepository.achieveMilestone(milestoneTypes.WEEK_UNDER_BUDGET);
    if (newCount >= 30) await streakRepository.achieveMilestone(milestoneTypes.MONTH_UNDER_BUDGET);
  } else {
    await streakRepository.updateStreak('under_budget', 0, streak.longestCount, streak.lastAchieved ?? '');
  }
}

/**
 * Check and achieve transaction-count milestones.
 */
export async function checkTransactionMilestones(): Promise<void> {
  const count = await transactionRepository.getCount();
  if (count >= 1) await streakRepository.achieveMilestone(milestoneTypes.FIRST_TRANSACTION);
  if (count >= 10) await streakRepository.achieveMilestone(milestoneTypes.TEN_TRANSACTIONS);
  if (count >= 100) await streakRepository.achieveMilestone(milestoneTypes.HUNDRED_TRANSACTIONS);
}

export async function checkBudgetMilestones(): Promise<void> {
  const budgets = await budgetRepository.getAll();
  if (budgets.length >= 1) await streakRepository.achieveMilestone(milestoneTypes.FIRST_BUDGET);
}

/**
 * Compute the Financial Health Score (0-100).
 */
export async function computeHealthScore(): Promise<HealthScore> {
  const now = new Date();
  const monthStart = format(startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), "yyyy-MM-dd'T'HH:mm:ss");
  const monthEnd = format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");

  const weights = config.gamification.healthScore;

  // 1. Budget adherence: average of all budgets' compliance
  let budgetAdherence = 100;
  const budgets = await budgetRepository.getAll();
  if (budgets.length > 0) {
    let totalCompliance = 0;
    for (const budget of budgets) {
      const progress = await budgetRepository.computeProgress(budget, monthStart, monthEnd);
      totalCompliance += Math.max(0, Math.min(100, 100 - Math.max(0, progress.percentUsed - 100)));
    }
    budgetAdherence = totalCompliance / budgets.length;
  }

  // 2. Savings rate: (income - expense) / income * 100
  let savingsRate = 50;
  const income = await transactionRepository.getTotalByType('income', monthStart, monthEnd);
  const expense = await transactionRepository.getTotalByType('expense', monthStart, monthEnd);
  if (income > 0) {
    savingsRate = Math.max(0, Math.min(100, ((income - expense) / income) * 100));
  }

  // 3. No-spend days: count of days with zero expenses this month
  let noSpendDays = 0;
  const daysInMonth = now.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = format(new Date(now.getFullYear(), now.getMonth(), d), 'yyyy-MM-dd');
    const dayExpenses = await transactionRepository.getCount({
      startDate: `${dayStr}T00:00:00`, endDate: `${dayStr}T23:59:59`, type: 'expense',
    });
    if (dayExpenses === 0) noSpendDays++;
  }
  const noSpendScore = Math.min(100, (noSpendDays / daysInMonth) * 200); // 50% no-spend = 100 score

  // 4. Streak bonus: current longest streak scaled
  const streaks = await streakRepository.getAll();
  const maxStreak = Math.max(...streaks.map((s) => s.currentCount), 0);
  const streakBonus = Math.min(100, maxStreak * 5); // 20-day streak = 100

  const total = Math.round(
    budgetAdherence * weights.budgetAdherenceWeight +
    savingsRate * weights.savingsRateWeight +
    noSpendScore * weights.noSpendDaysWeight +
    streakBonus * weights.streakBonusWeight
  );

  return {
    total: Math.max(0, Math.min(100, total)),
    budgetAdherence: Math.round(budgetAdherence),
    savingsRate: Math.round(savingsRate),
    noSpendDays: Math.round(noSpendScore),
    streakBonus: Math.round(streakBonus),
  };
}
