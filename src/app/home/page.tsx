/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product, parseProductFromJson } from '@/models/product';
import { HomeService } from '@/services/home_service';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import { FilterSaveService } from '@/services/filter_save_service';
import { useToast } from '@/components/ui/toast_provider';

import OffersBannerSection from '@/app/home/sections/offers_banner_section';
import SectionsScreen from '@/app/home/sections/sections_screen';
import CollectionsSection from '@/app/home/sections/collections_section';
import NewProductsSection from '@/app/home/sections/new_products_section';
import ProductGridSection from '@/app/home/sections/product_grid_section';
import SearchSection from '@/app/home/sections/search_section';

const favoriteService = new FavoriteService();

interface CategoryItem {
  id: string;
  name?: string | Record<string, string> | null;
  image_url?: string | null;
  image_version?: number | null;
  parent_id?: string | null;
  is_active?: boolean;
}

interface OfferItem {
  id: string;
  title?: string;
  offer_type?: string;
  discount_percentage?: number;
  initial_price?: number;
  final_price?: number;
  free_product_id?: string | null;
  is_star?: boolean;
  end_date?: string | null;
  products?: Product[];
  [key: string]: unknown;
}

interface GroupItem {
  id: string;
  name?: string;
  description?: string | null;
  features?: string[] | null;
  usages?: string[] | null;
  compatibility?: string | null;
  custom_price?: number | null;
  calculated_price?: number | null;
  final_price?: number;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  products?: Product[];
  [key: string]: unknown;
}

