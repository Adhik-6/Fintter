/**
 * Fintter Database Seed Data
 * Inserted on first launch after migration.
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import { allDefaultCategories } from '@src/constants/categories';
import { defaultMoods } from '@src/features/emotional/types';

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  // Check if already seeded (categories exist)
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (existing && existing.count > 0) {
    return; // Already seeded
  }

  // Seed categories
  const categoryStmt = await db.prepareAsync(
    `INSERT INTO categories (name, icon, color, type, parent_id, is_system, created_at)
     VALUES ($name, $icon, $color, $type, $parentId, $isSystem, $createdAt)`
  );

  try {
    for (const cat of allDefaultCategories) {
      await categoryStmt.executeAsync({
        $name: cat.name,
        $icon: cat.icon,
        $color: cat.color,
        $type: cat.type,
        $parentId: null,
        $isSystem: cat.isSystem ? 1 : 0,
        $createdAt: now,
      });
    }
  } finally {
    await categoryStmt.finalizeAsync();
  }

  // Seed moods
  const moodStmt = await db.prepareAsync(
    `INSERT INTO moods (label, emoji, valence, created_at)
     VALUES ($label, $emoji, $valence, $createdAt)`
  );

  try {
    for (const mood of defaultMoods) {
      await moodStmt.executeAsync({
        $label: mood.label,
        $emoji: mood.emoji,
        $valence: mood.valence,
        $createdAt: now,
      });
    }
  } finally {
    await moodStmt.finalizeAsync();
  }

  // Seed default wallets
  const walletStmt = await db.prepareAsync(
    `INSERT INTO wallets (name, type, currency, balance, icon, color, is_default, created_at, updated_at)
     VALUES ($name, $type, $currency, $balance, $icon, $color, $isDefault, $createdAt, $updatedAt)`
  );

  try {
    await walletStmt.executeAsync({
      $name: 'Cash',
      $type: 'cash',
      $currency: 'INR',
      $balance: 0,
      $icon: '💵',
      $color: '#22C55E',
      $isDefault: 1,
      $createdAt: now,
      $updatedAt: now,
    });

    await walletStmt.executeAsync({
      $name: 'Bank Account',
      $type: 'bank',
      $currency: 'INR',
      $balance: 0,
      $icon: '🏦',
      $color: '#3B82F6',
      $isDefault: 0,
      $createdAt: now,
      $updatedAt: now,
    });
  } finally {
    await walletStmt.finalizeAsync();
  }

  // Seed streaks
  const streakStmt = await db.prepareAsync(
    `INSERT INTO streaks (type, current_count, longest_count, last_achieved, updated_at)
     VALUES ($type, 0, 0, NULL, $updatedAt)`
  );

  try {
    for (const streakType of ['no_spend_day', 'under_budget', 'daily_log'] as const) {
      await streakStmt.executeAsync({
        $type: streakType,
        $updatedAt: now,
      });
    }
  } finally {
    await streakStmt.finalizeAsync();
  }

  // Seed milestones
  const milestoneStmt = await db.prepareAsync(
    `INSERT INTO milestones (type, label, achieved_at, is_shown)
     VALUES ($type, $label, NULL, 0)`
  );

  try {
    const milestones = [
      { type: 'first_transaction', label: '🎉 First Transaction Logged!' },
      { type: 'ten_transactions', label: '🔟 10 Transactions!' },
      { type: 'hundred_transactions', label: '💯 100 Transactions!' },
      { type: 'first_budget', label: '🎯 First Budget Created!' },
      { type: 'seven_day_streak', label: '🔥 7-Day Logging Streak!' },
      { type: 'thirty_day_streak', label: '⚡ 30-Day Logging Streak!' },
      { type: 'first_no_spend_day', label: '💎 First No-Spend Day!' },
      { type: 'week_under_budget', label: '📊 Week Under Budget!' },
      { type: 'month_under_budget', label: '🏆 Month Under Budget!' },
    ];

    for (const ms of milestones) {
      await milestoneStmt.executeAsync({
        $type: ms.type,
        $label: ms.label,
      });
    }
  } finally {
    await milestoneStmt.finalizeAsync();
  }

  // Seed default parser rules (Indian banks)
  const parserStmt = await db.prepareAsync(
    `INSERT INTO parser_rules (name, source, pattern, amount_group, merchant_group, type, default_category_id, is_active, created_at)
     VALUES ($name, $source, $pattern, $amountGroup, $merchantGroup, $type, $defaultCategoryId, $isActive, $createdAt)`
  );

  try {
    // Get the "Other" category id for default assignment
    const otherCategory = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM categories WHERE name = 'Other' AND type = 'expense' LIMIT 1"
    );
    const defaultCatId = otherCategory?.id ?? 1;

    const salaryCategory = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM categories WHERE name = 'Salary' AND type = 'income' LIMIT 1"
    );
    const salaryCatId = salaryCategory?.id ?? 1;

    const rules = [
      {
        name: 'HDFC Bank Debit',
        source: 'sms',
        pattern: 'Rs\\.?(\\d+[\\.\\d]*)\\s+debited.*HDFC',
        amountGroup: 1,
        merchantGroup: null,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
      {
        name: 'HDFC Bank Credit',
        source: 'sms',
        pattern: 'Rs\\.?(\\d+[\\.\\d]*)\\s+credited.*HDFC',
        amountGroup: 1,
        merchantGroup: null,
        type: 'income',
        defaultCategoryId: salaryCatId,
      },
      {
        name: 'SBI Debit',
        source: 'sms',
        pattern: 'debited by Rs\\.?(\\d+[\\.\\d]*).*SBI',
        amountGroup: 1,
        merchantGroup: null,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
      {
        name: 'UPI Payment',
        source: 'sms',
        pattern: 'Rs\\.?(\\d+[\\.\\d]*).*(?:paid to|sent to)\\s+(.+?)\\s',
        amountGroup: 1,
        merchantGroup: 2,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
    ];

    for (const rule of rules) {
      await parserStmt.executeAsync({
        $name: rule.name,
        $source: rule.source,
        $pattern: rule.pattern,
        $amountGroup: rule.amountGroup,
        $merchantGroup: rule.merchantGroup,
        $type: rule.type,
        $defaultCategoryId: rule.defaultCategoryId,
        $isActive: 1,
        $createdAt: now,
      });
    }
  } finally {
    await parserStmt.finalizeAsync();
  }
}
