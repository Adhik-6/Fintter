import * as SQLite from 'expo-sqlite';

export const MIGRATION_003_VERSION = 3;

export async function migrate003(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[DB] Running migration 003: budget scopes');
  
  // Alter budgets table
  try {
    await db.execAsync(`
      ALTER TABLE budgets ADD COLUMN scope TEXT NOT NULL DEFAULT 'overall' CHECK(scope IN ('overall', 'category_group', 'manual'));
    `);
  } catch (error) {
    console.log('[DB] budgets.scope column might already exist:', error);
  }

  try {
    await db.execAsync(`
      ALTER TABLE budgets ADD COLUMN category_ids TEXT;
    `);
  } catch (error) {
    console.log('[DB] budgets.category_ids column might already exist:', error);
  }

  try {
    await db.execAsync(`
      ALTER TABLE budgets ADD COLUMN budget_transaction_ids TEXT;
    `);
  } catch (error) {
    console.log('[DB] budgets.budget_transaction_ids column might already exist:', error);
  }

  // Alter transactions table
  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN budget_id INTEGER REFERENCES budgets(id);
    `);
  } catch (error) {
    console.log('[DB] transactions.budget_id column might already exist:', error);
  }
}
