'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/models/product';

interface NewProductsSectionProps {
  products: Product[];
  isLoading?: boolean;
  favoritesMap?: Record<string, boolean>;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

function localizedText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const localized = record['ar'] ?? Object.values(record)[0] ?? '';
    return String(localized);
  }
  return String(value);
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
      <div className="flex justify-between items-center px-4 mb-3">
        <h2 className="text-lg font-bold text-deepRose">
          أحدث المنتجات
        </h2>
      </div>

      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-none">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[155px] h-[240px] shimmer rounded-2xl flex-shrink-0"
            />
          ))
        ) : !products || products.length === 0 ? (
          <div className="w-full text-center py-6 text-textMuted text-sm">
            لا توجد منتجات جديدة حالياً
          </div>
        ) : (
          products.map((product) => {
            const productName = localizedText(product.name) || 'منتج';
            const description = localizedText(product.description);
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
                className="min-w-[155px] max-w-[155px] h-[240px] bg-surfaceWhite rounded-2xl border border-pink-100 shadow-sm flex flex-col relative group flex-shrink-0 overflow-hidden cursor-pointer hover:border-pink-200 transition"
              >
                <div className="w-full h-[110px] bg-white relative block overflow-hidden p-1">
                  {hasValidImage ? (
                    <Image
                      src={product.thumbnailUrl!}
                      alt={productName}
                      fill
                      sizes="155px"
                      className="product-image w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-textMuted">
                      صورة غير متوفرة
                    </div>
                  )}
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite?.(product);
                  }}
                  aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                  className="absolute top-2 left-2 bg-white/95 p-1.5 rounded-full shadow hover:scale-110 transition z-10 border border-pink-50"
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

                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-textDark font-bold text-xs line-clamp-1 mb-0.5">
                      {productName}
                    </h3>
                    {description && (
                      <p className="text-[10px] text-gray-500 line-clamp-1 leading-normal">
                        {description}
                      </p>
                    )}
                    <span className="text-[9px] font-semibold text-gray-400 bg-pink-50/80 px-1.5 py-0.5 rounded-md inline-block mt-1">
                      المخزون: {product.stockQuantity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-deepRose font-extrabold text-xs">
                      {Number(displayPrice || 0).toLocaleString('ar-SY')} ل.س
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddToCart?.(product);
                      }}
                      aria-label={`إضافة ${productName} إلى السلة`}
                      className="bg-primaryRose text-white p-1.5 rounded-xl hover:bg-deepRose active:scale-95 transition shadow-sm flex items-center justify-center"
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
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}