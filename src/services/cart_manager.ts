/* eslint-disable @typescript-eslint/no-explicit-any */
import { Product } from '../models/product';

export class CartItem {
  readonly product?: Product;
  readonly offer?: Record<string, any>;
  readonly group?: Record<string, any>;
  quantity: number;

  constructor(options: {
    product?: Product;
    offer?: Record<string, any>;
    group?: Record<string, any>;
    quantity?: number;
  }) {
    this.product = options.product;
    this.offer = options.offer;
    this.group = options.group;
    this.quantity = options.quantity ?? 1;
  }

  get isGroup(): boolean {
    return this.group != null;
  }

  get isOffer(): boolean {
    return this.offer != null;
  }

  get id(): string {
    if (this.isGroup) return String(this.group!['id'] ?? '');
    return this.isOffer
      ? String(this.offer!['id'] ?? this.offer!['offer_id'] ?? '')
      : String(this.product!.id ?? '');
  }

  get name(): string {
    if (this.group != null) return CartItem.localizedName(this.group['name']) ?? 'مجموعة مميزة';
    const data = this.offer;
    if (data != null) return CartItem.localizedName(data['title']) ?? 'عرض خاص';
    
    const prodName = this.product?.name;
    if (prodName && typeof prodName === 'object') {
      return prodName['ar']?.toString() ?? Object.values(prodName)[0]?.toString() ?? '';
    }
    return '';
  }

  get imageUrls(): string[] {
    if (this.group != null) {
      const products = Array.isArray(this.group['products']) ? this.group['products'] : [];
      const productImages = products.flatMap((product: unknown) => {
        if (!product || typeof product !== 'object') return [];
        const groupProduct = product as Record<string, unknown>;
        return [
          groupProduct['thumbnail_url'],
          groupProduct['thumbnailUrl'],
          groupProduct['image_url'],
          ...(Array.isArray(groupProduct['images']) ? groupProduct['images'] : []),
        ];
      });
      return CartItem.uniqueImages([this.group['image_url'], ...productImages]);
    }

    if (this.product != null) {
      return CartItem.uniqueImages([
        (this.product as any).thumbnailUrl,
        (this.product as any).image_url,
        ...((this.product as any).images ?? []),
      ]);
    }

    const data = this.offer!;
    const images: unknown[] = [];
    const products = Array.isArray(data['products']) ? data['products'] : [];
    const freeProduct = data['free_product'];
    const offerProducts = [
      ...products,
      ...(freeProduct && typeof freeProduct === 'object' ? [freeProduct] : []),
    ];

    for (const product of offerProducts) {
      if (!product || typeof product !== 'object') continue;
      const offerProduct = product as Record<string, unknown>;
      images.push(offerProduct['thumbnail_url'], offerProduct['thumbnailUrl'], offerProduct['image_url']);
      if (Array.isArray(offerProduct['images'])) images.push(...offerProduct['images']);
    }

    if (images.length === 0) images.push(data['thumbnail_url'], data['image_url']);
    return CartItem.uniqueImages(images);
  }

  get imageUrl(): string | null {
    return this.imageUrls[0] ?? null;
  }

  get unitPrice(): number {
    if (this.group != null) {
      return CartItem.toNumber(this.group['final_price'] ?? this.group['calculated_price']) ?? 0;
    }
    if (this.product != null) {
      return CartItem.toNumber(
        (this.product as any).discountedPrice ??
          (this.product as any).discounted_price ??
          (this.product as any).final_price ??
          (this.product as any).price,
      ) ?? 0;
    }
    return CartItem.toNumber(this.offer!['final_price']) ?? 0;
  }

  get originalUnitPrice(): number | null {
    if (this.group != null) {
      const initialPrice = CartItem.toNumber(this.group['calculated_price']);
      return initialPrice != null && initialPrice > this.unitPrice ? initialPrice : null;
    }
    if (this.product != null) {
      const originalPrice = CartItem.toNumber(
        (this.product as any).originalPrice ??
          (this.product as any).original_price ??
          (this.product as any).price_before_discount ??
          (this.product as any).price,
      );
      return originalPrice != null && originalPrice > this.unitPrice ? originalPrice : null;
    }

    const offer = this.offer!;
    const initialPrice = CartItem.toNumber(offer['initial_price']);
    if (initialPrice != null && initialPrice > this.unitPrice) return initialPrice;

    const discountPercentage = CartItem.toNumber(offer['discount_percentage']);
    if (discountPercentage != null && discountPercentage > 0 && discountPercentage < 100) {
      return Number((this.unitPrice / (1 - discountPercentage / 100)).toFixed(2));
    }

    return null;
  }

  get isDiscounted(): boolean {
    return this.originalUnitPrice != null;
  }

  get discountPercentage(): number | null {
    if (!this.isDiscounted || this.originalUnitPrice == null) return null;

    const percentage = this.isGroup
      ? null
      : this.isOffer
      ? CartItem.toNumber(this.offer!['discount_percentage'])
      : CartItem.toNumber((this.product as any).discountPercentage ?? (this.product as any).discount_percentage);

    return percentage != null && percentage > 0
      ? percentage
      : Math.round((1 - this.unitPrice / this.originalUnitPrice) * 100);
  }

  get totalPrice(): number {
    return this.unitPrice * this.quantity;
  }

  toJson(): Record<string, any> {
    if (this.isGroup) return { type: 'group', quantity: this.quantity, group: this.group };
    return this.isOffer
      ? { type: 'offer', quantity: this.quantity, offer: this.offer }
      : { type: 'product', quantity: this.quantity, product: this.product };
  }

