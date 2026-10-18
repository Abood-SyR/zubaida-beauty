/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';

const HOME_CACHE_KEY = 'cached_home_dashboard';
const HOME_VERSION_KEY = 'home_version';

export class HomeService {
  static async getHomeDashboard(forceRefresh: boolean = false): Promise<Record<string, any>> {
    const isClient = typeof window !== 'undefined';
    let localVersion = '0';

    if (isClient) {
      localVersion = localStorage.getItem(HOME_VERSION_KEY) || '0';
      // إذا لم يكن هناك كاش مخزن محلياً، نجبر على جلب البيانات من السيرفر كبداية
      if (!localStorage.getItem(HOME_CACHE_KEY)) {
        forceRefresh = true;
      }
    }

    try {
      const response = await apiClient('/home/', {
        headers: {
          'X-Home-Version': forceRefresh ? '0' : localVersion,
        },
      });

      const data = response.data || response; 
      const serverVersion = data.version || response.headers?.get?.('x-home-version');

      if (isClient && data) {
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
        if (serverVersion) {
          localStorage.setItem(HOME_VERSION_KEY, String(serverVersion));
        }
      }

      return data;
    } catch (e: any) {
      // التعامل مع 304 أو في حال فشل الاتصال: إرجاع الكاش المحلي فوراً دون تكرار الطلب
      if (isClient) {
        const cachedString = localStorage.getItem(HOME_CACHE_KEY);
        if (cachedString) {
          try {
            return JSON.parse(cachedString);
          } catch (_) {}
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

  static async clearHomeCache(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HOME_CACHE_KEY);
      localStorage.removeItem(HOME_VERSION_KEY);
    }
  }
}