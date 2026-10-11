'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CartManager } from '@/services/cart_manager';
import { OfferService } from '@/services/offer_service';
import { useToast } from '@/components/ui/toast_provider';
import PageLoadingSkeleton from '@/components/ui/page_loading_skeleton';

type OfferProduct = Record<string, unknown>;
type OfferData = Record<string, unknown>;

function localizedText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value || fallback;
  if (isOfferProduct(value)) {
    const localized = value['ar'] ?? Object.values(value)[0] ?? fallback;
    return String(localized);
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

function formatPrice(value: number): string {
  return `${value.toLocaleString('ar-SY')} ل.س`;
}

function remainingTime(endDate: string | undefined, now: number): string {
  if (!endDate || !now) return 'لفترة محدودة';
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return 'لفترة محدودة';
  const difference = end - now;
  if (difference < 0) return 'انتهى العرض';
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(difference / (1000 * 60 * 60));
  if (days > 0) return `متبقي ${days} يوم`;
  if (hours > 0) return `متبقي ${hours} ساعة`;
  return 'ينتهي قريباً';
}

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = String(params?.id ?? '');
  const cartManager = CartManager.getInstance();
  const showToast = useToast();
  const [loadedOffer, setLoadedOffer] = useState<{ id: string; data: OfferData } | null>(null);
  const [requestError, setRequestError] = useState<{
    id: string;
    attempt: number;
    message: string;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [now, setNow] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let isCurrent = true;
    OfferService.getOfferById(offerId)
      .then((data) => {
        if (isCurrent) setLoadedOffer({ id: offerId, data });
      })
      .catch((fetchError: unknown) => {
        if (isCurrent) {
          setRequestError({
            id: offerId,
            attempt: reloadKey,
            message: fetchError instanceof Error
              ? fetchError.message
              : 'تعذر تحميل تفاصيل العرض. يرجى المحاولة مرة أخرى.',
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [offerId, reloadKey]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const offer = loadedOffer?.id === offerId ? loadedOffer.data : null;
  const error = requestError?.id === offerId && requestError.attempt === reloadKey
    ? requestError.message
    : '';
  const products: OfferProduct[] = useMemo(
    () => (Array.isArray(offer?.['products']) ? offer['products'].filter(isOfferProduct) : []),
    [offer],
  );
  const freeProductId = offer?.['free_product_id'] == null
    ? null
    : String(offer['free_product_id']);
  const hasFreeGift = offer?.['free_product_id'] != null || offer?.['free_product'] != null;
  const freeProduct: OfferProduct | null = useMemo(() => {
    if (isOfferProduct(offer?.['free_product'])) return offer['free_product'];
    if (freeProductId) {
      const match = products.find((product) => String(product['id']) === freeProductId);
      if (match) return match;
    }
    return hasFreeGift && products.length === 2 ? products[1] : null;
  }, [freeProductId, hasFreeGift, offer, products]);
  const mainProducts = useMemo(() => {
    const resolvedGiftId = freeProductId ?? (freeProduct?.['id'] == null ? null : String(freeProduct['id']));
    let resolvedGiftIndex = freeProduct
      ? products.findIndex((product) =>
          product === freeProduct ||
          (freeProduct['id'] != null && String(product['id']) === String(freeProduct['id']))
        )
      : -1;
    if (resolvedGiftIndex < 0 && freeProduct === products[1] && hasFreeGift) {
      resolvedGiftIndex = 1;
    }
    return products.filter(
      (product, index) =>
        index !== resolvedGiftIndex &&
        (resolvedGiftId == null || String(product['id']) !== resolvedGiftId),
    );
  }, [freeProduct, freeProductId, hasFreeGift, products]);
  const galleryImages = useMemo(
    () => [...mainProducts, ...(freeProduct ? [freeProduct] : [])],
    [freeProduct, mainProducts],
  );

  if (!offer && !error) return <PageLoadingSkeleton />;

  if (!offer) {
    return (
      <main className="min-h-screen bg-lightPinkBg px-4 py-12" dir="rtl">
        <section className="mx-auto max-w-lg rounded-[32px] border border-pink-100 bg-white p-8 text-center shadow-xl">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-3xl text-deepRose">
            !
          </span>
          <h1 className="text-xl font-black text-textDark">لم نتمكن من تحميل العرض</h1>
          <p className="mt-2 text-sm leading-7 text-textMuted">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-6 rounded-2xl bg-deepRose px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primaryRose"
          >
            إعادة المحاولة
          </button>
          <Link href="/home" className="mt-4 block text-sm font-bold text-primaryRose hover:underline">
            العودة إلى المتجر
          </Link>
        </section>
      </main>
    );
  }

  const title = localizedText(offer['title'], 'عرض خاص');
  const description = localizedText(offer['description']);
  const finalPrice = numberValue(offer['final_price']) ?? 0;
  const discountPercentage = numberValue(offer['discount_percentage']);
  const suppliedInitialPrice = numberValue(offer['initial_price']);
  const initialPrice =
    suppliedInitialPrice != null && suppliedInitialPrice > finalPrice
      ? suppliedInitialPrice
      : discountPercentage != null && discountPercentage > 0 && discountPercentage < 100
        ? Number((finalPrice / (1 - discountPercentage / 100)).toFixed(2))
        : null;
  const actualDiscount = initialPrice
    ? discountPercentage ?? Math.round((1 - finalPrice / initialPrice) * 100)
    : null;
  const savings = initialPrice ? initialPrice - finalPrice : 0;
  const isBundle = offer['offer_type'] === 'bundle';
  const safeImageIndex = galleryImages.length ? activeImageIndex % galleryImages.length : 0;
  const isGiftImage = safeImageIndex >= mainProducts.length;
  const activeImage = galleryImages[safeImageIndex];
  const activeImageUrl = imageSource(activeImage);

  const changeImage = (step: number) => {
    if (galleryImages.length < 2) return;
    setActiveImageIndex((current) => (current + step + galleryImages.length) % galleryImages.length);
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    try {
      cartManager.loadFromStorage();
      cartManager.addOffer(offer);
      showToast('تمت إضافة العرض إلى السلة');
    } catch (addError: unknown) {
      console.error('Failed to add offer to cart:', addError);
      showToast('تعذرت إضافة العرض إلى السلة', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleOrderNow = () => {
    cartManager.loadFromStorage();
    cartManager.addOffer(offer);
    router.push('/checkout');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`مرحباً، أود الاستفسار عن العرض: ${title}`);
    window.open(`https://wa.me/963981082693?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff0f6_0%,_#fff8fb_36%,_#fff_100%)] pb-32" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/home" className="rounded-full bg-pink-50 px-4 py-2 text-sm font-bold text-primaryRose transition hover:bg-pink-100">
            ← العودة للمتجر
          </Link>
          <div className="text-center">
            <span className="block text-[10px] font-semibold tracking-[0.24em] text-primaryRose">ZUBAIDA BEAUTY</span>
            <h1 className="mt-0.5 text-sm font-black text-deepRose sm:text-base">تفاصيل العرض</h1>
          </div>
          <Link href="/cart" aria-label="سلة المشتريات" className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-lg shadow-sm transition hover:-translate-y-0.5">
            🛍️
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <section className="space-y-4">
            <div
              className="relative isolate min-h-[330px] overflow-hidden rounded-[36px] border border-white bg-white p-4 shadow-[0_24px_70px_rgba(133,38,84,0.16)] sm:min-h-[490px] sm:p-7"
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const startX = touchStartX.current;
                const endX = event.changedTouches[0]?.clientX;
                touchStartX.current = null;
                if (startX != null && endX != null && Math.abs(endX - startX) > 40) {
                  changeImage(endX < startX ? 1 : -1);
                }
              }}
            >
              <div className="absolute right-7 top-7 z-10 flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-xs font-bold text-deepRose shadow-lg backdrop-blur">
                <span aria-hidden="true">✦</span>
                {isBundle ? (hasFreeGift ? 'باقة مع هدية' : 'باقة مختارة') : 'عرض لفترة محدودة'}
              </div>

              {activeImageUrl ? (
                <div key={activeImageIndex} className="offer-detail-image absolute inset-14 bottom-12 sm:inset-20 sm:bottom-16">
                  <Image
                    src={activeImageUrl}
                    alt={localizedText(activeImage['name'], title)}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="absolute inset-14 flex items-center justify-center rounded-[28px] bg-white/50 text-7xl sm:inset-20">
                  🎀
                </div>
              )}

              {isGiftImage && (
                <span className="absolute bottom-7 right-7 z-10 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-lg">
                  هدية مجانية 🎁
                </span>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="الصورة السابقة"
                    onClick={() => changeImage(-1)}
                    className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-xl text-deepRose shadow-lg backdrop-blur transition hover:scale-105"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    aria-label="الصورة التالية"
                    onClick={() => changeImage(1)}
                    className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-xl text-deepRose shadow-lg backdrop-blur transition hover:scale-105"
                  >
                    ‹
                  </button>
                  <span className="absolute bottom-7 left-7 z-10 rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold text-deepRose backdrop-blur">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </span>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((product, index) => (
                  <button
                    key={`${product['id'] ?? index}-${index}`}
                    type="button"
                    aria-label={`عرض الصورة ${index + 1}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-[76px] w-[76px] flex-none overflow-hidden rounded-2xl border-2 bg-white p-1 transition sm:h-[88px] sm:w-[88px] ${
                      index === activeImageIndex
                        ? 'border-primaryRose shadow-[0_8px_20px_rgba(190,67,120,0.2)]'
                        : 'border-white shadow-sm hover:border-pink-200'
                    }`}
                  >
                    {imageSource(product) ? (
                      <Image
                        src={imageSource(product)!}
                        alt={localizedText(product['name'], title)}
                        fill
                        unoptimized
                        sizes="88px"
                        className="object-contain"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center">🎀</span>
                    )}
                    {index >= mainProducts.length && (
                      <span className="absolute inset-x-0 bottom-0 bg-red-500/90 py-0.5 text-[9px] font-bold text-white">هدية</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[32px] border border-pink-100 bg-white p-5 shadow-[0_18px_55px_rgba(133,38,84,0.1)] sm:p-8">
            <span className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-pink-50" />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-deepRose px-4 py-2 text-xs font-bold text-white shadow-sm">
                  {isBundle ? (hasFreeGift ? 'عرض الهدية' : 'باقة خاصة') : 'عرض حصري'}
                </span>
                {actualDiscount != null && actualDiscount > 0 && (
                  <span className="rounded-full bg-rose-50 px-4 py-2 text-xs font-black text-primaryRose">
                    خصم {Math.round(actualDiscount)}٪
                  </span>
                )}
                <span className="mr-auto flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                  <span aria-hidden="true">◷</span>
                  {remainingTime(
                    typeof offer['end_date'] === 'string' ? offer['end_date'] : undefined,
                    now,
                  )}
                </span>
              </div>

              <h2 className="text-2xl font-black leading-tight text-textDark sm:text-3xl">{title}</h2>
              {description && (
                <p className="mt-3 text-sm leading-7 text-textMuted">{description}</p>
              )}

              <div className="mt-6 rounded-[24px] bg-gradient-to-l from-[#fff0f6] via-[#fff8fb] to-white p-4 ring-1 ring-pink-100 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="block text-xs font-semibold text-textMuted">سعر العرض</span>
                    <span className="mt-1 block text-3xl font-black tracking-tight text-deepRose">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                  {initialPrice != null && initialPrice > finalPrice && (
                    <div className="text-left">
                      <span className="block text-xs text-textMuted">بدلاً من</span>
                      <span className="mt-1 block text-sm font-semibold text-gray-400 line-through">
                        {formatPrice(initialPrice)}
                      </span>
                    </div>
                  )}
                </div>
                {savings > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <span aria-hidden="true">✓</span>
                    وفّري {formatPrice(savings)} عند اختيار هذا العرض
                  </div>
                )}
              </div>

              {(mainProducts.length > 0 || freeProduct) && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black text-textDark">محتويات العرض</h3>
                    <span className="text-xs font-medium text-textMuted">
                      {mainProducts.length + (freeProduct ? 1 : 0)} منتجات
                    </span>
                  </div>
                  <div className="max-h-[300px] space-y-2.5 overflow-y-auto pl-1">
                    {mainProducts.map((product, index) => (
                      <OfferProductRow
                        key={product['id'] == null ? index : String(product['id'])}
                        product={product}
                        isGift={false}
                      />
                    ))}
                    {freeProduct && <OfferProductRow product={freeProduct} isGift />}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[#fff8fb] px-4 py-3 text-xs leading-6 text-textMuted">
                <span className="text-lg" aria-hidden="true">♡</span>
                منتجات مختارة بعناية لتمنحك تجربة عناية متكاملة.
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-pink-100 bg-white/95 px-3 py-3 shadow-[0_-12px_40px_rgba(74,30,52,0.12)] backdrop-blur-xl sm:px-5 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleWhatsApp}
            aria-label="الاستفسار عبر واتساب"
            className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700 transition hover:bg-emerald-100 sm:h-14 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm sm:font-bold"
          >
            <span aria-hidden="true">☏</span>
            <span className="hidden sm:inline">واتساب</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="h-12 flex-1 rounded-2xl border border-primaryRose bg-white px-2 text-xs font-bold text-primaryRose transition hover:bg-pink-50 disabled:opacity-60 sm:h-14 sm:text-sm"
          >
            {isAddingToCart ? 'جارٍ الإضافة…' : 'أضف للسلة'}
          </button>
          <button
            type="button"
            onClick={handleOrderNow}
            className="h-12 flex-1 rounded-2xl bg-gradient-to-l from-deepRose to-primaryRose px-2 text-xs font-bold text-white shadow-lg shadow-rose-900/15 transition hover:-translate-y-0.5 sm:h-14 sm:text-sm"
          >
            اطلب العرض الآن
          </button>
        </div>
      </div>
    </main>
  );
}

function OfferProductRow({ product, isGift }: { product: OfferProduct; isGift: boolean }) {
  const name = localizedText(product['name'], isGift ? 'هدية العرض' : 'منتج العرض');
  const imageUrl = imageSource(product);
  const description = localizedText(product['description']);
  const price = numberValue(product['price']);

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-2.5 ${
      isGift ? 'border-emerald-100 bg-emerald-50/70' : 'border-pink-100 bg-[#fffafd]'
    }`}>
      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-xl bg-white shadow-sm">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="56px"
            className="object-contain p-1"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xl">🎀</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`truncate text-xs font-bold ${isGift ? 'text-emerald-900' : 'text-textDark'}`}>
          {isGift ? `هدية مجانية · ${name}` : name}
        </h4>
        {description && <p className="mt-1 line-clamp-1 text-[10px] text-textMuted">{description}</p>}
      </div>
      <span className={`flex-none text-[10px] font-bold ${isGift ? 'text-emerald-700' : 'text-textMuted'}`}>
        {isGift ? 'مجاناً' : price != null ? formatPrice(price) : 'ضمن العرض'}
      </span>
    </div>
  );
}

function isOfferProduct(value: unknown): value is OfferProduct {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function imageSource(product: OfferProduct | undefined): string | null {
  if (typeof product?.['thumbnail_url'] === 'string') return product['thumbnail_url'];
  if (typeof product?.['thumbnailUrl'] === 'string') return product['thumbnailUrl'];
  return null;
}
