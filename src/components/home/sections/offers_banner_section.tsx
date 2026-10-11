'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OffersBannerSectionProps {
  offers: any[];
  isLoading?: boolean;
}

export default function OffersBannerSection({ offers, isLoading }: OffersBannerSectionProps) {
  const [allOffers, setAllOffers] = useState<any[]>([]);

  useEffect(() => {
    if (Array.isArray(offers)) {
      setAllOffers(offers.slice(0, 10));
    }
  }, [offers]);

  // حساب الوقت المتبقي للعرض
  const getRemainingTime = (endDateStr?: string) => {
    if (!endDateStr) return 'لفترة محدودة';
    try {
      const endDate = new Date(endDateStr);
      const diffTime = endDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

      if (diffTime < 0) return 'منتهي';
      if (diffDays > 0) return `ينتهي خلال ${diffDays} يوم`;
      if (diffHours > 0) return `ينتهي خلال ${diffHours} ساعة`;
      return 'ينتهي قريباً';
    } catch {
      return 'لفترة محدودة';
    }
  };

  if (isLoading) {
    return (
      <div className="py-2">
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[300px] h-[150px] bg-pink-100 animate-pulse rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!allOffers.length) return null;

  return (
    <section className="py-2">
      <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-none">
        {allOffers.map((offer, index) => {
          const offerType = offer['offer_type'] || 'single_discount';
          const title = typeof offer['title'] === 'object'
            ? (offer['title']?.['ar'] || 'عرض خاص')
            : (offer['title'] || 'عرض خاص');

          const finalPrice = Number(offer['final_price'] || 0);
          let initialPrice = offer['initial_price'] != null ? Number(offer['initial_price']) : null;
          const discountPercentage = offer['discount_percentage'] != null ? Number(offer['discount_percentage']) : null;

          if (!initialPrice && discountPercentage && discountPercentage > 0 && discountPercentage < 100) {
            initialPrice = Number((finalPrice / (1 - discountPercentage / 100)).toFixed(2));
          }

          const endDate = offer['end_date'];
          const products = Array.isArray(offer['products']) ? offer['products'] : [];
          const hasFreeGift = offer['free_product_id'] != null;
          const freeProductId = offer['free_product_id']?.toString();

          let freeProduct = offer['free_product'];
          if (!freeProduct && freeProductId) {
            freeProduct = products.find((p: any) => p['id']?.toString() === freeProductId);
          }
          if (!freeProduct && hasFreeGift && products.length === 2) {
            freeProduct = products[1];
          }

          const resolvedFreeProductId = freeProductId || freeProduct?.['id']?.toString();
          const mainProducts = products.filter(
            (p: any) => p['id']?.toString() !== resolvedFreeProductId
          );
          const displayedMainProducts = mainProducts.length > 0 ? mainProducts.slice(0, 3) : products.slice(0, 3);
          const offerId = offer['id'] || `offer_${index}`;

          return (
            <Link
              key={offerId}
              href={`/offers/${offerId}`}
              className="min-w-[320px] max-w-[360px] h-[145px] bg-surfaceWhite rounded-3xl shadow-sm border border-pink-100 p-3 flex items-center gap-3 relative overflow-hidden flex-shrink-0 group hover:shadow-md transition duration-300"
            >
              {/* قسم صور المنتجات في العرض */}
              <div className="w-[110px] h-full relative flex items-center justify-center bg-lightPinkBg/30 rounded-2xl overflow-hidden">
                {displayedMainProducts.length > 0 && (
                  <img
                    src={displayedMainProducts[0]['thumbnail_url'] || ''}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                )}
                {hasFreeGift && (
                  <span className="absolute bottom-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    هدية 🎁
                  </span>
                )}
              </div>

              {/* تفاصيل العرض والنصوص */}
              <div className="flex-1 flex flex-col justify-center">
                {/* شارة التمييز */}
                <div className="inline-flex items-center gap-1 bg-deepRose text-white text-[10px] font-bold px-2 py-0.5 rounded-md w-fit mb-1 shadow-sm">
                  <span>⭐</span>
                  <span>
                    {offerType === 'bundle'
                      ? (hasFreeGift ? 'عرض الهدية' : 'باقة خاصة')
                      : (discountPercentage ? `خصم ${Math.round(discountPercentage)}%` : 'عرض حصري')}
                  </span>
                </div>

                {/* عنوان العرض */}
                <h3 className="text-textDark font-bold text-xs line-clamp-1 mb-1">
                  {title}
                </h3>

                {/* الأسعار */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-deepRose font-black text-sm">
                    {finalPrice} ر.س
                  </span>
                  {initialPrice && initialPrice > finalPrice && (
                    <span className="text-gray-400 text-[11px] line-through">
                      {initialPrice} ر.س
                    </span>
                  )}
                </div>

                {/* الوقت المتبقي */}
                <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                  <span>⏰</span>
                  <span>{getRemainingTime(endDate)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}