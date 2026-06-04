/**
 * Notification Service
 *
 * Handles local push notifications for budget alerts,
 * recurring transaction reminders, and milestone celebrations.
 *
 * NOTE: expo-notifications push (remote) features are not supported in Expo Go SDK53+.
 * Local scheduled notifications still work in dev builds.
 * This module uses dynamic requires to avoid crashing/warning on app startup in Expo Go.
 */

import { Platform } from 'react-native';
import { format, addHours } from 'date-fns';
import { formatAmount } from '@src/utils/currency';
import type { BudgetProgress } from '@src/features/budgets/types';

/** Stable identifier for the daily reminder notification. */
const DAILY_REMINDER_ID_KEY = 'daily_reminder_notification_id';

// Load expo-notifications — local scheduled notifications work in all environments
// including Expo Go. The remote-push deprecation warning in Expo Go is cosmetic only.
function getNotifications() {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

// Configure notification behavior (local alerts only)
const Notifications = getNotifications();
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Silently ignore
  }
}

/**
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Send a budget alert when spending exceeds threshold.
 */
export async function sendBudgetAlert(
  budgetName: string,
  progress: BudgetProgress
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
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
  } catch {
    // Silently ignore
  }
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
  const Notifications = getNotifications();
  if (!Notifications) return '';
  try {
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
  } catch {
    return '';
  }
}

/**
 * Send a milestone celebration notification.
 */
export async function sendMilestoneNotification(
  milestoneLabel: string
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Achievement Unlocked!',
        body: milestoneLabel,
        data: { type: 'milestone' },
      },
      trigger: null,
    });
  } catch {
    // Silently ignore
  }
}

/**
 * Schedule (or reschedule) a daily reminder at the specified local time.
 * Cancels any previously scheduled daily reminder first.
 *
 * @param hour   Local hour in 24-hour format (0–23)
 * @param minute Local minute (0–59)
 * @returns The new notification identifier, or '' on failure.
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<string> {
  const Notifications = getNotifications();
  if (!Notifications) return '';
  try {
    // Cancel the old reminder before scheduling a new one
    await cancelDailyReminder();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Fintter Daily Check-in',
        body: "Don't forget to log today's expenses!",
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch {
    return '';
  }
}

/**
 * Cancel the currently scheduled daily reminder.
 * Reads the stored notification ID from the settings repository.
 */
export async function cancelDailyReminder(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    // Cancel all scheduled notifications with the daily_reminder data type
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content?.data?.type === 'daily_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {
    // Silently ignore
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silently ignore
  }
}
