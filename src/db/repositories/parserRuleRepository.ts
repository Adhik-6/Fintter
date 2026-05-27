/**
 * Parser Rule Repository
 */
import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';

export interface ParserRule {
  id: number; name: string; source: 'sms' | 'notification'; pattern: string;
  amountGroup: number | null; merchantGroup: number | null; type: 'expense' | 'income';
  defaultCategoryId: number | null; isActive: number; createdAt: string;
}

export const parserRuleRepository = {
  async getAll(): Promise<ParserRule[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM parser_rules ORDER BY name ASC');
    return rows.map(mapRow);
  },

  async getActive(source?: 'sms' | 'notification'): Promise<ParserRule[]> {
    const db = getDb();
    const filter = source ? 'AND source = $source' : '';
    const params: Record<string, SQLiteBindValue> = {};
    if (source) params.$source = source;
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM parser_rules WHERE is_active = 1 ${filter} ORDER BY id ASC`, params);
    return rows.map(mapRow);
  },

  async create(input: Omit<ParserRule, 'id' | 'createdAt'>): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO parser_rules (name, source, pattern, amount_group, merchant_group, type, default_category_id, is_active, created_at)
       VALUES ($name, $source, $pattern, $amountGroup, $merchantGroup, $type, $defaultCategoryId, $isActive, $now)`,
      { $name: input.name, $source: input.source, $pattern: input.pattern, $amountGroup: input.amountGroup, $merchantGroup: input.merchantGroup, $type: input.type, $defaultCategoryId: input.defaultCategoryId, $isActive: input.isActive, $now: now }
    );
    return result.lastInsertRowId;
  },

  async toggleActive(id: number, isActive: number): Promise<void> {
    const db = getDb();
    await db.runAsync('UPDATE parser_rules SET is_active = $isActive WHERE id = $id', { $id: id, $isActive: isActive });
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM parser_rules WHERE id = $id', { $id: id });
  },

  async seedDefaultRules(): Promise<void> {
    const db = getDb();
    const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM parser_rules');
    if (existing && existing.count > 0) return;
    const now = new Date().toISOString();
    const otherCat = await db.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE name = 'Other' AND type = 'expense' LIMIT 1");
    const salaryCat = await db.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE name = 'Salary' AND type = 'income' LIMIT 1");
    const defaultCatId = otherCat?.id ?? 1;
    const salaryCatId = salaryCat?.id ?? 1;
    const defaults = [
      { name: 'HDFC Bank Debit', type: 'expense', catId: defaultCatId, pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+debited.*HDFC' },
      { name: 'HDFC Bank Credit', type: 'income', catId: salaryCatId, pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+credited.*HDFC' },
      { name: 'SBI Debit', type: 'expense', catId: defaultCatId, pattern: 'debited by Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?).*SBI' },
      { name: 'UPI Payment', type: 'expense', catId: defaultCatId, pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?).*(?:paid to|sent to)\\s+(?<merchant>[A-Za-z0-9@._-]+)' },
      { name: 'ICICI Bank Debit', type: 'expense', catId: defaultCatId, pattern: 'INR\\s*(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+(?:debited|deducted).*ICICI' },
      { name: 'Kotak Bank Debit', type: 'expense', catId: defaultCatId, pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+debited.*Kotak' },
    ];
    for (const r of defaults) {
      await db.runAsync(
        `INSERT INTO parser_rules (name, source, pattern, amount_group, merchant_group, type, default_category_id, is_active, created_at)
         VALUES ($name, 'sms', $pattern, NULL, NULL, $type, $catId, 1, $now)`,
        { $name: r.name, $pattern: r.pattern, $type: r.type, $catId: r.catId, $now: now }
      );
    }
  },
};

function mapRow(row: Record<string, unknown>): ParserRule {
  return { id: row.id as number, name: row.name as string, source: row.source as ParserRule['source'], pattern: row.pattern as string, amountGroup: row.amount_group as number | null, merchantGroup: row.merchant_group as number | null, type: row.type as ParserRule['type'], defaultCategoryId: row.default_category_id as number | null, isActive: row.is_active as number, createdAt: row.created_at as string };
}
