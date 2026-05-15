/**
 * Category Repository
 */
import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@src/features/categories/types';

export const categoryRepository = {
  async getAll(): Promise<Category[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories ORDER BY is_system DESC, name ASC');
    return rows.map(mapRow);
  },

  async getByType(type: Category['type']): Promise<Category[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories WHERE type = $type ORDER BY is_system DESC, name ASC', { $type: type });
    return rows.map(mapRow);
  },

  async getById(id: number): Promise<Category | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM categories WHERE id = $id', { $id: id });
    return row ? mapRow(row) : null;
  },

  async create(input: CreateCategoryInput): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO categories (name, icon, color, type, parent_id, is_system, created_at) VALUES ($name, $icon, $color, $type, $parentId, $isSystem, $createdAt)`,
      { $name: input.name, $icon: input.icon, $color: input.color, $type: input.type, $parentId: input.parentId ?? null, $isSystem: input.isSystem ?? 0, $createdAt: now }
    );
    return result.lastInsertRowId;
  },

  async update(id: number, input: UpdateCategoryInput): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const params: Record<string, SQLiteBindValue> = { $id: id };
    if (input.name !== undefined) { fields.push('name = $name'); params.$name = input.name; }
    if (input.icon !== undefined) { fields.push('icon = $icon'); params.$icon = input.icon; }
    if (input.color !== undefined) { fields.push('color = $color'); params.$color = input.color; }
    if (input.type !== undefined) { fields.push('type = $type'); params.$type = input.type; }
    if (input.parentId !== undefined) { fields.push('parent_id = $parentId'); params.$parentId = input.parentId; }
    if (fields.length === 0) return;
    await db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = $id`, params);
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM categories WHERE id = $id AND is_system = 0', { $id: id });
  },
};

function mapRow(row: Record<string, unknown>): Category {
  return {
    id: row.id as number, name: row.name as string, icon: row.icon as string,
    color: row.color as string, type: row.type as Category['type'],
    parentId: row.parent_id as number | null, isSystem: row.is_system as number,
    createdAt: row.created_at as string,
  };
}
