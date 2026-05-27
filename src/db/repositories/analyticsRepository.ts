/**
 * Analytics Repository — aggregation queries + cache.
 */
import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';

export interface MonthlySummary { totalIncome: number; totalExpense: number; netAmount: number; avgPerDay: number; transactionCount: number; daysInPeriod: number; }
export interface CategoryBreakdown { categoryId: number; categoryName: string; categoryIcon: string; categoryColor: string; total: number; percentage: number; transactionCount: number; }
export interface SpendingVelocity { todaySpent: number; yesterdaySpent: number; weekAvg: number; monthAvg: number; }
export interface MoodSpendCorrelation { moodId: number; moodLabel: string; moodEmoji: string; avgSpend: number; transactionCount: number; }
export interface TrendDataPoint { label: string; value: number; date: string; }
export interface MerchantSummary { merchant: string; total: number; count: number; categoryColor?: string; categoryName?: string; }
export interface ImpulseStats { impulseTotal: number; plannedTotal: number; impulseCount: number; plannedCount: number; }

export const analyticsRepository = {
  async getMonthlySummary(startDate: string, endDate: string, walletId?: number): Promise<MonthlySummary> {
    const db = getDb();
    const wf = walletId ? 'AND wallet_id = $walletId' : '';
    const params: Record<string, SQLiteBindValue> = { $startDate: startDate, $endDate: endDate };
    if (walletId) params.$walletId = walletId;

    const income = await db.getFirstAsync<{ total: number | null }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND date >= $startDate AND date <= $endDate ${wf}`, params);
    const expense = await db.getFirstAsync<{ total: number | null }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $startDate AND date <= $endDate ${wf}`, params);
    const count = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM transactions WHERE date >= $startDate AND date <= $endDate ${wf}`, params);

    const ti = income?.total ?? 0; const te = expense?.total ?? 0;
    const days = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
    return { totalIncome: ti, totalExpense: te, netAmount: ti - te, avgPerDay: Math.round(te / days), transactionCount: count?.count ?? 0, daysInPeriod: days };
  },

  async getCategoryBreakdown(startDate: string, endDate: string, type: 'expense' | 'income' = 'expense'): Promise<CategoryBreakdown[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color, SUM(t.amount) as total, COUNT(t.id) as tx_count
       FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.type = $type AND t.date >= $startDate AND t.date <= $endDate
       GROUP BY c.id ORDER BY total DESC`,
      { $type: type, $startDate: startDate, $endDate: endDate }
    );
    const grandTotal = rows.reduce((sum, r) => sum + (r.total as number), 0);
    return rows.map(r => ({
      categoryId: r.category_id as number, categoryName: r.category_name as string,
      categoryIcon: r.category_icon as string, categoryColor: r.category_color as string,
      total: r.total as number, percentage: grandTotal > 0 ? Math.round(((r.total as number) / grandTotal) * 10000) / 100 : 0,
      transactionCount: r.tx_count as number,
    }));
  },

  async getSpendingVelocity(today: string): Promise<SpendingVelocity> {
    const db = getDb();
    const td = new Date(today);
    const yd = new Date(td); yd.setDate(yd.getDate() - 1);
    const wa = new Date(td); wa.setDate(wa.getDate() - 7);
    const ma = new Date(td); ma.setDate(ma.getDate() - 30);

    const todayR = await db.getFirstAsync<{ total: number | null }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $s AND date <= $e`, { $s: today.substring(0, 10), $e: today.substring(0, 10) + 'T23:59:59' });
    const yesterdayR = await db.getFirstAsync<{ total: number | null }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $s AND date <= $e`, { $s: yd.toISOString().substring(0, 10), $e: yd.toISOString().substring(0, 10) + 'T23:59:59' });
    const weekR = await db.getFirstAsync<{ total: number | null }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $s AND date <= $e`, { $s: wa.toISOString(), $e: today + 'T23:59:59' });
    const monthR = await db.getFirstAsync<{ total: number | null }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $s AND date <= $e`, { $s: ma.toISOString(), $e: today + 'T23:59:59' });

    return { todaySpent: todayR?.total ?? 0, yesterdaySpent: yesterdayR?.total ?? 0, weekAvg: Math.round((weekR?.total ?? 0) / 7), monthAvg: Math.round((monthR?.total ?? 0) / 30) };
  },

  async getMoodCorrelation(startDate: string, endDate: string): Promise<MoodSpendCorrelation[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT m.id as mood_id, m.label as mood_label, m.emoji as mood_emoji, AVG(t.amount) as avg_spend, COUNT(t.id) as tx_count
       FROM transactions t JOIN moods m ON t.mood_id = m.id WHERE t.type = 'expense' AND t.date >= $startDate AND t.date <= $endDate AND t.mood_id IS NOT NULL
       GROUP BY m.id ORDER BY m.valence ASC`,
      { $startDate: startDate, $endDate: endDate }
    );
    return rows.map(r => ({ moodId: r.mood_id as number, moodLabel: r.mood_label as string, moodEmoji: r.mood_emoji as string, avgSpend: Math.round(r.avg_spend as number), transactionCount: r.tx_count as number }));
  },

  async getSpendingTrend(startDate: string, endDate: string): Promise<TrendDataPoint[]> {
    const db = getDb();
    const today = new Date().toISOString().substring(0, 10) + 'T23:59:59';
    const effectiveEnd = endDate < today ? endDate : today;
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT CAST(strftime('%d', date) AS INTEGER) as dayOfMonth, SUM(amount) as total 
       FROM transactions 
       WHERE type = 'expense' AND date >= $startDate AND date <= $effectiveEnd 
       GROUP BY dayOfMonth`,
      { $startDate: startDate, $effectiveEnd: effectiveEnd }
    );
    
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0;
    const end = new Date(effectiveEnd);
    const maxDays = new Date(endDate).getDate();
    const lastDay = end.getDate();

    rows.forEach(r => {
      const d = r.dayOfMonth as number;
      const t = r.total as number;
      if (d <= 7) w1 += t;
      else if (d <= 14) w2 += t;
      else if (d <= 21) w3 += t;
      else if (d <= 28) w4 += t;
      else w5 += t;
    });

    // Only include weeks that have started (i.e. first day of week <= lastDay)
    const result: TrendDataPoint[] = [
      { label: 'Week 1', value: w1, date: startDate },
    ];
    if (lastDay > 7)  result.push({ label: 'Week 2', value: w2, date: startDate });
    if (lastDay > 14) result.push({ label: 'Week 3', value: w3, date: startDate });
    if (lastDay > 21) result.push({ label: 'Week 4', value: w4, date: startDate });
    if (maxDays > 28 && lastDay > 28) result.push({ label: 'Week 5', value: w5, date: startDate });

    return result;
  },

  async getHeatmapData(startDate: string, endDate: string): Promise<Record<string, number>> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT strftime('%Y-%m-%d', date) as day, SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= $startDate AND date <= $endDate GROUP BY day`,
      { $startDate: startDate, $endDate: endDate }
    );
    const result: Record<string, number> = {};
    for (const r of rows) { result[r.day as string] = r.total as number; }
    return result;
  },

  async getTopMerchants(startDate: string, endDate: string, limit = 5): Promise<MerchantSummary[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT t.merchant as merchant_name, SUM(t.amount) as total, COUNT(t.id) as count, MAX(c.color) as category_color, MAX(c.name) as category_name 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = 'expense' AND t.date >= $startDate AND t.date <= $endDate 
         AND t.merchant IS NOT NULL AND TRIM(t.merchant) != ''
       GROUP BY t.merchant 
       ORDER BY total DESC LIMIT $limit`,
      { $startDate: startDate, $endDate: endDate, $limit: limit }
    );
    return rows.map(r => ({ merchant: r.merchant_name as string, total: r.total as number, count: r.count as number, categoryColor: r.category_color as string | undefined, categoryName: r.category_name as string | undefined }));
  },

  async getImpulseStats(startDate: string, endDate: string): Promise<ImpulseStats> {
    const db = getDb();
    const impulse = await db.getFirstAsync<{ total: number | null, count: number }>(`SELECT SUM(amount) as total, COUNT(id) as count FROM transactions WHERE type = 'expense' AND is_impulse = 1 AND date >= $startDate AND date <= $endDate`, { $startDate: startDate, $endDate: endDate });
    const planned = await db.getFirstAsync<{ total: number | null, count: number }>(`SELECT SUM(amount) as total, COUNT(id) as count FROM transactions WHERE type = 'expense' AND (is_impulse = 0 OR is_impulse IS NULL) AND date >= $startDate AND date <= $endDate`, { $startDate: startDate, $endDate: endDate });
    return {
      impulseTotal: impulse?.total ?? 0, impulseCount: impulse?.count ?? 0,
      plannedTotal: planned?.total ?? 0, plannedCount: planned?.count ?? 0
    };
  },

  async getCached(key: string): Promise<string | null> {
    const db = getDb();
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM analytics_cache WHERE key = $key', { $key: key });
    return row?.data ?? null;
  },

  async setCache(key: string, data: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync(`INSERT INTO analytics_cache (key, data, computed_at) VALUES ($key, $data, $now) ON CONFLICT(key) DO UPDATE SET data = $data, computed_at = $now`, { $key: key, $data: data, $now: now });
  },
};
