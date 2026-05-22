# Fintter AI Information

This document provides context for future AI agents working on the Fintter codebase.

## Architecture

Fintter is a production-grade React Native app built using Expo.
It follows a strict feature-based architecture and offline-first data model.

**Tech Stack**:
- Framework: React Native + Expo (managed workflow)
- Navigation: Expo Router
- State Management: Zustand (global store + slices)
- Storage: `expo-sqlite` (primary database) + `react-native-mmkv` (lightweight kv store)
- Styling: NativeWind + Reanimated for animations

**Core Patterns**:
1. **DB Layer**: Do not call `db.runAsync` or `db.getAllAsync` directly in UI components. All DB access must go through the typed Repository layer (e.g. `transactionRepository.ts`).
2. **State Layer**: The Zustand store caches lists of models (e.g., transactions, wallets, budgets) so that UI components do not query the DB directly. Components should dispatch store actions to mutate state. The store slice will call the repository, then update state.
3. **Analytics Cache**: Analytics aggregates are computed and cached in the `analytics_cache` table to keep UI renders at 60fps. The `analyticsSlice` hydrates from this cache.
4. **Theme**: Use colors from `src/theme/colors.ts` and styling from NativeWind.
5. **No Network**: The app is strictly offline. No fetch calls or backend services.

## Available Entities

- **Wallet**: Accounts where money is stored.
- **Category**: Classifications for transactions (Income, Expense, Transfer).
- **Transaction**: The core event representing money movement.
- **Budget**: Spending limits tied to a category or wallet over a specific period.
- **Mood**: Emotional states tied to transactions to build spending correlations.

## Working with Migrations
When changing the schema, always add a new file in `src/db/migrations` with a sequential prefix (e.g., `003_add_new_table.ts`) and register it in `src/db/index.ts`. Do not modify existing migrations.
