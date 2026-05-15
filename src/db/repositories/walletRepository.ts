/**
 * Wallet Repository — CRUD operations for wallets table.
 */

import { getDb } from '../index';
import type { SQLiteBindValue } from 'expo-sqlite';
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@src/features/wallets/types';

export const walletRepository = {
  async getAll(): Promise<Wallet[]> {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM wallets ORDER BY is_default DESC, name ASC'
    );
    return rows.map(mapRowToWallet);
  },

  async getById(id: number): Promise<Wallet | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM wallets WHERE id = $id',
      { $id: id }
    );
    return row ? mapRowToWallet(row) : null;
  },

  async getDefault(): Promise<Wallet | null> {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM wallets WHERE is_default = 1 LIMIT 1'
    );
    return row ? mapRowToWallet(row) : null;
  },

  async create(input: CreateWalletInput): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO wallets (name, type, currency, balance, icon, color, is_default, created_at, updated_at)
       VALUES ($name, $type, $currency, $balance, $icon, $color, $isDefault, $createdAt, $updatedAt)`,
      {
        $name: input.name, $type: input.type, $currency: input.currency,
        $balance: input.balance ?? 0, $icon: input.icon ?? null, $color: input.color ?? null,
        $isDefault: input.isDefault ?? 0, $createdAt: now, $updatedAt: now,
      }
    );
    return result.lastInsertRowId;
  },

  async update(id: number, input: UpdateWalletInput): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: Record<string, SQLiteBindValue> = { $id: id, $updatedAt: now };

    if (input.name !== undefined) { fields.push('name = $name'); params.$name = input.name; }
    if (input.type !== undefined) { fields.push('type = $type'); params.$type = input.type; }
    if (input.currency !== undefined) { fields.push('currency = $currency'); params.$currency = input.currency; }
    if (input.balance !== undefined) { fields.push('balance = $balance'); params.$balance = input.balance; }
    if (input.icon !== undefined) { fields.push('icon = $icon'); params.$icon = input.icon; }
    if (input.color !== undefined) { fields.push('color = $color'); params.$color = input.color; }
    if (input.isDefault !== undefined) { fields.push('is_default = $isDefault'); params.$isDefault = input.isDefault; }

    if (fields.length === 0) return;
    fields.push('updated_at = $updatedAt');
    await db.runAsync(`UPDATE wallets SET ${fields.join(', ')} WHERE id = $id`, params);
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM wallets WHERE id = $id', { $id: id });
  },

  async setDefault(id: number): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE wallets SET is_default = 0, updated_at = $now', { $now: now });
    await db.runAsync('UPDATE wallets SET is_default = 1, updated_at = $now WHERE id = $id', { $id: id, $now: now });
  },

  async updateBalance(id: number, delta: number): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE wallets SET balance = balance + $delta, updated_at = $now WHERE id = $id', { $id: id, $delta: delta, $now: now });
  },
};

function mapRowToWallet(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as number, name: row.name as string, type: row.type as Wallet['type'],
    currency: row.currency as string, balance: row.balance as number,
    icon: row.icon as string | null, color: row.color as string | null,
    isDefault: row.is_default as number, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  };
}
