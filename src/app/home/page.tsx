/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, parseProductFromJson } from '@/models/product';
import { HomeService } from '@/services/home_service';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import { FilterSaveService } from '@/services/filter_save_service';
import { useToast } from '@/components/ui/toast_provider';

// استدعاء الأقسام الفرعية الموجودة داخل مجلد الصفحات الرئيسي
import OffersBannerSection from '@/app/home/sections/offers_banner_section';
import SectionsScreen from '@/app/home/sections/sections_screen';
import CollectionsSection from '@/app/home/sections/collections_section';
import NewProductsSection from '@/app/home/sections/new_products_section';
import ProductGridSection from '@/app/home/sections/product_grid_section';
import SearchSection from '@/app/home/sections/search_section';

const favoriteService = new FavoriteService();

export default function HomeScreen() {
  const searchParams = useSearchParams();

  const productService = new ProductService();
  const cartManager = CartManager.getInstance();
  const showToast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [isSuggestedProductsLoading, setIsSuggestedProductsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [categories, setCategories] = useState<
    { id: string; name?: string | Record<string, string> | null }[]
  >([]);
  const [featuredOffers, setFeaturedOffers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
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

  // تحميل بيانات الـ Home عند الإطلاق الأول
  useEffect(() => {
    loadHomeData();
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

  useEffect(() => {
    let isActive = true;

    const loadSuggestedProducts = async () => {
      try {
        const popularProducts = await new ProductService().getProducts({
          sortBy: 'popular',
          limit: 3,
        });
        const parsedProducts = popularProducts.map((product) =>
          parseProductFromJson({ ...product }),
        );

        if (isActive) setSuggestedProducts(parsedProducts);
      } catch (error) {
        console.error('Error loading popular products:', error);
      } finally {
        if (isActive) setIsSuggestedProductsLoading(false);
      }
    };

    void loadSuggestedProducts();
    return () => {
      isActive = false;
    };
  }, []);

  const loadHomeData = async () => {
    setIsLoading(true);
    try {
      const homeData = await HomeService.getHomeDashboard();
      
      const cats: any[] = Array.isArray(homeData.categories) ? homeData.categories : [];
      const newProds = (homeData.new_products || []).map((p: any) => parseProductFromJson(p));
      const prods = (homeData.products || []).map((p: any) => parseProductFromJson(p));
      const offers = Array.isArray(homeData.featured_offers) ? homeData.featured_offers : [];
      const grps = Array.isArray(homeData.groups) ? homeData.groups : [];

      setCategories(cats);
      setNewProducts(newProds);
      setProducts(prods);
      setFeaturedOffers(offers);
      setGroups(grps);
    } catch (e) {
      console.error('❌ Error loading home data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // فلترة المنتجات عند البحث أو تغيير الفئات
  const filterProducts = async (query: string, catId: string, sort: string) => {
    setIsLoading(true);
    try {
      const prodsData = await productService.getProducts({
        search: query,
        categoryId: catId || undefined,
        sortBy: sort,
      });
      setProducts(prodsData.map((product) => parseProductFromJson({ ...product })));
    } catch (e) {
      console.error('❌ Error filtering products:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelected = (query = searchQuery) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      setRecentSearches(FilterSaveService.saveSearchQuery(normalizedQuery));
    }
  };

  // التعامل مع تغيير الفلاتر أو البحث (مع Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasActiveSearchOrFilters) {
        filterProducts(searchQuery, selectedCategories[0] || '', sortBy);
      } else {
        loadHomeData();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategories, sortBy]);

  // تبديل المفضلة
  const handleToggleFavorite = async (product: Product) => {
    const productId = product.id;
    try {
      const result = await favoriteService.toggleFavorite(productId, product);
      setFavoritesMap((prev) => ({
        ...prev,
        [productId]: result.is_favorite,
      }));
      if (result.syncError) {
        console.error('Error syncing favorites:', result.syncError);
        showToast('تم حفظ المفضلة محلياً، وتعذرت مزامنتها مع الحساب', 'error');
      }
    } catch (error) {
      console.error('Error saving favorite locally:', error);
      showToast('تعذر حفظ المنتج في المفضلة', 'error');
    }
  };

  // إضافة للسلة
  const handleAddToCart = (product: Product) => {
    cartManager.addProduct(product);
    const prodName = product.name?.['ar'] || Object.values(product.name || {})[0] || 'المنتج';
    showToast(`تمت إضافة ${prodName} إلى السلة بنجاح`);
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* شريط الأنفبار العلوي */}
      <header className="sticky top-0 z-40 bg-surfaceWhite/80 backdrop-blur-md border-b border-pink-100 px-4 py-4 mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <h1 className="text-xl font-bold text-deepRose">Zubaida Beauty</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* شريط البحث المتقدم */}
        <SearchSection 
          categories={categories}
          selectedCategories={selectedCategories}
          activeSearchQuery={searchQuery}
          activeSortBy={sortBy}
          recentSearches={recentSearches}
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