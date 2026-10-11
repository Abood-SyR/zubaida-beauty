/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { Product } from '@/models/product';

interface ProductGridSectionProps {
  products: Product[];
  isLoading?: boolean;
  favoritesMap?: Record<string, boolean>;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export default function ProductGridSection({
  products,
  isLoading,
  favoritesMap = {},
  onToggleFavorite,
  onAddToCart,
}: ProductGridSectionProps) {
  // عرض كحد أقصى 10 منتجات في الصفحة الرئيسية مطابقة لكود فلاتر 
  const displayedProducts = (products || []).slice(0, 10);

  return (
    <section className="px-4 py-2">
      {/* العنوان في الأعلى  */}
      <h2 className="text-lg font-bold text-deepRose mb-3">
        ✨ أحدث المنتجات
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-pink-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-12 bg-surfaceWhite rounded-2xl border border-pink-100 text-textMuted shadow-sm">
          لا توجد منتجات مطابقة حالياً 
        </div>
      ) : (
        <div className="space-y-6">
          {/* شبكة المنتجات  */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {displayedProducts.map((product) => {
              const productName =
                product.name?.['ar'] ||
                Object.values(product.name || {})[0] ||
                'منتج';
              const description = product.description?.toString() || '';
              const displayPrice = product.discountedPrice ?? product.price;
              const isFav = favoritesMap[product.id] || false;
              const hasValidImage =
                product.thumbnailUrl &&
                product.thumbnailUrl.trim() !== '' &&
                product.thumbnailUrl.startsWith('http');

              return (
                <div
                  key={product.id}
                  className="bg-surfaceWhite rounded-xl border border-pink-100/50 shadow-sm hover:shadow-md transition duration-300 flex flex-col relative group overflow-hidden"
                >
                  {/* صورة المنتج المصغرة مع رابط للتفاصيل  */}
                  <Link
                    href={`/product/${product.id}`}
                    className="w-full h-36 bg-lightPinkBg/40 relative block overflow-hidden"
                  >
                    {hasValidImage ? (
                      <img
                        src={product.thumbnailUrl!}
                        alt={productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-textMuted">
                        صورة غير متوفرة
                      </div>
                    )}
                  </Link>

                  {/* زر المفضلة العائم  */}
                  <button
                    onClick={() => onToggleFavorite?.(product)}
                    className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full shadow hover:scale-110 transition flex items-center justify-center"
                    aria-label="المفضلة"
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

                  {/* تفاصيل المنتج  */}
                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <Link href={`/product/${product.id}`}>
                        <h3 className="text-textDark font-bold text-xs line-clamp-1 mb-0.5 hover:text-deepRose transition">
                          {productName}
                        </h3>
                      </Link>
                      {description && (
                        <p className="text-[10px] text-gray-500 line-clamp-1">
                          {description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-deepRose font-bold text-xs">
                        {displayPrice} ل.س
                      </span>
                      {/* زر السلة بخلفية زهرية فائقة الدقة */}
                      <button
                        onClick={() => onAddToCart?.(product)}
                        className="bg-lightPinkBg text-deepRose p-2 rounded-lg hover:bg-pink-200 transition shadow-sm flex items-center justify-center border border-pink-100"
                        aria-label="إضافة للسلة"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* زر "عرض الكل"  */}
          <div className="flex justify-center pt-2 pb-8">
            <Link
              href="/home/category"
              className="border-2 border-deepRose text-deepRose hover:bg-deepRose hover:text-white font-bold text-sm px-8 py-2.5 rounded-xl transition duration-300 shadow-sm"
            >
              عرض الكل 
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
