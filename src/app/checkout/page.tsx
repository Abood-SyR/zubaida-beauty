'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CartManager } from '@/services/cart_manager';
import { ApiService } from '@/services/api_client';
import { useToast } from '@/components/ui/toast_provider';

export default function CheckoutPage() {
  const router = useRouter();
  const cartManager = CartManager.getInstance();
  const apiService = new ApiService();
  const showToast = useToast();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [tempPinLocation, setTempPinLocation] = useState<{ lat: number; lng: number }>({ lat: 33.5138, lng: 36.2765 });
  const [isPinningMode, setIsPinningMode] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('sham_cash');
  const [shamCashType, setShamCashType] = useState<'invoice' | 'image' | 'pdf'>('invoice');
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [transferPdf, setTransferPdf] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const shamCashNumber = 'SC-98214563-SY';

  useEffect(() => {
    let isMounted = true;
    cartManager.loadFromStorage();

    new ApiService().client.get('/auth/me')
      .then((response) => {
        if (!isMounted || response.status !== 200) return;

        const profile = response.data as Record<string, unknown>;
        const username = typeof profile['username'] === 'string' ? profile['username'] : '';
        const isPhoneUsername = /^[+0-9][0-9 +()-]{5,}$/.test(username);
        setIsLoggedIn(true);
        setName(typeof profile['full_name'] === 'string' ? profile['full_name'] : isPhoneUsername ? '' : username);

        const phoneNumber = typeof profile['phone_number'] === 'string'
          && profile['phone_number'].trim()
          ? profile['phone_number']
          : isPhoneUsername
          ? username
          : '';
        setPhone(phoneNumber);

        const savedAddress = profile['address'];
        if (typeof savedAddress === 'string') {
          setAddress(savedAddress);
        } else if (savedAddress && typeof savedAddress === 'object') {
          const addressData = savedAddress as Record<string, unknown>;
          const savedAddressText = addressData['address'] ?? addressData['address_text'];
          if (typeof savedAddressText === 'string') setAddress(savedAddressText);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoggedIn(false);
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cartManager]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shamCashNumber);
    showToast('تم نسخ رمز الحساب بنجاح');
  };

  const handleGetMyCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          };
          setTempPinLocation(currentPos);
          setIsPinningMode(false);
          showToast('تم تحديد موقعك الحالي على الخريطة بنجاح');
        },
        () => {
          showToast('تعذر جلب موقعك تلقائياً', 'error');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleMapManualClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinningMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickedLat = Number((tempPinLocation.lat + (0.5 - y) * 0.04).toFixed(6));
    const clickedLng = Number((tempPinLocation.lng + (x - 0.5) * 0.04).toFixed(6));

    setTempPinLocation({ lat: clickedLat, lng: clickedLng });
    setIsPinningMode(false);
    showToast('تم تثبيت الدبوس في المكان المختار يدوياً ✓');
  };

  const handleConfirmLocation = () => {
    setSelectedLocation(tempPinLocation);
    setIsMapOpen(false);
    showToast('تم تثبيت واعتماد موقع التوصيل بنجاح ✓');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'cod' && !isLoggedIn) {
      showToast(
        isAuthLoading ? 'جارٍ التحقق من تسجيل الدخول، حاول مجدداً بعد لحظات' : 'الدفع عند الاستلام يتطلب تسجيل الدخول',
        'error'
      );
      return;
    }

    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }

    if (cartManager.items.length === 0) {
      showToast('السلة فارغة، أضف المنتجات قبل إتمام الطلب', 'error');
      return;
    }

    if (paymentMethod === 'sham_cash') {
      const hasProof =
        (shamCashType === 'invoice' && invoiceNumber.trim().length > 0) ||
        (shamCashType === 'image' && transferImage !== null) ||
        (shamCashType === 'pdf' && transferPdf !== null);

      if (!hasProof) {
        showToast('يجب إرفاق إثبات تحويل (رقم الحوالة، أو صورة التحويل، أو ملف PDF) لإتمام الطلب', 'error');
        return;
      }
    }

    setIsLoading(true);

    try {
      const itemsList = cartManager.items.map((item) => {
        const target = item.isGroup
          ? { group_id: item.id }
          : item.isOffer
          ? { offer_id: item.id }
          : { product_id: item.id };
        return { ...target, quantity: item.quantity };
      });

      let proofUrl: string | undefined;
      if (paymentMethod === 'sham_cash' && shamCashType !== 'invoice') {
        const proofFile = shamCashType === 'image' ? transferImage : transferPdf;
        if (!proofFile) {
          showToast('أرفق صورة أو ملف PDF لإثبات الحوالة', 'error');
          return;
        }
        const formData = new FormData();
        formData.append('proof', proofFile);
        const uploadResponse = await apiService.client.postForm('/orders/transfer-proof', formData);
        if (typeof uploadResponse.data?.proof_url !== 'string') {
          throw new Error('لم يستلم المتجر ملف إثبات الحوالة');
        }
        proofUrl = uploadResponse.data.proof_url;
      }

      const requestData = {
        items: itemsList,
        payment_method: paymentMethod,
        payment_details: paymentMethod === 'sham_cash' ? {
          type: shamCashType,
          ...(shamCashType === 'invoice' ? { invoice_number: invoiceNumber.trim() } : { proof_url: proofUrl }),
        } : null,
        shipping_address: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          coordinates: selectedLocation,
        },
      };

      const response = await apiService.client.post('/orders/', requestData);

      if (response.status === 201 || response.status === 200) {
        const orderId = response.data?.id;
        if (typeof orderId !== 'string') {
          throw new Error('تم إنشاء الطلب لكن لم يصل رقم الطلب من الخادم');
        }
        localStorage.setItem('last_order_id', orderId);
        cartManager.clear();
        showToast(`تم إرسال الطلب بنجاح! رقم الطلب: ${orderId.slice(0, 8)}`);
        router.push(isLoggedIn ? `/orders/${orderId}` : '/home');
      }
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى';
      showToast(detail, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmountValue = cartManager.totalAmount || 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff0f6_0%,_#fff8fb_36%,_#fff_100%)] pb-24" dir="rtl">
      <header className="bg-white/80 border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <Link href="/cart" className="text-primaryRose text-xs font-bold hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            <span>العودة للسلة</span>
          </Link>
          <h1 className="text-base font-black text-deepRose">إتمام الطلب</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4">
        <form onSubmit={handleSubmitOrder} className="space-y-6">

          {/* ملخص المشتريات والفاتورة المتوافق مع هيكل CartItem */}
          <div className="bg-white p-6 rounded-[28px] border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <h2 className="font-black text-deepRose text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-primaryRose" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>ملخص المشتريات والفاتورة</span>
              </h2>
              <span className="text-[11px] font-bold text-primaryRose bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                {cartManager.items.length} عناصر
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-3 pr-1 divide-y divide-pink-50">
              {cartManager.items.map((item, index) => {
                const imageUrl = item.imageUrl;
                const hasImage = !!imageUrl && imageUrl.startsWith('http');
                return (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between pt-2.5 first:pt-0">
                    <div className="flex items-center gap-3">
                      {hasImage ? (
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-pink-100 bg-pink-50/50 flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={item.name}
                            fill
                            unoptimized
                            className="object-cover h-full w-full"
                          />
                        </div>
                      ) : (
                        <div className="h-11 w-11 rounded-xl border border-pink-100 bg-pink-50 flex items-center justify-center text-deepRose text-xs font-bold flex-shrink-0">
                          🛒
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-textDark line-clamp-1">{item.name}</h4>
                        <span className="text-[10px] text-textMuted font-medium">الكمية: {item.quantity}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono text-xs font-black text-deepRose">
                      {(item.unitPrice * item.quantity).toLocaleString('ar-SY')} ل.س
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-dashed border-pink-200 space-y-2">
              <div className="flex justify-between items-center text-xs text-textMuted font-medium">
                <span>مجموع المنتجات:</span>
                <span className="font-mono text-textDark">{totalAmountValue.toLocaleString('ar-SY')} ل.س</span>
              </div>

              

              <div className="flex justify-between items-center pt-2 border-t border-pink-100">
                <span className="text-sm font-black text-textDark">إجمالي الفاتورة النهائي:</span>
                <span className="text-base font-black font-mono text-deepRose bg-pink-50/80 px-3 py-1 rounded-xl border border-pink-200/60">
                  {totalAmountValue.toLocaleString('ar-SY')} ل.س
                </span>
                
              </div>
              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 text-lg rounded-md text-[10px]">*  قد يترتب عليك  رسوم اجرة التوصيل</span>
            </div>
          </div>

          {/* معلومات المستلم والعنوان */}
          <div className="bg-white p-6 rounded-[28px] border border-pink-100 shadow-sm space-y-4">
            <h2 className="font-black text-deepRose text-sm mb-2">معلومات المستلم والعنوان</h2>

            <div>
              <label className="block text-xs font-bold text-textDark mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm text-textDark focus:outline-none focus:border-primaryRose bg-pink-50/20 font-medium"
                placeholder="أدخل اسمك الكامل..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-textDark mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm text-textDark focus:outline-none focus:border-primaryRose bg-pink-50/20 font-medium"
                placeholder="مثال: 0912345678"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-textDark mb-1">عنوان التوصيل بالتفصيل *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm text-textDark focus:outline-none focus:border-primaryRose bg-pink-50/20 resize-none font-medium"
                placeholder="المدينة، الحي، الشارع، أقرب نقطة دالة..."
              />
            </div>

            {/* قسم الخريطة التفاعلية */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-bold text-textDark">موقع التوصيل على الخريطة (اختياري)</label>

              {!isMapOpen ? (
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50/50 text-deepRose text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-pink-100/80 transition shadow-xs"
                >
                  <svg className="w-4 h-4 text-primaryRose" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>{selectedLocation ? 'تعديل الموقع المحدد من الخريطة ✓' : 'اختر مكان التوصيل بدقة عبر الخريطة'}</span>
                </button>
              ) : (
                <div className="space-y-3 p-4 rounded-2xl border border-pink-200 bg-pink-50/30 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-deepError">
                      {isPinningMode ? '📍 انقر الآن في المكان المطلوب على الخريطة لتثبيت الدبوس' : 'تصفح الخريطة بحرية أو انقر لتحديد مكان يدوي:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(false)}
                      className="text-xs font-bold text-textMuted hover:text-deepRose"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-pink-200 shadow-inner bg-slate-100">
                    <iframe
                      title="Interactive Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${tempPinLocation.lat},${tempPinLocation.lng}&z=15&output=embed`}
                    />

                    {isPinningMode && (
                      <div
                        onClick={handleMapManualClick}
                        className="absolute inset-0 bg-primaryRose/10 cursor-crosshair z-20 flex items-center justify-center animate-pulse"
                      >
                        <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-deepRose shadow-lg border border-pink-200">
                          انقر هنا الآن لتثبيت الدبوس 📍
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 z-30 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={handleGetMyCurrentLocation}
                        className="bg-white/95 px-3 py-1.5 rounded-full shadow-md text-[11px] font-bold text-deepRose border border-pink-100 flex items-center gap-1 hover:bg-white transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>موقعي الحالي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPinningMode(!isPinningMode);
                          showToast(isPinningMode ? 'تم إيقاف وضع التحديد اليدوي' : 'يرجى النقر على مكانك المطلوب بالخريطة الآن');
                        }}
                        className={`px-3 py-1.5 rounded-full shadow-md text-[11px] font-bold border transition flex items-center gap-1 ${
                          isPinningMode ? 'bg-deepRose text-white border-deepRose' : 'bg-white text-primaryRose border-pink-200 hover:bg-pink-50'
                        }`}
                      >
                        <span>📍</span>
                        <span>{isPinningMode ? 'إلغاء وضع التحديد' : 'تحديد مكان يدوي بالضغط'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-textMuted font-mono">
                      الإحداثيات الحالية: ({tempPinLocation.lat}, {tempPinLocation.lng})
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmLocation}
                      className="py-2.5 px-5 rounded-xl bg-deepRose text-white text-xs font-bold shadow-md hover:bg-primaryRose transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      <span>اعتماد وتثبيت هذا المكان</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedLocation && !isMapOpen && (
                <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    <span>تم اعتماد موقع التوصيل بنجاح</span>
                  </span>
                  <span className="font-mono text-[10px]">({selectedLocation.lat}, {selectedLocation.lng})</span>
                </div>
              )}
            </div>
          </div>

          {/* طرق الدفع */}
          <div className="bg-white p-6 rounded-[28px] border border-pink-100 shadow-sm space-y-4">
            <h2 className="font-black text-deepRose text-sm mb-2">طريقة الدفع</h2>

            <div className="space-y-3">
              {/* شام كاش */}
              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${paymentMethod === 'sham_cash' ? 'border-primaryRose bg-pink-50/30 shadow-sm' : 'border-pink-100 hover:bg-pink-50/10'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="sham_cash"
                    checked={paymentMethod === 'sham_cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primaryRose"
                  />
                  <span className="font-bold text-sm text-textDark">Sham Cash</span>
                </div>
                <div className="relative h-12 w-24 rounded-xl overflow-hidden border border-pink-200/80 bg-pink-50 shadow-xs flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=250&auto=format&fit=crop&q=80"
                    alt="Sham Cash"
                    fill
                    unoptimized
                    className="object-cover h-full w-full"
                  />
                </div>
              </label>

              {/* الدفع نقداً */}
              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${paymentMethod === 'cod' ? 'border-primaryRose bg-pink-50/30 shadow-sm' : 'border-pink-100 hover:bg-pink-50/10'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primaryRose"
                  />
                  <span className="font-bold text-sm text-textDark">الدفع نقداً عند الاستلام</span>
                </div>
                <div className="relative h-12 w-24 rounded-xl overflow-hidden border border-pink-200/80 bg-pink-50 shadow-xs flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=250&auto=format&fit=crop&q=80"
                    alt="Cash on Delivery"
                    fill
                    unoptimized
                    className="object-cover h-full w-full"
                  />
                </div>
              </label>

              {paymentMethod === 'cod' && !isLoggedIn && (
                <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 border border-amber-200">
                  الدفع عند الاستلام يتطلب تسجيل الدخول. يمكنك متابعة الطلب عبر شام كاش دون تسجيل دخول.
                  {' '}
                  <Link href="/auth/login" className="font-bold text-deepRose underline">
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>

            {/* تفاصيل شام كاش وإثبات التحويل */}
            {paymentMethod === 'sham_cash' && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 to-white border border-pink-200/80 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-pink-100 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 bg-gray-50 rounded-lg p-1 border">
                      <Image
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ShamCash"
                        alt="QR Code"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-textMuted">رمز الحساب للتحويل:</span>
                      <span className="font-mono font-black text-xs text-deepRose">{shamCashNumber}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-deepRose text-white text-xs font-bold shadow-xs hover:bg-primaryRose transition flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    <span>نسخ الرمز</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-pink-100">
                  <span className="text-xs font-bold text-textDark">تحتاج لمساعدة في طريقة التحويل؟</span>
                  <Link
                    href="/help/sham-cash"
                    className="px-3 py-1.5 rounded-lg bg-pink-100 text-deepRose text-xs font-bold hover:bg-pink-200 transition flex items-center gap-1"
                  >
                    <span>كيفية التحويل</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </Link>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex gap-2 bg-pink-100/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setShamCashType('invoice')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${shamCashType === 'invoice' ? 'bg-white text-deepRose shadow-xs' : 'text-textMuted'}`}
                    >
                      رقم الحوالة *
                    </button>
                    <button
                      type="button"
                      onClick={() => setShamCashType('image')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${shamCashType === 'image' ? 'bg-white text-deepRose shadow-xs' : 'text-textMuted'}`}
                    >
                      صورة التحويل *
                    </button>
                    <button
                      type="button"
                      onClick={() => setShamCashType('pdf')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${shamCashType === 'pdf' ? 'bg-white text-deepRose shadow-xs' : 'text-textMuted'}`}
                    >
                      ملف PDF *
                    </button>
                  </div>

                  {shamCashType === 'invoice' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-textDark">
                          رقم الحوالة *
                        </label>
                        <Link
                          href="/help/sham-cash#no"
                          target="_blank"
                          className="text-[10px] font-bold text-primaryRose bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-lg border border-pink-200 transition flex items-center gap-1"
                        >
                          <span>ما هو رقم الحوالة؟</span>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </Link>
                      </div>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required={paymentMethod === 'sham_cash' && shamCashType === 'invoice'}
                        className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm text-textDark focus:outline-none focus:border-primaryRose bg-white font-medium"
                        placeholder="أدخل رقم الحوالة هنا..."
                      />
                    </div>
                  )}

                  {shamCashType === 'image' && (
                    <div>
                      <label className="block text-xs font-bold text-textDark mb-1">رفع صورة إيصال التحويل *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required={paymentMethod === 'sham_cash' && shamCashType === 'image'}
                        onChange={(e) => setTransferImage(e.target.files?.[0] || null)}
                        className="w-full text-xs text-textDark file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-deepRose hover:file:bg-pink-100 cursor-pointer"
                      />
                    </div>
                  )}

                  {shamCashType === 'pdf' && (
                    <div>
                      <label className="block text-xs font-bold text-textDark mb-1">رفع ملف الـ PDF للإيصال *</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        required={paymentMethod === 'sham_cash' && shamCashType === 'pdf'}
                        onChange={(e) => setTransferPdf(e.target.files?.[0] || null)}
                        className="w-full text-xs text-textDark file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-deepRose hover:file:bg-pink-100 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-l from-deepRose to-primaryRose text-white font-bold rounded-2xl hover:opacity-95 transition shadow-lg shadow-rose-900/15 flex items-center justify-center text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'تأكيد وإرسال الطلب'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}