/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';

const HOME_CACHE_KEY = 'cached_home_dashboard';
const HOME_VERSION_KEY = 'home_version';

export class HomeService {
  // جلب كافة بيانات الصفحة الرئيسية مع التحقق من الإصدار
  static async getHomeDashboard(forceRefresh: boolean = false): Promise<Record<string, any>> {
    const isClient = typeof window !== 'undefined';
    let localVersion = '0';

    if (isClient) {
      localVersion = localStorage.getItem(HOME_VERSION_KEY) || '0';
    }

    try {
      // إرسال رقم الإصدار الحالي للـ Backend عبر الـ Header
      const response = await apiClient('/home/', {
        headers: {
          'X-Home-Version': forceRefresh ? '0' : localVersion,
        },
      });

      // إذا كانت الـ apiClient تعيد البيانات مباشرة أو الاستجابة كاملة، نتحقق من الإصدار والبيانات
      const data = response.data || response; 
      const serverVersion = data.version || response.headers?.get?.('x-home-version');

      if (isClient && data) {
        // تخزين البيانات الجديدة ورقم الإصدار الجديد محلياً
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
        if (serverVersion) {
          localStorage.setItem(HOME_VERSION_KEY, String(serverVersion));
        }
      }

      return data;
    } catch (e: any) {
      // إذا رد السيرفر بـ 304 (لم يحدث تغيير)، فغالباً يعتبره الـ apiClient خطأ أو يتم التقاطه هنا
      if (e?.status === 304 || e?.response?.status === 304) {
        if (isClient) {
          const cachedString = localStorage.getItem(HOME_CACHE_KEY);
          if (cachedString) {
            return JSON.parse(cachedString);
          }
        }
      }

      console.error('❌ HomeService Error:', e);
      
      // في حال حدوث خطأ أو انقطاع في الإنترنت، نلجأ للنسخة المخزنة محلياً إن وجدت
      if (isClient) {
        const cachedString = localStorage.getItem(HOME_CACHE_KEY);
        if (cachedString) {
          try {
            return JSON.parse(cachedString);
          } catch (e2) {
            // تجاهل خطأ التحويل
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

  // مسح الكاش والإصدار معاً
  static async clearHomeCache(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HOME_CACHE_KEY);
      localStorage.removeItem(HOME_VERSION_KEY);
    }
  }
}