  static fromJson(json: Record<string, any>): CartItem {
    const quantity = json['quantity'];
    if (typeof quantity !== 'number' || quantity < 1) {
      throw new Error('Cart item quantity must be a positive integer');
    }

    if (json['type'] === 'product') {
      const product = json['product'];
      if (!product || typeof product !== 'object') {
        throw new Error('Cart product data is missing');
      }
      return new CartItem({ product: product as Product, quantity });
    } else if (json['type'] === 'group') {
      const group = json['group'];
      if (!group || typeof group !== 'object') {
        throw new Error('Cart group data is missing');
      }
      return new CartItem({ group: group as Record<string, any>, quantity });
    } else if (json['type'] === 'offer') {
      const offer = json['offer'];
      if (!offer || typeof offer !== 'object') {
        throw new Error('Cart offer data is missing');
      }
      return new CartItem({ offer: offer as Record<string, any>, quantity });
    }
    throw new Error(`Unknown cart item type: ${json['type']}`);
  }

  private static toNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  private static localizedName(value: any): string | null {
    if (value && typeof value === 'object') {
      const localized = value['ar'] || Object.values(value)[0];
      const result = localized?.toString();
      if (result && result !== 'string') return result;
      return null;
    }
    const result = value?.toString();
    return !result || result === 'string' ? null : result;
  }

  private static uniqueImages(values: unknown[]): string[] {
    return [...new Set(values.filter(
      (value): value is string =>
        typeof value === 'string' &&
        value.trim() !== '' &&
        value !== 'string' &&
        value.startsWith('http'),
    ))];
  }
}

export class CartManager {
  private static instance: CartManager;
  private static readonly STORAGE_KEY = 'shopping_cart_items';
  private readonly listeners = new Set<() => void>();
  items: CartItem[] = [];

  private constructor() {}

  static getInstance(): CartManager {
    if (!CartManager.instance) {
      CartManager.instance = new CartManager();
    }
    return CartManager.instance;
  }

  get itemCount(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.removeListener(listener);
  }

  removeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    const savedItems = localStorage.getItem(CartManager.STORAGE_KEY);
    if (!savedItems) {
      this.items = [];
      this.notifyListeners();
      return;
    }

    try {
      const decoded = JSON.parse(savedItems);
      if (!Array.isArray(decoded)) {
        throw new Error('Stored cart data must be an array');
      }

      this.items = decoded.map((val) => CartItem.fromJson(val));
    } catch (e) {
      console.error('Failed to load cart from storage', e);
      this.items = [];
    } finally {
      this.notifyListeners();
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = JSON.stringify(this.items.map((item) => item.toJson()));
      localStorage.setItem(CartManager.STORAGE_KEY, snapshot);
      this.notifyListeners();
    }  catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }

  // التحقق من الكمية المتوفرة في المخزون قبل إضافة المنتج للسلة
  addProduct(product: Product, quantity: number = 1): void {
    const productId = String((product as any).id ?? '');
    
    // جلب حد المخزون المتاح (دعم التسميتين stockQuantity و stock_quantity)
    const stockQuantity = Number((product as any).stockQuantity ?? (product as any).stock_quantity ?? 0);

    const existingIndex = this.items.findIndex((item) => item.product?.id === productId);
    
    let currentQuantityInCart = 0;
    if (existingIndex >= 0) {
      currentQuantityInCart = this.items[existingIndex].quantity;
    }

    const requestedTotal = currentQuantityInCart + quantity;

    // منع الإضافة إذا تجاوزت الكمية المتاحة في المخزون
    if (stockQuantity > 0 && requestedTotal > stockQuantity) {
      throw new Error(`عذراً، الكمية المتوفرة في المخزون هي ${stockQuantity} قطع فقط.`);
    }

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity = requestedTotal;
    } else {
      this.items.push(new CartItem({ product, quantity }));
    }
    this.saveToStorage();
  }

  addOffer(offer: Record<string, any>, quantity: number = 1): void {
    const offerId = String(offer['id'] ?? offer['offer_id'] ?? '');
    const existingIndex = this.items.findIndex((item) => item.isOffer && item.id === offerId);
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push(new CartItem({ offer, quantity }));
    }
    this.saveToStorage();
  }

  addGroup(group: Record<string, any>, quantity: number = 1): void {
    const groupId = String(group['id'] ?? '');
    const existingIndex = this.items.findIndex((item) => item.isGroup && item.id === groupId);
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push(new CartItem({ group, quantity }));
    }
    this.saveToStorage();
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter((item) => item.id !== itemId);
    this.saveToStorage();
  }

  // التحقق أيضاً عند تحديث الكمية يدوياً من السلة
  updateQuantity(itemId: string, quantity: number): void {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index >= 0) {
      if (quantity > 0) {
        const item = this.items[index];
        // إذا كان عنصراً عبارة عن منتج مفرد، نتحقق من المخزون عند التحديث
        if (item.product != null) {
          const stockQuantity = Number((item.product as any).stockQuantity ?? (item.product as any).stock_quantity ?? 0);
          if (stockQuantity > 0 && quantity > stockQuantity) {
            throw new Error(`عذراً، الكمية المتوفرة في المخزون هي ${stockQuantity} قطع فقط.`);
          }
        }
        this.items[index].quantity = quantity;
      } else {
        this.items.splice(index, 1);
      }
      this.saveToStorage();
    }
  }

  clear(): void {
    this.items = [];
    this.saveToStorage();
  }
}