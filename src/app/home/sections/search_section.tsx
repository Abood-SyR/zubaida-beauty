'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getProductName, Product } from '@/models/product';

interface SearchCategory {
  id: string;
  name?: string | Record<string, string> | null;
}

interface SearchSectionProps {
  categories: SearchCategory[];
  selectedCategories: string[];
  activeSearchQuery: string;
  activeSortBy: string;
  recentSearches: string[];
  trendingKeywords?: string[];
  suggestedProducts?: Product[]; // <-- المنتجات المقترحة القادمة من الـ Home Dashboard
  isSuggestedProductsLoading?: boolean;
  onProductSelected: (query?: string) => void;
  onCategoriesSelected: (categories: string[]) => void;
  onFilterChanged: (
    query: string,
    skinHairType: string | null,
    size: string | null,
    sortBy: string,
    categories: string[]
  ) => void;
}

type SearchIconName = 'search' | 'tune' | 'close' | 'check' | 'history';

function SearchIcon({ name, className = 'h-5 w-5' }: { name: SearchIconName; className?: string }) {
  const paths: Record<SearchIconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    tune: (
      <>
        <path d="M4 7h9" />
        <path d="M17 7h3" />
        <circle cx="15" cy="7" r="2" />
        <path d="M4 17h3" />
        <path d="M11 17h9" />
        <circle cx="9" cy="17" r="2" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    check: <path d="m5 12 4 4L19 6" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function SearchSection({
  categories = [],
  selectedCategories = [],
  activeSearchQuery,
  activeSortBy,
  recentSearches,
  trendingKeywords = ['كرياتين', 'كريم تسبيل', 'واقي شمسي', 'لاكتولاك'],
  suggestedProducts = [], // <-- استقبال المنتجات المقترحة المدارة
  isSuggestedProductsLoading = false,
  onProductSelected,
  onCategoriesSelected,
  onFilterChanged,
}: SearchSectionProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(activeSearchQuery);
  const [sortBy, setSortBy] = useState(activeSortBy);

  const hasActiveFilters =
    activeSearchQuery.trim().length > 0 ||
    activeSortBy !== 'newest' ||
    selectedCategories.length > 0;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChanged(value, null, null, sortBy, selectedCategories);
    if (value.length > 0) setIsExpanded(false);
  };

  const handleExecuteSearch = (query: string) => {
    setSearchQuery(query);
    onFilterChanged(query, null, null, sortBy, selectedCategories);
    onProductSelected(query);
    setIsExpanded(false);
  };

  const handleToggleCategory = (catId: string | null) => {
    let updated: string[];
    if (catId === null) {
      updated = [];
    } else if (selectedCategories.includes(catId)) {
      updated = selectedCategories.filter((id) => id !== catId);
    } else {
      updated = [...selectedCategories, catId];
    }
    onCategoriesSelected(updated);
    onFilterChanged(searchQuery, null, null, sortBy, updated);
    setIsExpanded(false);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    onFilterChanged(searchQuery, null, null, sort, selectedCategories);
    setIsExpanded(false);
  };

  return (
    <div className={`relative w-full ${isExpanded ? 'z-50' : 'z-10'}`}>
      <div
        className={`rounded-2xl border p-2.5 transition-[max-height,box-shadow] duration-300 ease-in-out ${
          isExpanded
            ? 'absolute inset-x-0 top-0 z-50 max-h-[calc(100dvh-8rem)] overflow-hidden border-pink-100 bg-surfaceWhite shadow-xl'
            : hasActiveFilters
              ? 'relative border-pink-100 bg-surfaceWhite shadow-sm'
              : 'relative max-h-[65px] overflow-hidden border-pink-100 bg-surfaceWhite shadow-sm'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-pink-200 bg-lightPinkBg/50 px-3 py-2">
          <SearchIcon name="search" className="ml-2 h-5 w-5 shrink-0 text-primaryRose" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsExpanded(true)}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleExecuteSearch(searchQuery);
            }}
            placeholder="ابحثي عن منتجات التجميل، العناية، الشعر..."
            className="w-full bg-transparent text-sm text-textDark focus:outline-none"
          />
          {isExpanded ? (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="إغلاق خيارات البحث"
              className="mr-2 shrink-0 text-deepRose"
            >
              <SearchIcon name="close" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="إظهار خيارات البحث"
              onClick={() => setIsExpanded(true)}
              className="mr-2 shrink-0 text-primaryRose"
            >
              <SearchIcon name="tune" />
            </button>
          )}
        </div>

        {!isExpanded && hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-3">
            {activeSortBy !== 'newest' && (
              <button
                type="button"
                onClick={() => handleSortChange('newest')}
                className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-medium text-deepRose"
              >
                {activeSortBy === 'popular'
                  ? 'الأكثر مبيعاً'
                  : activeSortBy === 'price_desc'
                    ? 'الأعلى سعراً'
                    : 'الأقل سعراً'}
                <SearchIcon name="close" className="h-3.5 w-3.5" />
              </button>
            )}
            {selectedCategories.map((categoryId) => {
              const category = categories.find((item) => item.id === categoryId);
              const categoryName =
                typeof category?.name === 'string'
                  ? category.name
                  : category?.name?.['ar'] || 'قسم';
              return (
                <button
                  type="button"
                  key={categoryId}
                  onClick={() => handleToggleCategory(categoryId)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-medium text-deepRose"
                >
                  {categoryName}
                  <SearchIcon name="close" className="h-3.5 w-3.5" />
                </button>
              );
            })}
            {activeSearchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onFilterChanged('', null, null, sortBy, selectedCategories);
                }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-medium text-deepRose"
              >
                <span className="truncate">{activeSearchQuery}</span>
                <SearchIcon name="close" className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="mt-5 max-h-[calc(100dvh-13rem)] space-y-5 overflow-y-auto pb-5">
            <div>
              <h3 className="mb-3 text-sm font-bold text-deepRose">ترتيب المنتجات</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'newest', label: 'الأحدث' },
                  { id: 'price_desc', label: 'الأعلى سعراً' },
                  { id: 'price_asc', label: 'الأقل سعراً' },
                  { id: 'popular', label: 'الأكثر مبيعاً' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSortChange(item.id)}
                    className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                      sortBy === item.id ? 'bg-primaryRose text-white' : 'bg-lightPinkBg text-textDark'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-deepRose">التصفية حسب الفئات</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCategory(null)}
                  className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                    selectedCategories.length === 0
                      ? 'bg-primaryRose text-white'
                      : 'bg-lightPinkBg text-textDark'
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  const catName =
                    typeof cat.name === 'string' ? cat.name : cat.name?.['ar'] || 'قسم';
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                        isSelected ? 'bg-primaryRose text-white' : 'bg-lightPinkBg text-textDark'
                      }`}
                    >
                      {catName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-deepRose">كلمات شائعة</h3>
              <div className="flex flex-wrap gap-2">
                {trendingKeywords.map((keyword) => (
                  <button
                    type="button"
                    key={keyword}
                    onClick={() => handleExecuteSearch(keyword)}
                    className="rounded-xl bg-lightPinkBg px-4 py-2 text-xs font-medium text-textDark transition hover:bg-pink-200"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-deepRose">عمليات البحث الأخيرة</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      type="button"
                      key={search}
                      onClick={() => handleExecuteSearch(search)}
                      className="flex items-center gap-2 rounded-full bg-lightPinkBg px-3 py-2 text-right text-sm text-textDark hover:text-primaryRose"
                    >
                      <SearchIcon name="history" className="h-4 w-4 text-textMuted" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-bold text-deepRose">منتجات رائجة لك</h3>
              {isSuggestedProductsLoading ? (
                <div className="grid grid-cols-3 gap-2" aria-label="جارٍ تحميل المنتجات الرائجة">
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
                          onProductSelected();
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
          </div>
        )}
      </div>
    </div>
  );
}