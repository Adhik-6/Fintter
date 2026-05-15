# Fintter — Vibe Coding Prompt
## Production-Grade React Native Expense Tracker

Build a production-grade React Native mobile application called **Fintter** — a futuristic, offline-first expense tracker focused on speed, emotional finance tracking, rule-based automation, and cinematic UI design.

The app must feel modern, fluid, and visually immersive — NOT like a traditional banking app.

---

## TECH STACK & ARCHITECTURE

**Core:**
- React Native with Expo (managed workflow)
- TypeScript (strict mode)
- Expo Router (file-based navigation)

**State Management:**
- Zustand (global state + slices per feature)
- No Redux — keep state minimal and co-located

**Storage:**
- SQLite (via `expo-sqlite`) — primary database, source of truth
- MMKV (via `react-native-mmkv`) — lightweight settings, UI preferences, onboarding flags

**UI & Animation:**
- React Native Reanimated v3
- React Native Gesture Handler
- NativeWind (Tailwind CSS for React Native)
- Dark-theme-first; AMOLED-friendly palette
- React Native Skia — only for Skia-specific visuals (spending heatmap, health meter arc). Do not overuse.

**Lists & Charts:**
- FlashList (all long lists — transactions, categories)
- Victory Native — charts (line, bar, pie, area)

**Architecture Pattern:**
- Feature-based folder structure (each feature is self-contained)
- Strict separation of: UI components → hooks → store slices → database layer → services → utilities
- Database accessed only through a typed repository/service layer — never directly from components
- All business logic in hooks or service files, not inside components

---

## ARCHITECTURE — FOLDER STRUCTURE

```
fintter/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard / Home
│   │   ├── history.tsx           # Transaction history
│   │   ├── analytics.tsx         # Analytics screen
│   │   ├── budgets.tsx           # Budget management
│   │   └── settings.tsx          # Settings
│   ├── modals/
│   │   ├── quick-add.tsx         # Quick-add expense modal
│   │   ├── transaction-detail.tsx
│   │   ├── category-picker.tsx
│   │   └── mood-picker.tsx
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   ├── setup-currency.tsx
│   │   └── setup-categories.tsx
│   └── _layout.tsx
│
├── src/
│   ├── features/
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── types.ts
│   │   ├── budgets/
│   │   ├── categories/
│   │   ├── wallets/
│   │   ├── recurring/
│   │   ├── analytics/
│   │   ├── emotional/
│   │   ├── gamification/
│   │   └── notifications/
│   │
│   ├── db/
│   │   ├── schema.ts             # All CREATE TABLE definitions
│   │   ├── migrations/           # Versioned migration files
│   │   ├── repositories/         # One file per entity (CRUD)
│   │   └── index.ts              # DB singleton + init
│   │
│   ├── services/
│   │   ├── parserEngine.ts       # Rule-based SMS/notification parser
│   │   ├── recurringDetector.ts  # Pattern-matching for recurring txns
│   │   ├── backupService.ts      # JSON export/import
│   │   ├── reminderService.ts    # Local push notification scheduling
│   │   └── analyticsEngine.ts   # In-app analytics computation
│   │
│   ├── store/
│   │   ├── index.ts              # Root Zustand store
│   │   └── slices/               # One slice per domain
│   │
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   ├── useAnalytics.ts
│   │   ├── useRecurring.ts
│   │   └── useTheme.ts
│   │
│   ├── components/               # Shared, reusable UI components
│   │   ├── ui/                   # Atoms: Button, Card, Badge, Input, Sheet
│   │   ├── charts/               # Chart wrappers
│   │   ├── timeline/             # Timeline feed components
│   │   └── animated/             # Reanimated wrappers
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── format.ts
│   │   └── validators.ts
│   │
│   └── constants/
│       ├── categories.ts         # Default category definitions
│       ├── currencies.ts
│       └── config.ts
│
├── assets/
│   ├── fonts/
│   └── icons/
│
├── tailwind.config.js
├── app.json
└── tsconfig.json
```

---

## DATABASE SCHEMA

All tables use integer primary keys. All timestamps stored as ISO 8601 strings. All monetary amounts stored as integers in the smallest currency unit (paise for INR, cents for USD).

