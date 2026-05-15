/**
 * Category Types
 */

export type CategoryType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  parentId: number | null;
  isSystem: number; // SQLite boolean (0 or 1)
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  parentId?: number | null;
  isSystem?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  type?: CategoryType;
  parentId?: number | null;
}
