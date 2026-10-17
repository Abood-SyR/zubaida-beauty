'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import lottie from 'lottie-web';
import { Product, parseProductFromJson } from '@/models/product';
import { ProductService } from '@/services/product_service';
import { FavoriteService } from '@/services/favorite_service';
import { CartManager } from '@/services/cart_manager';
import PageLoadingSkeleton from '@/components/ui/page_loading_skeleton';
import { useToast } from '@/components/ui/toast_provider';
import nothingAnimation from '@/assets/nothing.json';

const favoriteService = new FavoriteService();

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const productId = params?.id;
    const productData = await new ProductService().getProductById(productId);
    const product = parseProductFromJson(productData);
    const productName = product.getName('ar');
    const description = product.description ? product.description.substring(0, 150) : productName;
    const imageUrl = product.thumbnailUrl || (product.images && product.images[0]) || '/images.jpg';

    return {
      title: `${productName} - زُبيدة بيوتي`,
      description: description,
      openGraph: {
        title: `${productName} - زُبيدة بيوتي`,
        description: description,
        url: `https://zubaidabeauty.com/product/${productId}`,
        images: imageUrl ? [{ url: imageUrl }] : [{ url: '/images.jpg' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${productName} - زُبيدة بيوتي`,
        description: description,
        images: imageUrl ? [imageUrl] : ['/images.jpg'],
      },
    };
  } catch {
    return {
      title: 'تفاصيل المنتج - زُبيدة بيوتي',
      description: 'متجر زُبيدة بيوتي للعناية والتجميل',
      openGraph: {
        images: ['/images.jpg'],
      },
    };
  }
}

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

  const emptyContainerRef = useRef<HTMLDivElement>(null);

  // تشغيل انيميشن عدم وجود المنتج عند عدم العثور عليه أو حدوث خطأ
  useEffect(() => {
    if (!isLoading && !product && emptyContainerRef.current) {
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
  }, [isLoading, product]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productData = await new ProductService().getProductById(productId);
        setProduct(parseProductFromJson(productData));
      } catch (e) {
        console.error('Error fetching product details:', e);
        setProduct(null);
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
      <main className="min-h-screen bg-lightPinkBg flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="bg-lightPinkBg rounded-3xl  p-8 flex flex-col items-center max-w-md w-full">
          <div ref={emptyContainerRef} className="w-64 h-64 sm:w-82 sm:h-82 mb-4" />
          <p className="text-sm font-bold text-deepRose text-center mb-6">
            لم يتم العثور على المنتج المطلوب أو أنه غير متوفر حالياً.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 bg-primaryRose text-white font-bold rounded-2xl shadow-md hover:bg-deepRose transition text-xs cursor-pointer"
          >
            العودة للرئيسية
          </button>
        </div>
      </main>
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

  const handleSmartBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/home');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`مرحبا لدي سؤال حول "${productName}"`);   
    window.open(`https://wa.me/+963981082693?text=${text}`, '_blank');   
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `تصفحي منتج ${productName} في متجر زُبيدة بيوتي`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('تم نسخ رابط المنتج بنجاح');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await favoriteService.toggleFavorite(product.id, product);
      setIsFavorite(result.is_favorite);
      showToast(result.is_favorite ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة', 'success');
    } catch (error) {
      console.error('Error saving favorite locally:', error);
      showToast('تعذر حفظ المنتج في المفضلة', 'error');
    }
  };

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) {
      // تم إزالة إشعار الخطأ عند نفاد المخزون بناءً على طلبك
      return;
    }
    cartManager.addProduct(product);   
    showToast('تمت إضافة المنتج إلى السلة بنجاح', 'success');   
  };

  const handleOrderNow = () => {
    if (product.stockQuantity <= 0) {
      // تم إزالة إشعار الخطأ عند نفاد المخزون بناءً على طلبك
      return;
    }
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

  const totalUnits = product.stockQuantity + product.soldCount;
  const stockPercentage = totalUnits > 0 ? Math.min(Math.round((product.stockQuantity / totalUnits) * 100), 100) : 0;

  return (
    <main className="min-h-screen bg-lightPinkBg pb-28" dir="rtl">
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-3">
          <button
            onClick={handleSmartBack}
            className="text-primaryRose text-xs sm:text-sm font-semibold hover:underline flex-none text-right cursor-pointer"
          >
            ← العودة للخلف
          </button>
          <h1 className="text-sm sm:text-xl font-bold text-deepRose truncate text-center flex-1">{productName}</h1>   
          
          <button
            onClick={handleShare}
            aria-label="مشاركة المنتج"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-gray-600 shadow-sm transition hover:-translate-y-0.5 flex-none cursor-pointer"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-surfaceWhite rounded-3xl overflow-hidden border border-pink-100 shadow-sm lg:sticky lg:top-24">
            <div
              className="h-[320px] sm:h-[420px] relative bg-white touch-pan-y"
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
                <Image
                  src={allImages[currentImageIndex]}
                  alt={productName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 450px"
                  className="object-contain p-3"
                  priority={currentImageIndex === 0}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صور</div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-t border-pink-100 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-white transition flex-none relative cursor-pointer ${
                      idx === currentImageIndex ? 'border-primaryRose shadow-sm' : 'border-pink-50'
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="56px" className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-5">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-lg sm:text-2xl font-bold text-textDark break-words flex-1">{productName}</h1>   
                <span className="text-xl sm:text-2xl font-black text-deepRose flex-none">{product.price} ل.س</span>   
              </div>

              {totalUnits > 0 && (
                <div className="p-4 bg-lightPinkBg/60 rounded-2xl border border-pink-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>حالة المخزون والمبيعات</span>
                    <span>{product.stockQuantity > 0 ? `المتبقي: ${product.stockQuantity}` : 'نفد المخزون'}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex dir-ltr">
                    <div 
                      className="h-full bg-deepRose transition-all duration-300"
                      style={{ width: `${stockPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>المبيعات: {product.soldCount}</span>
                    <span>الإجمالي: {totalUnits}</span>
                  </div>
                </div>
              )}
            </div>

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
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surfaceWhite border-t border-pink-100 p-4 shadow-lg z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleWhatsApp}
            className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition flex-none cursor-pointer"
            title="استفسار عبر واتساب"   
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </button>
          <button
            onClick={handleToggleFavorite}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition flex-none border cursor-pointer ${isFavorite ? 'bg-rose-50 text-primaryRose border-pink-200' : 'bg-lightPinkBg text-gray-500 border-pink-100'}`}
            title="المفضلة"   
          >
            <svg className={`w-5 h-5 ${isFavorite ? 'fill-current' : 'fill-none'}`} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className="flex-1 border-2 border-primaryRose text-primaryRose font-bold py-3 rounded-xl hover:bg-primaryRose hover:text-white transition text-xs disabled:opacity-50 truncate px-2 cursor-pointer"
          >
            إضافة للسلة   
          </button>
          <button
            onClick={handleOrderNow}
            disabled={product.stockQuantity <= 0}
            className="flex-1 bg-deepRose text-white font-bold py-3 rounded-xl hover:bg-primaryRose transition text-xs shadow-md disabled:opacity-50 truncate px-2 cursor-pointer"
          >
            طلب الآن   
          </button>
        </div>
      </div>
    </main>
  );
}