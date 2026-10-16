/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface SectionsScreenProps {
  categories: any[];
  onCategoryTap?: (categoryId: string, categoryTitle: string) => void;
}

export default function SectionsScreen({ categories = [], onCategoryTap }: SectionsScreenProps) {
  if (!categories || categories.length === 0) {
    return (
      <section className="py-1">
        <div className="px-4 mb-2">
          <h2 className="text-lg font-bold text-deepRose">الأقسام</h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-[65px] h-[65px] bg-pink-100 animate-pulse rounded-full" />
              <div className="w-12 h-3 bg-pink-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-1">
      <div className="px-4 mb-2">
        <h2 className="text-lg font-bold text-deepRose">
          الأقسام
        </h2>
      </div>

      <div className="flex overflow-x-auto gap-3 px-4 pb-1 scrollbar-none">
        {categories.map((category) => {
          const categoryId = category['id']?.toString() || '';
          const nameMap = category['name'];
          const title = typeof nameMap === 'object' && nameMap !== null
            ? (nameMap['ar'] || Object.values(nameMap)[0] || 'قسم')
            : (nameMap?.toString() || 'قسم');
          const imageUrl = category['image_url'];
          const hasValidImage = imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http');

          return (
            <Link
              key={categoryId}
              href={`/home/category/${categoryId}?title=${encodeURIComponent(title)}`}
              onClick={() => onCategoryTap?.(categoryId, title)}
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div className="w-[65px] h-[65px] rounded-full border border-pink-100 overflow-hidden bg-white flex items-center justify-center group-hover:scale-105 transition duration-300 relative shadow-2xs">
                {hasValidImage ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="65px"
                    priority={false}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-deepRose font-bold text-xs">📁</span>
                )}
              </div>

              <span className="w-[68px] text-center text-textDark font-bold text-[11px] mt-1 line-clamp-1">
                {title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}