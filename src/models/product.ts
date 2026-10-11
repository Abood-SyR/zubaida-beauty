/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Product {
  id: string;
  name: Record<string, any>;
  description?: Record<string, any> | null;
  price: number;
  originalPrice?: number | null;
  discountedPrice?: number | null;
  discountPercentage?: number | null;
  costPrice: number;
  stockQuantity: number;
  soldCount: number;
  sizes?: string[] | null;
  skinHairType?: string[] | null;
  usageInstructions?: Record<string, any> | null;
  ingredients?: Record<string, any> | null;
  compatibility?: Record<string, any> | null;
  attributes?: Record<string, any> | null;
  thumbnailUrl?: string | null;
  images?: string[] | null;
  categoryId?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  getName(lang?: string): string;
}

// دالة مساعدة لتحويل الـ JSON القادم من الـ API إلى Product مطابق لمنطق فلاتر
export function parseProductFromJson(json: Record<string, any>): Product {
  const discount = json['discount'] && typeof json['discount'] === 'object' ? json['discount'] : {};

  const product = {
    id: json['id'] ?? '',
    name: json['name'] ?? {},
    description: json['description'],
    price: typeof json['price'] === 'number' ? json['price'] : 0.0,
    originalPrice: undefined as number | null | undefined,
    discountedPrice: undefined as number | null | undefined,
    discountPercentage: undefined as number | null | undefined,
    costPrice: typeof json['cost_price'] === 'number' ? json['cost_price'] : 0.0,
    stockQuantity: json['stock_quantity'] ?? 0,
    soldCount: json['sold_count'] ?? 0,
    sizes: Array.isArray(json['sizes']) ? json['sizes'].map((value: any) => String(value)) : null,
    skinHairType: Array.isArray(json['skin_hair_type']) ? json['skin_hair_type'].map((value: any) => String(value)) : null,
    usageInstructions: json['usage_instructions'],
    ingredients: json['ingredients'],
    compatibility: json['compatibility'],
    attributes: json['attributes'],
    thumbnailUrl: json['thumbnail_url'],
    images: Array.isArray(json['images']) ? json['images'].map((value: any) => String(value)) : null,
    categoryId: json['category_id'],
    isActive: false,
    createdAt: json['created_at'],
    updatedAt: json['updated_at'],
    getName(lang = 'ar') {
      return getProductName(product, lang);
    },
  };

  const firstNumber = (values: any[]): number | null => {
    for (const val of values) {
      if (typeof val === 'number') return val;
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  const originalPrice = firstNumber([
    json['original_price'],
    json['initial_price'],
    json['price_before_discount'],
    json['regular_price'],
    discount['original_price'],
    discount['initial_price'],
  ]);

  const discountedPrice = firstNumber([
    json['discounted_price'],
    json['discount_price'],
    json['sale_price'],
    json['final_price'],
    discount['discounted_price'],
    discount['final_price'],
  ]);

  const price = typeof json['price'] === 'number' ? json['price'] : 0.0;

  const boolValue = (val: any, def: boolean): boolean => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    return def;
  };

  product.originalPrice = originalPrice;
  product.discountedPrice = discountedPrice ?? (originalPrice != null && price > 0 && price < originalPrice ? price : null);
  product.discountPercentage = firstNumber([json['discount_percentage'], discount['discount_percentage']]);
  product.isActive = boolValue(json['is_active'], true);
  product.price = price;

  return product as Product;
}

// دالة لجلب الاسم حسب اللغة (مطابقة لدالة getName في فلاتر)[cite: 10]
export function getProductName(product: Product, lang: string): string {
  const name = product.name;
  if (!name || typeof name !== 'object') return '';
  return name[lang]?.toString() ?? name['ar']?.toString() ?? (Object.values(name)[0]?.toString() ?? '');
}