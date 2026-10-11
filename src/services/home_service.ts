/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';

const HOME_CACHE_KEY = 'cached_home_dashboard';

export class HomeService {
  // جلب كافة بيانات الصفحة الرئيسية
  static async getHomeDashboard(forceRefresh: boolean = false): Promise<Record<string, any>> {
    const isClient = typeof window !== 'undefined';
    
    if (!forceRefresh && isClient) {
      const cachedString = localStorage.getItem(HOME_CACHE_KEY);
      if (cachedString) {
        try {
          return JSON.parse(cachedString);
        } catch (e) {
          console.error('❌ Error decoding home cache:', e);
        }
      }
    }

    try {
      const data = await apiClient('/home/');
      
      if (isClient) {
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
      }
      return data;
    } catch (e) {
      console.error('❌ HomeService Error:', e);
      if (isClient) {
        const cachedString = localStorage.getItem(HOME_CACHE_KEY);
        if (cachedString) {
          try {
            return JSON.parse(cachedString);
          } catch (e2) {
            // تجاهل الخطأ
          }
        }
      }
      return {
        "categories": [],
        "new_products": [],
        "products": [],
        "featured_offers": []
      };
    }
  }

  // مسح الكاش
  static async clearHomeCache(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HOME_CACHE_KEY);
    }
  }
}