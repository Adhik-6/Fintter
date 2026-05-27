import { type SQLiteDatabase } from 'expo-sqlite';

export const MIGRATION_004_VERSION = 4;

export async function migrate004(db: SQLiteDatabase) {
  try {
    // We add 3 columns to budgets: reset_interval_value, reset_interval_unit, icon
    // SQLite ALTER TABLE ADD COLUMN allows adding columns with or without DEFAULT.
    await db.execAsync(`
      ALTER TABLE budgets ADD COLUMN reset_interval_value INTEGER;
    `);
    
    await db.execAsync(`
      ALTER TABLE budgets ADD COLUMN reset_interval_unit TEXT;
    `);
    
    await db.execAsync(`
      ALTER TABLE budgets ADD COLUMN icon TEXT;
    `);
    
    console.log('[Migration 004] Added reset interval and icon columns to budgets table successfully.');
  } catch (error) {
    console.error('[Migration 004] Error applying migration:', error);
    // Ignore duplicate column errors if migration was already applied
  }
}
