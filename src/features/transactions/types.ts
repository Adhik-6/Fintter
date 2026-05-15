/**
 * Transaction Types
 */

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'manual' | 'sms' | 'notification' | 'import';

export interface Transaction {
  id: number;
  /** Amount in smallest currency unit (paise/cents) */
  amount: number;
  type: TransactionType;
  categoryId: number;
  walletId: number;
  toWalletId: number | null; // for transfers
  note: string | null;
  merchant: string | null;
  tags: string | null; // JSON array string
  moodId: number | null;
  isImpulse: number; // SQLite boolean
  isRecurring: number; // SQLite boolean
  recurringId: number | null;
  source: TransactionSource;
  date: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

/** Transaction with joined category and wallet data for display */
export interface TransactionWithDetails extends Transaction {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  walletName: string;
  moodEmoji: string | null;
  moodLabel: string | null;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: number;
  walletId: number;
  toWalletId?: number | null;
  note?: string;
  merchant?: string;
  tags?: string[];
  moodId?: number | null;
  isImpulse?: number;
  isRecurring?: number;
  recurringId?: number | null;
  source?: TransactionSource;
  date?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  categoryId?: number;
  walletId?: number;
  toWalletId?: number | null;
  note?: string;
  merchant?: string;
  tags?: string[];
  moodId?: number | null;
  isImpulse?: number;
  date?: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  walletId?: number;
  type?: TransactionType;
  moodId?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

/** Day-grouped transactions for timeline display */
export interface TransactionGroup {
  date: string;
  totalIncome: number;
  totalExpense: number;
  transactions: TransactionWithDetails[];
}
