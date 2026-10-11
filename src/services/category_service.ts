/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';

const CATEGORIES_KEY = 'cached_categories';

export class CategoryService {
  // 1. جلب كافة الأقسام[cite: 7]
  static async getCategories(forceRefresh: boolean = false): Promise<any[]> {
    const isClient = typeof window !== 'undefined';

    if (!forceRefresh && isClient) {
      const cachedData = localStorage.getItem(CATEGORIES_KEY);
      if (cachedData) {
        try { return JSON.parse(cachedData); } catch (e) {}
      }
    }

    try {
      const response = await apiClient('/categories/');
      const categories = Array.isArray(response) ? response : [];

      if (isClient) {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      }
      return categories;
    } catch (e) {
      console.error('❌ CategoryService getCategories Error:', e);
      if (isClient) {
        const cachedData = localStorage.getItem(CATEGORIES_KEY);
        if (cachedData) { try { return JSON.parse(cachedData); } catch (e2) {} }
      }
      return [];
    }
  }

  // 2. إنشاء قسم جديد[cite: 7]
  static async addCategory(data: Record<string, any>): Promise<boolean> {
    try {
      await apiClient('/categories/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await CategoryService.clearCategoriesCache();
      return true;
    } catch (e) {
      console.error('❌ CategoryService addCategory Error:', e);
      return false;
    }
  }

  // 3. تعديل قسم[cite: 7]
  static async updateCategory(id: string, data: Record<string, any>): Promise<boolean> {
    try {
      await apiClient(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      await CategoryService.clearCategoriesCache();
      return true;
    } catch (e) {
      console.error('❌ CategoryService updateCategory Error:', e);
      return false;
    }
  }

  // 4. حذف قسم[cite: 7]
  static async deleteCategory(id: string): Promise<boolean> {
    try {
      await apiClient(`/categories/${id}`, { method: 'DELETE' });
      await CategoryService.clearCategoriesCache();
      return true;
    } catch (e) {
      console.error('❌ CategoryService deleteCategory Error:', e);
      return false;
    }
  }

  // 5. مسح الكاش[cite: 7]
  static async clearCategoriesCache(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CATEGORIES_KEY);
    }
  }
}