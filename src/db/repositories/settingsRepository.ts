/**
 * Settings Repository — key-value store in SQLite.
 */
import { getDb } from '../index';

export const settingsRepository = {
  async get(key: string): Promise<string | null> {
    const db = getDb();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = $key', { $key: key });
    return row?.value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO settings (key, value, updated_at) VALUES ($key, $value, $now) ON CONFLICT(key) DO UPDATE SET value = $value, updated_at = $now`,
      { $key: key, $value: value, $now: now }
    );
  },

  async delete(key: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM settings WHERE key = $key', { $key: key });
  },

  async getAll(): Promise<Record<string, string>> {
    const db = getDb();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const result: Record<string, string> = {};
    for (const row of rows) { result[row.key] = row.value; }
    return result;
  },
};
