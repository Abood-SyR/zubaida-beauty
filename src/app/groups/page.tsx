'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import lottie from 'lottie-web';
import { ProductService } from '@/services/product_service';
import { useToast } from '@/components/ui/toast_provider';
import nothingAnimation from '@/assets/nothing.json';
import searchingAnimation from '@/assets/Searching.json';

type GroupData = Record<string, unknown>;

function isGroupData(value: unknown): value is GroupData {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function localizedText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value || fallback;
  if (isGroupData(value)) {
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

export async function generateMetadata() {
  return {
    title: 'مجموعات العناية - زُبيدة بيوتي',
    description: 'تصفحي أحدث مجموعات العناية والتجميل المتكاملة في متجر زُبيدة بيوتي',
    openGraph: {
      title: 'مجموعات العناية - زُبيدة بيوتي',
      description: 'تصفحي أحدث مجموعات العناية والتجميل المتكاملة في متجر زُبيدة بيوتي',
      url: 'https://zubaidabeauty.com/groups',
      images: [{ url: '/images.jpg' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'مجموعات العناية - زُبيدة بيوتي',
      description: 'تصفحي أحدث مجموعات العناية والتجميل المتكاملة في متجر زُبيدة بيوتي',
      images: ['/images.jpg'],
    },
  };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const showToast = useToast();
  const emptyContainerRef = useRef<HTMLDivElement>(null);
  const searchingContainerRef = useRef<HTMLDivElement>(null);

  // تشغيل انيميشن البحث عند التحميل
  useEffect(() => {
    if (isLoading && searchingContainerRef.current) {
      const anim = lottie.loadAnimation({
        container: searchingContainerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: searchingAnimation,
      });

      return () => {
        anim.destroy();
      };
    }
  }, [isLoading]);

  // تشغيل انيميشن عدم وجود المجموعات عند الخطأ أو الفراغ
  useEffect(() => {
    if ((error || groups.length === 0) && !isLoading && emptyContainerRef.current) {
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
  }, [error, groups.length, isLoading]);

  useEffect(() => {
    let isCurrent = true;

    ProductService.getGroups()
      .then((data) => {
        if (isCurrent) {
          setGroups(data);
          setIsLoading(false);
        }
      })
      .catch((fetchError: unknown) => {
        if (isCurrent) {
          setError(fetchError instanceof Error
            ? fetchError.message
            : 'تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.');
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'مجموعات العناية - زُبيدة بيوتي',
          text: 'تصفحي أحدث مجموعات العناية والتجميل في متجر زُبيدة بيوتي',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('تم نسخ رابط الصفحة إلى الحافظة', 'success');
      }
    } catch (shareError) {
      console.error('Error sharing page:', shareError);
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg px-4 py-8 sm:py-10" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
          <Link href="/home" className="rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-bold text-primaryRose shadow-sm transition hover:bg-pink-50 cursor-pointer">
            ← الصفحة الرئيسية
          </Link>
          <h1 className="text-base sm:text-xl font-black text-deepRose truncate">مجموعات العناية</h1>
          <button
            type="button"
            onClick={handleShare}
            aria-label="مشاركة الصفحة"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-gray-600 shadow-sm transition hover:-translate-y-0.5 cursor-pointer flex-none"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </header>

        {isLoading ? (
          <div className="mx-auto max-w-full w-full m-0 bg-lightPinkBg p-8 text-center flex flex-col items-center">
            <div ref={searchingContainerRef} className="w-70 h-70 sm:w-60 sm:h-60 mb-2" />
          </div>
        ) : error || groups.length === 0 ? (
          <section className="mx-auto max-w-md w-full rounded-[32px] bg-lightPinkBg p-8 text-center flex flex-col items-center">
            <div ref={emptyContainerRef} className="w-64 h-64 sm:w-82 sm:h-82 mb-2" />
            <h2 className="text-lg font-black text-textDark">
              {error ? 'لم نتمكن من تحميل المجموعات' : 'لا توجد مجموعات متاحة حالياً'}
            </h2>
            {/* <p className="mt-2 text-sm leading-7 text-textMuted">{error || 'يرجى التحقق لاحقاً لمعاينة أحدث المجموعات والعروض.'}</p> */}
            
            <div className="mt-6 flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsLoading(true);
                  setReloadKey((current) => current + 1);
                }}
                className="flex-1 rounded-2xl bg-deepRose py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:bg-primaryRose cursor-pointer"
              >
                إعادة المحاولة
              </button>
              <Link 
                href="/home" 
                className="flex-1 rounded-2xl border border-pink-200 bg-pink-50 py-3 text-xs sm:text-sm font-bold text-primaryRose transition hover:bg-pink-100 text-center"
              >
                الصفحة الرئيسية
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {groups.map((group, index) => {
              const groupId = typeof group['id'] === 'string' ? group['id'] : '';
              const title = localizedText(group['name'], 'مجموعة مميزة');
              const description = localizedText(group['description']);
              const imageUrl = typeof group['image_url'] === 'string' ? group['image_url'] : null;
              const products = Array.isArray(group['products']) ? group['products'].filter(isGroupData) : [];
              const price = numberValue(group['final_price']) ?? numberValue(group['calculated_price']);

              return (
                <Link
                  key={groupId || index}
                  href={groupId ? `/groups/${groupId}` : '/groups'}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-xs transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div className="relative h-36 sm:h-40 w-full bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-4xl" aria-hidden="true">🎁</span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h2 className="text-xs sm:text-sm font-bold text-textDark line-clamp-1 flex-1">{title}</h2>
                        {price != null && (
                          <span className="flex-none text-[11px] sm:text-xs font-black text-deepRose">{formatPrice(price)}</span>
                        )}
                      </div>
                      {description && (
                        <p className="text-[10px] sm:text-xs text-textMuted line-clamp-1 leading-normal">{description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-pink-50">
                      <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-primaryRose">
                        {products.length} منتجات
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-primaryRose group-hover:underline">
                        التفاصيل ←
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}