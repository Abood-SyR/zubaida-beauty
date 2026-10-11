'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, parseProductFromJson } from '@/models/product';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import PageLoadingSkeleton from '@/components/ui/page_loading_skeleton';
import { useToast } from '@/components/ui/toast_provider';

const favoriteService = new FavoriteService();

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const cartManager = CartManager.getInstance();
  const showToast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productData = await new ProductService().getProductById(productId);
        setProduct(parseProductFromJson(productData));
      } catch (e) {
        console.error('Error fetching product details:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    Promise.resolve()
      .then(() => {
        setIsFavorite(favoriteService.getLocalFavoriteIds().includes(productId));
        return favoriteService.getFavorites();
      })
      .then((items) => {
        setIsFavorite(items.some((item) => String(item.id) === productId));
      })
      .catch((error) => {
        console.error('Error loading favorite status:', error);
      });
  }, [productId]);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-lightPinkBg flex items-center justify-center text-gray-500">
        لم يتم العثور على المنتج المطلوب
      </div>
    );
  }

  const productName = product.getName('ar');
  const allImages: string[] = [];
  if (product.thumbnailUrl && product.thumbnailUrl.trim() !== '' && product.thumbnailUrl !== 'string' && product.thumbnailUrl.startsWith('http')) {
    allImages.push(product.thumbnailUrl);
  }
  if (product.images) {
    product.images.forEach((img) => {
      if (img.trim() !== '' && img !== 'string' && img.startsWith('http') && !allImages.includes(img)) {
        allImages.push(img);
      }
    });
  }

  const formatDetailValue = (field: unknown) => {
    if (!field) return '-';
    if (typeof field === 'object' && !Array.isArray(field)) {
      const values = Object.values(field)
        .filter((value) => value != null && value !== 'string' && value !== '')
        .map(String);
      if (values.length > 0) return values.join(' - ');
    } else if (Array.isArray(field)) {
      const items = field
        .filter((item) => item != null && item !== 'string' && item !== '')
        .map(String);
      if (items.length > 0) return items.join('، ');
    } else {
      const str = String(field);
      if (str !== '' && str !== 'string') return str;
    }
    return '-';
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`مرحبا لدي سؤال حول "${productName}"`);   
    window.open(`https://wa.me/+963981082693?text=${text}`, '_blank');   
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await favoriteService.toggleFavorite(product.id, product);
      setIsFavorite(result.is_favorite);
    } catch (error) {
      console.error('Error saving favorite locally:', error);
      showToast('تعذر حفظ المنتج في المفضلة', 'error');
    }
  };

  const handleAddToCart = () => {
    cartManager.addProduct(product);   
    showToast('تمت إضافة المنتج إلى السلة بنجاح');   
  };

  const handleOrderNow = () => {
    router.push(`/checkout?product_id=${product.id}`);   
  };

  const renderDetailRow = (title: string, value: unknown, icon: string) => {
    const formatted = formatDetailValue(value);
    if (formatted === '-') return null;

    return (
      <div className="mb-3 p-4 bg-surfaceWhite rounded-2xl border border-pink-100 shadow-sm flex items-start gap-3">
        <div className="p-2 bg-lightPinkBg rounded-xl text-deepRose">
          <span>{icon}</span>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-1">{title}</h4>
          <p className="text-sm font-semibold text-textDark leading-relaxed">{formatted}</p>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-28" dir="rtl">
      {/* هيدر الصفحة */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-primaryRose text-sm font-semibold hover:underline">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-xl font-bold text-deepRose line-clamp-1 max-w-xs">{productName}</h1>   
          <div className="w-16"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* معرض الصور */}
        <div className="bg-surfaceWhite rounded-3xl overflow-hidden border border-pink-100 shadow-sm">
          <div
            className="h-[300px] sm:h-[400px] relative bg-white touch-pan-y"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (startX === null || endX === undefined || Math.abs(endX - startX) < 40 || allImages.length < 2) {
                return;
              }
              setCurrentImageIndex((current) =>
                (current + (endX < startX ? 1 : -1) + allImages.length) % allImages.length,
              );
            }}
          >
            {allImages.length > 0 ? (
              <img
                src={allImages[currentImageIndex]}
                alt={productName}
                className="product-image w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">لا توجد صور</div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto border-t border-pink-100">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-white transition ${
                    idx === currentImageIndex ? 'border-primaryRose' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="product-image w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* تفاصيل المنتج الأساسية */}
        <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-textDark">{productName}</h1>   
            <span className="text-xl font-black text-deepRose">{product.price} ل.س</span>   
          </div>

          <div className="flex gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${product.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {product.stockQuantity > 0 ? `متوفر (${product.stockQuantity} قطعة)` : 'غير متوفر'}   
            </span>
            {product.soldCount > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-lightPinkBg text-gray-600 border border-pink-100">
                المبيعات: {product.soldCount}   
              </span>
            )}
          </div>
        </div>

        {/* المواصفات والخصائص */}
        <div>
          <h2 className="font-bold text-deepRose text-base mb-3">تفاصيل المنتج والمواصفات   </h2>   
          {renderDetailRow('وصف المنتج', product.description, '📄')}
          {renderDetailRow('طريقة الاستخدام', product.usageInstructions, '💡')}
          {renderDetailRow('المكونات', product.ingredients, '🧪')}
          {renderDetailRow('التوافق والتحذيرات', product.compatibility, '⚠️')}
          {renderDetailRow('الأحجام المتوفرة', product.sizes, '📏')}
          {renderDetailRow('نوع البشرة / الشعر', product.skinHairType, '✨')}
          {renderDetailRow('خصائص إضافية (Attributes)', product.attributes, '📋')}
        </div>
      </div>

      {/* شريط الإجراءات السفلي */}
      <div className="fixed bottom-0 left-0 right-0 bg-surfaceWhite border-t border-pink-100 p-4 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={handleWhatsApp}
            className="w-11 h-11 bg-lightPinkBg text-deepRose rounded-xl flex items-center justify-center hover:bg-pink-200 transition"
            title="استفسار عبر واتساب"   
          >
            💬
          </button>
          <button
            onClick={handleToggleFavorite}
            className="w-11 h-11 bg-lightPinkBg text-primaryRose rounded-xl flex items-center justify-center hover:bg-pink-200 transition"
            title="المفضلة"   
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className="flex-1 border-2 border-primaryRose text-primaryRose font-bold py-2.5 rounded-xl hover:bg-primaryRose hover:text-white transition text-xs disabled:opacity-50"
          >
            إضافة للسلة   
          </button>
          <button
            onClick={handleOrderNow}
            disabled={product.stockQuantity <= 0}
            className="flex-1 bg-deepRose text-white font-bold py-2.5 rounded-xl hover:bg-primaryRose transition text-xs shadow-md disabled:opacity-50"
          >
            طلب الآن   
          </button>
        </div>
      </div>
    </main>
  );
}