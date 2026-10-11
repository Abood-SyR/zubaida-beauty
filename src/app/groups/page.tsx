'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductService } from '@/services/product_service';

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

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

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

  return (
    <main className="min-h-screen bg-lightPinkBg px-4 py-8 sm:py-12" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/home" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-primaryRose shadow-sm transition hover:bg-pink-50">
            ← العودة للمتجر
          </Link>
          <h1 className="text-xl font-black text-deepRose sm:text-2xl">مجموعات العناية</h1>
          <Link href="/cart" aria-label="سلة المشتريات" className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-lg shadow-sm">
            🛍️
          </Link>
        </header>

        {isLoading ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-sm font-semibold text-textMuted shadow-sm">
            جاري تحميل المجموعات...
          </div>
        ) : error ? (
          <section className="mx-auto max-w-lg rounded-[28px] border border-pink-100 bg-white p-8 text-center shadow-lg">
            <h2 className="text-lg font-black text-textDark">لم نتمكن من تحميل المجموعات</h2>
            <p className="mt-2 text-sm leading-7 text-textMuted">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setIsLoading(true);
                setReloadKey((current) => current + 1);
              }}
              className="mt-5 rounded-2xl bg-deepRose px-6 py-3 text-sm font-bold text-white transition hover:bg-primaryRose"
            >
              إعادة المحاولة
            </button>
          </section>
        ) : groups.length === 0 ? (
          <p className="rounded-[28px] bg-white p-8 text-center text-sm font-semibold text-textMuted shadow-sm">
            لا توجد مجموعات متاحة حالياً.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group overflow-hidden rounded-[28px] border border-pink-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-56 bg-gradient-to-br from-pink-100 to-rose-50">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-7xl" aria-hidden="true">🎁</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-black text-textDark">{title}</h2>
                      {price != null && (
                        <span className="flex-none text-sm font-black text-deepRose">{formatPrice(price)}</span>
                      )}
                    </div>
                    {description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-textMuted">{description}</p>}
                    <span className="mt-4 inline-block rounded-full bg-pink-50 px-3 py-1.5 text-xs font-bold text-primaryRose">
                      {products.length} منتجات
                    </span>
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
