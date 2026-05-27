/**
 * Fintter Database — Singleton & Initialization
 * Provides a typed database singleton and handles migrations + seeding.
 */

import * as SQLite from 'expo-sqlite';
import { config } from '@src/constants/config';
import { migrate001, MIGRATION_001_VERSION } from './migrations/001_initial';
import { migrate002, MIGRATION_002_VERSION } from './migrations/002_linked_list';
import { migrate003, MIGRATION_003_VERSION } from './migrations/003_budget_scopes';
import { migrate004, MIGRATION_004_VERSION } from './migrations/004_budget_reset_periods';
import { seedDatabase } from './seed';
export { seedTestData } from './seed';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the database singleton.
 * Call this once at app startup (in root _layout.tsx).
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(config.db.name);
  dbInstance = db;

  return db;
}

/**
 * Initialize the database: run migrations and seed data.
 * Should be called once at app startup.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();

  try {
    // Check current schema version
    const versionResult = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version;'
    );
    const currentVersion = versionResult?.user_version ?? 0;

    // Run migrations in order
    if (currentVersion < MIGRATION_001_VERSION) {
      await migrate001(db);
      await db.execAsync(`PRAGMA user_version = ${MIGRATION_001_VERSION};`);
    }
    if (currentVersion < MIGRATION_002_VERSION) {
      await migrate002(db);
      await db.execAsync(`PRAGMA user_version = ${MIGRATION_002_VERSION};`);
    }
    if (currentVersion < MIGRATION_003_VERSION) {
      await migrate003(db);
      await db.execAsync(`PRAGMA user_version = ${MIGRATION_003_VERSION};`);
    }
    if (currentVersion < MIGRATION_004_VERSION) {
      await migrate004(db);
      await db.execAsync(`PRAGMA user_version = ${MIGRATION_004_VERSION};`);
    }

    // Patch categories (Issue 5)
    try {
      const patchDone = await db.getFirstAsync<{ done: number }>("SELECT 1 as done FROM categories WHERE name = 'People' LIMIT 1");
      if (!patchDone) {
        await db.execAsync(`
          UPDATE categories SET name = 'People', icon = '🫂', color = '#6366F1' WHERE name = 'Subscriptions' AND type = 'expense';
          UPDATE categories SET name = 'Pocket Money', icon = '🪙', color = '#10B981' WHERE name = 'Freelance' AND type = 'income';
          INSERT OR IGNORE INTO categories (name, icon, color, type, is_system, created_at) VALUES ('Bonus', '🎉', '#F59E0B', 'income', 1, datetime('now'));
        `);
        // Move Travel txs to Other and delete Travel
        const otherExpense = await db.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE name = 'Other' AND type = 'expense' LIMIT 1");
        const travelCat = await db.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE name = 'Travel' AND type = 'expense' LIMIT 1");
        if (otherExpense && travelCat) {
          await db.execAsync(`UPDATE transactions SET category_id = ${otherExpense.id} WHERE category_id = ${travelCat.id}`);
          await db.execAsync(`DELETE FROM categories WHERE id = ${travelCat.id}`);
        }
      }
    } catch (e) {
      console.log('Patch error', e);
    }

    // Seed data (idempotent — checks if data exists before inserting)
    await seedDatabase(db);

  } catch (error) {
    console.error('[DB] Initialization error:', error);
    throw error;
  }

  return db;
}

/**
 * Close the database connection.
 * Call this on app shutdown if needed.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

/**
 * Get the current database instance (throws if not initialized).
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error(
      '[DB] Database not initialized. Call initializeDatabase() first.'
    );
  }
  return dbInstance;
}
