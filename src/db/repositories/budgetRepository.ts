/**
 * Budget Repository
 */
import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';
import type { Budget, BudgetWithDetails, CreateBudgetInput, UpdateBudgetInput, BudgetProgress } from '@src/features/budgets/types';
import { config } from '@src/constants/config';

export const budgetRepository = {
  async getAll(): Promise<BudgetWithDetails[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b LEFT JOIN categories c ON b.category_id = c.id ORDER BY b.name ASC`
    );
    return rows.map(mapRow);
  },

  async getById(id: number): Promise<BudgetWithDetails | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = $id`, { $id: id }
    );
    return row ? mapRow(row) : null;
  },

  async create(input: CreateBudgetInput): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO budgets (name, category_id, wallet_id, amount, period, start_date, end_date, rollover, alert_at_percent, created_at, updated_at)
       VALUES ($name, $categoryId, $walletId, $amount, $period, $startDate, $endDate, $rollover, $alertAtPercent, $createdAt, $updatedAt)`,
      { $name: input.name, $categoryId: input.categoryId ?? null, $walletId: input.walletId ?? null, $amount: input.amount, $period: input.period, $startDate: input.startDate, $endDate: input.endDate ?? null, $rollover: input.rollover ?? 0, $alertAtPercent: input.alertAtPercent ?? config.budget.defaultAlertPercent, $createdAt: now, $updatedAt: now }
    );
    return result.lastInsertRowId;
  },

  async update(id: number, input: UpdateBudgetInput): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: Record<string, SQLiteBindValue> = { $id: id, $updatedAt: now };
    if (input.name !== undefined) { fields.push('name = $name'); params.$name = input.name; }
    if (input.amount !== undefined) { fields.push('amount = $amount'); params.$amount = input.amount; }
    if (input.period !== undefined) { fields.push('period = $period'); params.$period = input.period; }
    if (fields.length === 0) return;
    fields.push('updated_at = $updatedAt');
    await db.runAsync(`UPDATE budgets SET ${fields.join(', ')} WHERE id = $id`, params);
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM budgets WHERE id = $id', { $id: id });
  },

  async computeProgress(budget: Budget, startDate: string, endDate: string): Promise<BudgetProgress> {
    const db = getDb();
    const catFilter = budget.categoryId ? 'AND category_id = $categoryId' : '';
    const walFilter = budget.walletId ? 'AND wallet_id = $walletId' : '';
    const params: Record<string, SQLiteBindValue> = { $startDate: startDate, $endDate: endDate };
    if (budget.categoryId) params.$categoryId = budget.categoryId;
    if (budget.walletId) params.$walletId = budget.walletId;

    const result = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $startDate AND date <= $endDate ${catFilter} ${walFilter}`, params
    );
    const spent = result?.total ?? 0;
    const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    let status: BudgetProgress['status'] = 'safe';
    if (percentUsed >= 100) status = 'exceeded';
    else if (percentUsed >= config.budget.dangerPercent) status = 'danger';
    else if (percentUsed >= config.budget.warningPercent) status = 'warning';

    return { budgetId: budget.id, spent, limit: budget.amount, percentUsed: Math.round(percentUsed * 100) / 100, remaining: budget.amount - spent, status };
  },
};

function mapRow(row: Record<string, unknown>): BudgetWithDetails {
  return {
    id: row.id as number, name: row.name as string, categoryId: row.category_id as number | null,
    walletId: row.wallet_id as number | null, amount: row.amount as number, period: row.period as Budget['period'],
    startDate: row.start_date as string, endDate: row.end_date as string | null, rollover: row.rollover as number,
    alertAtPercent: row.alert_at_percent as number, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
    categoryName: (row.category_name as string | null) ?? null, categoryIcon: (row.category_icon as string | null) ?? null,
    categoryColor: (row.category_color as string | null) ?? null,
  };
}
