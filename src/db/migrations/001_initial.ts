/**
 * Migration 001 — Initial Schema
 * Creates all tables for Fintter v1.0.
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import { ALL_CREATE_STATEMENTS, CREATE_INDEXES } from '../schema';

export const MIGRATION_001_VERSION = 1;

export async function migrate001(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables
  for (const statement of ALL_CREATE_STATEMENTS) {
    await db.execAsync(statement);
  }

  // Create indexes (each index needs to be a separate statement)
  const indexStatements = CREATE_INDEXES
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const indexStatement of indexStatements) {
    await db.execAsync(indexStatement + ';');
  }
}
