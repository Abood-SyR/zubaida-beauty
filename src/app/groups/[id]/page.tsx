'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CartManager } from '@/services/cart_manager';
import { ProductService } from '@/services/product_service';
import { useToast } from '@/components/ui/toast_provider';
import PageLoadingSkeleton from '@/components/ui/page_loading_skeleton';

type GroupProduct = Record<string, unknown>;
type GroupData = Record<string, unknown>;

function localizedText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value || fallback;
  if (isGroupProduct(value)) {
    const localized = value['ar'] ?? Object.values(value)[0] ?? fallback;
    return String(localized);
  }
  return fallback;
}

function detailLines(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(detailLines);
  if (!isGroupProduct(value)) return [];

  const localized = value['ar'] ?? value['en'];
  if (typeof localized === 'string') return localized.trim() ? [localized] : [];

  return Object.entries(value).flatMap(([key, entry]) => (
    detailLines(entry).map((line) => `${key}: ${line}`)
  ));
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

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = String(params?.id ?? '');
  const cartManager = CartManager.getInstance();
  const showToast = useToast();
  const [loadedGroup, setLoadedGroup] = useState<{ id: string; data: GroupData } | null>(null);
  const [requestError, setRequestError] = useState<{
    id: string;
    attempt: number;
    message: string;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let isCurrent = true;
    ProductService.getGroupById(groupId)
      .then((data: GroupData) => {
        if (isCurrent) setLoadedGroup({ id: groupId, data });
      })
      .catch((fetchError: unknown) => {
        if (isCurrent) {
          setRequestError({
            id: groupId,
            attempt: reloadKey,
            message: fetchError instanceof Error
              ? fetchError.message
              : 'تعذر تحميل تفاصيل المجموعة. يرجى المحاولة مرة أخرى.',
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [groupId, reloadKey]);

  const group = loadedGroup?.id === groupId ? loadedGroup.data : null;
  const error = requestError?.id === groupId && requestError.attempt === reloadKey
    ? requestError.message
    : '';

  const products: GroupProduct[] = useMemo(
    () => (Array.isArray(group?.['products']) ? group['products'].filter(isGroupProduct) : []),
    [group],
  );

  const mainImageUrl = typeof group?.['image_url'] === 'string' ? group['image_url'] : null;

  const galleryImages = useMemo(() => {
    const list: { url: string; name: string }[] = [];
    if (mainImageUrl) {
      list.push({ url: mainImageUrl, name: localizedText(group?.['name'], 'صورة المجموعة') });
    }
    products.forEach((p) => {
      const img = imageSource(p);
      if (img) {
        list.push({ url: img, name: localizedText(p['name'], 'منتج') });
      }
    });
    return list;
  }, [group, mainImageUrl, products]);

  if (!group && !error) return <PageLoadingSkeleton />;

  if (!group) {
    return (
      <main className="min-h-screen bg-lightPinkBg px-4 py-12 overflow-x-hidden" dir="rtl">
        <section className="mx-auto max-w-lg rounded-[32px] border border-pink-100 bg-white p-8 text-center shadow-xl">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-3xl text-deepRose">
            !
          </span>
          <h1 className="text-xl font-black text-textDark">لم نتمكن من تحميل المجموعة</h1>
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

  const title = localizedText(group['name'], 'مجموعة مميزة');
  const description = localizedText(group['description']);
  const finalPrice = numberValue(group['final_price']) ?? numberValue(group['calculated_price']) ?? 0;
  const initialPrice = numberValue(group['calculated_price']) ?? numberValue(group['custom_price']);
  const savings = initialPrice != null && initialPrice > finalPrice ? initialPrice - finalPrice : 0;
  const detailSections = [
    { label: 'مميزات المجموعة', lines: detailLines(group['features']) },
    { label: 'طريقة الاستخدام', lines: detailLines(group['usages']) },
    { label: 'التوافق', lines: detailLines(group['compatibility']) },
  ].filter((section) => section.lines.length > 0);
  
  const safeImageIndex = galleryImages.length ? activeImageIndex % galleryImages.length : 0;
  const activeImage = galleryImages[safeImageIndex];

  const changeImage = (step: number) => {
    if (galleryImages.length < 2) return;
    setActiveImageIndex((current) => (current + step + galleryImages.length) % galleryImages.length);
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    try {
      cartManager.loadFromStorage();
      cartManager.addGroup(group);
      showToast('تمت إضافة المجموعة إلى السلة');
    } catch (addError: unknown) {
      console.error('Failed to add group to cart:', addError);
      showToast('تعذرت إضافة المجموعة إلى السلة', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleOrderNow = () => {
    cartManager.loadFromStorage();
    cartManager.addGroup(group);
    router.push('/checkout');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`مرحباً، أود الاستفسار عن المجموعة: ${title}`);
    window.open(`https://wa.me/963981082693?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff0f6_0%,_#fff8fb_36%,_#fff_100%)] pb-32 overflow-x-hidden" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/home" className="rounded-full bg-pink-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-primaryRose transition hover:bg-pink-100">
            ← العودة
          </Link>
          <div className="text-center truncate px-2">
            <span className="block text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-primaryRose">ZUBAIDA BEAUTY</span>
            <h1 className="mt-0.5 text-xs sm:text-base font-black text-deepRose truncate">تفاصيل المجموعة</h1>
          </div>
          <Link href="/cart" aria-label="سلة المشتريات" className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-base sm:text-lg shadow-sm transition">
            🛍️
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <section className="space-y-4 min-w-0">
            <div
              className="relative isolate min-h-[280px] sm:min-h-[490px] overflow-hidden rounded-[28px] sm:rounded-[36px] border border-white bg-white p-3 sm:p-7 shadow-[0_24px_70px_rgba(133,38,84,0.16)]"
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
              <div className="absolute right-4 top-4 sm:right-7 sm:top-7 z-10 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-deepRose shadow-lg backdrop-blur">
                <span aria-hidden="true">✦</span>
                مجموعة متكاملة
              </div>

              {activeImage?.url ? (
                <div key={activeImageIndex} className="offer-detail-image absolute inset-10 bottom-10 sm:inset-20 sm:bottom-16">
                  <Image
                    src={activeImage.url}
                    alt={activeImage.name}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="absolute inset-10 flex items-center justify-center rounded-[24px] bg-white/50 text-6xl sm:text-7xl">
                  🎁
                </div>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="الصورة السابقة"
                    onClick={() => changeImage(-1)}
                    className="absolute left-2 sm:left-4 top-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-lg sm:text-xl text-deepRose shadow-lg backdrop-blur"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    aria-label="الصورة التالية"
                    onClick={() => changeImage(1)}
                    className="absolute right-2 sm:right-4 top-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-lg sm:text-xl text-deepRose shadow-lg backdrop-blur"
                  >
                    ‹
                  </button>
                  <span className="absolute bottom-4 left-4 sm:bottom-7 sm:left-7 z-10 rounded-full bg-white/75 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-deepRose backdrop-blur">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </span>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {galleryImages.map((imgItem, index) => (
                  <button
                    key={`${index}`}
                    type="button"
                    aria-label={`عرض الصورة ${index + 1}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-16 w-16 sm:h-[88px] sm:w-[88px] flex-none overflow-hidden rounded-2xl border-2 bg-white p-1 transition ${
                      index === activeImageIndex
                        ? 'border-primaryRose shadow-[0_8px_20px_rgba(190,67,120,0.2)]'
                        : 'border-white shadow-sm'
                    }`}
                  >
                    <Image
                      src={imgItem.url}
                      alt={imgItem.name}
                      fill
                      unoptimized
                      sizes="88px"
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-pink-100 bg-white p-4 sm:p-8 shadow-[0_18px_55px_rgba(133,38,84,0.1)] min-w-0">
            <span className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-pink-50" />
            <div className="relative min-w-0">
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-deepRose px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm">
                  مجموعة مميزة
                </span>
                <span className="rounded-full bg-rose-50 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-black text-primaryRose">
                  {products.length} منتجات بالداخل
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-black leading-tight text-textDark break-words">{title}</h2>
              {description && (
                <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-6 sm:leading-7 text-textMuted break-words">{description}</p>
              )}

              {detailSections.length > 0 && (
                <div className="mt-4 sm:mt-5 grid gap-3">
                  {detailSections.map((section) => (
                    <section key={section.label} className="rounded-2xl bg-[#fff8fb] p-3.5 sm:p-4 min-w-0">
                      <h3 className="text-xs sm:text-sm font-black text-textDark">{section.label}</h3>
                      <ul className="mt-2 space-y-1.5 text-[11px] sm:text-xs leading-5 sm:leading-6 text-textMuted">
                        {section.lines.map((line, index) => (
                          <li key={`${section.label}-${index}`} className="flex gap-2 items-start">
                            <span className="text-primaryRose flex-none mt-0.5" aria-hidden="true">•</span>
                            <span className="break-words flex-1">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}

              <div className="mt-5 sm:mt-6 rounded-[20px] sm:rounded-[24px] bg-gradient-to-l from-[#fff0f6] via-[#fff8fb] to-white p-3.5 sm:p-5 ring-1 ring-pink-100">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[11px] sm:text-xs font-semibold text-textMuted">سعر البكج الإجمالي</span>
                    <span className="mt-0.5 block text-2xl sm:text-3xl font-black tracking-tight text-deepRose truncate">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                  {initialPrice != null && initialPrice > finalPrice && (
                    <div className="text-left flex-none">
                      <span className="block text-[10px] sm:text-xs text-textMuted">السعر العادي</span>
                      <span className="mt-0.5 block text-xs sm:text-sm font-semibold text-gray-400 line-through">
                        {formatPrice(initialPrice)}
                      </span>
                    </div>
                  )}
                </div>
                {savings > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-emerald-700 max-w-full">
                    <span aria-hidden="true" className="flex-none">✓</span>
                    <span className="truncate">وفّري {formatPrice(savings)} عند طلب المجموعة كاملة</span>
                  </div>
                )}
              </div>

              {products.length > 0 && (
                <div className="mt-6 sm:mt-7 min-w-0">
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-textDark">مكونات المجموعة</h3>
                    <span className="text-[11px] sm:text-xs font-medium text-textMuted">
                      {products.length} منتجات
                    </span>
                  </div>
                  <div className="max-h-[260px] sm:max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
                    {products.map((product, index) => (
                      <GroupProductRow
                        key={product['id'] == null ? index : String(product['id'])}
                        product={product}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 sm:mt-6 flex items-center gap-2 rounded-2xl bg-[#fff8fb] px-3.5 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs leading-5 sm:leading-6 text-textMuted">
                <span className="text-base sm:text-lg flex-none" aria-hidden="true">♡</span>
                <span>مجموعة مختارة بعناية لتمنحك روتين عناية متكاملاً بأفضل سعر.</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-pink-100 bg-white/95 px-3 py-2.5 sm:px-5 sm:py-4 shadow-[0_-12px_40px_rgba(74,30,52,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleWhatsApp}
            aria-label="الاستفسار عبر واتساب"
            className="flex h-11 sm:h-14 w-11 sm:w-auto flex-none items-center justify-center rounded-2xl bg-emerald-50 text-lg sm:text-xl text-emerald-700 transition sm:gap-2 sm:px-4 sm:text-sm sm:font-bold"
          >
            <span aria-hidden="true">☏</span>
            <span className="hidden sm:inline">واتساب</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="h-11 sm:h-14 flex-1 rounded-2xl border border-primaryRose bg-white px-2 text-[11px] sm:text-sm font-bold text-primaryRose transition hover:bg-pink-50 disabled:opacity-60 truncate"
          >
            {isAddingToCart ? 'جارٍ الإضافة…' : 'أضف للسلة'}
          </button>
          <button
            type="button"
            onClick={handleOrderNow}
            className="h-11 sm:h-14 flex-1 rounded-2xl bg-gradient-to-l from-deepRose to-primaryRose px-2 text-[11px] sm:text-sm font-bold text-white shadow-lg shadow-rose-900/15 transition truncate"
          >
            اطلب المجموعة الآن
          </button>
        </div>
      </div>
    </main>
  );
}

function GroupProductRow({ product }: { product: GroupProduct }) {
  const name = localizedText(product['name'], 'منتج داخل المجموعة');
  const imageUrl = imageSource(product);
  const description = localizedText(product['description']);
  const price = numberValue(product['price']);

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-pink-100 bg-white p-2 sm:p-2.5 min-w-0">
      <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-none overflow-hidden rounded-xl bg-white shadow-sm">
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
          <span className="flex h-full items-center justify-center text-lg sm:text-xl">🎀</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-xs font-bold text-textDark">{name}</h4>
        {description && <p className="mt-0.5 sm:mt-1 line-clamp-1 text-[10px] text-textMuted">{description}</p>}
      </div>
      <span className="flex-none text-[10px] sm:text-xs font-bold text-textMuted pl-1">
        {price != null ? formatPrice(price) : 'ضمن البكج'}
      </span>
    </div>
  );
}

function isGroupProduct(value: unknown): value is GroupProduct {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function imageSource(product: GroupProduct | undefined): string | null {
  if (typeof product?.['thumbnail_url'] === 'string') return product['thumbnail_url'];
  if (typeof product?.['thumbnailUrl'] === 'string') return product['thumbnailUrl'];
  return null;
}
