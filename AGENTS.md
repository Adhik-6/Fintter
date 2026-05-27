# Fintter - Deep Codebase Audit

This document contains an exhaustive audit of every file in the Fintter codebase.

## FILE AUDIT

### File: `app/(tabs)/analytics.tsx`
- **Exports**: AnalyticsScreen
- **Local State**: selectedPeriod, activeTab, selectedCategoryId, focusedSlice
- **Hooks Used**: useStore, useRouter, useCallback, useMemo
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Analytics Screen — with immediate refresh and pie chart visualization.  */

---

### File: `app/(tabs)/budgets.tsx`
- **Exports**: BudgetsScreen
- **Local State**: showAdd, newName, newAmount, scope, selectedCatIds, period, resetVal, resetUnit, manualIcon
- **Hooks Used**: useEffect, useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Budget Management Screen  */

---

### File: `app/(tabs)/history.tsx`
- **Exports**: HistoryScreen
- **Local State**: refreshing, filterType, selectedDate, selectedCategoryId
- **Hooks Used**: useState, useRouter, useStore, useCallback
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Transaction History — timeline grouped by day.  */

---

### File: `app/(tabs)/index.tsx`
- **Exports**: DashboardScreen
- **Local State**: refreshing, balanceVisible
- **Hooks Used**: useEffect, useRouter, useStore, useState, useCallback
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Dashboard Screen — the main home screen.  */

---

### File: `app/(tabs)/settings.tsx`
- **Exports**: SettingsScreen
- **Local State**: exporting, importing, seeding, userName, currency, showNameModal, showCurrencyModal, nameInput
- **Hooks Used**: useState, useRouter, useStore, useCallback
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: '@src/services/backupService', '@src/services/notificationService', '@src/db/repositories/settingsRepository'
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **SQL Executed**: 4 queries found
- **Props Accepted**: 
```typescript
interface SettingRowProps {
  icon: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  danger?: boolean;
  value?: string;
  loading?: boolean;
}
```
- **Summary**: /**  * Settings Screen — connected to all management screens and backup/export services.  */

---

### File: `app/(tabs)/_layout.tsx`
- **Exports**: TabLayout
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Props Accepted**: 
```typescript
interface TabIconProps {
  icon: IoniconName;
  iconFocused: IoniconName;
  label: string;
  focused: boolean;
}
```
- **Summary**: Code file.

---

### File: `app/+not-found.tsx`
- **Exports**: NotFoundScreen
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: Code file.

---

### File: `app/modals/budget-detail.tsx`
- **Exports**: BudgetDetailModal
- **Local State**: showEdit, editName, editAmount, editCategoryId, saving
- **Hooks Used**: useEffect, useRouter, useStore, useMemo
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Summary**: /**  * Budget Detail Modal — view budget progress, edit, and see related transactions.  */

---

### File: `app/modals/categories.tsx`
- **Exports**: CategoriesScreen
- **Local State**: tab, showForm, form, saving
- **Hooks Used**: useState, useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Category Management Screen — Manage both system and custom categories (expense & income).  */

---

### File: `app/modals/category-picker.tsx`
- **Exports**: CategoryPickerModal
- **Local State**: search
- **Hooks Used**: useState, useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Summary**: /**  * Category Picker Modal  */

---

### File: `app/modals/category-spending.tsx`
- **Exports**: CategorySpendingScreen
- **Local State**: selectedCategoryId, showAllMerchants, focusedSlice
- **Hooks Used**: useRouter, useMemo, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Category Spending Modal  * Shows a bar chart for past 1 year of a specific category and its transactions.

---

### File: `app/modals/mood-picker.tsx`
- **Exports**: MoodPickerModal
- **Local State**: moods, selected
- **Hooks Used**: useEffect, useRouter
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/moodRepository'
- **Summary**: /**  * Mood Picker Modal  */

---

### File: `app/modals/parser-rules.tsx`
- **Exports**: ParserRulesScreen
- **Local State**: rules, loading, showForm, saving, form
- **Hooks Used**: useState, useRouter
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/parserRuleRepository'
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Parser Rules Management Screen — view, toggle, and manage SMS parser rules.  */

---

