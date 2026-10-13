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
      <section className="py-2">
        <div className="px-4 mb-3">
          <h2 className="text-lg font-bold text-deepRose">الأقسام</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-[75px] h-[75px] shimmer rounded-full" />
              <div className="w-12 h-3 shimmer rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-2">
      {/* عنوان القسم    */}
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-deepRose">
          الأقسام
        </h2>
      </div>

      {/* قائمة الأقسام الأفقية الدائرية    */}
      <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-none">
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
              {/* صورة القسم الدائرية    */}
              <div className="w-[75px] h-[75px] rounded-full border-2 border-deepRose/30 shadow-md overflow-hidden bg-lightPinkBg/55 flex items-center justify-center group-hover:scale-105 transition duration-300 relative">
                {hasValidImage ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="75px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-deepRose font-bold text-sm">📁</span>
                )}
              </div>

              {/* عنوان القسم    */}
              <span className="w-[75px] text-center text-deepRose font-bold text-xs mt-1.5 line-clamp-1">
                {title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}