```sql
-- Wallets / Accounts
CREATE TABLE wallets (
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

-- Categories
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
  parent_id INTEGER REFERENCES categories(id),
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Transactions (core table)
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  wallet_id INTEGER NOT NULL REFERENCES wallets(id),
  to_wallet_id INTEGER REFERENCES wallets(id),       -- for transfers
  note TEXT,
  merchant TEXT,
  tags TEXT,                                          -- JSON array string
  mood_id INTEGER REFERENCES moods(id),
  is_impulse INTEGER NOT NULL DEFAULT 0,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurring_id INTEGER REFERENCES recurring_templates(id),
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual', 'sms', 'notification', 'import')),
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Moods
CREATE TABLE moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  valence INTEGER NOT NULL CHECK(valence BETWEEN -2 AND 2), -- -2=very bad, 2=very good
  created_at TEXT NOT NULL
);

-- Budgets
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),      -- NULL = total budget
  wallet_id INTEGER REFERENCES wallets(id),           -- NULL = all wallets
  amount INTEGER NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  rollover INTEGER NOT NULL DEFAULT 0,
  alert_at_percent INTEGER NOT NULL DEFAULT 80,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Recurring Templates
CREATE TABLE recurring_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  wallet_id INTEGER NOT NULL REFERENCES wallets(id),
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval INTEGER NOT NULL DEFAULT 1,               -- every N frequency units
  next_due TEXT NOT NULL,
  last_triggered TEXT,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Reminders
CREATE TABLE reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  recurring_id INTEGER REFERENCES recurring_templates(id),
  remind_at TEXT NOT NULL,
  is_dismissed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Streaks & Gamification
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('no_spend_day', 'under_budget', 'daily_log')),
  current_count INTEGER NOT NULL DEFAULT 0,
  longest_count INTEGER NOT NULL DEFAULT 0,
  last_achieved TEXT,
  updated_at TEXT NOT NULL
);

-- Milestones
CREATE TABLE milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  achieved_at TEXT,
  is_shown INTEGER NOT NULL DEFAULT 0
);

-- Parser Rules (for SMS / notification parsing)
CREATE TABLE parser_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('sms', 'notification')),
  pattern TEXT NOT NULL,                              -- regex string
  amount_group INTEGER,                              -- regex capture group index
  merchant_group INTEGER,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  default_category_id INTEGER REFERENCES categories(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Analytics Cache (precomputed summaries for performance)
CREATE TABLE analytics_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,                          -- e.g. "monthly_2025_06"
  data TEXT NOT NULL,                                -- JSON blob
  computed_at TEXT NOT NULL
);

-- Settings (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## ZUSTAND STORE DESIGN

One root store composed of slices. Each slice owns its own state and actions.

```typescript
// Root store shape
interface FintterStore {
  // Transactions
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: number, input: Partial<CreateTransactionInput>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // Wallets
  wallets: Wallet[];
  activeWalletId: number | null;
  fetchWallets: () => Promise<void>;
  setActiveWallet: (id: number) => void;

  // Categories
  categories: Category[];
  fetchCategories: () => Promise<void>;

  // Budgets
  budgets: Budget[];
  budgetProgress: Record<number, BudgetProgress>;
  fetchBudgets: () => Promise<void>;
  computeBudgetProgress: () => Promise<void>;

  // Recurring
  recurringTemplates: RecurringTemplate[];
  fetchRecurring: () => Promise<void>;
  triggerDueRecurring: () => Promise<void>;

  // Analytics (cached summaries — not raw data)
  monthlySummary: MonthlySummary | null;
  categoryBreakdown: CategoryBreakdown[];
  spendingVelocity: SpendingVelocity;
  refreshAnalytics: (month: string) => Promise<void>;

  // Gamification
  streaks: Streak[];
  milestones: Milestone[];
  financialHealthScore: number;
  fetchGamification: () => Promise<void>;

