/**
 * Fintter Database Seed Data
 * Inserted on first launch after migration.
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import { allDefaultCategories } from '@src/constants/categories';
import { defaultMoods } from '@src/features/emotional/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
        pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+debited.*HDFC',
        amountGroup: null,
        merchantGroup: null,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
      {
        name: 'HDFC Bank Credit',
        source: 'sms',
        pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+credited.*HDFC',
        amountGroup: null,
        merchantGroup: null,
        type: 'income',
        defaultCategoryId: salaryCatId,
      },
      {
        name: 'SBI Debit',
        source: 'sms',
        pattern: 'debited by Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?).*SBI',
        amountGroup: null,
        merchantGroup: null,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
      {
        name: 'UPI Payment',
        source: 'sms',
        pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?).*(?:paid to|sent to)\\s+(?<merchant>[A-Za-z0-9\\s@_.-]+?)(?:\\s|$)',
        amountGroup: null,
        merchantGroup: null,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
      {
        name: 'ICICI Bank Debit',
        source: 'sms',
        pattern: 'INR\\s*(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+(?:debited|deducted).*ICICI',
        amountGroup: null,
        merchantGroup: null,
        type: 'expense',
        defaultCategoryId: defaultCatId,
      },
      {
        name: 'Kotak Bank Debit',
        source: 'sms',
        pattern: 'Rs\\.?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+debited.*Kotak',
        amountGroup: null,
        merchantGroup: null,
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

export async function seedTestData(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  // 1. Clear existing dynamic user data
  await db.runAsync('DELETE FROM transactions');
  await db.runAsync('DELETE FROM budgets');
  await db.runAsync('DELETE FROM analytics_cache');
  await db.runAsync('DELETE FROM categories WHERE is_system = 0');
  await db.runAsync('DELETE FROM wallets');

  // 2. Seed default wallets with 0 balance (will be updated after seeding transactions)
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

  // 3. Seed some custom categories for testing
  const categoryStmt = await db.prepareAsync(
    `INSERT INTO categories (name, icon, color, type, parent_id, is_system, created_at)
     VALUES ($name, $icon, $color, $type, $parentId, $isSystem, $createdAt)`
  );

  try {
    await categoryStmt.executeAsync({
      $name: 'Coffee & Cafes',
      $icon: '☕',
      $color: '#8B5A2B',
      $type: 'expense',
      $parentId: null,
      $isSystem: 0,
      $createdAt: now,
    });
    await categoryStmt.executeAsync({
      $name: 'Gadgets',
      $icon: '🎮',
      $color: '#00FFFF',
      $type: 'expense',
      $parentId: null,
      $isSystem: 0,
      $createdAt: now,
    });
    await categoryStmt.executeAsync({
      $name: 'Side Hustle',
      $icon: '🚀',
      $color: '#10B981',
      $type: 'income',
      $parentId: null,
      $isSystem: 0,
      $createdAt: now,
    });
  } finally {
    await categoryStmt.finalizeAsync();
  }

  // 4. Retrieve seeded items to get their IDs
  const dbWallets = await db.getAllAsync<{ id: number; name: string }>('SELECT id, name FROM wallets');
  const dbCategories = await db.getAllAsync<{ id: number; name: string; type: string }>('SELECT id, name, type FROM categories');
  const dbMoods = await db.getAllAsync<{ id: number; label: string }>('SELECT id, label FROM moods');

  const cashWalletId = dbWallets.find(w => w.name === 'Cash')?.id ?? 1;
  const bankWalletId = dbWallets.find(w => w.name === 'Bank Account')?.id ?? 2;

  const getCatId = (name: string): number => {
    return dbCategories.find(c => c.name === name)?.id ?? dbCategories[0]?.id ?? 1;
  };

  const getMoodId = (label: string): number | null => {
    return dbMoods.find(m => m.label === label)?.id ?? null;
  };

  // 5. Seed budgets for the current month
  const budgetStmt = await db.prepareAsync(
    `INSERT INTO budgets (name, category_id, wallet_id, amount, period, start_date, end_date, rollover, alert_at_percent, created_at, updated_at)
     VALUES ($name, $categoryId, $walletId, $amount, $period, $startDate, $endDate, $rollover, $alertAtPercent, $createdAt, $updatedAt)`
  );

  try {
    const startOfCurrentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00");
    const endOfCurrentMonth = format(endOfMonth(new Date()), "yyyy-MM-dd'T'23:59:59");

    // Food Budget: ₹6,000 (600000 paise)
    await budgetStmt.executeAsync({
      $name: 'Food & Dining Budget',
      $categoryId: getCatId('Food & Dining'),
      $walletId: null,
      $amount: 600000,
      $period: 'monthly',
      $startDate: startOfCurrentMonth,
      $endDate: endOfCurrentMonth,
      $rollover: 0,
      $alertAtPercent: 80,
      $createdAt: now,
      $updatedAt: now,
    });

    // Transport Budget: ₹3,000 (300000 paise)
    await budgetStmt.executeAsync({
      $name: 'Transport Budget',
      $categoryId: getCatId('Transport'),
      $walletId: null,
      $amount: 300000,
      $period: 'monthly',
      $startDate: startOfCurrentMonth,
      $endDate: endOfCurrentMonth,
      $rollover: 0,
      $alertAtPercent: 80,
      $createdAt: now,
      $updatedAt: now,
    });

    // Shopping Budget: ₹5,000 (500000 paise)
    await budgetStmt.executeAsync({
      $name: 'Shopping Budget',
      $categoryId: getCatId('Shopping'),
      $walletId: null,
      $amount: 500000,
      $period: 'monthly',
      $startDate: startOfCurrentMonth,
      $endDate: endOfCurrentMonth,
      $rollover: 0,
      $alertAtPercent: 80,
      $createdAt: now,
      $updatedAt: now,
    });
  } finally {
    await budgetStmt.finalizeAsync();
  }

  // 6. Generate 30 days of daily transactions
  const txStmt = await db.prepareAsync(
    `INSERT INTO transactions (amount, type, category_id, wallet_id, to_wallet_id, note, merchant, tags, mood_id, is_impulse, is_recurring, source, date, created_at, updated_at)
     VALUES ($amount, $type, $categoryId, $walletId, $toWalletId, $note, $merchant, $tags, $moodId, $isImpulse, $isRecurring, $source, $date, $createdAt, $updatedAt)`
  );

  try {
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Natural scatter of transaction hours
      date.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);
      const dateStr = date.toISOString();
      const dayOfWeek = date.getDay();

      // Daily Transport commute (most weekdays)
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.2) {
        const isUber = Math.random() > 0.5;
        await txStmt.executeAsync({
          $amount: 15000 + Math.floor(Math.random() * 200) * 100, // ₹150 - ₹350
          $type: 'expense',
          $categoryId: getCatId('Transport'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: isUber ? 'Uber ride to office' : 'Auto ride',
          $merchant: isUber ? 'Uber' : 'Local Auto',
          $tags: 'commute',
          $moodId: getMoodId('Neutral'),
          $isImpulse: 0,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Daily Lunch
      await txStmt.executeAsync({
        $amount: 18000 + Math.floor(Math.random() * 250) * 100, // ₹180 - ₹430
        $type: 'expense',
        $categoryId: getCatId('Food & Dining'),
        $walletId: Math.random() > 0.5 ? cashWalletId : bankWalletId,
        $toWalletId: null,
        $note: 'Lunch at office cafeteria',
        $merchant: 'Cafeteria',
        $tags: 'food,lunch',
        $moodId: getMoodId('Good'),
        $isImpulse: 0,
        $isRecurring: 0,
        $source: 'manual',
        $date: dateStr,
        $createdAt: dateStr,
        $updatedAt: dateStr,
      });

      // Coffee & Cafes (custom category, often impulse purchase)
      if (Math.random() > 0.4) {
        const isStarbucks = Math.random() > 0.7;
        const isImpulse = Math.random() > 0.5 ? 1 : 0;
        await txStmt.executeAsync({
          $amount: isStarbucks ? 35000 : 12000 + Math.floor(Math.random() * 80) * 100, // ₹350 or ₹120-₹200
          $type: 'expense',
          $categoryId: getCatId('Coffee & Cafes'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: isStarbucks ? 'Iced Latte' : 'Evening Tea & Snacks',
          $merchant: isStarbucks ? 'Starbucks' : 'Chai Point',
          $tags: isImpulse ? 'impulse,caffeine' : 'caffeine',
          $moodId: getMoodId(isImpulse ? 'Great' : 'Good'),
          $isImpulse: isImpulse,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Dinner (Zomato/Swiggy or restaurant, weekend heavy)
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6 || Math.random() > 0.7) {
        const isFineDining = Math.random() > 0.7;
        const isImpulse = Math.random() > 0.5 ? 1 : 0;
        await txStmt.executeAsync({
          $amount: isFineDining ? 150000 + Math.floor(Math.random() * 1000) * 100 : 45000 + Math.floor(Math.random() * 400) * 100, // ₹1500+ or ₹450-₹850
          $type: 'expense',
          $categoryId: getCatId('Food & Dining'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: isFineDining ? 'Dinner with friends' : 'Zomato order',
          $merchant: isFineDining ? 'Barbeque Nation' : 'Zomato',
          $tags: 'food,dinner',
          $moodId: getMoodId(isFineDining ? 'Great' : 'Neutral'),
          $isImpulse: isImpulse,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Weekly Groceries
      if (dayOfWeek === 6) {
        await txStmt.executeAsync({
          $amount: 150000 + Math.floor(Math.random() * 2000) * 100, // ₹1500 - ₹3500
          $type: 'expense',
          $categoryId: getCatId('Groceries'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Weekly groceries',
          $merchant: 'Zepto',
          $tags: 'groceries',
          $moodId: getMoodId('Neutral'),
          $isImpulse: 0,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Shopping (some impulse, some planned)
      if (Math.random() > 0.85) {
        const isImpulse = Math.random() > 0.4 ? 1 : 0;
        await txStmt.executeAsync({
          $amount: 80000 + Math.floor(Math.random() * 3000) * 100, // ₹800 - ₹3800
          $type: 'expense',
          $categoryId: getCatId('Shopping'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: isImpulse ? 'Impulse clothes purchase' : 'T-shirts and socks',
          $merchant: 'Myntra',
          $tags: isImpulse ? 'impulse,shopping' : 'shopping',
          $moodId: getMoodId(isImpulse ? 'Bad' : 'Good'),
          $isImpulse: isImpulse,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Entertainment (weekends movie or gaming)
      if ((dayOfWeek === 5 || dayOfWeek === 6) && Math.random() > 0.6) {
        await txStmt.executeAsync({
          $amount: 60000 + Math.floor(Math.random() * 1200) * 100, // ₹600 - ₹1800
          $type: 'expense',
          $categoryId: getCatId('Entertainment'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Movie tickets',
          $merchant: 'PVR Cinemas',
          $tags: 'movie',
          $moodId: getMoodId('Great'),
          $isImpulse: 0,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Gadgets (Impulse buy) on Day -12
      if (i === 12) {
        await txStmt.executeAsync({
          $amount: 850000, // ₹8,500
          $type: 'expense',
          $categoryId: getCatId('Gadgets'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Mechanical Keyboard Cherry MX Blue',
          $merchant: 'Keychron',
          $tags: 'impulse,setup',
          $moodId: getMoodId('Great'),
          $isImpulse: 1,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Monthly Salary on Day -28
      if (i === 28) {
        await txStmt.executeAsync({
          $amount: 8500000, // ₹85,000
          $type: 'income',
          $categoryId: getCatId('Salary'),
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Monthly salary credit',
          $merchant: 'Tech Corp LLC',
          $tags: 'salary',
          $moodId: getMoodId('Great'),
          $isImpulse: 0,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Freelance Income on Day -15
      if (i === 15) {
        await txStmt.executeAsync({
          $amount: 2200000, // ₹22,000
          $type: 'income',
          $categoryId: getCatId('Bonus') ?? 1,
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Upwork Project Milestones',
          $merchant: 'Upwork Client',
          $tags: 'freelance,side-hustle',
          $moodId: getMoodId('Great'),
          $isImpulse: 0,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Subscriptions on Day -25
      if (i === 25) {
        await txStmt.executeAsync({
          $amount: 69900, // ₹699
          $type: 'expense',
          $categoryId: getCatId('Other') ?? 1,
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Netflix subscription',
          $merchant: 'Netflix',
          $tags: 'subscription',
          $moodId: getMoodId('Neutral'),
          $isImpulse: 0,
          $isRecurring: 1,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });

        await txStmt.executeAsync({
          $amount: 29900, // ₹299
          $type: 'expense',
          $categoryId: getCatId('Other') ?? 1,
          $walletId: bankWalletId,
          $toWalletId: null,
          $note: 'Spotify Premium Family plan',
          $merchant: 'Spotify',
          $tags: 'subscription',
          $moodId: getMoodId('Good'),
          $isImpulse: 0,
          $isRecurring: 1,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }

      // Cash withdrawals (ATM transfers from Bank → Cash)
      if (i === 24 || i === 9) {
        await txStmt.executeAsync({
          $amount: 500000, // ₹5,000
          $type: 'transfer',
          $categoryId: getCatId('Transfer'),
          $walletId: bankWalletId,
          $toWalletId: cashWalletId,
          $note: 'ATM cash withdrawal',
          $merchant: 'HDFC ATM',
          $tags: 'atm,cash',
          $moodId: null,
          $isImpulse: 0,
          $isRecurring: 0,
          $source: 'manual',
          $date: dateStr,
          $createdAt: dateStr,
          $updatedAt: dateStr,
        });
      }
    }
  } finally {
    await txStmt.finalizeAsync();
  }

  // 7. Update wallet balances dynamically to align perfectly with seeded transactions
  await db.runAsync(`
    UPDATE wallets SET balance = (
      COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'income' AND wallet_id = wallets.id), 0) -
      COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND wallet_id = wallets.id), 0) -
      COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'transfer' AND wallet_id = wallets.id), 0) +
      COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'transfer' AND to_wallet_id = wallets.id), 0)
    )
  `);
}
