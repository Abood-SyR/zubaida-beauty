'use client';

import Link from 'next/link';
import { Product } from '@/models/product';

interface NewProductsSectionProps {
  products: Product[];
  isLoading?: boolean;
  favoritesMap?: Record<string, boolean>;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export default function NewProductsSection({
  products,
  isLoading,
  favoritesMap = {},
  onToggleFavorite,
  onAddToCart,
}: NewProductsSectionProps) {
  return (
    <section className="py-2">
      {/* عنوان القسم */}
      <div className="flex justify-between items-center px-4 mb-3">
        <h2 className="text-lg font-bold text-deepRose">
          ✨ جديدنا وأبرز المنتجات
        </h2>
      </div>

      {/* المحتوى الأفقي */}
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-none">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[155px] h-[235px] bg-pink-100 animate-pulse rounded-2xl flex-shrink-0"
            />
          ))
        ) : !products || products.length === 0 ? (
          <div className="w-full text-center py-6 text-textMuted text-sm">
            لا توجد منتجات جديدة حالياً
          </div>
        ) : (
          products.map((product) => {
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
                className="min-w-[155px] max-w-[155px] h-[235px] bg-surfaceWhite rounded-2xl border border-pink-100 shadow-sm flex flex-col relative group flex-shrink-0 overflow-hidden"
              >
                {/* صورة المنتج مع رابط لصفحة التفاصيل */}
                <Link
                  href={`/product/${product.id}`}
                  className="w-full h-[110px] bg-lightPinkBg/40 relative block overflow-hidden"
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

                {/* زر المفضلة */}
                <button
                  onClick={() => onToggleFavorite?.(product)}
                  className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full shadow hover:scale-110 transition"
                >
                  <span className={`text-xs ${isFav ? 'text-primaryRose' : 'text-gray-400'}`}>
                    {isFav ? '❤️' : '🤍'}
                  </span>
                </button>

                {/* تفاصيل المنتج */}
                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-textDark font-bold text-xs line-clamp-1 mb-0.5">
                      {productName}
                    </h3>
                    {description && (
                      <p className="text-[10px] text-gray-500 line-clamp-1">
                        {description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-deepRose font-bold text-xs">
                      {displayPrice} ل.س
                    </span>
                    <button
                      onClick={() => onAddToCart?.(product)}
                      className="bg-deepRose text-white p-1.5 rounded-xl hover:bg-primaryRose transition shadow-sm"
                    >
                      🛒
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}