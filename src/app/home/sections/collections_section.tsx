/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type GroupData = Record<string, unknown>;
type ProductItem = Record<string, unknown>;

interface CollectionsSectionProps {
  groups: GroupData[];
  isLoading?: boolean;
}

export default function CollectionsSection({ groups, isLoading }: CollectionsSectionProps) {
  const [pulse, setPulse] = useState(false);
  const [currentIndexMap, setCurrentIndexMap] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  
  // عرض أول 5 مجموعات فقط في القسم الرئيسي
  const allGroups = Array.isArray(groups) ? groups.slice(0, 5) : [];

  useEffect(() => {
    const timer = window.setInterval(() => setPulse((current) => !current), 1100);
    return () => window.clearInterval(timer);
  }, []);

  // أنيميشن متقدم: ارتفاع وتكبير الـ div الخاص بالمنتجات، تبديل الأماكن بالتساوي، ثم العودة
  useEffect(() => {
    if (!allGroups.length) return;

    const rotationTimer = window.setInterval(() => {
      // 1. ارتفاع وتكبير الـ div للأعلى
      setIsAnimating(true);

      // 2. تبديل أماكن المنتجات في المنتصف
      setTimeout(() => {
        setCurrentIndexMap((prev) => {
          const nextMap: Record<string, number> = {};
          allGroups.forEach((group, index) => {
            const groupId = group['id'] == null ? `group_${index}` : String(group['id']);
            const products = Array.isArray(group['products']) ? group['products'].filter(isProduct) : [];
            if (products.length > 1) {
              const current = prev[groupId] || 0;
              nextMap[groupId] = (current + 1) % products.length;
            } else {
              nextMap[groupId] = 0;
            }
          });
          return nextMap;
        });
      }, 450);

      // 3. عودة الـ div لوضعيته الطبيعية
      setTimeout(() => {
        setIsAnimating(false);
      }, 900);

    }, 3800);

    return () => window.clearInterval(rotationTimer);
  }, [groups]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex justify-between items-center px-4 mb-3">
          <div className="shimmer h-5 w-24 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none">
          {[1, 2].map((item) => (
            <div key={item} className="shimmer h-[210px] w-[min(85vw,340px)] flex-shrink-0 rounded-3xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!allGroups.length) return null;

  return (
    <section className="mb-8 overflow-hidden">
      {/* عنوان القسم */}
      <div className="flex justify-between items-center px-4 mb-3">
        <h2 className="text-lg font-bold text-deepRose">المجموعات</h2>
        <Link href="/groups" className="text-xs text-textMuted hover:text-primaryRose transition">
          عرض الكل
        </Link>
      </div>

      {/* قائمة البطاقات الأفقية */}
      <div className="flex overflow-x-auto gap-5 px-4 pb-4 pt-2 scrollbar-none">
        {allGroups.map((group, index) => {
          const titleValue = group['name'];
          const title = typeof titleValue === 'object'
            ? localizedText(titleValue, 'مجموعة مميزة')
            : (typeof titleValue === 'string' ? titleValue : 'مجموعة مميزة');

          const finalPrice = numberValue(group['final_price']) ?? numberValue(group['calculated_price']) ?? 0;
          const imageUrl = typeof group['image_url'] === 'string' ? group['image_url'] : null;
          const products = Array.isArray(group['products']) ? group['products'].filter(isProduct) : [];
          const groupId = group['id'] == null ? `group_${index}` : String(group['id']);

          const offset = currentIndexMap[groupId] || 0;
          const rotatedProducts = products.length > 0 
            ? [...products.slice(offset), ...products.slice(0, offset)]
            : [];
          const bouquetProducts = rotatedProducts.slice(0, 3);

          return (
            <Link
              key={groupId}
              href={`/groups/${groupId}`}
              className="group relative flex h-[210px] w-[min(85vw,340px)] flex-none flex-col justify-between overflow-hidden rounded-[28px] border-2 border-pink-100/80 bg-gradient-to-br from-white via-pink-50/40 to-pink-100/60 p-4 shadow-[0_12px_30px_rgba(129,44,86,0.12)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(129,44,86,0.22)]"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              {/* خلفية صورة المجموعة */}
              {imageUrl ? (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="340px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 backdrop-blur-[1px]" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#812C56_1px,transparent_1px)] [background-size:16px_16px]" />
              )}

              {/* حاوية باقة الورد مع تأثير حركة الـ div بالكامل */}
              <div className="relative h-[95px] w-full z-10 flex items-end justify-center">
                <div className="relative flex items-end justify-center h-full w-full">
                  {bouquetProducts.map((prod, pIdx) => {
                    const prodImg = imageSource(prod);
                    if (!prodImg) return null;

                    // توضعات وتوزيعات باقة الورد الأساسية
                    let baseRotation = 'rotate-0';
                    let baseTranslate = 'translate-x-0';
                    let baseZ = 'z-20';

                    if (bouquetProducts.length === 3) {
                      if (pIdx === 0) {
                        baseRotation = '-rotate-12';
                        baseTranslate = '-translate-x-7';
                        baseZ = 'z-10';
                      } else if (pIdx === 2) {
                        baseRotation = 'rotate-12';
                        baseTranslate = 'translate-x-7';
                        baseZ = 'z-10';
                      } else {
                        baseRotation = 'rotate-0';
                        baseTranslate = 'translate-x-0';
                        baseZ = 'z-30';
                      }
                    } else if (bouquetProducts.length === 2) {
                      if (pIdx === 0) {
                        baseRotation = '-rotate-6';
                        baseTranslate = '-translate-x-4';
                        baseZ = 'z-10';
                      } else {
                        baseRotation = 'rotate-6';
                        baseTranslate = 'translate-x-4';
                        baseZ = 'z-20';
                      }
                    }

                    // تطبيق حركة ارتفاع الـ div للأعلى، التكبير، والتوزيع بالتساوي أثناء التحريك
                    const animatingStyle = isAnimating
                      ? `-translate-y-6 scale-110 rotate-0 ${pIdx === 0 ? '-translate-x-3' : pIdx === 2 ? 'translate-x-3' : 'translate-y-[-8px]'}`
                      : `translate-y-0 scale-100 ${baseRotation} ${baseTranslate}`;

                    return (
                      <div
                        key={`slot-${pIdx}`}
                        className={`absolute bottom-0 h-20 w-16 rounded-2xl bg-white/95 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.25)] border border-white/80 backdrop-blur-md transition-all duration-700 ease-in-out ${baseZ} ${animatingStyle}`}
                        style={{ transformOrigin: 'bottom center' }}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-xl bg-white">
                          <Image
                            src={prodImg}
                            alt="product item"
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* تفاصيل المجموعة والأسعار في الأسفل */}
              <div className="relative z-20 mt-2 flex flex-col bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-pink-100 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md bg-deepRose px-2 py-0.5 text-[9px] font-bold text-white shadow-xs transition-transform duration-1000 ${
                      pulse ? 'scale-105' : 'scale-100'
                    }`}
                  >
                    <span>✦</span>
                    <span>مجموعة متكاملة</span>
                  </span>

                  <span className="text-[10px] font-bold text-gray-600 bg-pink-50 px-2 py-0.5 rounded-md">
                    {products.length} منتجات
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <h3 className="line-clamp-1 text-[13px] font-extrabold text-textDark">
                    {title}
                  </h3>

                  <span className="text-[12px] font-black text-deepRose flex-shrink-0">
                    {finalPrice.toLocaleString('ar-SY')} ل.س
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function imageSource(product: ProductItem): string | null {
  if (typeof product['thumbnail_url'] === 'string') return product['thumbnail_url'];
  if (typeof product['thumbnailUrl'] === 'string') return product['thumbnailUrl'];
  return null;
}

function isProduct(value: unknown): value is ProductItem {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function localizedText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value) return value;
  if (isProduct(value)) {
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