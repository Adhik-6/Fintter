/**
 * Default Category Definitions
 * System categories that are seeded on first launch.
 * Users can add custom categories but cannot delete system ones.
 */

export interface DefaultCategory {
  name: string;
  icon: string; // emoji
  color: string;
  type: 'expense' | 'income' | 'transfer';
  isSystem: boolean;
}

export const defaultExpenseCategories: DefaultCategory[] = [
  { name: 'Food & Dining', icon: '🍔', color: '#EF4444', type: 'expense', isSystem: true },
  { name: 'Groceries', icon: '🛒', color: '#F97316', type: 'expense', isSystem: true },
  { name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'expense', isSystem: true },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'expense', isSystem: true },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6', type: 'expense', isSystem: true },
  { name: 'Bills & Utilities', icon: '💡', color: '#F59E0B', type: 'expense', isSystem: true },
  { name: 'Health', icon: '💊', color: '#10B981', type: 'expense', isSystem: true },
  { name: 'Education', icon: '📚', color: '#06B6D4', type: 'expense', isSystem: true },
  { name: 'Subscriptions', icon: '📱', color: '#6366F1', type: 'expense', isSystem: true },
  { name: 'Rent', icon: '🏠', color: '#D946EF', type: 'expense', isSystem: true },
  { name: 'Travel', icon: '✈️', color: '#0EA5E9', type: 'expense', isSystem: true },
  { name: 'Personal Care', icon: '💅', color: '#F43F5E', type: 'expense', isSystem: true },
  { name: 'Gifts', icon: '🎁', color: '#A855F7', type: 'expense', isSystem: true },
  { name: 'Insurance', icon: '🛡️', color: '#64748B', type: 'expense', isSystem: true },
  { name: 'Other', icon: '📦', color: '#94A3B8', type: 'expense', isSystem: true },
];

export const defaultIncomeCategories: DefaultCategory[] = [
  { name: 'Salary', icon: '💰', color: '#22C55E', type: 'income', isSystem: true },
  { name: 'Freelance', icon: '💻', color: '#10B981', type: 'income', isSystem: true },
  { name: 'Investments', icon: '📈', color: '#06B6D4', type: 'income', isSystem: true },
  { name: 'Refund', icon: '🔄', color: '#3B82F6', type: 'income', isSystem: true },
  { name: 'Other Income', icon: '💸', color: '#84CC16', type: 'income', isSystem: true },
];

export const defaultTransferCategory: DefaultCategory = {
  name: 'Transfer',
  icon: '🔀',
  color: '#F59E0B',
  type: 'transfer',
  isSystem: true,
};

export const allDefaultCategories: DefaultCategory[] = [
  ...defaultExpenseCategories,
  ...defaultIncomeCategories,
  defaultTransferCategory,
];
