'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import lottie from 'lottie-web';
import { WholesaleCatalogProduct } from '@/models/product';
import { ProductService } from '@/services/product_service';
import nothingAnimation from '@/assets/nothing.json';

type CatalogCategory = 'all' | 'body' | 'skin' | 'hair';

const categories: { id: CatalogCategory; label: string; subtitle: string }[] = [
  { id: 'all', label: 'الكل', subtitle: 'جميع منتجات المتجر' },
  { id: 'body', label: 'الجسم', subtitle: 'عناية وترطيب الجسم' },
  { id: 'skin', label: 'البشرة', subtitle: 'منتجات العناية بالبشرة' },
  { id: 'hair', label: 'الشعر', subtitle: 'عناية وجمال الشعر' },
];

function getLocalizedText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value.map(getLocalizedText).filter(Boolean).join('، ');
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const localized = record['ar'] ?? record['en'] ?? Object.values(record).find((item) => item != null);
    return getLocalizedText(localized);
  }
  return '';
}

function getCategoryLabel(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === 'body' || normalized === 'جسم') return 'الجسم';
  if (normalized === 'skin' || normalized === 'بشرة') return 'البشرة';
  if (normalized === 'hair' || normalized === 'شعر') return 'الشعر';
  return value;
}

function getProductSearchText(product: WholesaleCatalogProduct): string {
  return [
    getLocalizedText(product.name),
    getLocalizedText(product.description),
    getLocalizedText(product.ingredients),
    getLocalizedText(product.usageInstructions),
    getLocalizedText(product.compatibility),
  ].join(' ').toLocaleLowerCase('ar');
}

