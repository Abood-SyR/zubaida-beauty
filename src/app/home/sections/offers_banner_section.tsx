'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type OfferData = Record<string, unknown>;
type OfferProduct = Record<string, unknown>;

interface OffersBannerSectionProps {
  offers: OfferData[];
  isLoading?: boolean;
}

export default function OffersBannerSection({ offers, isLoading }: OffersBannerSectionProps) {
  const [pulse, setPulse] = useState(false);
  const [now, setNow] = useState(0);
  const clipId = `offer-wave-${useId().replace(/:/g, '')}`;
  const clipPathRef = useRef<SVGPathElement>(null);
  const allOffers = Array.isArray(offers) ? offers.slice(0, 10) : [];

  useEffect(() => {
    const timer = window.setInterval(() => setPulse((current) => !current), 1100);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (
      isLoading ||
      !allOffers.length ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const animateWave = (timestamp: number) => {
      const cycle = ((timestamp - startedAt) % 3600) / 3600;
      const progress = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
      const easedProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
      clipPathRef.current?.setAttribute('d', interpolateOfferWave(easedProgress));
      frameId = window.requestAnimationFrame(animateWave);
    };

    frameId = window.requestAnimationFrame(animateWave);
    return () => window.cancelAnimationFrame(frameId);
  }, [allOffers.length, isLoading]);

  const getRemainingTime = (endDateStr: string | undefined) => {
    if (!endDateStr || !now) return 'لفترة محدودة';
    const endDate = new Date(endDateStr);
    if (Number.isNaN(endDate.getTime())) return 'لفترة محدودة';
    const diffTime = endDate.getTime() - now;
    if (diffTime < 0) return 'منتهي';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffDays > 0) return `ينتهي خلال ${diffDays} يوم`;
    if (diffHours > 0) return `ينتهي خلال ${diffHours} ساعة`;
    return 'ينتهي قريباً';
  };

  if (isLoading) {
    return (
      <div className="py-2">
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none">
          {[1, 2].map((item) => (
            <div key={item} className="shimmer h-[150px] w-[min(60.8vw,288px)] flex-shrink-0 rounded-[28px] sm:w-[min(76vw,360px)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!allOffers.length) return null;

  return (
    <section className="py-2">
      <svg aria-hidden="true" className="offer-wave-defs">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path ref={clipPathRef} d={offerWaveStart} />
          </clipPath>
        </defs>
      </svg>
      <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-none">
        {allOffers.map((offer, index) => {
          const offerType = typeof offer['offer_type'] === 'string' ? offer['offer_type'] : 'single_discount';
          const titleValue = offer['title'];
          const title = typeof titleValue === 'object'
            ? localizedText(titleValue, 'عرض خاص')
            : (typeof titleValue === 'string' ? titleValue : 'عرض خاص');
          const finalPrice = numberValue(offer['final_price']) ?? 0;
          let initialPrice = numberValue(offer['initial_price']);
          const discountPercentage = numberValue(offer['discount_percentage']);

          if (initialPrice == null && discountPercentage && discountPercentage > 0 && discountPercentage < 100) {
            initialPrice = Number((finalPrice / (1 - discountPercentage / 100)).toFixed(2));
          }

          const endDate = typeof offer['end_date'] === 'string' ? offer['end_date'] : undefined;
          const products = Array.isArray(offer['products'])
            ? offer['products'].filter(isOfferProduct)
            : [];
          const hasFreeGift = offer['free_product_id'] != null || offer['free_product'] != null;
          const freeProductId = offer['free_product_id'] == null
            ? undefined
            : String(offer['free_product_id']);

          let freeProduct = isOfferProduct(offer['free_product']) ? offer['free_product'] : undefined;
          if (!freeProduct && freeProductId) {
            freeProduct = products.find((product) => String(product['id']) === freeProductId);
          }
          if (!freeProduct && hasFreeGift && products.length === 2) {
            freeProduct = products[1];
          }

          const freeProductIndex = freeProduct
            ? products.findIndex((product) =>
                product === freeProduct ||
                (freeProduct['id'] != null && String(product['id']) === String(freeProduct['id']))
              )
            : -1;
          const resolvedFreeProductId = freeProductId ?? (
            freeProduct?.['id'] == null ? undefined : String(freeProduct['id'])
          );
          
          // تصفية المنتجات الأساسية بحد أقصى 3 منتجات
          const mainProducts = products.filter(
            (product, productIndex) =>
              productIndex !== freeProductIndex &&
              String(product['id']) !== resolvedFreeProductId
          );
          const visibleMainProducts = mainProducts.length > 0 || hasFreeGift ? mainProducts : products;
          const displayedMainProducts = visibleMainProducts.slice(0, 3);
          const offerId = offer['id'] == null ? `offer_${index}` : String(offer['id']);
          const isCompact = displayedMainProducts.length === 1 && !hasFreeGift;

          return (
            <Link
              key={offerId}
              href={`/offers/${offerId}`}
              className={`offer-organic-card group relative flex h-[150px] flex-none items-center overflow-hidden border border-pink-100 bg-surfaceWhite p-2.5 shadow-[0_8px_24px_rgba(129,44,86,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(129,44,86,0.18)] ${
                isCompact
                  ? 'w-[min(46.4vw,216px)] sm:w-[min(58vw,270px)]'
                  : 'w-[min(60.8vw,288px)] sm:w-[min(76vw,360px)]'
              }`}
              style={{ clipPath: `url(#${clipId})` }}
            >
              {/* قسم عرض المنتجات (أساسية + هدية ليصبح المجموع حتى 4 منتجات في المنتصف) */}
              <div className="relative h-full flex-none w-[44%] flex items-end justify-center">
                <div className="relative flex items-end justify-center h-full w-full">
                  {displayedMainProducts.length === 1 && !hasFreeGift ? (
                    <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                      <div className="h-24 w-20 rounded-2xl bg-white/95 p-1.5 shadow-md border border-pink-100">
                        <OfferProductImage product={displayedMainProducts[0]} title={title} />
                      </div>
                    </div>
                  ) : (
                    (() => {
                      // دمج المنتجات الأساسية مع الهدية إن وجدت (إجمالي حتى 4 منتجات)
                      const allDisplayItems: { product: OfferProduct; isGift: boolean }[] = [
                        ...displayedMainProducts.map((p) => ({ product: p, isGift: false })),
                      ];
                      if (hasFreeGift && freeProduct) {
                        allDisplayItems.push({ product: freeProduct, isGift: true });
                      }

                      const totalCount = allDisplayItems.length;

                      return allDisplayItems.map((item, idx) => {
                        let rotation = 'rotate-0';
                        let translate = 'translate-x-0';
                        let zIdx = 'z-20';

                        if (totalCount === 4) {
                          // توزيع 4 منتجات (أساسية + هدية) بشكل متناسق في المنتصف
                          if (idx === 0) { rotation = '-rotate-12'; translate = '-translate-x-9'; zIdx = 'z-10'; }
                          else if (idx === 1) { rotation = '-rotate-4'; translate = '-translate-x-3'; zIdx = 'z-20'; }
                          else if (idx === 2) { rotation = 'rotate-4'; translate = 'translate-x-3'; zIdx = 'z-25'; }
                          else { rotation = 'rotate-12'; translate = 'translate-x-9'; zIdx = 'z-30'; }
                        } else if (totalCount === 3) {
                          if (idx === 0) { rotation = '-rotate-10'; translate = '-translate-x-6'; zIdx = 'z-10'; }
                          else if (idx === 1) { rotation = 'rotate-0'; translate = 'translate-x-0'; zIdx = 'z-20'; }
                          else { rotation = 'rotate-10'; translate = 'translate-x-6'; zIdx = 'z-30'; }
                        } else if (totalCount === 2) {
                          if (idx === 0) { rotation = '-rotate-6'; translate = '-translate-x-4'; zIdx = 'z-10'; }
                          else { rotation = 'rotate-6'; translate = 'translate-x-4'; zIdx = 'z-20'; }
                        }

                        return (
                          <div
                            key={item.product['id'] == null ? idx : String(item.product['id'])}
                            className={`absolute bottom-1 h-20 w-15 rounded-2xl bg-white/95 p-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.15)] border border-pink-200/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${rotation} ${translate} ${zIdx}`}
                            style={{ transformOrigin: 'bottom center' }}
                          >
                            <div className="relative h-full w-full overflow-hidden rounded-xl bg-white">
                              <OfferProductImage product={item.product} title={item.isGift ? 'هدية العرض' : title} />
                            </div>

                            {/* شارة هدية ملتصقة تماماً على رأس يسار الحاوية بشكل مائل */}
                            {item.isGift && (
                              <span className="absolute -top-1.5 -left-1.5 z-40 rotate-[-15deg] rounded bg-red-500 px-1 py-0.5 text-[7px] font-black text-white shadow-md">
                                هدية
                              </span>
                            )}
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              {/* تفاصيل العرض والأسعار */}
              <div className="flex min-w-0 flex-1 flex-col justify-center px-2 z-20">
                <span
                  className={`mb-1 inline-flex w-fit items-center gap-1 rounded-md bg-deepRose px-2 py-0.5 text-[9px] font-bold text-white shadow-sm transition-transform duration-1000 ${
                    pulse ? 'scale-[1.02]' : 'scale-100'
                  }`}
                >
                  <span aria-hidden="true">★</span>
                  <span>
                    {offerType === 'bundle'
                      ? (hasFreeGift ? 'عرض الهدية' : 'باقة خاصة')
                      : (discountPercentage ? `خصم ${Math.round(discountPercentage)}٪` : 'عرض حصري')}
                  </span>
                </span>

                <h3 className="mb-1 line-clamp-1 text-[11px] font-bold text-textDark">
                  {title}
                </h3>

                <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-[12px] font-black text-deepRose">
                    {finalPrice.toLocaleString('ar-SY')} ل.س
                  </span>
                  {initialPrice != null && initialPrice > finalPrice && (
                    <span className="text-[9px] text-gray-400 line-through decoration-red-300">
                      {initialPrice.toLocaleString('ar-SY')} ل.س
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[8px] font-medium text-gray-500">
                  <span aria-hidden="true">◷</span>
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

const offerWaveStart =
  'M .05 .05 C .10 .01 .16 .03 .23 .045 C .31 .065 .36 .02 .44 .035 C .53 .055 .59 .07 .67 .04 C .77 0 .84 .055 .94 .025 C 1.02 0 .98 .15 .98 .22 C .96 .32 .995 .4 .98 .5 C .965 .6 1.015 .68 .98 .78 C .95 .91 .99 .97 .92 .97 C .82 .98 .75 .95 .66 .97 C .56 1.02 .49 .96 .4 .98 C .31 .99 .25 .94 .16 .98 C .07 1.02 0 .96 .025 .85 C .04 .74 0 .67 .025 .56 C .04 .45 0 .37 .035 .27 C .07 .18 0 .11 .05 .05 Z';

const offerWaveEnd =
  'M .04 .035 C .11 0 .17 .055 .24 .035 C .32 .01 .37 .07 .45 .045 C .53 .02 .6 0 .68 .045 C .77 .08 .85 .015 .94 .045 C 1.01 .075 .96 .16 .99 .24 C 1.02 .33 .96 .4 .99 .49 C 1.02 .59 .96 .67 .99 .76 C 1.02 .86 .96 .92 .93 .97 C .85 1.015 .77 .94 .68 .975 C .59 1.01 .52 .94 .43 .975 C .34 1.01 .27 .94 .18 .975 C .09 1.01 .015 .95 .025 .86 C .035 .76 0 .68 .025 .58 C .05 .48 0 .4 .025 .3 C .05 .2 .015 .12 .04 .035 Z';

const offerWaveStartTokens = offerWaveStart.match(/[A-Za-z]|-?(?:\d*\.)?\d+/g) ?? [];
const offerWaveEndTokens = offerWaveEnd.match(/[A-Za-z]|-?(?:\d*\.)?\d+/g) ?? [];

function interpolateOfferWave(progress: number): string {
  return offerWaveStartTokens
    .map((token, index) => {
      if (/^[A-Za-z]$/.test(token)) return token;
      const start = Number(token);
      const end = Number(offerWaveEndTokens[index]);
      return (start + (end - start) * progress).toFixed(4);
    })
    .join(' ');
}

function OfferProductImage({ product, title }: { product: OfferProduct; title: string }) {
  const imageUrl = imageSource(product);

  if (!imageUrl) {
    return <div className="relative h-full w-full bg-pink-50" />;
  }

  return (
    <div className="relative h-full w-full">
      <Image
        src={imageUrl}
        alt={localizedText(product['name'], title)}
        fill
        unoptimized
        sizes="160px"
        className="object-contain transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

function imageSource(product: OfferProduct): string | null {
  if (typeof product['thumbnail_url'] === 'string') return product['thumbnail_url'];
  if (typeof product['thumbnailUrl'] === 'string') return product['thumbnailUrl'];
  return null;
}

function isOfferProduct(value: unknown): value is OfferProduct {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function localizedText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value) return value;
  if (isOfferProduct(value)) {
    const localized = value['ar'] ?? Object.values(value)[0];
    return typeof localized === 'string' ? localized : fallback;
  }
  return fallback;
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}