### File: `app/modals/quick-add.tsx`
- **Exports**: QuickAddModal
- **Local State**: amount, txType, selectedCategoryId, selectedWalletId, toWalletId, note, merchant, moodId, isImpulse, makeRecurring, recurringDays, moods, showOptional, saving, resolvedBudget, manualBudgetId, ambiguousSelectedBudgetId
- **Hooks Used**: useState, useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Quick-Add Modal — log a transaction in under 3 seconds.  */

---

### File: `app/modals/smart-scan.tsx`
- **Exports**: SmartScanScreen
- **Local State**: phase, permissionDenied, noNativeModule, reviewItems, saving, savedCount, selectedWalletId
- **Hooks Used**: useState, useRouter, useStore, useCallback
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Smart SMS Scan — reads SMS messages from the device inbox (Android),  * auto-detects financial transactions, and lets the user review and confirm

---

### File: `app/modals/transaction-detail.tsx`
- **Exports**: TransactionDetailModal
- **Local State**: tx, linkedRecurring, showEdit, editAmount, editNote, editType, editCategoryId, editWalletId, editToWalletId, editMerchant, editMoodId, editIsImpulse, editMakeRecurring, editRecurringDays, moods, saving
- **Hooks Used**: useEffect, useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: '@src/db/repositories/transactionRepository'
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Transaction Detail Modal — polished view & full-height edit with improved UX.  */

---

### File: `app/modals/wallets.tsx`
- **Exports**: WalletsScreen
- **Local State**: showForm, form, editWalletId, saving
- **Hooks Used**: useState, useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Wallet Management Screen — Create, edit, delete wallets and set default.  */

---

### File: `app/onboarding/setup-categories.tsx`
- **Exports**: SetupCategoriesScreen
- **Local State**: None detected
- **Hooks Used**: useRouter, useStore
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Onboarding — Setup Categories  */

---

### File: `app/onboarding/setup-currency.tsx`
- **Exports**: SetupCurrencyScreen
- **Local State**: selected
- **Hooks Used**: useState, useRouter
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Onboarding — Setup Currency  */

---

### File: `app/onboarding/welcome.tsx`
- **Exports**: WelcomeScreen
- **Local State**: None detected
- **Hooks Used**: useRouter
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * Onboarding — Welcome Screen  */

---

### File: `app/_layout.tsx`
- **Exports**: RootLayout
- **Local State**: dbReady, dbError
- **Hooks Used**: useEffect, useRouter, useFonts, useStore, useSegments, useCallback
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Summary**: Code file.

---

### File: `src/components/animated/ConfettiOverlay.tsx`
- **Exports**: ConfettiOverlay
- **Local State**: None detected
- **Hooks Used**: useEffect, useStore, useSharedValue, useAnimatedStyle
- **Store/Slices Read**: '@src/store'
- **Repositories/Services Called**: None
- **Props Accepted**: 
```typescript
interface ParticleProps {
  index: number;
  trigger: number;
}
```
- **Summary**: /**  * ConfettiOverlay — Particle system for milestone unlocks.  */

---

### File: `src/components/charts/BudgetProgressBar.tsx`
- **Exports**: BudgetProgressBar
- **Local State**: None detected
- **Hooks Used**: useAnimatedStyle, useEffect, useSharedValue
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface BudgetProgressBarProps {
  name: string;
  icon: string;
  spent: number;
  limit: number;
  percentUsed: number;
  color?: string;
}
```
- **Summary**: /**  * BudgetProgressBar — animated horizontal progress bar for budgets.  */

---

### File: `src/components/charts/CategoryDonutChart.tsx`
- **Exports**: CategorySlice, CategoryDonutChart
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Props Accepted**: 
```typescript
interface CategoryDonutChartProps {
  data: CategorySlice[];
  centerLabel?: string;
  centerValue?: number;
  size?: number;
}
```
- **Summary**: /**  * CategoryDonutChart — donut/pie chart for category breakdown.  */

---

### File: `src/components/charts/index.ts`
- **Exports**: None (default export or no exports)
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Chart Components — barrel export.  */

---

### File: `src/components/charts/SpendingHeatmap.tsx`
- **Exports**: SpendingHeatmap
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Props Accepted**: 
```typescript
interface SpendingHeatmapProps {
  data: Record<string, number>; // date string 'YYYY-MM-DD' -> amount in paise
  month: Date; // A date in the target month
}
```
- **Summary**: /**  * SpendingHeatmap — A 7-column calendar grid showing spending intensity.  */

---

### File: `src/components/charts/SpendingTrendChart.tsx`
- **Exports**: TrendDataPoint, SpendingTrendChart
- **Local State**: tooltip
- **Hooks Used**: useState, useWindowDimensions
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Props Accepted**: 
```typescript
interface SpendingTrendChartProps {
  data: TrendDataPoint[];
  height?: number;
  showArea?: boolean;
  onPointPress?: (date: string) => void;
}
```
- **Summary**: /**  * SpendingTrendChart — weekly area chart with scrollable & tappable data points.  * Uses React state tooltip instead of pointerConfig to avoid scroll conflicts.

---

### File: `src/components/ui/AnimatedNumber.tsx`
- **Exports**: AnimatedNumber
- **Local State**: None detected
- **Hooks Used**: useEffect, useSharedValue, useAnimatedProps
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface AnimatedNumberProps {
  value: number;
  formatFn: (n: number) => string;
  style?: TextStyle;
  duration?: number;
}
```
- **Summary**: /**  * AnimatedNumber — count-up animation for displaying amounts.  */

