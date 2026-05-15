/**
 * Budget Types
 */

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Budget {
  id: number;
  name: string;
  categoryId: number | null; // null = total budget across all categories
  walletId: number | null; // null = all wallets
  /** Budget limit in smallest currency unit */
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string | null;
  rollover: number; // SQLite boolean
  alertAtPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithDetails extends Budget {
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface CreateBudgetInput {
  name: string;
  categoryId?: number | null;
  walletId?: number | null;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string | null;
  rollover?: number;
  alertAtPercent?: number;
}

export interface UpdateBudgetInput {
  name?: string;
  categoryId?: number | null;
  walletId?: number | null;
  amount?: number;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string | null;
  rollover?: number;
  alertAtPercent?: number;
}

/** Computed budget progress for display */
export interface BudgetProgress {
  budgetId: number;
  /** Amount spent in current period (smallest unit) */
  spent: number;
  /** Budget limit (smallest unit) */
  limit: number;
  /** Percentage used (0–100+) */
  percentUsed: number;
  /** Remaining amount (can be negative if over budget) */
  remaining: number;
  /** Status based on percentage */
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
}
