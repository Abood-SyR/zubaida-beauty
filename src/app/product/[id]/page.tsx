/* eslint-disable @next/next/no-img-element */
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
      <div className="min-h-screen bg-lightPinkBg flex items-center justify-center text-gray-500 text-sm font-bold">
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

  const renderDetailRow = (title: string, value: unknown, iconSvg: React.ReactNode) => {
    const formatted = formatDetailValue(value);
    if (formatted === '-') return null;

    return (
      <div className="mb-3 p-4 bg-surfaceWhite rounded-2xl border border-pink-100 shadow-sm flex items-start gap-3">
        <div className="p-2.5 bg-lightPinkBg rounded-xl text-deepRose flex items-center justify-center flex-none">
          {iconSvg}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-gray-400 mb-1">{title}</h4>
          <p className="text-sm font-semibold text-textDark leading-relaxed break-words">{formatted}</p>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-28" dir="rtl">
      {/* هيدر الصفحة */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
          <Link href="/home" className="text-primaryRose text-xs sm:text-sm font-semibold hover:underline flex-none">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-sm sm:text-xl font-bold text-deepRose truncate text-center flex-1">{productName}</h1>   
          <div className="w-12 sm:w-16 flex-none"></div>
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
                className="product-image w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">لا توجد صور</div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto border-t border-pink-100 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-white transition flex-none ${
                    idx === currentImageIndex ? 'border-primaryRose shadow-md' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="product-image w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* تفاصيل المنتج الأساسية */}
        <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-textDark break-words flex-1">{productName}</h1>   
            <span className="text-lg sm:text-xl font-black text-deepRose flex-none">{product.price} ل.س</span>   
          </div>

          <div className="flex flex-wrap gap-2">
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
          <h2 className="font-bold text-deepRose text-base mb-3">تفاصيل المنتج والمواصفات</h2>   
          {renderDetailRow('وصف المنتج', product.description, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" /></svg>
          ))}
          {renderDetailRow('طريقة الاستخدام', product.usageInstructions, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          ))}
          {renderDetailRow('المكونات', product.ingredients, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          ))}
          {renderDetailRow('التوافق والتحذيرات', product.compatibility, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          ))}
          {renderDetailRow('الأحجام المتوفرة', product.sizes, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          ))}
          {renderDetailRow('نوع البشرة / الشعر', product.skinHairType, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          ))}
          {renderDetailRow('خصائص إضافية (Attributes)', product.attributes, (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          ))}
        </div>
      </div>

      {/* شريط الإجراءات السفلي */}
      <div className="fixed bottom-0 left-0 right-0 bg-surfaceWhite border-t border-pink-100 p-4 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleWhatsApp}
            className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition flex-none"
            title="استفسار عبر واتساب"   
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
          <button
            onClick={handleToggleFavorite}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition flex-none border ${isFavorite ? 'bg-rose-50 text-primaryRose border-pink-200' : 'bg-lightPinkBg text-gray-500 border-pink-100'}`}
            title="المفضلة"   
          >
            <svg className={`w-5 h-5 ${isFavorite ? 'fill-current' : 'fill-none'}`} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className="flex-1 border-2 border-primaryRose text-primaryRose font-bold py-3 rounded-xl hover:bg-primaryRose hover:text-white transition text-xs disabled:opacity-50 truncate px-2"
          >
            إضافة للسلة   
          </button>
          <button
            onClick={handleOrderNow}
            disabled={product.stockQuantity <= 0}
            className="flex-1 bg-deepRose text-white font-bold py-3 rounded-xl hover:bg-primaryRose transition text-xs shadow-md disabled:opacity-50 truncate px-2"
          >
            طلب الآن   
          </button>
        </div>
      </div>
    </main>
  );
}
