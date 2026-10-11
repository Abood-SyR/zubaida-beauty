'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getProductName, Product } from '@/models/product';

interface ProductGridSectionProps {
  products: Product[];
  isLoading?: boolean;
  favoritesMap?: Record<string, boolean>;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onProductSelected?: () => void;
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
  // عرض كحد أقصى 10 منتجات في الصفحة الرئيسية مطابقة لكود فلاتر 
  const displayedProducts = (products || []).slice(0, 10);

  return (
    <section className="px-4 py-2">
      {/* العنوان في الأعلى  */}
      <h2 className="text-lg font-bold text-deepRose mb-3">
        ابرز المنتجات
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 shimmer rounded-2xl" />
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
              const productName = getProductName(product, 'ar') || 'منتج';
              const rawDescription = product.description;
              const description = typeof rawDescription === 'string'
                ? rawDescription
                : rawDescription && typeof rawDescription === 'object'
                  ? (typeof rawDescription['ar'] === 'string'
                      ? rawDescription['ar']
                      : Object.values(rawDescription).find(
                          (value) => typeof value === 'string',
                        )) || ''
                  : '';
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
                  className="bg-surfaceWhite rounded-xl border border-pink-100/50 shadow-sm hover:shadow-md transition duration-300 flex flex-col relative group overflow-hidden cursor-pointer"
                >
                  {/* صورة المنتج المصغرة */}
                  <div className="w-full h-36 bg-white relative block overflow-hidden">
                    {hasValidImage ? (
                      <Image
                        src={product.thumbnailUrl!}
                        alt={productName}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="product-image w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-textMuted">
                        صورة غير متوفرة
                      </div>
                    )}
                  </div>

                  {/* زر المفضلة العائم  */}
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

                  {/* تفاصيل المنتج  */}
                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-textDark font-bold text-xs line-clamp-1 mb-0.5 hover:text-deepRose transition">
                        {productName}
                      </h3>
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
                      {/* زر السلة  */}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddToCart?.(product);
                        }}
                        aria-label={`إضافة ${productName} إلى السلة`}
                        className="bg-deepRose text-white p-1.5 rounded-lg hover:bg-primaryRose transition shadow-sm"
                      >
                        🛒
                      </button>
                    </div>
                  </div>
                </article>
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