function ProductCard({ product, onClick }: { product: WholesaleCatalogProduct; onClick: () => void }) {
  const name = getLocalizedText(product.name) || 'منتج زبيدة بيوتي';
  const description = getLocalizedText(product.description);
  
  // تحويل روابط الصور إلى AVIF أو التعامل معها عبر Next.js Image Optimization
  let imageUrl = product.thumbnailUrl || product.images?.[0] || '';
  if (imageUrl.includes('.jpeg') || imageUrl.includes('.jpg')) {
    // محاولة تحويل الصيغة إن أمكن أو الاعتماد على Next.js في تحسينها تلقائياً
    imageUrl = imageUrl;
  }
  
  const hasValidImage = imageUrl.startsWith('http') || imageUrl.startsWith('/');
  const sizeText = product.sizes?.filter(Boolean).join('، ');
  const skinHairTypeText = product.skinHairType?.map(getCategoryLabel).join('، ');

  return (
    <article
      onClick={onClick}
      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
    >
      <div>
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-pink-50/50 to-white">
          {hasValidImage ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-4 transition duration-300 hover:scale-105"
              quality={80} // تحسين وضغط الصورة بأعلى كفاءة
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-medium text-textMuted">
              صورة المنتج غير متوفرة
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h2 className="text-sm font-bold leading-6 text-textDark line-clamp-1">{name}</h2>
          
          {description && (
            <p className="text-xs leading-5 text-textMuted line-clamp-2">{description}</p>
          )}

          {(sizeText || skinHairTypeText) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {sizeText && (
                <span className="rounded-md bg-lightPinkBg px-2 py-0.5 text-[10px] font-semibold text-deepRose">
                  الحجم: {sizeText}
                </span>
              )}
              {skinHairTypeText && (
                <span className="rounded-md bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-primaryRose">
                  مناسب لـ: {skinHairTypeText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-pink-50 bg-lightPinkBg/30 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold text-textMuted">سعر الجملة</span>
        <span className="text-sm font-black text-deepRose">
          {product.wholesalePrice.toLocaleString('ar-SY')} <span className="text-[11px] font-bold">ل.س</span>
        </span>
      </div>
    </article>
  );
}

// كاش محلي لتجنب إعادة طلب نفس البيانات وتحقيق Optimization عالي
const catalogCache = new Map<string, WholesaleCatalogProduct[]>();

export default function PricingPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>('all');
  const [products, setProducts] = useState<WholesaleCatalogProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  const emptyContainerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('ar');
    if (!query) return products;
    return products.filter((product) => getProductSearchText(product).includes(query));
  }, [products, searchQuery]);

  useEffect(() => {
    if (!isLoading && filteredProducts.length === 0 && emptyContainerRef.current) {
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
  }, [isLoading, filteredProducts.length]);

  useEffect(() => {
    let isActive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    const fetchCatalogData = async () => {
      const productService = new ProductService();
      try {
        if (catalogCache.has(selectedCategory) && reloadVersion === 0) {
          if (isActive) {
            setProducts(catalogCache.get(selectedCategory)!);
            setIsLoading(false);
          }
          return;
        }

        if (selectedCategory === 'all') {
          const [bodyCatalog, skinCatalog, hairCatalog] = await Promise.all([
            productService.getWholesaleCatalog('body').catch(() => [] as WholesaleCatalogProduct[]),
            productService.getWholesaleCatalog('skin').catch(() => [] as WholesaleCatalogProduct[]),
            productService.getWholesaleCatalog('hair').catch(() => [] as WholesaleCatalogProduct[]),
          ]);

          const combinedMap = new Map<string, WholesaleCatalogProduct>();
          [...bodyCatalog, ...skinCatalog, ...hairCatalog].forEach((p) => {
            if (p && p.id) combinedMap.set(String(p.id), p);
          });

          const allList = Array.from(combinedMap.values());
          catalogCache.set('all', allList);
          if (isActive) setProducts(allList);
        } else {
          const catalog = await productService.getWholesaleCatalog(selectedCategory);
          catalogCache.set(selectedCategory, catalog);
          if (isActive) setProducts(catalog);
        }
      } catch (error: unknown) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل كتالوج أسعار الجملة');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchCatalogData();

    return () => {
      isActive = false;
    };
  }, [selectedCategory, reloadVersion]);

  const activeCategory = categories.find((category) => category.id === selectedCategory);

  const handleSmartBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/home');
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16 text-right" dir="rtl">
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-5 shadow-sm sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <button
            onClick={handleSmartBack}
            className="text-primaryRose text-xs sm:text-sm font-semibold hover:underline flex-none cursor-pointer"
          >
            ← العودة للخلف
          </button>
          
          <h1 className="text-sm sm:text-lg font-bold text-deepRose truncate text-center flex-1">كتالوج أسعار الجملة</h1>

          <a
            href="https://wa.me/+963966627602?text=مرحباً، أود الاستفسار عن كتالوج أسعار الجملة"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 flex-none cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>تواصل معنا</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
        {/* تحسين حقل البحث (تباعد الأيقونة عن الـ placeholder) */}
        <section aria-label="شريط البحث">
  <div className="relative flex items-center w-full bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden focus-within:border-primaryRose focus-within:ring-4 focus-within:ring-primaryRose/10 transition">
    <span className="absolute right-4 text-textMuted pointer-events-none flex items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    </span>
    <input
      type="search"
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      placeholder="ابحث عن منتج او كلمة مفتاحية"
      className="w-full bg-transparent py-3.5 ps-14 pe-4 text-sm text-textDark outline-none placeholder:text-textMuted/75"
    />
  </div>
</section>

        {/* فئات المنتجات */}
        <section aria-label="فئات المنتجات" className="grid grid-cols-4 gap-2 sm:gap-3">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setProducts([]);
                  setErrorMessage('');
                }}
                className={`rounded-2xl border px-2 py-3 text-center transition sm:px-4 sm:py-3.5 cursor-pointer ${
                  isSelected
                    ? 'border-primaryRose bg-white shadow-md ring-2 ring-primaryRose/10'
                    : 'border-pink-100 bg-white/70 hover:border-pink-300 hover:bg-white'
                }`}
              >
                <span className={`block text-xs sm:text-sm font-extrabold ${isSelected ? 'text-deepRose' : 'text-textDark'}`}>
                  {category.label}
                </span>
                <span className="mt-0.5 hidden text-[11px] text-textMuted sm:block">{category.subtitle}</span>
              </button>
            );
          })}
        </section>

        <section role="tabpanel" aria-label={`منتجات ${activeCategory?.label ?? ''}`}>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-2xl border border-pink-100 bg-white shadow-sm">
                  <div className="h-36 rounded-t-2xl bg-pink-100/70" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 rounded bg-pink-100" />
                    <div className="h-3 w-full rounded bg-pink-50" />
                    <div className="mt-4 h-7 rounded-xl bg-pink-100/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-3xl border border-pink-100 bg-white px-6 py-12 text-center shadow-sm">
              <p className="font-bold text-deepRose">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  catalogCache.clear();
                  setReloadVersion((version) => version + 1);
                }}
                className="mt-4 rounded-xl bg-primaryRose px-5 py-2.5 text-xs font-bold text-white transition hover:bg-deepRose cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-lightPink rounded-3xl p-8 flex flex-col items-center justify-center max-w-md mx-auto mt-6  text-center">
              <div ref={emptyContainerRef} className="w-64 h-64 sm:w-72 sm:h-72 mb-2" />
              <p className="text-sm font-bold text-deepRose mb-1">
                {searchQuery ? 'لا توجد منتجات مطابقة لكلمة البحث' : 'لا توجد منتجات متوفرة في هذه الفئة حالياً'}
              </p>
              <p className="text-xs text-textMuted"> اختر فئة أخرى أو تغيير كلمات البحث.</p>
            </div>
          ) : (
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => router.push(`/product/${product.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}