export default function HomeClientView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productService = new ProductService();
  const cartManager = CartManager.getInstance();
  const showToast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [isSuggestedProductsLoading, setIsSuggestedProductsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [featuredOffers, setFeaturedOffers] = useState<OfferItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category_id') ? [searchParams.get('category_id')!] : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'newest');
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  const hasActiveSearchOrFilters =
    searchQuery.trim().length > 0 ||
    selectedCategories.length > 0 ||
    sortBy !== 'newest';

  // --- منطق الحماية: التحقق من تسجيل الدخول وإكمال الملف الشخصي ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const profileCompleted = localStorage.getItem('profile_completed');

      if (token && profileCompleted !== 'true') {
        router.push('/auth/complete-profile');
      }
    }
  }, [router]);

  const loadHomeData = useCallback(async (setLoading = true) => {
    if (setLoading) {
      queueMicrotask(() => {
        setIsLoading(true);
        setIsSuggestedProductsLoading(true);
      });
    }
    try {
      const homeData = await HomeService.getHomeDashboard();
      
      const cats: CategoryItem[] = Array.isArray(homeData.categories) ? homeData.categories : [];
      const newProds = (homeData.new_products || []).map((p: Record<string, unknown>) => parseProductFromJson(p));
      const prods = (homeData.products || []).map((p: Record<string, unknown>) => parseProductFromJson(p));
      const offers: OfferItem[] = Array.isArray(homeData.featured_offers) ? homeData.featured_offers : [];
      const grps: GroupItem[] = Array.isArray(homeData.groups) ? homeData.groups : [];
      const keywords = Array.isArray(homeData.trending_keywords) ? homeData.trending_keywords : [];
      const suggestedProds = (homeData.suggested_products || []).map((p: Record<string, unknown>) => parseProductFromJson(p));

      setCategories(cats);
      setNewProducts(newProds);
      setProducts(prods);
      setFeaturedOffers(offers);
      setGroups(grps);
      setTrendingKeywords(keywords);
      setSuggestedProducts(suggestedProds);
    } catch (e) {
      console.error('Error loading home data:', e);
    } finally {
      setIsLoading(false);
      setIsSuggestedProductsLoading(false);
    }
  }, []);

  const filterProducts = useCallback(async (query: string, catId: string, sort: string) => {
    queueMicrotask(() => setIsLoading(true));
    try {
      const prodsData = await productService.getProducts({
        search: query,
        categoryId: catId || undefined,
        sortBy: sort,
      });
      setProducts(prodsData.map((product) => parseProductFromJson({ ...product })));
    } catch (e) {
      console.error('Error filtering products:', e);
    } finally {
      setIsLoading(false);
    }
  }, [productService]);

  // التحميل الأولي للبيانات والمفضلة (يعمل مرة واحدة فقط عند فتح الصفحة)
  useEffect(() => {
    loadHomeData(false);
    cartManager.loadFromStorage();
    Promise.resolve()
      .then(() => {
        setRecentSearches(FilterSaveService.loadRecentSearches());
        setFavoritesMap(
          Object.fromEntries(favoriteService.getLocalFavoriteIds().map((id) => [id, true])),
        );
        return favoriteService.getFavorites();
      })
      .then((items) => {
        setFavoritesMap(Object.fromEntries(items.map((item) => [String(item.id), true])));
      })
      .catch((error) => {
        console.error('Error loading favorites:', error);
      });
  }, []);

  const handleProductSelected = (query = searchQuery) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      setRecentSearches(FilterSaveService.saveSearchQuery(normalizedQuery));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasActiveSearchOrFilters) {
        filterProducts(searchQuery, selectedCategories[0] || '', sortBy);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategories, sortBy, hasActiveSearchOrFilters, filterProducts]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'شركة زُبيدة بيوتي',
          text: 'اكتشفي أرقى منتجات التجميل والعناية المصنعة محلياً في شركة زُبيدة بيوتي',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('تم نسخ رابط المتجر بنجاح');
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    const productId = product.id;
    try {
      const result = await favoriteService.toggleFavorite(productId, product);
      setFavoritesMap((prev) => ({
        ...prev,
        [productId]: result.is_favorite,
      }));
    } catch (error) {
      console.error('Error saving favorite locally:', error);
      showToast('تعذر حفظ المنتج في المفضلة', 'error');
    }
  };

  const handleAddToCart = (product: Product) => {
    cartManager.addProduct(product);
    const prodName = product.name?.['ar'] || Object.values(product.name || {})[0] || 'المنتج';
    showToast(`تمت إضافة ${prodName} إلى السلة بنجاح`);
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      <header className="sticky top-0 z-40 bg-surfaceWhite/75 backdrop-blur-xl border-b border-white/40 px-4 py-3 mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/help/contact"
              className="text-xs sm:text-sm font-semibold text-deepRose hover:text-primaryRose transition-colors"
            >
              اتصل بنا
            </Link>
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-deepRose hover:text-primaryRose transition-colors"
            >
              حول زبيدة بيوتي
            </Link>
            <button
              onClick={handleShare}
              className="text-xs sm:text-sm font-semibold text-deepRose hover:text-primaryRose transition-colors cursor-pointer"
            >
              مشاركة
            </button>
          </div>

          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="شركة زُبيدة بيوتي"
              width={90}
              height={61}
              className="object-contain h-9 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-4">
        <SearchSection 
          categories={categories}
          selectedCategories={selectedCategories}
          activeSearchQuery={searchQuery}
          activeSortBy={sortBy}
          recentSearches={recentSearches}
          trendingKeywords={trendingKeywords} 
          suggestedProducts={suggestedProducts}
          isSuggestedProductsLoading={isSuggestedProductsLoading}
          onProductSelected={handleProductSelected}
          onCategoriesSelected={(cats) => setSelectedCategories(cats)}
          onFilterChanged={(q, _skinHairType, _size, sort, selected) => {
            setSearchQuery(q);
            setSelectedCategories(selected);
            setSortBy(sort);
          }}
        />

        {!hasActiveSearchOrFilters && (
          <>
            <OffersBannerSection offers={featuredOffers} isLoading={isLoading} />
            <SectionsScreen categories={categories} />
            <CollectionsSection groups={groups} isLoading={isLoading} />
            <NewProductsSection 
              products={newProducts} 
              isLoading={isLoading} 
              favoritesMap={favoritesMap}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleAddToCart}
            />
          </>
        )}

        <ProductGridSection 
          products={products} 
          isLoading={isLoading}
          favoritesMap={favoritesMap}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onProductSelected={() => handleProductSelected(searchQuery)}
        />
      </div>
    </main>
  );
}