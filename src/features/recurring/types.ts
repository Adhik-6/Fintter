/**
 * Recurring Transaction Types
 */

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTemplate {
  id: number;
  name: string;
  /** Amount in smallest currency unit */
  amount: number;
  type: 'expense' | 'income';
  categoryId: number;
  walletId: number;
  frequency: RecurringFrequency;
  /** Every N frequency units (e.g. every 2 weeks) */
  interval: number;
  nextDue: string; // ISO 8601
  lastTriggered: string | null;
  endDate: string | null;
  isActive: number; // SQLite boolean
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTemplateWithDetails extends RecurringTemplate {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  walletName: string;
}

export interface CreateRecurringInput {
  name: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: number;
  walletId: number;
  frequency: RecurringFrequency;
  interval?: number;
  nextDue: string;
  endDate?: string | null;
  note?: string;
}

export interface UpdateRecurringInput {
  name?: string;
  amount?: number;
  type?: 'expense' | 'income';
  categoryId?: number;
  walletId?: number;
  frequency?: RecurringFrequency;
  interval?: number;
  nextDue?: string;
  endDate?: string | null;
  isActive?: number;
  note?: string;
}

/** Reminder for upcoming recurring transactions */
export interface Reminder {
  id: number;
  title: string;
  body: string | null;
  recurringId: number | null;
  remindAt: string;
  isDismissed: number; // SQLite boolean
  createdAt: string;
}

export interface CreateReminderInput {
  title: string;
  body?: string;
  recurringId?: number;
  remindAt: string;
}
