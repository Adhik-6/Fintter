import { type SQLiteDatabase } from 'expo-sqlite';

export const MIGRATION_002_VERSION = 2;

export async function migrate002(db: SQLiteDatabase): Promise<void> {
  // 1. Wipe old recurring transactions that relied on recurring_templates
  // We identify them by is_recurring = 1
  await db.execAsync(`DELETE FROM transactions WHERE is_recurring = 1;`);

  // 2. Drop recurring_templates table
  await db.execAsync(`DROP TABLE IF EXISTS recurring_templates;`);

  // 3. Add new columns to transactions table
  // SQLite ALTER TABLE ADD COLUMN allows adding one column at a time
  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN next_transaction_id INTEGER REFERENCES transactions(id);`);
  } catch (e) {
    console.log('Column next_transaction_id may already exist', e);
  }

  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN recurring_days INTEGER;`);
  } catch (e) {
    console.log('Column recurring_days may already exist', e);
  }
}
