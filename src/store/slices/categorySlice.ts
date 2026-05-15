/**
 * Category Slice
 */
import type { StateCreator } from 'zustand';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@src/features/categories/types';
import { categoryRepository } from '@src/db/repositories/categoryRepository';

export interface CategorySlice {
  categories: Category[];
  isLoadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (input: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: number, input: UpdateCategoryInput) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export const createCategorySlice: StateCreator<CategorySlice, [], [], CategorySlice> = (set) => ({
  categories: [],
  isLoadingCategories: false,

  fetchCategories: async () => {
    set({ isLoadingCategories: true });
    try {
      const categories = await categoryRepository.getAll();
      set({ categories, isLoadingCategories: false });
    } catch (error) {
      console.error('[Store] fetchCategories error:', error);
      set({ isLoadingCategories: false });
    }
  },

  addCategory: async (input) => {
    try {
      await categoryRepository.create(input);
      const categories = await categoryRepository.getAll();
      set({ categories });
    } catch (error) { console.error('[Store] addCategory error:', error); }
  },

  updateCategory: async (id, input) => {
    try {
      await categoryRepository.update(id, input);
      const categories = await categoryRepository.getAll();
      set({ categories });
    } catch (error) { console.error('[Store] updateCategory error:', error); }
  },

  deleteCategory: async (id) => {
    try {
      await categoryRepository.delete(id);
      const categories = await categoryRepository.getAll();
      set({ categories });
    } catch (error) { console.error('[Store] deleteCategory error:', error); }
  },
});
