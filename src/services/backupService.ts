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

export interface BackupData {
  version: number;
  exportedAt: string;
  appVersion: string;
  data: {
    wallets: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    transactions: Record<string, unknown>[];
    budgets: Record<string, unknown>[];
    recurring_templates: Record<string, unknown>[];
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

  const [wallets, categories, transactions, budgets, recurring, moods, streaks, milestones, settings] = await Promise.all([
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM wallets'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM transactions'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM budgets'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM recurring_templates'),
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
      recurring_templates: recurring, moods, streaks, milestones, settings,
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
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const fileUri = result.assets[0].uri;
  const content = await readAsStringAsync(fileUri);

  let backup: BackupData;
  try {
    backup = JSON.parse(content);
  } catch {
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
    { name: 'transactions', columns: ['id', 'amount', 'type', 'category_id', 'wallet_id', 'to_wallet_id', 'note', 'merchant', 'tags', 'mood_id', 'is_impulse', 'is_recurring', 'recurring_id', 'source', 'date', 'created_at', 'updated_at'] },
    { name: 'budgets', columns: ['id', 'name', 'category_id', 'wallet_id', 'amount', 'period', 'start_date', 'end_date', 'rollover', 'alert_at_percent', 'created_at', 'updated_at'] },
    { name: 'recurring_templates', columns: ['id', 'name', 'amount', 'type', 'category_id', 'wallet_id', 'frequency', 'interval', 'next_due', 'last_triggered', 'end_date', 'is_active', 'note', 'created_at', 'updated_at'] },
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
