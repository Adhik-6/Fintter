/**
 * Recurring Template Repository
 */
import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';
import type { RecurringTemplate, RecurringTemplateWithDetails, CreateRecurringInput, UpdateRecurringInput } from '@src/features/recurring/types';

export const recurringRepository = {
  async getAll(): Promise<RecurringTemplateWithDetails[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT r.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color, w.name AS wallet_name
       FROM recurring_templates r LEFT JOIN categories c ON r.category_id = c.id LEFT JOIN wallets w ON r.wallet_id = w.id ORDER BY r.next_due ASC`
    );
    return rows.map(mapWithDetails);
  },

  async getDue(today: string): Promise<RecurringTemplate[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM recurring_templates WHERE is_active = 1 AND next_due <= $today', { $today: today });
    return rows.map(mapRow);
  },

  async create(input: CreateRecurringInput): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO recurring_templates (name, amount, type, category_id, wallet_id, frequency, interval, next_due, last_triggered, end_date, is_active, note, created_at, updated_at)
       VALUES ($name, $amount, $type, $categoryId, $walletId, $frequency, $interval, $nextDue, NULL, $endDate, 1, $note, $now, $now)`,
      { $name: input.name, $amount: input.amount, $type: input.type, $categoryId: input.categoryId, $walletId: input.walletId, $frequency: input.frequency, $interval: input.interval ?? 1, $nextDue: input.nextDue, $endDate: input.endDate ?? null, $note: input.note ?? null, $now: now }
    );
    return result.lastInsertRowId;
  },

  async update(id: number, input: UpdateRecurringInput): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: Record<string, SQLiteBindValue> = { $id: id, $now: now };
    if (input.name !== undefined) { fields.push('name = $name'); params.$name = input.name; }
    if (input.amount !== undefined) { fields.push('amount = $amount'); params.$amount = input.amount; }
    if (input.isActive !== undefined) { fields.push('is_active = $isActive'); params.$isActive = input.isActive; }
    if (input.nextDue !== undefined) { fields.push('next_due = $nextDue'); params.$nextDue = input.nextDue; }
    if (fields.length === 0) return;
    fields.push('updated_at = $now');
    await db.runAsync(`UPDATE recurring_templates SET ${fields.join(', ')} WHERE id = $id`, params);
  },

  async markTriggered(id: number, triggeredAt: string, nextDue: string): Promise<void> {
    const db = getDb();
    await db.runAsync('UPDATE recurring_templates SET last_triggered = $triggeredAt, next_due = $nextDue, updated_at = $triggeredAt WHERE id = $id', { $id: id, $triggeredAt: triggeredAt, $nextDue: nextDue });
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM recurring_templates WHERE id = $id', { $id: id });
  },
};

function mapRow(row: Record<string, unknown>): RecurringTemplate {
  return {
    id: row.id as number, name: row.name as string, amount: row.amount as number,
    type: row.type as RecurringTemplate['type'], categoryId: row.category_id as number,
    walletId: row.wallet_id as number, frequency: row.frequency as RecurringTemplate['frequency'],
    interval: row.interval as number, nextDue: row.next_due as string,
    lastTriggered: row.last_triggered as string | null, endDate: row.end_date as string | null,
    isActive: row.is_active as number, note: row.note as string | null,
    createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  };
}

function mapWithDetails(row: Record<string, unknown>): RecurringTemplateWithDetails {
  return { ...mapRow(row), categoryName: row.category_name as string, categoryIcon: row.category_icon as string, categoryColor: row.category_color as string, walletName: row.wallet_name as string };
}
