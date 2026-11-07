/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';
import { parseWholesaleProductFromJson, Product, WholesaleCatalogProduct } from '../models/product';

type ProductGroup = Record<string, unknown>;

function isProductGroup(value: unknown): value is ProductGroup {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export class ProductService {
  private static productsCache: Map<string, Product[]> = new Map();
  private static cachedCategories: Record<string, any>[] | null = null;

  // جلب المنتجات مع دعم الـ Pagination
  async getProducts(params: {
    search?: string;
    categoryId?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
    forceRefresh?: boolean;
  } = {}): Promise<Product[]> {
    const {
      search,
      categoryId,
      sortBy = 'newest',
      limit = 10,
      offset = 0,
      forceRefresh = false,
    } = params;

    const cacheKey = `prod_${search || ""}_${categoryId || "all"}_${sortBy}_${limit}_${offset}`;

    if (!forceRefresh && ProductService.productsCache.has(cacheKey)) {
      return ProductService.productsCache.get(cacheKey)!;
    }

    try {
      const queryParams = new URLSearchParams({
        sort_by: sortBy,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) queryParams.append('search', search);
      if (categoryId) queryParams.append('category_id', categoryId);

      const data = await apiClient(`/products/?${queryParams.toString()}`);
      const products: Product[] = Array.isArray(data) ? data : [];

      ProductService.productsCache.set(cacheKey, products);
      return products;
    } catch (e) {
      throw new Error(`فشل في جلب المنتجات: ${e}`);
    }
  }

  async getWholesaleCatalog(targetType: 'body' | 'skin' | 'hair'): Promise<WholesaleCatalogProduct[]> {
    const pageSize = 100;
    const products: WholesaleCatalogProduct[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryParams = new URLSearchParams({
        target_type: targetType,
        limit: String(pageSize),
        skip: String(offset),
      });
      const data: unknown = await apiClient(`/products/wholesale-catalog?${queryParams.toString()}`);

      if (!Array.isArray(data)) {
        throw new Error('استجابة كتالوج أسعار الجملة غير صالحة');
      }

      const page = data
        .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
        .map(parseWholesaleProductFromJson);
      products.push(...page);
      hasMore = data.length === pageSize;
      offset += data.length;
    }

    return products;
  }

  // جلب أحدث المنتجات
  async getNewProducts(): Promise<Product[]> {
    try {
      const data = await apiClient('/products/get_new_product');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];   }
  }

  // جلب الأقسام
  async getCategories(forceRefresh: boolean = false): Promise<Record<string, any>[]> {
    if (!forceRefresh && ProductService.cachedCategories !== null) {
      return ProductService.cachedCategories;
    }

    try {
      const data = await apiClient('/categories/');
      ProductService.cachedCategories = Array.isArray(data) ? data : [];
      return ProductService.cachedCategories!;
    } catch (e) {
      return [];
    }
  }

  // تفاصيل منتج معين
  async getProductById(id: string): Promise<Record<string, any>> {
    try {
      return await apiClient(`/products/${id}`);
    } catch (e) {
      throw new Error(`فشل في جلب تفاصيل المنتج: ${e}`);
    }
  }

  static async getGroups(): Promise<ProductGroup[]> {
    const response: unknown = await apiClient('/groups/');
    if (!Array.isArray(response) || !response.every(isProductGroup)) {
      throw new Error('تعذر تحميل قائمة المجموعات');
    }
    return response;
  }

  static async getGroupById(id: string): Promise<ProductGroup> {
    const response: unknown = await apiClient(`/groups/${encodeURIComponent(id)}`);
    if (!isProductGroup(response)) {
      throw new Error('تعذر العثور على تفاصيل المجموعة');
    }
    return response;
  }

  // مسح الكاش
  static clearCache(): void {
    ProductService.productsCache.clear();
    ProductService.cachedCategories = null;
  }
}