/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  return (
    <section className="py-2">
      {/* عنوان القسم */}
      <div className="flex justify-between items-center px-4 mb-3">
        <h2 className="text-lg font-bold text-deepRose">
         احدث المنتجات
        </h2>
      </div>

      {/* المحتوى الأفقي */}
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-none">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[155px] h-[235px] shimmer rounded-2xl flex-shrink-0"
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
                className="min-w-[155px] max-w-[155px] h-[235px] bg-surfaceWhite rounded-2xl border border-pink-100 shadow-sm flex flex-col relative group flex-shrink-0 overflow-hidden cursor-pointer"
              >
                {/* صورة المنتج */}
                <div className="w-full h-[110px] bg-white relative block overflow-hidden">
                  {hasValidImage ? (
                    <img
                      src={product.thumbnailUrl!}
                      alt={productName}
                      className="product-image w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-textMuted">
                      صورة غير متوفرة
                    </div>
                  )}
                </div>

                {/* زر المفضلة */}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite?.(product);
                  }}
                  aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
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
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddToCart?.(product);
                      }}
                      aria-label={`إضافة ${productName} إلى السلة`}
                      className="bg-deepRose text-white p-1.5 rounded-xl hover:bg-primaryRose transition shadow-sm"
                    >
                      🛒
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}