---

### File: `src/components/ui/CircularProgressArc.tsx`
- **Exports**: CircularProgressArc
- **Local State**: None detected
- **Hooks Used**: useEffect, useSharedValue
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Summary**: /**  * CircularProgressArc — Skia-based circular progress bar with dynamic color.  * Green → Yellow → Orange → Red → Dark Red based on % used.

---

### File: `src/components/ui/EmptyState.tsx`
- **Exports**: EmptyState
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}
```
- **Summary**: /**  * EmptyState — placeholder for screens with no data.  */

---

### File: `src/components/ui/FBottomSheet.tsx`
- **Exports**: FBottomSheet
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface FBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}
```
- **Summary**: /**  * FBottomSheet — modal bottom sheet with drag handle.  */

---

### File: `src/components/ui/FButton.tsx`
- **Exports**: FButton
- **Local State**: None detected
- **Hooks Used**: useAnimatedStyle, useSharedValue
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface FButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}
```
- **Summary**: /**  * FButton — primary, secondary, and ghost button variants.  */

---

### File: `src/components/ui/FCard.tsx`
- **Exports**: FCard
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface FCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glow';
  glowColor?: string;
  animated?: boolean;
  delay?: number;
  style?: ViewStyle;
}
```
- **Summary**: /**  * FCard — glass-morphism card with optional glow accent.  */

---

### File: `src/components/ui/FChip.tsx`
- **Exports**: FChip
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Props Accepted**: 
```typescript
interface FChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  activeColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}
```
- **Summary**: /**  * FChip — selectable pill-shaped chip with icon.  */

---

### File: `src/components/ui/FInput.tsx`
- **Exports**: FInput
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * FInput — themed text input with label and error state.  */

---

### File: `src/components/ui/HealthScoreRing.tsx`
- **Exports**: HealthScoreRing
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Animations/Gestures**: Present (Reanimated/GestureHandler)
- **Props Accepted**: 
```typescript
interface HealthScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}
```
- **Summary**: /**  * HealthScoreRing — circular progress ring for Financial Health Score.  */

---

### File: `src/components/ui/index.ts`
- **Exports**: None (default export or no exports)
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * UI Component Library — barrel export.  */

---

### File: `src/constants/categories.ts`
- **Exports**: DefaultCategory, defaultExpenseCategories, defaultIncomeCategories, defaultTransferCategory, allDefaultCategories
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Default Category Definitions  * System categories that are seeded on first launch.

---

### File: `src/constants/config.ts`
- **Exports**: config
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * App-wide Configuration Constants  */

---

### File: `src/constants/currencies.ts`
- **Exports**: CurrencyDefinition, currencies, defaultCurrencyCode, currencyList
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Currency Definitions  * Includes symbol, code, name, and smallest unit multiplier.

---

### File: `src/db/index.ts`
- **Exports**: getDb
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 5 queries found
- **Summary**: /**  * Fintter Database — Singleton & Initialization  * Provides a typed database singleton and handles migrations + seeding.

---

### File: `src/db/migrations/001_initial.ts`
- **Exports**: MIGRATION_001_VERSION
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Migration 001 — Initial Schema  * Creates all tables for Fintter v1.0.

---

### File: `src/db/migrations/002_linked_list.ts`
- **Exports**: MIGRATION_002_VERSION
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 1 queries found
- **Summary**: Code file.

---

### File: `src/db/migrations/003_budget_scopes.ts`
- **Exports**: MIGRATION_003_VERSION
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: Code file.

---

### File: `src/db/migrations/004_budget_reset_periods.ts`
- **Exports**: MIGRATION_004_VERSION
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: Code file.

---

### File: `src/db/repositories/analyticsRepository.ts`
- **Exports**: MonthlySummary, CategoryBreakdown, SpendingVelocity, MoodSpendCorrelation, TrendDataPoint, MerchantSummary, ImpulseStats, analyticsRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 16 queries found
- **Summary**: /**  * Analytics Repository — aggregation queries + cache.  */

---

### File: `src/db/repositories/budgetRepository.ts`
- **Exports**: budgetRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 8 queries found
- **Summary**: /**  * Budget Repository  */

---

### File: `src/db/repositories/categoryRepository.ts`
- **Exports**: categoryRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 7 queries found
- **Summary**: /**  * Category Repository  */

---

### File: `src/db/repositories/moodRepository.ts`
- **Exports**: moodRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 3 queries found
- **Summary**: /**  * Mood Repository  */

---

### File: `src/db/repositories/parserRuleRepository.ts`
- **Exports**: ParserRule, parserRuleRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 9 queries found
- **Summary**: /**  * Parser Rule Repository  */

---

### File: `src/db/repositories/settingsRepository.ts`
- **Exports**: settingsRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 4 queries found
- **Summary**: /**  * Settings Repository — key-value store in SQLite.  */

---

### File: `src/db/repositories/streakRepository.ts`
- **Exports**: streakRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 7 queries found
- **Summary**: /**  * Streak & Milestone Repository  */

---

### File: `src/db/repositories/transactionRepository.ts`
- **Exports**: transactionRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 9 queries found
- **Summary**: /**  * Transaction Repository  */

---

### File: `src/db/repositories/walletRepository.ts`
- **Exports**: walletRepository
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 9 queries found
- **Summary**: /**  * Wallet Repository — CRUD operations for wallets table.  */

---

### File: `src/db/schema.ts`
- **Exports**: CREATE_WALLETS_TABLE, CREATE_CATEGORIES_TABLE, CREATE_MOODS_TABLE, CREATE_TRANSACTIONS_TABLE, CREATE_BUDGETS_TABLE, CREATE_REMINDERS_TABLE, CREATE_STREAKS_TABLE, CREATE_MILESTONES_TABLE, CREATE_PARSER_RULES_TABLE, CREATE_ANALYTICS_CACHE_TABLE, CREATE_SETTINGS_TABLE, CREATE_INDEXES, ALL_CREATE_STATEMENTS
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Fintter Database Schema  * All CREATE TABLE definitions.

---

### File: `src/db/seed.ts`
- **Exports**: None (default export or no exports)
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 21 queries found
- **Summary**: /**  * Fintter Database Seed Data  * Inserted on first launch after migration.

---

### File: `src/features/budgets/types.ts`
- **Exports**: BudgetPeriod, BudgetScope, Budget, BudgetWithDetails, CreateBudgetInput, UpdateBudgetInput, BudgetProgress
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Budget Types  */

---

### File: `src/features/categories/types.ts`
- **Exports**: CategoryType, Category, CreateCategoryInput, UpdateCategoryInput
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Category Types  */

---

### File: `src/features/emotional/types.ts`
- **Exports**: Mood, CreateMoodInput, defaultMoods
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Emotional Tracking Types  */

---

### File: `src/features/gamification/types.ts`
- **Exports**: StreakType, Streak, Milestone, CreateMilestoneInput, HealthScore, milestoneTypes, MilestoneType
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Gamification Types  */

---

### File: `src/features/recurring/types.ts`
- **Exports**: RecurringFrequency, RecurringTemplate, RecurringTemplateWithDetails, CreateRecurringInput, UpdateRecurringInput, Reminder, CreateReminderInput
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Recurring Transaction Types  */

---

### File: `src/features/transactions/types.ts`
- **Exports**: TransactionType, TransactionSource, Transaction, TransactionWithDetails, CreateTransactionInput, UpdateTransactionInput, TransactionFilters, TransactionGroup
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Transaction Types  */

---

### File: `src/features/wallets/types.ts`
- **Exports**: WalletType, Wallet, CreateWalletInput, UpdateWalletInput
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Wallet Types  */

---

### File: `src/services/backupService.ts`
- **Exports**: BackupData
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **SQL Executed**: 15 queries found
- **Summary**: /**  * Data Export / Import Service  *

---

### File: `src/services/gamificationEngine.ts`
- **Exports**: None (default export or no exports)
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/streakRepository', '@src/db/repositories/transactionRepository', '@src/db/repositories/budgetRepository'
- **Summary**: /**  * Gamification Engine  *

---

### File: `src/services/notificationService.ts`
- **Exports**: None (default export or no exports)
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Notification Service  *

---

### File: `src/services/smsParser.ts`
- **Exports**: ParsedTransaction, isFinancialMessage
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/parserRuleRepository'
- **Summary**: /**  * SMS Parser Service  *

---

### File: `src/store/index.ts`
- **Exports**: FintterStore, useStore
- **Local State**: None detected
- **Hooks Used**: useStore
- **Store/Slices Read**: './slices/uiSlice', './slices/walletSlice', './slices/categorySlice', './slices/transactionSlice', './slices/budgetSlice', './slices/analyticsSlice', './slices/gamificationSlice'
- **Repositories/Services Called**: None
- **Summary**: /**  * Fintter Root Store — composed from domain slices.  * Components should use granular selectors to avoid unnecessary re-renders.

---

### File: `src/store/slices/analyticsSlice.ts`
- **Exports**: AnalyticsSlice, createAnalyticsSlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/analyticsRepository'
- **Summary**: /**  * Analytics Slice — holds computed summaries only.  */

---

### File: `src/store/slices/budgetSlice.ts`
- **Exports**: BudgetSlice, createBudgetSlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/budgetRepository'
- **Summary**: /**  * Budget Slice  */

---

### File: `src/store/slices/categorySlice.ts`
- **Exports**: CategorySlice, createCategorySlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/categoryRepository'
- **Summary**: /**  * Category Slice  */

---

### File: `src/store/slices/gamificationSlice.ts`
- **Exports**: GamificationSlice, createGamificationSlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/streakRepository'
- **Summary**: /**  * Gamification Slice  */

---

### File: `src/store/slices/transactionSlice.ts`
- **Exports**: TransactionSlice, createTransactionSlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/transactionRepository', '@src/db/repositories/walletRepository'
- **Summary**: /**  * Transaction Slice — with optimistic updates.  */

---

### File: `src/store/slices/uiSlice.ts`
- **Exports**: UISlice, createUISlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * UI Slice — manages UI-only state (no DB interaction).  */

---

### File: `src/store/slices/walletSlice.ts`
- **Exports**: WalletSlice, createWalletSlice
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: '@src/db/repositories/walletRepository'
- **Summary**: /**  * Wallet Slice  */

---

### File: `src/theme/colors.ts`
- **Exports**: colors, ColorKey, ColorValue
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Fintter Color System  * AMOLED-friendly, dark-theme-first palette with neon cyan/purple accents.

---

### File: `src/theme/index.ts`
- **Exports**: None (default export or no exports)
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Fintter Theme — Barrel Export  * Central access point for all design tokens.

---

### File: `src/theme/spacing.ts`
- **Exports**: spacing, borderRadius, SpacingKey, BorderRadiusKey
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Fintter Spacing System  * Based on a 4px grid for consistent visual rhythm.

---

### File: `src/theme/typography.ts`
- **Exports**: typography, FontFamily, FontSize
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Fintter Typography System  * Uses Inter for UI text and SpaceMono for monetary amounts.

---

### File: `src/utils/currency.ts`
- **Exports**: formatAmount, formatAmountCompact, parseAmountToSmallestUnit
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Currency Formatting Utilities  */

---

### File: `src/utils/date.ts`
- **Exports**: formatTransactionDate, formatTime, formatShortDate, formatMonthYear, getGreeting, getTodayISO, getTodayDateOnly
- **Local State**: None detected
- **Hooks Used**: None
- **Store/Slices Read**: None
- **Repositories/Services Called**: None
- **Summary**: /**  * Date Formatting Utilities  */

---

## DATABASE SCHEMA

```sql
CREATE TABLE definitions.
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
```

```sql
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
```

```sql
CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    emoji TEXT NOT NULL,
    valence INTEGER NOT NULL CHECK(valence BETWEEN -2 AND 2),
    created_at TEXT NOT NULL
  );
