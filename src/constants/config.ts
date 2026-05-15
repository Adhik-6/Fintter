/**
 * App-wide Configuration Constants
 */

export const config = {
  /** App metadata */
  app: {
    name: 'Fintter',
    version: '1.0.0',
    schemaVersion: 1,
  },

  /** Database configuration */
  db: {
    name: 'fintter.db',
  },

  /** KV Store keys (expo-sqlite/kv-store) */
  kvKeys: {
    onboardingComplete: 'onboarding_complete',
    defaultCurrency: 'default_currency',
    defaultWalletId: 'default_wallet_id',
    userName: 'user_name',
    appLockEnabled: 'app_lock_enabled',
    lastBackupDate: 'last_backup_date',
    themeMode: 'theme_mode',
    reducedMotion: 'reduced_motion',
  },

  /** Dashboard configuration */
  dashboard: {
    recentTransactionsCount: 5,
  },

  /** Budget alert thresholds */
  budget: {
    defaultAlertPercent: 80,
    warningPercent: 60,
    dangerPercent: 90,
  },

  /** Gamification thresholds */
  gamification: {
    healthScore: {
      budgetAdherenceWeight: 0.35,
      savingsRateWeight: 0.30,
      noSpendDaysWeight: 0.20,
      streakBonusWeight: 0.15,
    },
  },

  /** Animation durations (ms) */
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    numberReveal: 600,
    staggerDelay: 50,
  },

  /** Backup */
  backup: {
    filePrefix: 'fintter_backup_',
    fileExtension: '.json',
  },
} as const;