  // UI State
  quickAddVisible: boolean;
  setQuickAddVisible: (v: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
```

**Slice rules:**
- Each slice is defined in `src/store/slices/`
- Actions always call the repository layer — never raw SQL
- Optimistic updates on add/delete; rollback on error
- Analytics state holds computed summaries only, never raw transaction arrays

---

## NAVIGATION FLOW

```
App Start
  └── Check onboarding complete (MMKV)
        ├── No  → /onboarding/welcome → setup-currency → setup-categories → /tabs
        └── Yes → /(tabs)/index (Dashboard)

/(tabs)/
  ├── index           Dashboard
  ├── history         Transaction History (FlashList timeline)
  ├── analytics       Analytics & Insights
  ├── budgets         Budget Management
  └── settings        Settings

/modals/
  ├── quick-add       Full-screen modal (triggered by FAB)
  ├── transaction-detail  View/edit a transaction
  ├── category-picker Searchable category sheet
  └── mood-picker     Mood selection bottom sheet

/onboarding/
  ├── welcome
  ├── setup-currency
  └── setup-categories
```

---

## THEME SYSTEM

```typescript
// src/theme/colors.ts
export const colors = {
  // Base (AMOLED-friendly)
  black:        '#000000',
  surface0:     '#0A0A0F',   // deepest background
  surface1:     '#12121A',   // cards
  surface2:     '#1A1A28',   // elevated cards
  surface3:     '#222235',   // input fields, chips

  // Accent — Neon Cyan + Purple
  cyan:         '#00E5FF',
  cyanDim:      '#00B8D9',
  cyanGlow:     'rgba(0, 229, 255, 0.15)',
  purple:       '#A855F7',
  purpleDim:    '#7C3AED',
  purpleGlow:   'rgba(168, 85, 247, 0.15)',

  // Semantic
  income:       '#22C55E',
  expense:      '#EF4444',
  transfer:     '#F59E0B',
  warning:      '#F59E0B',

  // Text
  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted:     '#475569',
  textDisabled:  '#334155',

  // Borders & Dividers
  border:        'rgba(255, 255, 255, 0.06)',
  borderStrong:  'rgba(255, 255, 255, 0.12)',

  // Glassmorphism helpers
  glass:         'rgba(255, 255, 255, 0.04)',
  glassBorder:   'rgba(255, 255, 255, 0.08)',
} as const;

export type ColorKey = keyof typeof colors;
```

```typescript
// src/theme/typography.ts
export const typography = {
  // Font family: use Inter or Space Grotesk
  fontFamily: {
    regular:  'Inter-Regular',
    medium:   'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold:     'Inter-Bold',
    mono:     'SpaceMono-Regular',   // for amounts
  },
  fontSize: {
    xs: 11, sm: 13, base: 15, md: 17,
    lg: 20, xl: 24, '2xl': 30, '3xl': 38,
  },
  lineHeight: {
    tight: 1.2, normal: 1.5, relaxed: 1.7,
  },
} as const;
```

---

## CORE SCREENS — REQUIREMENTS

### 1. Dashboard (`/tabs/index`)

Layout (top to bottom):
- Greeting header + current date
- Total balance card (glassmorphic, animated number reveal on mount)
- Wallet selector (horizontal scroll, pill chips)
- Today's spend summary (income vs expense bars)
- Budget health row (horizontal scroll — one card per budget showing % used)
- Recent transactions (last 5, FlashList, tap → detail modal)
- Floating Action Button (FAB) — opens quick-add modal. Animated glow ring pulse.

Interactions:
- Pull to refresh
- Long-press wallet chip to set as default
- Swipe left on transaction card to delete (with haptic feedback)
- Tap total balance to toggle balance visibility

### 2. Quick-Add Modal (`/modals/quick-add`)

This is the most critical screen. Target: expense logged in under 3 seconds.

Layout:
- Amount input at top — large, monospaced font, calculator-style
- Category row — horizontal icon grid, one tap to select, auto-scroll to suggested
- Wallet row — horizontal chip selector
- Optional fields (collapsible): Note / Merchant / Mood / Tags
- Date picker (defaults to now)
- Type toggle: Expense | Income | Transfer
- Save button (animated, haptic on tap)

UX rules:
- Amount field auto-focused on open
- Haptic feedback on category select
- Swipe down to dismiss
- Smart defaults: last-used category pre-selected
- Keyboard stays open until category is selected

### 3. Transaction History (`/tabs/history`)

Timeline layout — grouped by day:
- Sticky date header for each day group (animated separator)
- Transaction card per item (FlashList)
- Each card shows: icon, merchant/note, category, amount, mood emoji (if set)
- Swipe left → delete (with undo snackbar)
- Swipe right → duplicate
- Tap → detail modal

Filter bar (top, sticky):
- Filter by: date range, category, wallet, type, mood
- Search by note/merchant

### 4. Analytics (`/tabs/analytics`)

Sections (vertical scroll):
- Period selector (This Month / Last Month / Custom)
- Summary cards: Total Spent, Total Earned, Net, Avg/Day
- Category Pie Chart (animated, tap slice to drill down)
- Monthly Trend Line Chart (last 6 months)
- Spending Heatmap (calendar view, 7-col grid, color intensity = spend amount)
- Top Categories list
- Top Merchants list
- Mood vs Spend chart (bar — correlate mood with spend amount)
- Impulse purchase stats

All charts animated on scroll-into-view.

### 5. Budget Management (`/tabs/budgets`)

- Budget cards in a grid (2-col)
- Each card: category icon, name, amount used / limit, animated circular progress arc
- Color shifts green → amber → red as % increases
- Add budget button → bottom sheet form
- Tap card → detail with daily breakdown chart

### 6. Settings (`/tabs/settings`)

Sections:
- Profile (name, avatar initial)
- Default currency
- Default wallet
- Wallets (manage, add, edit, delete)
- Categories (manage, add, edit, reorder)
- Parser rules (enable/disable SMS/notification parsers)
- Recurring templates
- Backup & Restore (export JSON, import JSON)
- App Lock (biometric toggle)
- Danger zone (clear all data)

---

## FEATURE DETAILS

### Recurring Transaction Engine

- On app foreground resume, call `recurringDetector.checkAndTrigger()`
- Query all active recurring templates where `next_due <= today`
- For each: create transaction, update `last_triggered`, compute and update `next_due`
- Schedule local push notification (via Expo Notifications) N days before `next_due`
- Missed detection: flag if `next_due` is more than 1 interval behind `today` without a transaction

### Rule-Based SMS / Notification Parser

Designed to be modular and extensible without AI.

```typescript
interface ParserRule {
  id: number;
  name: string;         // "HDFC Bank debit"
  source: 'sms' | 'notification';
  pattern: string;      // regex string
  amountGroup: number;  // capture group index for amount
  merchantGroup?: number;
  type: 'expense' | 'income';
  defaultCategoryId: number;
  isActive: boolean;
}
```

Parser flow:
1. Raw SMS / notification arrives → `parserEngine.parse(raw, source)`
2. Engine iterates active rules in order
3. First matching regex wins
4. Extracted fields passed to `createTransaction()` with `source: 'sms'`
5. Unmatched messages are silently ignored (no crash, no noise)
6. New bank rules can be added in Settings UI without code changes

### Gamification Engine

Computed locally on each app open:

- **No-spend day streak** — count consecutive days with zero expense transactions
- **Under-budget streak** — count consecutive months where total spend < total budget
- **Financial Health Score (0–100)** — weighted composite:
  - Budget adherence: 35%
  - Savings rate (income − expense / income): 30%
  - No-spend days this month: 20%
  - Streak bonuses: 15%
- **Milestones** — triggered when thresholds are crossed (first transaction, 30-day streak, 100 transactions, first budget set, etc.)
- Milestone unlocks trigger a one-time confetti animation (Reanimated)

### Backup & Restore

Export format: single JSON file containing all table data.

```typescript
interface BackupPayload {
  version: number;          // schema version for migration safety
  exportedAt: string;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringTemplates: RecurringTemplate[];
  moods: Mood[];
  parserRules: ParserRule[];
  streaks: Streak[];
  milestones: Milestone[];
}
```

Import flow:
1. User selects JSON file (Expo Document Picker)
2. Validate `version` field — reject incompatible versions with clear error message
3. Show preview: X transactions, Y categories, date range
4. Confirm → wipe existing data → insert from backup in a single transaction (atomic)
5. Show success screen with summary

### Emotional Spending Tracking

- Mood picker appears as optional step in quick-add (bottom sheet, 5 emoji options)
- Moods stored with transactions
- Analytics screen shows:
  - Avg spend per mood (bar chart)
  - Impulse purchase % (transactions flagged as impulse)
  - "Emotional spending" section: list of regret-tagged transactions
- Users can retroactively tag a transaction's mood from the detail view

---

## ANIMATIONS & INTERACTIONS

| Interaction | Animation |
|---|---|
| App open → Dashboard | Staggered card fade-up (Reanimated FadeInDown, 50ms stagger) |
| FAB press | Scale pulse + glow ring expand |
| Quick-add open | Spring slide-up from bottom |
| Amount input | Each digit bounces in (spring, stiffness 400) |
| Category select | Haptic + scale pop (0.85 → 1.1 → 1.0) |
| Transaction save | Checkmark morph + card flies to history list |
| Balance card | Number counter animation on mount (0 → actual, 600ms ease-out) |
| Budget arc | Arc draws in on mount (Skia path animation) |
| Chart reveal | Fade + scale in when scrolled into view (useAnimatedStyle + useScrollViewOffset) |
| Swipe to delete | Rubber-band left, red background reveal, snap-back on cancel |
| Milestone unlock | Full-screen confetti burst (Reanimated particles) |
| No-spend day | Subtle green glow on date in calendar |

All animations must respect `useReducedMotion()` — disable or simplify if user has system accessibility motion reduced.

---

## FUTURE INTEGRATION POINTS (scaffold only — do not implement)

Prepare clean interfaces and placeholder service files for the following. These are not implemented in v1 but must not require architectural changes when added later.

```typescript
// src/services/future/aiInsightsService.ts
// Placeholder — will call on-device SLM or cloud LLM
export interface AIInsightsService {
  generateMonthlySummary(data: MonthlySummary): Promise<string>;
  suggestCategory(note: string, amount: number): Promise<number>;  // returns categoryId
  detectAnomaly(transactions: Transaction[]): Promise<AnomalyReport>;
}

// src/services/future/syncService.ts
// Placeholder — will sync to Supabase / Firebase
export interface SyncService {
  push(payload: BackupPayload): Promise<void>;
  pull(): Promise<BackupPayload>;
  resolveConflicts(local: BackupPayload, remote: BackupPayload): BackupPayload;
}

// src/services/future/ocrService.ts
// Placeholder — will parse receipt images
export interface OCRService {
  parseReceiptImage(uri: string): Promise<Partial<CreateTransactionInput>>;
}
```

These interfaces are defined and referenced in comments inside relevant components but are **never called** in v1.

---

## PERFORMANCE REQUIREMENTS

- FlashList for all lists exceeding 20 items (never FlatList)
- Charts lazy-rendered (only compute data when tab is active)
- Analytics computations run in background (not on main thread) via batched SQLite queries
- No `useEffect` chains that trigger re-renders
- Zustand selectors must be granular — components subscribe only to the slice of state they need
- No inline styles that change on every render — use `StyleSheet.create` or NativeWind classes
- DB writes never block the UI — all writes are `async`, errors caught silently and logged
- `InteractionManager.runAfterInteractions` for heavy operations after navigation

---

## OUTPUT REQUIREMENTS

Generate in this order:

1. `app.json` and `package.json` with all required dependencies and correct versions
2. `tailwind.config.js` (NativeWind v4 config)
3. `tsconfig.json` (strict mode)
4. Full `src/theme/` system
5. Full `src/db/` layer — schema, migrations, repositories
6. Full Zustand store with all slices
7. All service files (parser, recurring, backup, analytics, gamification)
8. All future service interfaces (placeholder only)
9. All reusable `src/components/` (ui, charts, timeline, animated)
10. All screens in order: onboarding → dashboard → quick-add → history → analytics → budgets → settings
11. Navigation layout (`app/_layout.tsx`, tab layout)
12. Default seed data (categories, moods, 2 default wallets, default parser rules)

After generating, verify:
- No screen imports directly from `db/` (must go through repositories)
- No `any` types
- All navigation routes are typed
- All async functions have try/catch
- No feature uses a network call or an LLM/SLM
