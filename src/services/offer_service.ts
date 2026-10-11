/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';

const DISCOUNTS_KEY = 'cached_discounts';
const BUNDLES_KEY = 'cached_bundles';
const FEATURED_OFFERS_KEY = 'cached_featured_offers';

export class OfferService {
  static async getOfferById(id: string): Promise<Record<string, unknown>> {
    const response = await apiClient(`/offers/${encodeURIComponent(id)}`);
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      throw new Error('تعذر العثور على تفاصيل العرض');
    }
    return response as Record<string, unknown>;
  }

  // 1. جلب الخصومات الفردية
  static async getDiscounts(forceRefresh: boolean = false): Promise<any[]> {
    const isClient = typeof window !== 'undefined';

    if (!forceRefresh && isClient) {
      const cachedData = localStorage.getItem(DISCOUNTS_KEY);
      if (cachedData) {
        try { return JSON.parse(cachedData); } catch (e) {}
      }
    }

    try {
      const response = await apiClient('/offers/');
      const allOffers = Array.isArray(response) ? response : [];
      const discounts = allOffers.filter((o: any) => o.offer_type === 'single_discount');

      if (isClient) {
        localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
      }
      return discounts;
    } catch (e) {
      console.error('❌ OfferService getDiscounts Error:', e);
      if (isClient) {
        const cachedData = localStorage.getItem(DISCOUNTS_KEY);
        if (cachedData) { try { return JSON.parse(cachedData); } catch (e2) {} }
      }
      return [];
    }
  }

  // 2. جلب عروض الحزم
  static async getBundles(forceRefresh: boolean = false): Promise<any[]> {
    const isClient = typeof window !== 'undefined';

    if (!forceRefresh && isClient) {
      const cachedData = localStorage.getItem(BUNDLES_KEY);
      if (cachedData) { try { return JSON.parse(cachedData); } catch (e) {} }
    }

    try {
      const response = await apiClient('/offers/');
      const allOffers = Array.isArray(response) ? response : [];
      const bundles = allOffers.filter((o: any) => o.offer_type === 'bundle');

      if (isClient) {
        localStorage.setItem(BUNDLES_KEY, JSON.stringify(bundles));
      }
      return bundles;
    } catch (e) {
      console.error('❌ OfferService getBundles Error:', e);
      if (isClient) {
        const cachedData = localStorage.getItem(BUNDLES_KEY);
        if (cachedData) { try { return JSON.parse(cachedData); } catch (e2) {} }
      }
      return [];
    }
  }

  // 3. جلب العروض المميزة
  static async getFeaturedOffers(forceRefresh: boolean = false): Promise<any[]> {
    const isClient = typeof window !== 'undefined';

    if (!forceRefresh && isClient) {
      const cachedData = localStorage.getItem(FEATURED_OFFERS_KEY);
      if (cachedData) { try { return JSON.parse(cachedData); } catch (e) {} }
    }

    try {
      const response = await apiClient('/offers/featured');
      const featuredOffers = Array.isArray(response) ? response : [];

      if (isClient) {
        localStorage.setItem(FEATURED_OFFERS_KEY, JSON.stringify(featuredOffers));
      }
      return featuredOffers;
    } catch (e) {
      console.error('❌ OfferService getFeaturedOffers Error:', e);
      if (isClient) {
        const cachedData = localStorage.getItem(FEATURED_OFFERS_KEY);
        if (cachedData) { try { return JSON.parse(cachedData); } catch (e2) {} }
      }
      return [];
    }
  }

  static async deleteOffer(id: string): Promise<boolean> {
    try {
      await apiClient(`/offers/${id}`, { method: 'DELETE' });
      await OfferService.clearDiscountsCache();
      await OfferService.clearBundlesCache();
      await OfferService.clearFeaturedCache();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async updateOffer(id: string, data: Record<string, any>): Promise<boolean> {
    try {
      await apiClient(`/offers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      await OfferService.clearDiscountsCache();
      await OfferService.clearBundlesCache();
      await OfferService.clearFeaturedCache();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async addDiscount(data: Record<string, any>): Promise<boolean> {
    try {
      await apiClient('/offers/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await OfferService.clearDiscountsCache();
      await OfferService.clearFeaturedCache();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async addBundle(data: Record<string, any>): Promise<boolean> {
    try {
      await apiClient('/offers/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await OfferService.clearBundlesCache();
      await OfferService.clearFeaturedCache();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async clearDiscountsCache(): Promise<void> {
    if (typeof window !== 'undefined') localStorage.removeItem(DISCOUNTS_KEY);
  }

  static async clearBundlesCache(): Promise<void> {
    if (typeof window !== 'undefined') localStorage.removeItem(BUNDLES_KEY);
  }

  static async clearFeaturedCache(): Promise<void> {
    if (typeof window !== 'undefined') localStorage.removeItem(FEATURED_OFFERS_KEY);
  }
}