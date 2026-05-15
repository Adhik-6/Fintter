/**
 * Fintter Database — Singleton & Initialization
 * Provides a typed database singleton and handles migrations + seeding.
 */

import * as SQLite from 'expo-sqlite';
import { config } from '@src/constants/config';
import { migrate001, MIGRATION_001_VERSION } from './migrations/001_initial';
import { seedDatabase } from './seed';

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
