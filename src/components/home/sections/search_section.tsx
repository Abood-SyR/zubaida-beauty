/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getProductName, Product } from '@/models/product';
import { useRouter } from 'next/navigation';

interface SearchSectionProps {
  categories: any[];
  selectedCategories: string[];
  trendingKeywords?: string[]; // <-- إضافة استقبال الكلمات الرائجة
  suggestedProducts?: Product[]; // <-- إضافة استقبال المنتجات المقترحة للبحث
  isSuggestedProductsLoading?: boolean;
  onProductSelected?: (query?: string) => void;
  onCategoriesSelected: (categories: string[]) => void;
  onFilterChanged: (
    query: string,
    skinHairType: string | null,
    size: string | null,
    sortBy: string,
    categories: string[]
  ) => void;
}

export default function SearchSection({
  categories = [],
  selectedCategories = [],
  trendingKeywords = ['كرياتين', 'كريم تسبيل', 'واقي شمسي', 'لاكتولاك'],
  suggestedProducts = [],
  isSuggestedProductsLoading = false,
  onProductSelected,
  onCategoriesSelected,
  onFilterChanged,
}: SearchSectionProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [recentSearches, setRecentSearches] = useState<string[]>(['كرياتين', 'واقي شمسي']);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChanged(value, null, null, sortBy, selectedCategories);
  };

  const handleExecuteSearch = (query: string) => {
    setSearchQuery(query);
    onFilterChanged(query, null, null, sortBy, selectedCategories);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)]);
    }
    onProductSelected?.(query);
    setIsExpanded(false);
  };

  const handleToggleCategory = (catId: string | null) => {
    let updated: string[];
    if (catId === null) {
      updated = [];
    } else {
      if (selectedCategories.includes(catId)) {
        updated = selectedCategories.filter((id) => id !== catId);
      } else {
        updated = [...selectedCategories, catId];
      }
    }
    onCategoriesSelected(updated);
    onFilterChanged(searchQuery, null, null, sortBy, updated);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    onFilterChanged(searchQuery, null, null, sort, selectedCategories);
  };

  return (
    <div
      className={`w-full transition-all duration-300 bg-surfaceWhite z-50 ${
        isExpanded
          ? 'fixed inset-0 overflow-y-auto p-4 bg-white'
          : 'rounded-2xl shadow-sm border border-pink-100 p-2.5'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-lightPinkBg/50 rounded-xl px-3 py-2 border border-pink-200">
          <span className="text-primaryRose ml-2">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ابحثي عن منتجات التجميل، العناية، الشعر..."
            className="w-full bg-transparent text-textDark text-sm focus:outline-none"
          />
        </div>
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-deepRose font-bold px-3 py-2 text-sm"
          >
            إغلاق
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6 pb-12">
          {/* ترتيب المنتجات */}
          <div>
            <h3 className="font-bold text-sm text-deepRose mb-3">ترتيب المنتجات</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'newest', label: 'الأحدث' },
                { id: 'price_desc', label: 'الأعلى سعراً' },
                { id: 'price_asc', label: 'الأقل سعراً' },
                { id: 'popular', label: 'الأكثر مبيعاً' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSortChange(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                    sortBy === item.id ? 'bg-primaryRose text-white' : 'bg-lightPinkBg text-textDark'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* التصفية حسب الفئات */}
          <div>
            <h3 className="font-bold text-sm text-deepRose mb-3">التصفية حسب الفئات</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleToggleCategory(null)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                  selectedCategories.length === 0 ? 'bg-primaryRose text-white' : 'bg-lightPinkBg text-textDark'
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const catName = cat.name?.['ar'] || cat.name || 'قسم';
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                      isSelected ? 'bg-primaryRose text-white' : 'bg-lightPinkBg text-textDark'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* كلمات شائعة (مستمدة من جدول الكلمات الرائجة trending_keywords) */}
          <div>
            <h3 className="font-bold text-sm text-deepRose mb-3">كلمات شائعة</h3>
            <div className="flex flex-wrap gap-2">
              {trendingKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExecuteSearch(kw)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-lightPinkBg text-textDark hover:bg-pink-200 transition"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* المنتجات المقترحة للبحث */}
          <div>
            <h3 className="font-bold text-sm text-deepRose mb-3">منتجات رائجة لك</h3>
            {isSuggestedProductsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-xl bg-lightPinkBg" />
                ))}
              </div>
            ) : suggestedProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {suggestedProducts.slice(0, 3).map((product) => {
                  const productName = getProductName(product, 'ar') || 'منتج';
                  const imageUrl = product.thumbnailUrl;
                  const displayPrice = product.discountedPrice ?? product.price;

                  return (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => {
                        setIsExpanded(false);
                        onProductSelected?.();
                        router.push(`/product/${product.id}`);
                      }}
                      className="min-w-0 overflow-hidden rounded-xl border border-pink-100 bg-white text-right transition hover:border-primaryRose"
                    >
                      {imageUrl && imageUrl.startsWith('http') ? (
                        <div className="relative aspect-[4/3] w-full bg-white">
                          <Image
                            src={imageUrl}
                            alt={productName}
                            fill
                            sizes="(max-width: 640px) 30vw, 180px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-lightPinkBg text-xs text-textMuted">
                          صورة غير متوفرة
                        </div>
                      )}
                      <span className="block truncate px-2 pt-2 text-xs font-semibold text-textDark">
                        {productName}
                      </span>
                      <span className="block px-2 pb-2 pt-1 text-xs font-bold text-deepRose">
                        {Number(displayPrice || 0).toLocaleString('ar-SY')} ل.س
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-textMuted">لا توجد منتجات رائجة حالياً</p>
            )}
          </div>

          {/* عمليات البحث الأخيرة */}
          {recentSearches.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-deepRose mb-3">عمليات البحث الأخيرة</h3>
              <div className="space-y-2">
                {recentSearches.map((search, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleExecuteSearch(search)}
                    className="flex items-center gap-2 text-sm text-textDark cursor-pointer py-1 hover:text-primaryRose"
                  >
                    <span>🕒</span>
                    <span>{search}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}