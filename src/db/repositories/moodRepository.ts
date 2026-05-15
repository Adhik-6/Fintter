/**
 * Mood Repository
 */
import { getDb } from '../index';
import type { Mood, CreateMoodInput } from '@src/features/emotional/types';

export const moodRepository = {
  async getAll(): Promise<Mood[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM moods ORDER BY valence ASC');
    return rows.map(mapRow);
  },

  async getById(id: number): Promise<Mood | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM moods WHERE id = $id', { $id: id });
    return row ? mapRow(row) : null;
  },

  async create(input: CreateMoodInput): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO moods (label, emoji, valence, created_at) VALUES ($label, $emoji, $valence, $createdAt)',
      { $label: input.label, $emoji: input.emoji, $valence: input.valence, $createdAt: now }
    );
    return result.lastInsertRowId;
  },
};

function mapRow(row: Record<string, unknown>): Mood {
  return { id: row.id as number, label: row.label as string, emoji: row.emoji as string, valence: row.valence as number, createdAt: row.created_at as string };
}
