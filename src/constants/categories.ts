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
  { name: 'Food & Dining', icon: '🍔', color: '#EF4444', type: 'expense', isSystem: true }, // Red
  { name: 'Groceries', icon: '🛒', color: '#F97316', type: 'expense', isSystem: true }, // Orange
  { name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'expense', isSystem: true }, // Blue
  { name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'expense', isSystem: true }, // Pink
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6', type: 'expense', isSystem: true }, // Purple
  { name: 'Bills & Utilities', icon: '💡', color: '#F59E0B', type: 'expense', isSystem: true }, // Amber
  { name: 'Health', icon: '💊', color: '#10B981', type: 'expense', isSystem: true }, // Emerald
  { name: 'Education', icon: '📚', color: '#06B6D4', type: 'expense', isSystem: true }, // Cyan
  { name: 'Rent', icon: '🏠', color: '#D946EF', type: 'expense', isSystem: true }, // Fuchsia
  { name: 'People', icon: '🫂', color: '#6366F1', type: 'expense', isSystem: true }, // Indigo
  { name: 'Personal Care', icon: '💅', color: '#F43F5E', type: 'expense', isSystem: true }, // Rose
  { name: 'Gifts', icon: '🎁', color: '#EAB308', type: 'expense', isSystem: true }, // Yellow
  { name: 'Insurance', icon: '🛡️', color: '#64748B', type: 'expense', isSystem: true }, // Slate
  { name: 'Other', icon: '📦', color: '#737373', type: 'expense', isSystem: true }, // Neutral
];

export const defaultIncomeCategories: DefaultCategory[] = [
  { name: 'Salary', icon: '💰', color: '#22C55E', type: 'income', isSystem: true }, // Green
  { name: 'Pocket Money', icon: '🪙', color: '#14B8A6', type: 'income', isSystem: true }, // Teal
  { name: 'Bonus', icon: '🎉', color: '#F59E0B', type: 'income', isSystem: true }, // Amber
  { name: 'Investments', icon: '📈', color: '#06B6D4', type: 'income', isSystem: true }, // Cyan
  { name: 'Refund', icon: '🔄', color: '#3B82F6', type: 'income', isSystem: true }, // Blue
  { name: 'Other Income', icon: '💸', color: '#84CC16', type: 'income', isSystem: true }, // Lime
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
