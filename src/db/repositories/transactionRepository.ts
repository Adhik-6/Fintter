/**
 * Transaction Repository
 */
import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';
import type { Transaction, TransactionWithDetails, CreateTransactionInput, UpdateTransactionInput, TransactionFilters } from '@src/features/transactions/types';

export const transactionRepository = {
  async getAll(filters?: TransactionFilters): Promise<TransactionWithDetails[]> {
    const db = getDb();
    const conditions: string[] = [];
    const params: Record<string, SQLiteBindValue> = {};

    if (filters?.startDate) { conditions.push('t.date >= $startDate'); params.$startDate = filters.startDate; }
    if (filters?.endDate) { conditions.push('t.date <= $endDate'); params.$endDate = filters.endDate; }
    if (filters?.categoryId) { conditions.push('t.category_id = $categoryId'); params.$categoryId = filters.categoryId; }
    if (filters?.walletId) { conditions.push('t.wallet_id = $walletId'); params.$walletId = filters.walletId; }
    if (filters?.type) { conditions.push('t.type = $type'); params.$type = filters.type; }
    if (filters?.moodId) { conditions.push('t.mood_id = $moodId'); params.$moodId = filters.moodId; }
    if (filters?.searchQuery) { conditions.push('(t.note LIKE $search OR t.merchant LIKE $search)'); params.$search = `%${filters.searchQuery}%`; }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = filters?.limit ? `LIMIT ${filters.limit}` : '';
    const offsetClause = filters?.offset ? `OFFSET ${filters.offset}` : '';

    const query = `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color, w.name AS wallet_name, m.emoji AS mood_emoji, m.label AS mood_label
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id LEFT JOIN wallets w ON t.wallet_id = w.id LEFT JOIN moods m ON t.mood_id = m.id
      ${whereClause} ORDER BY t.date DESC, t.created_at DESC ${limitClause} ${offsetClause}`;

    const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
    return rows.map(mapWithDetails);
  },

  async getById(id: number): Promise<TransactionWithDetails | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color, w.name AS wallet_name, m.emoji AS mood_emoji, m.label AS mood_label
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id LEFT JOIN wallets w ON t.wallet_id = w.id LEFT JOIN moods m ON t.mood_id = m.id WHERE t.id = $id`,
      { $id: id }
    );
    return row ? mapWithDetails(row) : null;
  },

  async create(input: CreateTransactionInput): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO transactions (amount, type, category_id, wallet_id, to_wallet_id, note, merchant, tags, mood_id, is_impulse, is_recurring, next_transaction_id, recurring_days, source, budget_id, date, created_at, updated_at)
       VALUES ($amount, $type, $categoryId, $walletId, $toWalletId, $note, $merchant, $tags, $moodId, $isImpulse, $isRecurring, $nextTransactionId, $recurringDays, $source, $budgetId, $date, $createdAt, $updatedAt)`,
      {
        $amount: input.amount, $type: input.type, $categoryId: input.categoryId, $walletId: input.walletId,
        $toWalletId: input.toWalletId ?? null, $note: input.note ?? null, $merchant: input.merchant ?? null,
        $tags: input.tags ? JSON.stringify(input.tags) : null, $moodId: input.moodId ?? null,
        $isImpulse: input.isImpulse ?? 0, $isRecurring: input.isRecurring ?? 0, 
        $nextTransactionId: input.nextTransactionId ?? null, $recurringDays: input.recurringDays ?? null,
        $source: input.source ?? 'manual', $budgetId: input.budgetId ?? null, $date: input.date ?? now, $createdAt: now, $updatedAt: now,
      }
    );
    return result.lastInsertRowId;
  },

  async update(id: number, input: UpdateTransactionInput): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: Record<string, SQLiteBindValue> = { $id: id, $updatedAt: now };
    if (input.amount !== undefined) { fields.push('amount = $amount'); params.$amount = input.amount; }
    if (input.type !== undefined) { fields.push('type = $type'); params.$type = input.type; }
    if (input.categoryId !== undefined) { fields.push('category_id = $categoryId'); params.$categoryId = input.categoryId; }
    if (input.walletId !== undefined) { fields.push('wallet_id = $walletId'); params.$walletId = input.walletId; }
    if (input.toWalletId !== undefined) { fields.push('to_wallet_id = $toWalletId'); params.$toWalletId = input.toWalletId; }
    if (input.note !== undefined) { fields.push('note = $note'); params.$note = input.note; }
    if (input.merchant !== undefined) { fields.push('merchant = $merchant'); params.$merchant = input.merchant; }
    if (input.tags !== undefined) { fields.push('tags = $tags'); params.$tags = JSON.stringify(input.tags); }
    if (input.moodId !== undefined) { fields.push('mood_id = $moodId'); params.$moodId = input.moodId; }
    if (input.isImpulse !== undefined) { fields.push('is_impulse = $isImpulse'); params.$isImpulse = input.isImpulse; }
    if (input.isRecurring !== undefined) { fields.push('is_recurring = $isRecurring'); params.$isRecurring = input.isRecurring; }
    if (input.nextTransactionId !== undefined) { fields.push('next_transaction_id = $nextTransactionId'); params.$nextTransactionId = input.nextTransactionId; }
    if (input.recurringDays !== undefined) { fields.push('recurring_days = $recurringDays'); params.$recurringDays = input.recurringDays; }
    if (input.budgetId !== undefined) { fields.push('budget_id = $budgetId'); params.$budgetId = input.budgetId; }
    if (input.date !== undefined) { fields.push('date = $date'); params.$date = input.date; }
    if (fields.length === 0) return;
    fields.push('updated_at = $updatedAt');
    await db.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = $id`, params);
  },

  async delete(id: number): Promise<Transaction | null> {
    const db = getDb();
    const existing = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM transactions WHERE id = $id', { $id: id });
    if (!existing) return null;
    await db.runAsync('DELETE FROM transactions WHERE id = $id', { $id: id });
    return mapRow(existing);
  },

  async getCount(filters?: TransactionFilters): Promise<number> {
    const db = getDb();
    const conditions: string[] = [];
    const params: Record<string, SQLiteBindValue> = {};
    if (filters?.startDate) { conditions.push('date >= $startDate'); params.$startDate = filters.startDate; }
    if (filters?.endDate) { conditions.push('date <= $endDate'); params.$endDate = filters.endDate; }
    if (filters?.type) { conditions.push('type = $type'); params.$type = filters.type; }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM transactions ${whereClause}`, params);
    return result?.count ?? 0;
  },

  async getTotalByType(type: string, startDate: string, endDate: string, walletId?: number): Promise<number> {
    const db = getDb();
    const walletFilter = walletId ? 'AND wallet_id = $walletId' : '';
    const params: Record<string, SQLiteBindValue> = { $type: type, $startDate: startDate, $endDate: endDate };
    if (walletId) params.$walletId = walletId;
    const result = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = $type AND date >= $startDate AND date <= $endDate ${walletFilter}`, params
    );
    return result?.total ?? 0;
  },

  async processDueRecurringTransactions(): Promise<void> {
    const db = getDb();
    const today = new Date();
    // In SQLite, date strings might be ISO (e.g. 2026-05-27T...) or just YYYY-MM-DD.
    // We query all potential candidates and filter in JS using date-fns for safety against timezones.
    const candidates = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM transactions WHERE is_recurring = 1 AND next_transaction_id IS NULL AND recurring_days IS NOT NULL`
    );

    if (candidates.length === 0) return;

    // Use dynamic import for date-fns to avoid blocking
    const { parseISO, isBefore, isSameDay, addDays } = await import('date-fns');

    for (const row of candidates) {
      const tx = mapRow(row);
      const txDate = tx.date.length === 10 ? parseISO(tx.date) : new Date(tx.date);
      
      // If the transaction's date is today or in the past, it's time to generate the next one!
      if (isBefore(txDate, today) || isSameDay(txDate, today)) {
        // Generate the next date
        const nextDate = addDays(txDate, tx.recurringDays!);
        
        // Format to ISO
        const nextDateStr = nextDate.toISOString();
        
        // Create the next transaction
        const nextTxId = await this.create({
          amount: tx.amount,
          type: tx.type,
          categoryId: tx.categoryId,
          walletId: tx.walletId,
          toWalletId: tx.toWalletId,
          note: tx.note || undefined,
          merchant: tx.merchant || undefined,
          tags: tx.tags ? JSON.parse(tx.tags) : undefined,
          moodId: tx.moodId,
          isImpulse: tx.isImpulse,
          isRecurring: 1,
          recurringDays: tx.recurringDays,
          source: tx.source,
          date: nextDateStr,
        });

        // Link current to the new next transaction
        await this.update(tx.id, { nextTransactionId: nextTxId });
      }
    }
  },
};

function mapRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as number, amount: row.amount as number, type: row.type as Transaction['type'],
    categoryId: row.category_id as number, walletId: row.wallet_id as number,
    toWalletId: row.to_wallet_id as number | null, note: row.note as string | null,
    merchant: row.merchant as string | null, tags: row.tags as string | null,
    moodId: row.mood_id as number | null, isImpulse: row.is_impulse as number,
    isRecurring: row.is_recurring as number, 
    nextTransactionId: row.next_transaction_id as number | null,
    recurringDays: row.recurring_days as number | null,
    source: row.source as Transaction['source'],
    budgetId: row.budget_id as number | null,
    date: row.date as string,
    createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  };
}

function mapWithDetails(row: Record<string, unknown>): TransactionWithDetails {
  const base = mapRow(row);
  const isTransfer = base.type === 'transfer';
  return {
    ...base,
    categoryName: isTransfer ? 'Wallet Transfer' : (row.category_name as string),
    categoryIcon: isTransfer ? '🔄' : (row.category_icon as string),
    categoryColor: isTransfer ? '#00BCD4' : (row.category_color as string),
    walletName: row.wallet_name as string,
    moodEmoji: row.mood_emoji as string | null,
    moodLabel: row.mood_label as string | null,
  };
}
