'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { getProductName, Product } from '@/models/product';
import nothingAnimation from '@/assets/nothing.json';

interface ProductGridSectionProps {
  products: Product[];
  isLoading?: boolean;
  favoritesMap?: Record<string, boolean>;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onProductSelected?: () => void;
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

export default function ProductGridSection({
  products,
  isLoading,
  favoritesMap = {},
  onToggleFavorite,
  onAddToCart,
  onProductSelected,
}: ProductGridSectionProps) {
  const router = useRouter();
  const displayedProducts = (products || []).slice(0, 10);
  const emptyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && displayedProducts.length === 0 && emptyContainerRef.current) {
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
  }, [isLoading, displayedProducts.length]);

  return (
    <section className="px-4 py-2">
      <h2 className="text-lg font-bold text-deepRose mb-3">
        أبرز المنتجات
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[240px] shimmer rounded-2xl" />
          ))}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-surfaceWhite rounded-2xl border border-pink-100 text-textMuted shadow-sm px-4">
          <div ref={emptyContainerRef} className="w-48 h-48 sm:w-60 sm:h-60 mb-3" />
          <p className="text-sm font-bold text-deepRose text-center">
            لا توجد منتجات مطابقة حالياً
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {displayedProducts.map((product) => {
              const productName = getProductName(product, 'ar') || 'منتج';
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
                  onClick={() => {
                    onProductSelected?.();
                    router.push(`/product/${product.id}`);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      onProductSelected?.();
                      router.push(`/product/${product.id}`);
                    }
                  }}
                  className="bg-surfaceWhite rounded-2xl border border-pink-100/60 shadow-sm hover:shadow-md hover:border-pink-200 transition duration-300 flex flex-col relative group overflow-hidden cursor-pointer h-[240px]"
                >
                  <div className="w-full h-[110px] bg-white relative block overflow-hidden p-1">
                    {hasValidImage ? (
                      <Image
                        src={product.thumbnailUrl!}
                        alt={productName}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
                      <h3 className="text-textDark font-bold text-xs line-clamp-1 mb-0.5 hover:text-deepRose transition">
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
            })}
          </div>

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