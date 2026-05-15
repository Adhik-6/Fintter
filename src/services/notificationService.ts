/**
 * Notification Service
 *
 * Handles local push notifications for budget alerts,
 * recurring transaction reminders, and milestone celebrations.
 */

import * as Notifications from 'expo-notifications';
import { format, addHours } from 'date-fns';
import { formatAmount } from '@src/utils/currency';
import type { BudgetProgress } from '@src/features/budgets/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Send a budget alert when spending exceeds threshold.
 */
export async function sendBudgetAlert(
  budgetName: string,
  progress: BudgetProgress
): Promise<void> {
  const emoji = progress.status === 'exceeded' ? '🚨' : progress.status === 'danger' ? '⚠️' : '📊';
  const body = progress.status === 'exceeded'
    ? `You've exceeded your ${budgetName} budget by ${formatAmount(Math.abs(progress.remaining))}`
    : `${Math.round(progress.percentUsed)}% of your ${budgetName} budget used. ${formatAmount(progress.remaining)} remaining.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Budget Alert: ${budgetName}`,
      body,
      data: { type: 'budget_alert', budgetId: progress.budgetId },
    },
    trigger: null, // immediate
  });
}

/**
 * Schedule a reminder for an upcoming recurring transaction.
 */
export async function scheduleRecurringReminder(
  templateName: string,
  amount: number,
  dueDate: string,
  recurringId: number
): Promise<string> {
  // Remind 1 hour before due
  const reminderDate = addHours(new Date(dueDate), -1);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔄 Upcoming: ${templateName}`,
      body: `${formatAmount(amount)} due on ${format(new Date(dueDate), 'MMM dd')}`,
      data: { type: 'recurring_reminder', recurringId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
  });

  return id;
}

/**
 * Send a milestone celebration notification.
 */
export async function sendMilestoneNotification(
  milestoneLabel: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 Achievement Unlocked!',
      body: milestoneLabel,
      data: { type: 'milestone' },
    },
    trigger: null,
  });
}

/**
 * Send a daily summary notification.
 */
export async function sendDailySummary(
  totalSpent: number,
  transactionCount: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Daily Summary',
      body: `You spent ${formatAmount(totalSpent)} across ${transactionCount} transactions today.`,
      data: { type: 'daily_summary' },
    },
    trigger: null,
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
