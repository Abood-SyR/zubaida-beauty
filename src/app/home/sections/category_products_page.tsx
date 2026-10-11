'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product, parseProductFromJson } from '@/models/product';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import { useToast } from '@/components/ui/toast_provider';

const favoriteService = new FavoriteService();

export default function CategoryProductsPage({
  categoryId = '',
  categoryTitle = 'منتجات القسم',
}: {
  categoryId?: string;
  categoryTitle?: string;
}) {

  const router = useRouter();
  const cartManager = CartManager.getInstance();
  const showToast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.resolve()
      .then(() => {
        setFavoritesMap(
          Object.fromEntries(favoriteService.getLocalFavoriteIds().map((id) => [id, true])),
        );
        return favoriteService.getFavorites();
      })
      .then((items) => {
        setFavoritesMap(Object.fromEntries(items.map((item) => [String(item.id), true])));
      })
      .catch((error) => {
        console.error('Error loading favorites:', error);
      });
  }, []);

  useEffect(() => {
    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const prods = await new ProductService().getProducts({
          categoryId: categoryId || undefined,
          search: searchQuery.trim() || undefined,
          sortBy,
        });

        if (isActive) {
          setProducts(prods.map((product: Product) => parseProductFromJson(product)));
        }
      } catch (error) {
        console.error('Error loading category products:', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, searchQuery ? 300 : 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [categoryId, searchQuery, sortBy]);

  const handleToggleFavorite = async (product: Product) => {
    const productId = product.id;
    try {
      const result = await favoriteService.toggleFavorite(productId, product);
      setFavoritesMap((prev) => ({
        ...prev,
        [productId]: result.is_favorite,
      }));
    } catch (error) {
      console.error('Error saving favorite locally:', error);
      showToast('تعذر حفظ المنتج في المفضلة', 'error');
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
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحثي في منتجات القسم..."
            aria-label="البحث في منتجات القسم"
            className="flex-1 rounded-xl border border-pink-200 bg-surfaceWhite px-4 py-3 text-sm text-textDark focus:outline-none focus:ring-2 focus:ring-primaryRose"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="ترتيب المنتجات"
            className="rounded-xl border border-pink-200 bg-surfaceWhite px-4 py-3 text-sm text-textDark focus:outline-none focus:ring-2 focus:ring-primaryRose"
          >
            <option value="newest">الأحدث</option>
            <option value="price_desc">الأعلى سعراً</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="popular">الأكثر مبيعاً</option>
          </select>
        </div>

        {/* شبكة المنتجات */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 6].map((i) => (
              <div key={i} className="h-64 shimmer rounded-2xl"></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => {
              const productName =
                product.name?.['ar'] || Object.values(product.name || {})[0] || 'منتج';
              const displayPrice = product.discountedPrice ?? product.price;
              const isFav = favoritesMap[product.id] || false;

              return (
                <article
                  key={product.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/product/${product.id}`)}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      router.push(`/product/${product.id}`);
                    }
                  }}
                  className="bg-surfaceWhite rounded-2xl p-3 shadow-sm hover:shadow-md transition duration-300 border border-pink-100 flex flex-col relative group cursor-pointer"
                >
                  <div className="block relative w-full h-48 rounded-xl overflow-hidden bg-white mb-3">
                    {product.thumbnailUrl ? (
                      <Image
                        src={product.thumbnailUrl}
                        alt={productName}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="product-image w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-textMuted text-sm">
                        لا توجد صورة
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleFavorite(product);
                    }}
                    aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
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
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                      aria-label={`إضافة ${productName} إلى السلة`}
                      className="bg-deepRose text-white p-2 rounded-xl hover:bg-primaryRose transition"
                    >
                      🛒
                    </button>
                  </div>
                </article>
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