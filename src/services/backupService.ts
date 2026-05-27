/**
 * Data Export / Import Service
 *
 * Exports all user data as JSON for backup.
 * Imports backup files to restore data.
 */

import { documentDirectory, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { shareAsync } from 'expo-sharing';
import { getDb } from '@src/db';
import { config } from '@src/constants/config';
import { format } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

async function importCsv(content: string, db: SQLiteDatabase): Promise<Record<string, number>> {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length <= 1) return { transactions: 0 };
  
  const parseRow = (str: string) => {
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '"') {
        if (inQuotes && str[i + 1] === '"') {
          cur += '"'; i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (str[i] === ',' && !inQuotes) {
        row.push(cur); cur = '';
      } else {
        cur += str[i];
      }
    }
    row.push(cur);
    return row;
  };

  const counts = { transactions: 0, categories: 0, wallets: 0 };
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length < 8) continue;
    const [date, type, amountStr, categoryName, walletName, merchant, note, source] = row;
    
    let categoryId = null;
    if (categoryName) {
      const cat = await db.getFirstAsync<{id: number}>('SELECT id FROM categories WHERE name = ? COLLATE NOCASE', [categoryName]);
      if (cat) { categoryId = cat.id; }
      else {
        const res = await db.runAsync('INSERT INTO categories (name, icon, color, type, is_system, created_at) VALUES (?, ?, ?, ?, 0, ?)', [categoryName, '🏷️', '#06B6D4', type || 'expense', new Date().toISOString()]);
        categoryId = res.lastInsertRowId;
        counts.categories++;
      }
    }
    
    let walletId = null;
    if (walletName) {
      const wal = await db.getFirstAsync<{id: number}>('SELECT id FROM wallets WHERE name = ? COLLATE NOCASE', [walletName]);
      if (wal) { walletId = wal.id; }
      else {
        const res = await db.runAsync('INSERT INTO wallets (name, type, currency, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [walletName, 'cash', 'INR', 0, new Date().toISOString(), new Date().toISOString()]);
        walletId = res.lastInsertRowId;
        counts.wallets++;
      }
    }
    
    await db.runAsync(
      `INSERT INTO transactions (amount, type, category_id, wallet_id, merchant, note, source, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Number(amountStr), type || 'expense', categoryId, walletId, merchant, note, source, date, new Date().toISOString(), new Date().toISOString()]
    );
    counts.transactions++;
  }
  return counts;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appVersion: string;
  data: {
    wallets: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    transactions: Record<string, unknown>[];
    budgets: Record<string, unknown>[];
    moods: Record<string, unknown>[];
    streaks: Record<string, unknown>[];
    milestones: Record<string, unknown>[];
    settings: Record<string, unknown>[];
  };
}

/**
 * Export all data as a JSON backup file and share it.
 */
export async function exportBackup(): Promise<string> {
  const db = getDb();

  const [wallets, categories, transactions, budgets, moods, streaks, milestones, settings] = await Promise.all([
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM wallets'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM transactions'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM budgets'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM moods'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM streaks'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM milestones'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM settings'),
  ]);

  const backup: BackupData = {
    version: config.app.schemaVersion,
    exportedAt: new Date().toISOString(),
    appVersion: config.app.version,
    data: {
      wallets, categories, transactions, budgets,
      moods, streaks, milestones, settings,
    },
  };

  const fileName = `${config.backup.filePrefix}${format(new Date(), 'yyyy-MM-dd_HHmmss')}${config.backup.fileExtension}`;
  const filePath = `${documentDirectory}${fileName}`;

  await writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

  // Share the file
  await shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Export Fintter Backup',
  });

  return filePath;
}

/**
 * Import data from a backup JSON file.
 * Returns the number of records imported per table.
 */
export async function importBackup(): Promise<Record<string, number> | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const fileUri = result.assets[0].uri;
  const content = await readAsStringAsync(fileUri);

  let backup: BackupData;
  try {
    backup = JSON.parse(content);
  } catch (error) {
    if (content.startsWith('Date,Type,Amount')) {
      const db = getDb();
      return await importCsv(content, db);
    }
    throw new Error('Invalid backup file format');
  }

  if (!backup.version || !backup.data) {
    throw new Error('Invalid backup structure — missing version or data');
  }

  const db = getDb();
  const counts: Record<string, number> = {};

  // Import in dependency order
  const tables: { name: keyof BackupData['data']; columns: string[] }[] = [
    { name: 'wallets', columns: ['id', 'name', 'type', 'currency', 'balance', 'icon', 'color', 'is_default', 'created_at', 'updated_at'] },
    { name: 'categories', columns: ['id', 'name', 'icon', 'color', 'type', 'parent_id', 'is_system', 'created_at'] },
    { name: 'moods', columns: ['id', 'label', 'emoji', 'valence', 'created_at'] },
    { name: 'transactions', columns: ['id', 'amount', 'type', 'category_id', 'wallet_id', 'to_wallet_id', 'note', 'merchant', 'tags', 'mood_id', 'is_impulse', 'is_recurring', 'recurring_days', 'next_transaction_id', 'source', 'date', 'created_at', 'updated_at'] },
    { name: 'budgets', columns: ['id', 'name', 'category_id', 'wallet_id', 'amount', 'period', 'start_date', 'end_date', 'rollover', 'alert_at_percent', 'created_at', 'updated_at'] },
    { name: 'streaks', columns: ['id', 'type', 'current_count', 'longest_count', 'last_achieved', 'updated_at'] },
    { name: 'milestones', columns: ['id', 'type', 'label', 'achieved_at', 'is_shown'] },
    { name: 'settings', columns: ['key', 'value', 'updated_at'] },
  ];

  for (const table of tables) {
    const rows = backup.data[table.name];
    if (!rows || !Array.isArray(rows)) continue;

    counts[table.name] = 0;
    for (const row of rows) {
      try {
        const values = table.columns.map((col) => row[col] ?? null);
        const placeholders = table.columns.map(() => '?').join(', ');
        await db.runAsync(
          `INSERT OR REPLACE INTO ${table.name} (${table.columns.join(', ')}) VALUES (${placeholders})`,
          values as any
        );
        counts[table.name]++;
      } catch (error) {
        console.warn(`[Import] Skipping row in ${table.name}:`, error);
      }
    }
  }

  return counts;
}

/**
 * Export data as CSV (transactions only, for spreadsheet apps).
 */
export async function exportTransactionsCsv(): Promise<string> {
  const db = getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT t.*, c.name AS category_name, w.name AS wallet_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     ORDER BY t.date DESC`
  );

  const headers = ['Date', 'Type', 'Amount', 'Category', 'Wallet', 'Merchant', 'Note', 'Source'];
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const line = [
      row.date as string,
      row.type as string,
      String(row.amount),
      `"${(row.category_name as string ?? '').replace(/"/g, '""')}"`,
      `"${(row.wallet_name as string ?? '').replace(/"/g, '""')}"`,
      `"${(row.merchant as string ?? '').replace(/"/g, '""')}"`,
      `"${(row.note as string ?? '').replace(/"/g, '""')}"`,
      row.source as string,
    ].join(',');
    csvLines.push(line);
  }

  const fileName = `fintter_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const filePath = `${documentDirectory}${fileName}`;

  await writeAsStringAsync(filePath, csvLines.join('\n'));
  await shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Transactions' });

  return filePath;
}
