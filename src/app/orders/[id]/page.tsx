/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ApiService } from '@/services/api_client';
import { ProductService } from '@/services/product_service';

interface OrderItem {
  id?: string;
  product_id?: string | null;
  item_type?: string;
  source_id?: string | null;
  product_name?: { ar?: string; en?: string } | null;
  quantity: number;
  unit_price: number;
  thumbnail_url?: string;
  image?: string;
}

interface OrderDetails {
  id: string;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: any;
  items: OrderItem[];
  total_amount: number;
  created_at?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const productService = useMemo(() => new ProductService(), []);

  const getCachedProductImages = () => {
    if (typeof window === 'undefined') {
      return {} as Record<string, string>;
    }

    try {
      const cachedImages = localStorage.getItem('zubaida_products_images_cache');
      if (!cachedImages) {
        return {} as Record<string, string>;
      }

      const parsed = JSON.parse(cachedImages);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {} as Record<string, string>;
    } catch (e) {
      console.error(e);
      return {} as Record<string, string>;
    }
  };

  const initialProductImages = useMemo(() => getCachedProductImages(), []);
  const productImagesRef = useRef<Record<string, string>>(initialProductImages);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productImages, setProductImages] = useState<Record<string, string>>(initialProductImages);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    productImagesRef.current = productImages;
  }, [productImages]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await new ApiService().client.get(`/orders/${orderId}`);
        if (response.status === 200) {
          const orderData = response.data;
          setOrder(orderData);

          const items = Array.isArray(orderData.items) ? orderData.items : [];
          const newImagesCache = { ...productImagesRef.current };
          let hasNewImages = false;

          for (const item of items) {
            const prodId = item.product_id || item.source_id;
            const normalizedProdId = typeof prodId === 'string' ? prodId : '';
            const directImg = item.thumbnail_url || item.image;

            if (normalizedProdId && directImg) {
              newImagesCache[normalizedProdId] = directImg;
              hasNewImages = true;
            } else if (normalizedProdId && !newImagesCache[normalizedProdId]) {
              try {
                const prodDetails = await productService.getProductById(normalizedProdId);
                const thumb = prodDetails?.thumbnail_url || prodDetails?.thumbnailUrl || prodDetails?.images?.[0];
                if (thumb) {
                  newImagesCache[normalizedProdId] = thumb;
                  hasNewImages = true;
                }
              } catch (err) {
                console.error(`Failed to fetch image for product ${normalizedProdId}`, err);
              }
            }
          }

          if (hasNewImages) {
            productImagesRef.current = newImagesCache;
            setProductImages(newImagesCache);
            if (typeof window !== 'undefined') {
              localStorage.setItem('zubaida_products_images_cache', JSON.stringify(newImagesCache));
            }
          }
        }
      } catch (e) {
        console.error('Error fetching order details:', e);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, productService]);

  const translateStatus = (status?: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'processing': return 'قيد التجهيز';
      case 'shipping': return 'تم الشحن';
      case 'completed': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status || 'غير معروف';
    }
  };

  const getStatusStep = (status?: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipping': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const translatePaymentMethod = (method?: string) => {
    switch (method) {
      case 'cod': return 'الدفع عند الاستلام';
      case 'sham_cash': return 'شام كاش';
      default: return method || 'غير محدد';
    }
  };

  const translatePaymentStatus = (status?: string) => {
    switch (status) {
      case 'paid': return 'مدفوع';
      case 'unpaid': return 'غير مدفوع';
      default: return status || 'معلق';
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `تفاصيل الطلب #${orderId.substring(0, 8)}`,
      text: `تابع تفاصيل طلبك من زبيدة بيوتي`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleWhatsAppInquiry = () => {
    const shortId = orderId.length > 8 ? orderId.substring(0, 8) : orderId;
    const text = encodeURIComponent(`مرحباً، لدي استفسار بخصوص الطلب رقم #${shortId}`);
    window.open(`https://wa.me/+963981082693?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
        <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div className="h-4 bg-pink-100 rounded-full w-24 animate-pulse"></div>
            <div className="h-6 bg-pink-100 rounded-full w-36 animate-pulse"></div>
            <div className="w-16"></div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 space-y-4 animate-pulse">
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
            <div className="h-5 bg-pink-100 rounded-full w-32"></div>
            <div className="flex justify-between items-center py-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100"></div>
                  <div className="h-3 bg-pink-100 rounded-full w-12"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-3">
            <div className="h-5 bg-pink-100 rounded-full w-40"></div>
            <div className="h-4 bg-pink-100 rounded-full w-3/4"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-lightPinkBg flex items-center justify-center p-4" dir="rtl">
        <div className="text-center bg-surfaceWhite p-8 rounded-3xl border border-pink-100 shadow-sm max-w-sm w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 className="text-base font-bold text-textDark">لم يتم العثور على تفاصيل الطلب</h2>
          <Link href="/orders" className="inline-block w-full bg-deepRose text-white font-bold py-3 rounded-2xl shadow-md text-xs">
            العودة لقائمة الطلبات
          </Link>
        </div>
      </main>
    );
  }

  const shortId = orderId.length > 8 ? orderId.substring(0, 8) : orderId;
  const items = Array.isArray(order.items) ? order.items : [];
  const currentStep = getStatusStep(order.status);

  const shipping = order.shipping_address || {};
  const recipientName = typeof shipping === 'object' ? shipping.name : null;
  const recipientPhone = typeof shipping === 'object' ? shipping.phone : null;
  const addressText = typeof shipping === 'object' 
    ? (shipping.address || shipping.detailed || shipping.address_text || 'غير محدد')
    : String(shipping);

  const formattedDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* هيدر الصفحة مع أزرار المشاركة والواتساب */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/orders" className="text-primaryRose text-sm font-semibold hover:underline flex items-center gap-1">
            <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            <span>الطلبات</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppInquiry}
              className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:bg-emerald-100"
              title="استفسار عبر واتساب"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              <span>واتساب</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 bg-pink-50 text-deepRose border border-pink-200 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:bg-pink-100 relative"
              title="مشاركة الطلب"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
              <span>مشاركة</span>
              {copySuccess && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-textDark text-white text-[10px] px-2 py-0.5 rounded shadow">
                  تم النسخ
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 space-y-5">
        
        {/* معلومات الطلب والتاريخ */}
        <div className="bg-surfaceWhite p-5 rounded-3xl border border-pink-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-base font-black text-deepRose">تفاصيل الطلب #{shortId}</h1>
            {formattedDate && (
              <p className="text-xs text-gray-400 mt-1">تاريخ الطلب: {formattedDate}</p>
            )}
          </div>
          <span className="text-xs font-bold text-deepRose bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
            {translateStatus(order.status)}
          </span>
        </div>

        {/* شريط تتبع حالة الطلب المرئي */}
        {order.status !== 'cancelled' ? (
          <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
            <span className="text-xs font-black text-textDark block">تتبع حالة الطلب</span>

            <div className="relative py-2">
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-pink-100 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 right-4 h-1 bg-deepRose -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>

              <div className="relative z-10 flex justify-between items-center">
                {[
                  { step: 1, label: 'قيد المراجعة' },
                  { step: 2, label: 'التجهيز' },
                  { step: 3, label: 'في الطريق' },
                  { step: 4, label: 'تم التسليم' },
                ].map((s) => {
                  const isDone = currentStep >= s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center gap-1.5">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition font-black ${
                          isDone 
                            ? 'bg-deepRose text-white shadow-md ring-4 ring-pink-100' 
                            : 'bg-white text-gray-400 border border-pink-200'
                        }`}
                      >
                        {s.step}
                      </div>
                      <span className={`text-[10px] font-bold ${isDone ? 'text-deepRose' : 'text-gray-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 p-5 rounded-3xl text-center">
            <h3 className="text-sm font-bold text-red-600">هذا الطلب ملغي</h3>
          </div>
        )}

        {/* معلومات التوصيل والعنوان */}
        <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-deepRose font-black text-xs border-b border-pink-100 pb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>معلومات التوصيل والعنوان</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-textDark">
            {recipientName && (
              <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                <span className="text-gray-400 block text-[10px]">الاسم:</span>
                <span className="font-bold">{recipientName}</span>
              </div>
            )}
            {recipientPhone && (
              <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                <span className="text-gray-400 block text-[10px]">رقم الهاتف:</span>
                <span className="font-bold">{recipientPhone}</span>
              </div>
            )}
            <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100 sm:col-span-2">
              <span className="text-gray-400 block text-[10px]">عنوان الشحن:</span>
              <span className="font-bold leading-relaxed">{addressText}</span>
            </div>
          </div>
        </div>

        {/* تفاصيل الدفع */}
        <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-deepRose font-black text-xs border-b border-pink-100 pb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            <span>تفاصيل الدفع</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
              <span className="text-gray-400 block text-[10px]">طريقة الدفع:</span>
              <span className="font-bold text-textDark">{translatePaymentMethod(order.payment_method)}</span>
            </div>
            <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
              <span className="text-gray-400 block text-[10px]">حالة الدفع:</span>
              <span className={`font-bold ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                {translatePaymentStatus(order.payment_status)}
              </span>
            </div>
          </div>
        </div>

        {/* عناصر الطلب مع صور المنتجات */}
        <div className="bg-surfaceWhite p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-deepRose font-black text-xs border-b border-pink-100 pb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span>عناصر الطلب ({items.length})</span>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const prodId = item.product_id || item.source_id;
              const normalizedProdId = typeof prodId === 'string' ? prodId : '';
              const imgUrl = (normalizedProdId ? productImages[normalizedProdId] : undefined) || item.thumbnail_url || item.image;
              const productName = item.product_name?.['ar'] || item.product_name?.['en'] || 'منتج زبيدة بيوتي';
              const itemKind = item.item_type === 'group' ? 'مجموعة' : item.item_type === 'offer' ? 'عرض خاص' : 'منتج أساسي';

              return (
                <div 
                  key={item.id ?? `${normalizedProdId}-${idx}`} 
                  className="bg-pink-50/40 p-4 rounded-2xl border border-pink-100 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-14 h-14 rounded-xl bg-white border border-pink-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={productName} fill sizes="56px" className="object-cover" unoptimized />
                      ) : (
                        <span className="text-[10px] text-deepRose font-bold">صورة</span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="bg-pink-100 text-deepRose text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">
                        {itemKind}
                      </span>
                      <h4 className="font-bold text-xs text-textDark truncate">{productName}</h4>
                      <p className="text-[11px] text-gray-500">الكمية: <span className="font-bold text-textDark">{item.quantity}</span></p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs font-black text-deepRose">{item.unit_price} ل.س</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* إجمالي الفاتورة */}
        <div className="bg-white p-6 rounded-3xl border-2 border-deepRose/20 shadow-sm flex justify-between items-center">
          <span className="font-black text-textDark text-sm">المجموع الكلي للفاتورة:</span>
          <span className="text-xl font-black text-deepRose">{order.total_amount} ل.س</span>
        </div>

      </div>
    </main>
  );
}