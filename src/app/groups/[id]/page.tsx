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

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const groupId = String(params?.id ?? '');
    const group = await ProductService.getGroupById(groupId);
    const title = localizedText(group?.['name'], 'مجموعة مميزة');
    const description = localizedText(group?.['description'], title);
    const mainImageUrl = typeof group?.['image_url'] === 'string' ? group['image_url'] : null;
    const products = Array.isArray(group?.['products']) ? group['products'].filter(isGroupProduct) : [];
    
    const imageUrls: string[] = [];
    if (mainImageUrl) imageUrls.push(mainImageUrl);
    products.forEach((p) => {
      const img = imageSource(p);
      if (img) imageUrls.push(img);
    });

    return {
      title: `${title} - زُبيدة بيوتي`,
      description: description,
      openGraph: {
        title: `${title} - زُبيدة بيوتي`,
        description: description,
        url: `https://zubaidabeauty.com/group/${groupId}`,
        images: imageUrls.map((url) => ({ url })),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} - زُبيدة بيوتي`,
        description: description,
        images: imageUrls,
      },
    };
  } catch {
    return {
      title: 'تفاصيل المجموعة - زُبيدة بيوتي',
      description: 'متجر زُبيدة بيوتي للعناية والتجميل',
    };
  }
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
          const errorMessage = fetchError instanceof Error
            ? fetchError.message
            : 'تعذر تحميل تفاصيل المجموعة. يرجى المحاولة مرة أخرى.';
          setRequestError({
            id: groupId,
            attempt: reloadKey,
            message: errorMessage,
          });
          showToast(errorMessage, 'error');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [groupId, reloadKey, showToast]);

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: description || title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('تم نسخ رابط المجموعة إلى الحافظة', 'success');
      }
    } catch (shareError) {
      console.error('Error sharing group:', shareError);
    }
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    try {
      cartManager.loadFromStorage();
      cartManager.addGroup(group);
      showToast('تمت إضافة المجموعة إلى السلة بنجاح', 'success');
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
    window.open(`https://wa.me/+963981082693?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff0f6_0%,_#fff8fb_36%,_#fff_100%)] pb-32 overflow-x-hidden" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/home" className="rounded-full bg-pink-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-primaryRose transition hover:bg-pink-100 flex-none">
            ← العودة
          </Link>
          <div className="text-center truncate px-2 flex-1">
            <h1 className="text-xs sm:text-base font-black text-deepRose truncate">{title}</h1>
          </div>
          <button
            type="button"
            onClick={handleShare}
            aria-label="مشاركة المجموعة"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-gray-600 shadow-sm transition hover:-translate-y-0.5 flex-none"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
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
              

              {activeImage?.url ? (
                <div key={activeImageIndex} className="absolute inset-10 bottom-10 sm:inset-20 sm:bottom-16">
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
                <div className="absolute inset-10 flex items-center justify-center rounded-[24px] bg-white/50 text-xs text-gray-400">
                  لا توجد صور
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
                <span className="rounded-full bg-deepRose px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs">
                  مجموعة مميزة
                </span>
                <span className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-black text-primaryRose border border-pink-200">
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
                            <span className="text-primaryRose flex-none mt-0.5">•</span>
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
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span>✓</span>
                    <span>وفّري {formatPrice(savings)} عند طلب المجموعة كاملة</span>
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
            className="flex h-11 sm:h-14 w-11 sm:w-auto flex-none items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700 transition sm:gap-2 sm:px-4 sm:text-sm sm:font-bold hover:bg-emerald-100"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
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
            className="h-11 sm:h-14 flex-1 rounded-2xl bg-deepRose px-2 text-[11px] sm:text-sm font-bold text-white shadow-md transition hover:bg-primaryRose truncate"
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
  const productId = product['id'];

  const content = (
    <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-pink-100 bg-white p-2 sm:p-2.5 min-w-0 transition hover:border-pink-200">
      <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-none overflow-hidden rounded-xl bg-white shadow-sm border border-pink-50">
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
          <span className="flex h-full items-center justify-center text-xs text-gray-400">صورة</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-xs font-bold text-textDark">{name}</h4>
        {description && <p className="mt-0.5 sm:mt-1 line-clamp-1 text-[10px] text-textMuted">{description}</p>}
      </div>
      <span className="flex-none text-[10px] sm:text-xs font-bold text-deepRose pl-1">
        {price != null ? formatPrice(price) : 'ضمن البكج'}
      </span>
    </div>
  );

  if (productId != null) {
    return (
      <Link href={`/product/${productId}`} className="block transition hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

function isGroupProduct(value: unknown): value is GroupProduct {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function imageSource(product: GroupProduct | undefined): string | null {
  if (typeof product?.['thumbnail_url'] === 'string') return product['thumbnail_url'];
  if (typeof product?.['thumbnailUrl'] === 'string') return product['thumbnailUrl'];
  return null;
}