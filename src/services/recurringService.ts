/**
 * Recurring Transaction Service
 *
 * Checks for due recurring templates and auto-creates transactions.
 * Should be called on app open and periodically.
 */

import { recurringRepository } from '@src/db/repositories/recurringRepository';
import { transactionRepository } from '@src/db/repositories/transactionRepository';
import { walletRepository } from '@src/db/repositories/walletRepository';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import type { RecurringTemplate, RecurringFrequency } from '@src/features/recurring/types';

export interface RecurringResult {
  processed: number;
  created: { templateName: string; amount: number }[];
  errors: { templateName: string; error: string }[];
}

/**
 * Process all due recurring transactions.
 * Creates the transaction, updates wallet balance, advances next_due.
 */
export async function processRecurringTransactions(): Promise<RecurringResult> {
  const today = format(new Date(), "yyyy-MM-dd'T'23:59:59");
  const templates = await recurringRepository.getDue(today);

  const result: RecurringResult = { processed: 0, created: [], errors: [] };

  for (const template of templates) {
    try {
      // Create the transaction
      await transactionRepository.create({
        amount: template.amount,
        type: template.type,
        categoryId: template.categoryId,
        walletId: template.walletId,
        note: template.note ?? `Recurring: ${template.name}`,
        isRecurring: 1,
        recurringId: template.id,
        source: 'manual',
        date: template.nextDue,
      });

      // Update wallet balance
      if (template.type === 'expense') {
        await walletRepository.updateBalance(template.walletId, -template.amount);
      } else {
        await walletRepository.updateBalance(template.walletId, template.amount);
      }

      // Advance the next due date
      const nextDue = computeNextDue(template.nextDue, template.frequency, template.interval);

      // Check if template has expired
      if (template.endDate && nextDue > template.endDate) {
        await recurringRepository.update(template.id, { isActive: 0 });
      }

      await recurringRepository.markTriggered(
        template.id,
        new Date().toISOString(),
        nextDue
      );

      result.created.push({ templateName: template.name, amount: template.amount });
      result.processed++;
    } catch (error) {
      result.errors.push({
        templateName: template.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Compute the next due date based on frequency and interval.
 */
export function computeNextDue(
  currentDue: string,
  frequency: RecurringFrequency,
  interval: number
): string {
  const date = new Date(currentDue);

  switch (frequency) {
    case 'daily':
      return format(addDays(date, interval), "yyyy-MM-dd'T'HH:mm:ss");
    case 'weekly':
      return format(addWeeks(date, interval), "yyyy-MM-dd'T'HH:mm:ss");
    case 'monthly':
      return format(addMonths(date, interval), "yyyy-MM-dd'T'HH:mm:ss");
    case 'yearly':
      return format(addYears(date, interval), "yyyy-MM-dd'T'HH:mm:ss");
    default:
      return format(addMonths(date, interval), "yyyy-MM-dd'T'HH:mm:ss");
  }
}

/**
 * Get a human-readable label for the next due date.
 */
export function getRecurringLabel(frequency: RecurringFrequency, interval: number): string {
  if (interval === 1) {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
    }
  }
  return `Every ${interval} ${frequency === 'daily' ? 'days' : frequency === 'weekly' ? 'weeks' : frequency === 'monthly' ? 'months' : 'years'}`;
}