```

```sql
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
```

```sql
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
```

```sql
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT,
    recurring_id INTEGER REFERENCES recurring_templates(id),
    remind_at TEXT NOT NULL,
    is_dismissed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
```

```sql
CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('no_spend_day', 'under_budget', 'daily_log')),
    current_count INTEGER NOT NULL DEFAULT 0,
    longest_count INTEGER NOT NULL DEFAULT 0,
    last_achieved TEXT,
    updated_at TEXT NOT NULL
  );
```

```sql
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    achieved_at TEXT,
    is_shown INTEGER NOT NULL DEFAULT 0
  );
```

```sql
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
```

```sql
CREATE TABLE IF NOT EXISTS analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    data TEXT NOT NULL,
    computed_at TEXT NOT NULL
  );
```

```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
```

## ZUSTAND STORE MAP

### analyticsSlice.ts
```typescript
interface AnalyticsSlice {
  monthlySummary: MonthlySummary | null;
  categoryBreakdown: CategoryBreakdown[];
  spendingVelocity: SpendingVelocity | null;
  moodCorrelation: MoodSpendCorrelation[];
  spendingTrend: TrendDataPoint[];
  heatmapData: Record<string, number>;
  topMerchants: MerchantSummary[];
  impulseStats: ImpulseStats | null;
  isLoadingAnalytics: boolean;
  refreshAnalytics: (month?: string) => Promise<void>;
}
```

### budgetSlice.ts
```typescript
interface BudgetSlice {
  budgets: BudgetWithDetails[];
  budgetProgress: Record<number, BudgetProgress>;
  isLoadingBudgets: boolean;
  fetchBudgets: () => Promise<void>;
  addBudget: (input: CreateBudgetInput) => Promise<void>;
  updateBudget: (id: number, input: UpdateBudgetInput) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
  computeBudgetProgress: () => Promise<void>;
}
```

### categorySlice.ts
```typescript
interface CategorySlice {
  categories: Category[];
  isLoadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (input: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: number, input: UpdateCategoryInput) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}
