'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import lottie from 'lottie-web';
import { Product, parseProductFromJson } from '@/models/product';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import { useToast } from '@/components/ui/toast_provider';
import nothingAnimation from '@/assets/nothing.json';

const favoriteService = new FavoriteService();

type SearchIconName = 'search' | 'tune' | 'close' | 'history';

function SearchIcon({ name, className = 'h-5 w-5' }: { name: SearchIconName; className?: string }) {
  const paths: Record<SearchIconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    tune: (
      <>
        <path d="M4 7h9" />
        <path d="M17 7h3" />
        <circle cx="15" cy="7" r="2" />
        <path d="M4 17h3" />
        <path d="M11 17h9" />
        <circle cx="9" cy="17" r="2" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

// دالة مساعدة لاستخراج النص بأمان في حال كانت البيانات نصية أو كائن لغات
function getLocalizedText(
  field: Record<string, string> | string | undefined | null,
  fallback = ''
): string {
  if (!field) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    return field['ar'] || Object.values(field)[0] || fallback;
  }
  return fallback;
}

export default function CategoryProductsPage({
  categoryId = '',
  categoryTitle = 'منتجات القسم',
}: {
  categoryId?: string;
  categoryTitle?: string;
}) {
  const cartManager = CartManager.getInstance();
  const showToast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const emptyContainerRef = useRef<HTMLDivElement>(null);

  // تشغيل انيميشن عدم وجود منتجات
  useEffect(() => {
    if (!isLoading && products.length === 0 && emptyContainerRef.current) {
      const anim = lottie.loadAnimation({
        container: emptyContainerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: nothingAnimation,
      });

      return () => {
        anim.destroy();
      };
    }
  }, [isLoading, products.length]);

  // جلب المفضلة عند تحميل الصفحة
  useEffect(() => {
    Promise.resolve()
      .then(() => {
        setFavoritesMap(
          Object.fromEntries(favoriteService.getLocalFavoriteIds().map((id) => [id, true]))
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

  // جلب المنتجات مع إلغاء الطلبات القديمة تفادياً لـ Race Conditions
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
          let filtered = prods.map((product: Product) => parseProductFromJson(product));

          if (inStockOnly) {
            filtered = filtered.filter((p: Product) => (p.stockQuantity ?? 0) > 0);
          }

          setProducts(filtered);
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
  }, [categoryId, searchQuery, sortBy, inStockOnly]);

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
    const prodName = getLocalizedText(product.name, 'المنتج');
    showToast(`تمت إضافة ${prodName} إلى السلة بنجاح`);
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: categoryTitle,
          text: `تصفحي أحدث منتجات قسم ${categoryTitle} في متجر زُبيدة بيوتي`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('تم نسخ رابط القسم بنجاح');
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* الهيدر العلوي */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-primaryRose text-sm font-semibold hover:underline">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-xl font-bold text-deepRose">{categoryTitle}</h1>
          <button
            onClick={handleShare}
            aria-label="مشاركة القسم"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-gray-600 shadow-sm transition hover:-translate-y-0.5 flex-none"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-4">
        {/* شريط البحث والتصفية */}
        <div className={`relative w-full ${isExpanded ? 'z-50' : 'z-10'}`}>
          <div
            className={`rounded-2xl border p-2.5 transition-[max-height,box-shadow] duration-300 ease-in-out ${
              isExpanded
                ? 'absolute inset-x-0 top-0 z-50 max-h-[calc(100dvh-8rem)] overflow-hidden border-pink-100 bg-surfaceWhite shadow-xl'
                : 'relative max-h-[65px] overflow-hidden border-pink-100 bg-surfaceWhite shadow-sm'
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-pink-200 bg-lightPinkBg/50 px-3 py-2">
              <SearchIcon name="search" className="ml-2 h-5 w-5 shrink-0 text-primaryRose" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsExpanded(true)}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ابحثي في منتجات القسم بالاسم أو الوصف..."
                aria-label="البحث في منتجات القسم"
                className="w-full bg-transparent text-sm text-textDark focus:outline-none"
              />
              {isExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="إغلاق خيارات البحث"
                  className="mr-2 shrink-0 text-deepRose"
                >
                  <SearchIcon name="close" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="إظهار خيارات البحث"
                  onClick={() => setIsExpanded(true)}
                  className="mr-2 shrink-0 text-primaryRose"
                >
                  <SearchIcon name="tune" />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="mt-5 max-h-[calc(100dvh-13rem)] space-y-5 overflow-y-auto pb-5">
                <div>
                  <h3 className="mb-3 text-sm font-bold text-deepRose">ترتيب المنتجات</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'newest', label: 'الأحدث' },
                      { id: 'price_desc', label: 'الأعلى سعراً' },
                      { id: 'price_asc', label: 'الأقل سعراً' },
                      { id: 'popular', label: 'الأكثر مبيعاً' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setSortBy(item.id);
                          setIsExpanded(false);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                          sortBy === item.id ? 'bg-primaryRose text-white' : 'bg-lightPinkBg text-textDark'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-pink-100 pt-4">
                  <h3 className="mb-3 text-sm font-bold text-deepRose">تصفية حسب المخزون</h3>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-textDark">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded border-pink-300 text-deepRose focus:ring-primaryRose w-4 h-4"
                    />
                    <span>عرض المنتجات المتوفرة في المخزون فقط</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* عرض المنتجات أو الهيكل العظمي للتحميل */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-64 shimmer rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {products.map((product) => {
              const productName = getLocalizedText(product.name, 'منتج');
              const productDesc = getLocalizedText(product.description, '');
              const displayPrice = product.discountedPrice ?? product.price;
              const originalPrice = product.discountedPrice != null ? product.price : null;
              const stockQty = product.stockQuantity ?? 0;
              const isFav = favoritesMap[product.id] || false;
              const hasValidImage = product.thumbnailUrl && product.thumbnailUrl.startsWith('http');

              return (
                <article
                  key={product.id}
                  className="bg-surfaceWhite rounded-2xl p-2.5 shadow-sm hover:shadow-md transition duration-300 border border-pink-100 flex flex-col relative group overflow-hidden"
                >
                  <Link href={`/product/${product.id}`} className="block w-full">
                    <div className="w-full h-36 bg-white relative rounded-xl overflow-hidden mb-2 p-1">
                      {hasValidImage ? (
                        <Image
                          src={product.thumbnailUrl!}
                          alt={productName}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-textMuted">
                          صورة غير متوفرة
                        </div>
                      )}
                      {stockQty <= 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">
                            نفذت الكمية
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleToggleFavorite(product);
                    }}
                    aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    className="absolute top-3 left-3 bg-white/95 p-1.5 rounded-full shadow hover:scale-110 transition z-20 border border-pink-50 cursor-pointer"
                  >
                    <svg
                      className={`w-4 h-4 ${isFav ? 'text-primaryRose fill-current' : 'text-gray-400 fill-none'}`}
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  <div className="flex flex-col justify-between flex-1 px-1">
                    <Link href={`/product/${product.id}`} className="block">
                      <h3 className="text-textDark font-bold text-xs mb-0.5 line-clamp-1 hover:text-primaryRose transition">
                        {productName}
                      </h3>
                      {productDesc && (
                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-1 leading-normal">
                          {productDesc}
                        </p>
                      )}
                      <span className="text-[9px] font-semibold text-gray-400 bg-pink-50 px-1.5 py-0.5 rounded-md inline-block mb-1">
                        المخزون: {stockQty}
                      </span>
                    </Link>

                    <div className="mt-auto pt-1 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-deepRose font-extrabold text-xs">
                          {Number(displayPrice || 0).toLocaleString('ar-SY')} ل.س
                        </span>
                        {originalPrice != null && originalPrice > displayPrice && (
                          <span className="text-[9px] text-gray-400 line-through">
                            {originalPrice.toLocaleString('ar-SY')} ل.س
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={stockQty <= 0}
                        aria-label={`إضافة ${productName} إلى السلة`}
                        className={`p-1.5 rounded-xl transition text-white shadow-sm flex items-center justify-center ${
                          stockQty > 0 ? 'bg-primaryRose hover:bg-deepRose cursor-pointer active:scale-95' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-surfaceWhite rounded-2xl border border-pink-100 text-textMuted shadow-sm px-4">
            <div ref={emptyContainerRef} className="w-48 h-48 sm:w-60 sm:h-60 mb-3" />
            <p className="text-sm font-bold text-deepRose text-center">
              لا توجد منتجات مطابقة لخيارات البحث أو الفلترة الحالية في هذا القسم.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export async function generateMetadata() {
  return {
    title: 'منتجات القسم | زُبيدة بيوتي',
    description: 'تصفحي أرقى منتجات التجميل والعناية ضمن أقسام متجر زُبيدة بيوتي',
    openGraph: {
      images: ['/images.jpg'],
    },
  };
}