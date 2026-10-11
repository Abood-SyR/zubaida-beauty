/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast_provider';
import { ApiService } from '@/services/api_client';

export default function CompleteProfilePage() {
  const router = useRouter();
  const showToast = useToast();
  const apiService = new ApiService();

  const [fullName, setFullName] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // قائمة تفضيلات منتجات العناية والجمال المتاحة للاختيار
  const availablePreferences = [
    'العناية بالبشرة',
    'مكياج ومستحضرات تجميل',
    'العناية بالشعر',
    'عطور ومباخر',
    'العناية بالجسم والاستحمام',
    'منتجات العرض الخاص والخصومات'
  ];

  // التحقق من وجود التوكن وجلب البيانات الحالية إن وجدت
  useEffect(() => {
    const checkUser = async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null;
      if (!token) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        router.push('/auth/login');
        return;
      }

      try {
        const res = await apiService.client.get('/auth/me');
        if (res.status === 200 && res.data) {
          if (res.data.full_name && res.data.full_name !== 'عميل جديد') {
            setFullName(res.data.full_name);
          }
          if (res.data.address?.detailed) {
            setDetailedAddress(res.data.address.detailed);
          }
        }
      } catch {
        showToast('فشل جلب بيانات الحساب', 'error');
      } finally {
        setIsFetching(false);
      }
    };

    checkUser();
  }, [apiService.client, router, showToast]);

  // تبديل اختيار التفضيل (تحديد أو إلغاء تحديد)
  const togglePreference = (item: string) => {
    if (selectedPreferences.includes(item)) {
      setSelectedPreferences(selectedPreferences.filter((p) => p !== item));
    } else {
      setSelectedPreferences([...selectedPreferences, item]);
    }
  };

  // حفظ البيانات وإرسالها للباك إند
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('يرجى إدخال الاسم الكامل', 'error');
      return;
    }
    if (!detailedAddress.trim()) {
      showToast('يرجى إدخال الموقع التفصيلي لتوصيل الطلبات', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.client.patch('/auth/me/profile', {
        full_name: fullName.trim(),
        address: {
          detailed: detailedAddress.trim(),
          preferences: selectedPreferences
        }
      });

      if (response.status === 200) {
        showToast('تم إكمال بيانات الحساب بنجاح', 'success');
        router.push('/home');
      } else {
        showToast(response.data?.detail || 'فشل حفظ البيانات', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'حدث خطأ أثناء الاتصال بالسيرفر', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF9a9e] via-[#fecfef] to-[#ffecd2] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF9a9e] via-[#fecfef] to-[#ffecd2] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden" dir="rtl">
      
      {/* خلفية كرات متحركة ناعمة */}
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] rounded-full bg-pink-300/40 blur-[90px] animate-pulse pointer-events-none" style={{ animationDuration: '9s' }} />
      <div className="absolute bottom-[-15%] right-[-15%] w-[650px] h-[650px] rounded-full bg-purple-300/35 blur-[110px] animate-bounce pointer-events-none" style={{ animationDuration: '12s' }} />

      <div className="w-full max-w-lg mx-auto relative z-10 my-auto py-6">
        
        {/* الشعار */}
        <header className="mb-6 text-center flex flex-col items-center">
          <div className="w-40 my-2">
            <Image
              src="/logo.png"
              alt="Zubaida-Beauty Logo"
              width={409}
              height={277}
              priority
              className="w-full h-auto object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-base font-black text-deepRose mt-3">إكمال الملف الشخصي</h1>
          <p className="text-xs text-textDark/70 font-bold mt-1">يرجى استكمال بياناتك لنقدم لك أفضل تجربة تسوق</p>
        </header>

        {/* نموذج البيانات */}
        <form onSubmit={handleSaveProfile} className="bg-white/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
          
          {/* الاسم الكامل */}
          <div>
            <label className="block text-xs font-bold text-textDark/90 mb-1.5 pr-1">
              الاسم الكامل <span className="text-deepRose">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="مثال: فاطمة أحمد"
              className="w-full px-5 py-3.5 rounded-2xl border-none text-sm text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-white shadow-inner"
            />
          </div>

          {/* الموقع التفصيلي */}
          <div>
            <label className="block text-xs font-bold text-textDark/90 mb-1.5 pr-1">
              الموقع التفصيلي لتوصيل الطلبات <span className="text-deepRose">*</span>
            </label>
            <p className="text-[11px] text-textDark/60 font-bold mb-2 pr-1">يرجى كتابة المدينة، الحي، الشارع، ورقم البناء أو الطابق.</p>
            <textarea
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              required
              rows={3}
              placeholder="مثال: دمشق، المزة، شارع الفردوس، بناء رقم 12، الطابق الثالث"
              className="w-full p-4 rounded-2xl border-none text-xs text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-white shadow-inner resize-none"
            />
          </div>

          {/* التفضيلات واهتمامات المتجر */}
          <div>
            <label className="block text-xs font-bold text-textDark/90 mb-2 pr-1">
              ما هي اهتماماتك وتفضيلاتك في المتجر؟ (اختياري)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availablePreferences.map((pref, index) => {
                const isSelected = selectedPreferences.includes(pref);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => togglePreference(pref)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition text-right flex items-center justify-between ${
                      isSelected
                        ? 'bg-deepRose text-white shadow-sm'
                        : 'bg-white/90 text-textDark/80 hover:bg-pink-50 shadow-xs'
                    }`}
                  >
                    <span>{pref}</span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-white text-deepRose' : 'border border-gray-300'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* زر الحفظ والمتابعة */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 bg-deepRose text-white font-black rounded-2xl hover:bg-primaryRose transition-all shadow-md flex items-center justify-center mt-6 text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'حفظ والانتقال للمتجر'
            )}
          </button>

        </form>
      </div>

      <div className="w-full text-center pb-2 text-[10px] font-bold text-textDark/40">
        جميع الحقوق محفوظة © Zubaida-Beauty 2026
      </div>
    </main>
  );
}