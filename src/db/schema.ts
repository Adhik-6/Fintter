/**
 * Fintter Database Schema
 * All CREATE TABLE definitions.
 * Integer PKs, ISO 8601 timestamps, amounts in smallest currency unit.
 */

export const CREATE_WALLETS_TABLE = `
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'credit', 'upi', 'crypto', 'other')),
    currency TEXT NOT NULL DEFAULT 'INR',
    balance INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    color TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
    parent_id INTEGER REFERENCES categories(id),
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_MOODS_TABLE = `
  CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    emoji TEXT NOT NULL,
    valence INTEGER NOT NULL CHECK(valence BETWEEN -2 AND 2),
    created_at TEXT NOT NULL
  );
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    wallet_id INTEGER NOT NULL REFERENCES wallets(id),
    to_wallet_id INTEGER REFERENCES wallets(id),
    note TEXT,
    merchant TEXT,
    tags TEXT,
    mood_id INTEGER REFERENCES moods(id),
    is_impulse INTEGER NOT NULL DEFAULT 0,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    next_transaction_id INTEGER REFERENCES transactions(id),
    recurring_days INTEGER,
    source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual', 'sms', 'notification', 'import')),
    budget_id INTEGER REFERENCES budgets(id),
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_BUDGETS_TABLE = `
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    wallet_id INTEGER REFERENCES wallets(id),
    amount INTEGER NOT NULL,
    period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
    start_date TEXT NOT NULL,
    end_date TEXT,
    scope TEXT NOT NULL DEFAULT 'overall' CHECK(scope IN ('overall', 'category_group', 'manual')),
    category_ids TEXT,
    budget_transaction_ids TEXT,
    rollover INTEGER NOT NULL DEFAULT 0,
    alert_at_percent INTEGER NOT NULL DEFAULT 80,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_REMINDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT,
    recurring_id INTEGER REFERENCES recurring_templates(id),
    remind_at TEXT NOT NULL,
    is_dismissed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_STREAKS_TABLE = `
  CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('no_spend_day', 'under_budget', 'daily_log')),
    current_count INTEGER NOT NULL DEFAULT 0,
    longest_count INTEGER NOT NULL DEFAULT 0,
    last_achieved TEXT,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_MILESTONES_TABLE = `
  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    achieved_at TEXT,
    is_shown INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_PARSER_RULES_TABLE = `
  CREATE TABLE IF NOT EXISTS parser_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('sms', 'notification')),
    pattern TEXT NOT NULL,
    amount_group INTEGER,
    merchant_group INTEGER,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
    default_category_id INTEGER REFERENCES categories(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_ANALYTICS_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    data TEXT NOT NULL,
    computed_at TEXT NOT NULL
  );
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

/** Indexes for query performance */
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
  CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
`;

/** All table creation statements in order (respecting foreign key dependencies) */
export const ALL_CREATE_STATEMENTS = [
  CREATE_WALLETS_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_MOODS_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_BUDGETS_TABLE,
  CREATE_REMINDERS_TABLE,
  CREATE_STREAKS_TABLE,
  CREATE_MILESTONES_TABLE,
  CREATE_PARSER_RULES_TABLE,
  CREATE_ANALYTICS_CACHE_TABLE,
  CREATE_SETTINGS_TABLE,
];