```

### gamificationSlice.ts
```typescript
interface GamificationSlice {
  streaks: Streak[];
  milestones: Milestone[];
  financialHealthScore: HealthScore | null;
  confettiKey: number;
  triggerConfetti: () => void;
  isLoadingGamification: boolean;
  fetchGamification: () => Promise<void>;
  markMilestoneShown: (id: number) => Promise<void>;
}
```

### transactionSlice.ts
```typescript
interface TransactionSlice {
  transactions: TransactionWithDetails[];
  isLoadingTransactions: boolean;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<number>;
  updateTransaction: (id: number, input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}
```

### uiSlice.ts
```typescript
interface UISlice {
  quickAddVisible: boolean;
  setQuickAddVisible: (v: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
```

### walletSlice.ts
```typescript
interface WalletSlice {
  wallets: Wallet[];
  activeWalletId: number | null;
  isLoadingWallets: boolean;
  fetchWallets: () => Promise<void>;
  setActiveWallet: (id: number | null) => void;
  addWallet: (input: CreateWalletInput) => Promise<void>;
  updateWallet: (id: number, input: UpdateWalletInput) => Promise<void>;
  deleteWallet: (id: number) => Promise<void>;
  setDefaultWallet: (id: number) => Promise<void>;
}
```

## NAVIGATION MAP

Expo Router handles navigation based on the `app/` directory structure:
- **Route**: `/(tabs)/analytics` (File: `app/(tabs)/analytics.tsx`)
- **Route**: `/(tabs)/budgets` (File: `app/(tabs)/budgets.tsx`)
- **Route**: `/(tabs)/history` (File: `app/(tabs)/history.tsx`)
- **Route**: `/(tabs)/` (File: `app/(tabs)/index.tsx`)
- **Route**: `/(tabs)/settings` (File: `app/(tabs)/settings.tsx`)
- **Route**: `/(tabs)/_layout` (File: `app/(tabs)/_layout.tsx`)
- **Route**: `/+not-found` (File: `app/+not-found.tsx`)
- **Route**: `/modals/budget-detail` (File: `app/modals/budget-detail.tsx`)
- **Route**: `/modals/categories` (File: `app/modals/categories.tsx`)
- **Route**: `/modals/category-picker` (File: `app/modals/category-picker.tsx`)
- **Route**: `/modals/category-spending` (File: `app/modals/category-spending.tsx`)
- **Route**: `/modals/mood-picker` (File: `app/modals/mood-picker.tsx`)
- **Route**: `/modals/parser-rules` (File: `app/modals/parser-rules.tsx`)
- **Route**: `/modals/quick-add` (File: `app/modals/quick-add.tsx`)
- **Route**: `/modals/smart-scan` (File: `app/modals/smart-scan.tsx`)
- **Route**: `/modals/transaction-detail` (File: `app/modals/transaction-detail.tsx`)
- **Route**: `/modals/wallets` (File: `app/modals/wallets.tsx`)
- **Route**: `/onboarding/setup-categories` (File: `app/onboarding/setup-categories.tsx`)
- **Route**: `/onboarding/setup-currency` (File: `app/onboarding/setup-currency.tsx`)
- **Route**: `/onboarding/welcome` (File: `app/onboarding/welcome.tsx`)
- **Route**: `/_layout` (File: `app/_layout.tsx`)

## COMPONENT DEPENDENCY TREE

- **app/(tabs)/analytics.tsx** uses: ScrollView, Animated, Text, View, Pressable, SpendingTrendChart, PieChart
- **app/(tabs)/budgets.tsx** uses: BudgetScope, BudgetPeriod, ScrollView, Animated, Text, Pressable, View, CircularProgressArc, Modal, KeyboardAvoidingView, TextInput
- **app/(tabs)/history.tsx** uses: TransactionType, View, Text, Pressable, Ionicons, ScrollView, Calendar, Animated, RefreshControl, FlashList
- **app/(tabs)/index.tsx** uses: View, ScrollView, RefreshControl, Animated, Text, Pressable, Ionicons
- **app/(tabs)/settings.tsx** uses: Pressable, Ionicons, Text, ActivityIndicator, View, ScrollView, Animated, SettingSection, SettingItem, Modal, TextInput
- **app/(tabs)/_layout.tsx** uses: View, Ionicons, Text, Tabs, TabIcon
- **app/+not-found.tsx** uses: Stack, View, Text, Link
- **app/modals/budget-detail.tsx** uses: View, Text, Pressable, Ionicons, ScrollView, CircularProgressArc, Modal, KeyboardAvoidingView, TextInput
- **app/modals/categories.tsx** uses: CategoryType, FormState, Animated, View, Text, Pressable, Ionicons, ScrollView, CategoryItem, Modal, TextInput
- **app/modals/category-picker.tsx** uses: View, Text, Pressable, TextInput, ScrollView
- **app/modals/category-spending.tsx** uses: View, Pressable, Ionicons, Text, ScrollView, Animated, BarChart, PieChart
- **app/modals/mood-picker.tsx** uses: Mood, View, Text, Pressable
- **app/modals/parser-rules.tsx** uses: ParserRule, View, Pressable, Ionicons, Text, ScrollView, Animated, Switch, Modal, KeyboardAvoidingView, TextInput
- **app/modals/quick-add.tsx** uses: TextInput, TransactionType, KeyboardAvoidingView, View, Pressable, Text, ScrollView, Animated, FlatList
- **app/modals/smart-scan.tsx** uses: SmsMessage, ReviewItem, View, Animated, Ionicons, Text, Pressable, ScrollView, TextInput, ActivityIndicator
- **app/modals/transaction-detail.tsx** uses: TransactionType, TransactionWithDetails, View, Text, Pressable, Ionicons, ScrollView, Animated, DetailRow, Modal, KeyboardAvoidingView, TextInput, FlatList
- **app/modals/wallets.tsx** uses: WalletType, WalletFormState, View, Pressable, Ionicons, Text, ScrollView, Animated, Modal, KeyboardAvoidingView, TextInput
- **app/onboarding/setup-categories.tsx** uses: View, Animated, Text, ScrollView, Pressable
- **app/onboarding/setup-currency.tsx** uses: View, Animated, Text, ScrollView, Pressable
- **app/onboarding/welcome.tsx** uses: View, Animated, Text, Pressable
- **app/_layout.tsx** uses: View, Text, GestureHandlerRootView, StatusBar, Stack, ConfettiOverlay

## DATA FLOW REFERENCE

- **Transaction Add**: UI (QuickAdd) -> store (transactionSlice.addTransaction) -> repository (transactionRepository.add) -> SQLite -> store updates state -> UI re-renders.
- **Analytics Fetch**: UI (Analytics) -> slice (refreshAnalytics) -> repository (analyticsRepository summary functions) -> store holds summary -> Chart UI updates.
- **Recurring Detection**: App Mount -> recurringDetector (checks due) -> triggers transaction insert -> schedules local notifications.

## KNOWN ISSUES & WORKAROUNDS

- **Gifted Charts Scroll Conflict**: Using `pointerConfig` on line charts prevents horizontal scrolling. Workaround: Use local React state and `onPress` on data points to show a custom tooltip.
- **Gifted Charts Freeze Bug**: Passing `StyleSheet` references directly into `chartData` (like `labelTextStyle`) causes read-only proxy errors (isActiveClone bug). Workaround: Inline plain objects.
- **Line Chart Overflow**: Hardcoded spacing cuts off the last point. Workaround: Dynamic spacing calculated as `(chartWidth - 80) / (data.length - 1)`.

## THIRD-PARTY LIBRARY REFERENCE

- **@expo/vector-icons** (^15.0.3)
- **@react-navigation/native** (^7.1.8)
- **@shopify/flash-list** (2.0.2)
- **@shopify/react-native-skia** (2.2.12)
- **date-fns** (^4.1.0)
- **expo** (~54.0.33)
- **expo-constants** (~18.0.13)
- **expo-document-picker** (~14.0.8)
- **expo-file-system** (~19.0.22)
- **expo-font** (~14.0.11)
- **expo-haptics** (~15.0.8)
- **expo-linear-gradient** (~15.0.8)
- **expo-linking** (~8.0.11)
- **expo-local-authentication** (~17.0.8)
- **expo-notifications** (~0.32.17)
- **expo-router** (~6.0.23)
- **expo-sharing** (~14.0.8)
- **expo-splash-screen** (~31.0.13)
- **expo-sqlite** (~16.0.10)
- **expo-status-bar** (~3.0.9)
- **expo-web-browser** (~15.0.10)
- **nativewind** (^4.2.1)
- **react** (19.1.0)
- **react-dom** (19.1.0)
- **react-native** (0.81.5)
- **react-native-calendars** (^1.1314.0)
- **react-native-gesture-handler** (~2.28.0)
- **react-native-gifted-charts** (^1.4.76)
- **react-native-reanimated** (~4.1.1)
- **react-native-safe-area-context** (~5.6.0)
- **react-native-screens** (~4.16.0)
- **react-native-svg** (15.12.1)
- **react-native-web** (~0.21.0)
- **react-native-worklets** (0.5.1)
- **zustand** (^5.0.13)

## CODING CONVENTIONS

- **Database**: NEVER query SQLite inside components. Always go through `src/db/repositories`.
- **State**: Use Zustand slices. Components read from slices via selectors.
- **Styling**: Use `StyleSheet.create`. Use `colors` from `@src/theme/colors`. No hardcoded hex codes.
- **Types**: Strict TypeScript. No `any`.
- **Money**: Stored as integers in DB (paise/cents). Formatted using `formatAmount` from `src/utils/currency`.

## WHAT NOT TO DO

- NEVER pass a `StyleSheet.create` result as a property inside a `react-native-gifted-charts` data point object.
- NEVER use NativeWind v5 — project is locked to v4.2.1.
- NEVER add a direct SQLite call inside a component.
- NEVER use `FlatList` — always use `FlashList`.
