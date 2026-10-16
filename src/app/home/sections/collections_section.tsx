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
  const [currentIndexMap, setCurrentIndexMap] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  
  const allGroups = Array.isArray(groups) ? groups.slice(0, 5) : [];

  useEffect(() => {
    if (!allGroups.length) return;

    const rotationTimer = window.setInterval(() => {
      setIsAnimating(true);

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

      setTimeout(() => {
        setIsAnimating(false);
      }, 900);

    }, 3800);

    return () => window.clearInterval(rotationTimer);
  }, [groups]);

  if (isLoading) {
    return (
      <section className="mb-4">
        <div className="flex justify-between items-center px-4 mb-2">
          <div className="shimmer h-5 w-24 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none">
          {[1, 2].map((item) => (
            <div key={item} className="shimmer h-[175px] w-[min(78vw,310px)] flex-shrink-0 rounded-[24px]" />
          ))}
        </div>
      </section>
    );
  }

  if (!allGroups.length) return null;

  return (
    <section className="mb-4 overflow-hidden">
      <div className="flex justify-between items-center px-4 mb-2">
        <h2 className="text-lg font-bold text-deepRose">المجموعات</h2>
        <Link href="/groups" className="text-xs text-textMuted hover:text-primaryRose transition">
          عرض الكل
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-2 pt-1 scrollbar-none snap-x">
        {allGroups.map((group, index) => {
          const titleValue = group['name'];
          const title = typeof titleValue === 'object'
            ? localizedText(titleValue, 'مجموعة مميزة')
            : (typeof titleValue === 'string' ? titleValue : 'مجموعة مميزة');

          const descValue = group['description'];
          const description = typeof descValue === 'object'
            ? localizedText(descValue, '')
            : (typeof descValue === 'string' ? descValue : '');

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
              // تم إزالة الظلال الكبيرة واستبدالها بإطار أنيق ونظيف
              className="group relative flex h-[175px] w-[min(78vw,310px)] flex-none flex-col justify-between overflow-hidden rounded-[24px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/40 to-pink-100/60 p-3.5 transition duration-300 hover:border-pink-200 snap-start"
            >
              {imageUrl ? (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="310px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 backdrop-blur-[1px]" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#812C56_1px,transparent_1px)] [background-size:16px_16px]" />
              )}

              <div className="relative h-[75px] w-full z-10 flex items-end justify-center">
                <div className="relative flex items-end justify-center h-full w-full">
                  {bouquetProducts.map((prod, pIdx) => {
                    const prodImg = imageSource(prod);
                    if (!prodImg) return null;

                    let baseRotation = 'rotate-0';
                    let baseTranslate = 'translate-x-0';
                    let baseZ = 'z-20';

                    if (bouquetProducts.length === 3) {
                      if (pIdx === 0) {
                        baseRotation = '-rotate-12';
                        baseTranslate = '-translate-x-6';
                        baseZ = 'z-10';
                      } else if (pIdx === 2) {
                        baseRotation = 'rotate-12';
                        baseTranslate = 'translate-x-6';
                        baseZ = 'z-10';
                      } else {
                        baseRotation = 'rotate-0';
                        baseTranslate = 'translate-x-0';
                        baseZ = 'z-30';
                      }
                    } else if (bouquetProducts.length === 2) {
                      if (pIdx === 0) {
                        baseRotation = '-rotate-6';
                        baseTranslate = '-translate-x-3';
                        baseZ = 'z-10';
                      } else {
                        baseRotation = 'rotate-6';
                        baseTranslate = 'translate-x-3';
                        baseZ = 'z-20';
                      }
                    }

                    const animatingStyle = isAnimating
                      ? `-translate-y-4 scale-110 rotate-0 ${pIdx === 0 ? '-translate-x-2' : pIdx === 2 ? 'translate-x-2' : 'translate-y-[-6px]'}`
                      : `translate-y-0 scale-100 ${baseRotation} ${baseTranslate}`;

                    return (
                      <div
                        key={`slot-${pIdx}`}
                        className={`absolute bottom-0 h-16 w-14 rounded-xl bg-white/95 p-1 shadow-sm border border-white/80 backdrop-blur-md transition-all duration-700 ease-in-out ${baseZ} ${animatingStyle}`}
                        style={{ transformOrigin: 'bottom center' }}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
                          <Image
                            src={prodImg}
                            alt="product item"
                            fill
                            sizes="60px"
                            className="object-contain p-0.5"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-20 mt-1.5 flex flex-col bg-white/95 backdrop-blur-md rounded-xl p-2 border border-pink-100">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 px-1.5 py-0.5 text-[8.5px] font-semibold text-deepRose line-clamp-1">
                    <span>✦</span>
                    <span>{description || 'مجموعة متكاملة للعناية'}</span>
                  </span>

                  <span className="text-[9.5px] font-bold text-gray-600 bg-pink-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    {products.length} منتجات
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <h3 className="line-clamp-1 text-[12px] font-extrabold text-textDark">
                    {title}
                  </h3>

                  <span className="text-[11px] font-black text-deepRose flex-shrink-0">
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