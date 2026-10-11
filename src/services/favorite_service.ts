import type { Product } from '../models/product';

const FAVORITES_STORAGE_KEY = 'favorite_products';

type FavoriteRecord = {
  id: string;
  product?: Record<string, unknown>;
};

type ToggleFavoriteResult = {
  is_favorite: boolean;
};

export class FavoriteService {
  private readLocalRecords(): FavoriteRecord[] {
    if (typeof window === 'undefined') return [];

    const serialized = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!serialized) return [];

    let savedRecords: unknown;
    try {
      savedRecords = JSON.parse(serialized);
    } catch (error) {
      console.error(`تعذر قراءة المفضلة المحفوظة: ${error}`);
      return [];
    }

    if (!Array.isArray(savedRecords)) {
      return [];
    }

    return savedRecords.map((savedRecord: unknown) => {
      if (typeof savedRecord === 'string' || typeof savedRecord === 'number') {
        return { id: String(savedRecord) };
      }

      if (!savedRecord || typeof savedRecord !== 'object') {
        return { id: '' };
      }

      const record = savedRecord as Record<string, unknown>;
      const id = record.id ?? record.product_id;
      if (typeof id !== 'string' && typeof id !== 'number') {
        return { id: '' };
      }

      const product =
        record.product && typeof record.product === 'object'
          ? (record.product as Record<string, unknown>)
          : undefined;
      return { id: String(id), product };
    }).filter(record => record.id !== '');
  }

  private saveLocalRecords(records: FavoriteRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(records));
  }

  private serializeProduct(product: Product): Record<string, unknown> {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      thumbnail_url: product.thumbnailUrl,
      images: product.images,
    };
  }

  getLocalFavoriteIds(): string[] {
    return this.readLocalRecords().map(({ id }) => id);
  }

  getLocalFavorites(): Record<string, unknown>[] {
    return this.readLocalRecords().map(({ id, product }) => product ?? { id });
  }

  // جلب المفضلة محلياً بالكامل دون أي طلبات للسيرفر
  async getFavorites(): Promise<Record<string, unknown>[]> {
    const localRecords = this.readLocalRecords();
    return localRecords.map(({ id, product }) => product ?? { id });
  }

  // تبديل حالة المفضلة محلياً فقط وتخزينها في localStorage
  async toggleFavorite(
    productId: string,
    product?: Product,
  ): Promise<ToggleFavoriteResult> {
    const records = this.readLocalRecords();
    const existingIndex = records.findIndex((record) => record.id === productId);
    const isFavorite = existingIndex < 0;

    if (isFavorite) {
      records.push({
        id: productId,
        ...(product ? { product: this.serializeProduct(product) } : {}),
      });
    } else {
      records.splice(existingIndex, 1);
    }
    
    this.saveLocalRecords(records);
    return { is_favorite: isFavorite };
  }
}