'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, parseProductFromJson } from '@/models/product';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import { useToast } from '@/components/ui/toast_provider';

export default function CategoryProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = (params?.id as string) || searchParams.get('category_id') || '';
  const categoryTitle = searchParams.get('title') || 'منتجات القسم';

  const productService = new ProductService();
  const favoriteService = new FavoriteService();
  const cartManager = CartManager.getInstance();
  const showToast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCategoryData();
  }, [categoryId]);

  const loadCategoryData = async () => {
    setIsLoading(true);
    try {
      const cats = await productService.getCategories();
      const prods = await productService.getProducts({
        categoryId: categoryId || undefined,
      });

      setCategories(cats);
      setProducts(prods.map((p: any) => parseProductFromJson(p)));
    } catch (e) {
      console.error('Error loading category products:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    const productId = product.id;
    const currentStatus = favoritesMap[productId] || false;
    setFavoritesMap((prev) => ({ ...prev, [productId]: !currentStatus }));

    try {
      const result = await favoriteService.toggleFavorite(productId);
      setFavoritesMap((prev) => ({
        ...prev,
        [productId]: result['is_favorite'] ?? !currentStatus,
      }));
    } catch (e) {
      setFavoritesMap((prev) => ({ ...prev, [productId]: currentStatus }));
      showToast('يجب تسجيل الدخول أولاً لإضافة المنتج للمفضلة', 'error');
    }
  };

  const handleAddToCart = (product: Product) => {
    cartManager.addProduct(product);
    const prodName = product.name?.['ar'] || Object.values(product.name || {})[0] || 'المنتج';
    showToast(`تمت إضافة ${prodName} إلى السلة`);
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* هيدر الصفحة */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-primaryRose text-sm font-semibold hover:underline">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-xl font-bold text-deepRose">{categoryTitle}</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* شبكة المنتجات */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 6].map((i) => (
              <div key={i} className="h-64 bg-pink-100 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => {
              const productName = product.name?.['ar'] || Object.values(product.name || {})[0] || 'منتج';
              const displayPrice = product.discountedPrice ?? product.price;
              const isFav = favoritesMap[product.id] || false;

              return (
                <div
                  key={product.id}
                  className="bg-surfaceWhite rounded-2xl p-3 shadow-sm hover:shadow-md transition duration-300 border border-pink-100 flex flex-col relative group"
                >
                  <Link href={`/product/${product.id}`} className="block relative w-full h-48 rounded-xl overflow-hidden bg-lightPinkBg mb-3">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-textMuted text-sm">
                        لا توجد صورة
                      </div>
                    )}
                  </Link>

                  <button
                    onClick={() => handleToggleFavorite(product)}
                    className="absolute top-5 right-5 bg-white/90 p-1.5 rounded-full shadow hover:scale-110 transition"
                  >
                    <span className={`text-sm ${isFav ? 'text-primaryRose font-bold' : 'text-gray-400'}`}>
                      {isFav ? '❤️' : '🤍'}
                    </span>
                  </button>

                  <h3 className="text-textDark font-semibold text-sm mb-2 line-clamp-1">
                    {productName}
                  </h3>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-primaryRose font-bold text-base">
                      {displayPrice} ل.س
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-deepRose text-white p-2 rounded-xl hover:bg-primaryRose transition"
                    >
                      🛒
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-surfaceWhite rounded-2xl border border-pink-100 text-textMuted shadow-sm">
            لا توجد منتجات مطابقة في هذا القسم حالياً.
          </div>
        )}
      </div>
    </main>
  );
}