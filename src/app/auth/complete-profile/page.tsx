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
  const [apiService] = useState(() => new ApiService());

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  
  // القائمة الديناميكية للتفضيلات
  const [availablePreferences, setAvailablePreferences] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // جلب البيانات والتفضيلات مرة واحدة فقط عند تحميل الصفحة لمنع تكرار الطلبات
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null;
      if (!token) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        router.push('/auth/login');
        return;
      }

      try {
        const [userRes, prefRes] = await Promise.all([
          apiService.client.get('/auth/me'),
          apiService.client.get('/auth/preferences-list').catch(() => ({ data: { available_preferences: [] } }))
        ]);

        if (!isMounted) return;

        if (userRes.status === 200 && userRes.data) {
          if (userRes.data.full_name && userRes.data.full_name !== 'عميل جديد') {
            setFullName(userRes.data.full_name);
          }
          if (userRes.data.phone_number) {
            setPhoneNumber(userRes.data.phone_number);
          }
          if (userRes.data.address?.detailed) {
            setDetailedAddress(userRes.data.address.detailed);
          }
          if (userRes.data.address?.preferences) {
            setSelectedPreferences(userRes.data.address.preferences);
          }
          
          // إذا كانت البيانات مكتملة مسبقاً في قاعدة البيانات، نحدث الذاكرة المحلية احتياطياً
          if (
            userRes.data.full_name && 
            userRes.data.full_name !== 'عميل جديد' && 
            userRes.data.phone_number && 
            userRes.data.address?.detailed
          ) {
            localStorage.setItem('profile_completed', 'true');
          }
        }

        if (prefRes.data?.available_preferences) {
          setAvailablePreferences(prefRes.data.available_preferences);
        }
      } catch {
        if (isMounted) {
          showToast('فشل جلب بيانات الحساب', 'error');
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, [apiService, router, showToast]);

  const togglePreference = (item: string) => {
    if (selectedPreferences.includes(item)) {
      setSelectedPreferences(selectedPreferences.filter((p) => p !== item));
    } else {
      setSelectedPreferences([...selectedPreferences, item]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('يرجى إدخال الاسم الكامل', 'error');
      return;
    }
    if (!phoneNumber.trim()) {
      showToast('يرجى إدخال رقم الهاتف للتواصل والطلبات', 'error');
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
        phone_number: phoneNumber.trim(),
        address: {
          detailed: detailedAddress.trim(),
          preferences: selectedPreferences
        }
      });

      if (response.status === 200) {
        // تخزين علامة في الذاكرة المحلية بأن البروفايل مكتمل تماماً لمنع محاولات التخطي
        localStorage.setItem('profile_completed', 'true');
        
        showToast('تم إكمال بيانات الحساب بنجاح', 'success');
        router.push('/home');
      } else {
        showToast(response.data?.detail || 'فشل حفظ البيانات', 'error');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.detail || e?.message || 'حدث خطأ أثناء الاتصال بالسيرفر', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-lightPinkBg flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-deepRose border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-lightPinkBg flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden" dir="rtl">
      <div className="w-full max-w-lg mx-auto relative z-10 my-auto py-6">
        
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

        <form onSubmit={handleSaveProfile} className="bg-surfaceWhite backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-pink-100 space-y-5">
          
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
              className="w-full px-5 py-3.5 rounded-2xl border border-pink-200 text-sm text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-surfaceWhite shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-textDark/90 mb-1.5 pr-1">
              رقم الهاتف المحمول <span className="text-deepRose">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="09xxxxxxxx"
              className="w-full px-5 py-3.5 rounded-2xl border border-pink-200 text-sm text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-surfaceWhite shadow-sm"
            />
          </div>

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
              className="w-full p-4 rounded-2xl border border-pink-200 text-xs text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-surfaceWhite shadow-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-textDark/90 mb-2 pr-1">
              ما هي اهتماماتك وتفضيلاتك في المتجر؟ (اختياري)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {availablePreferences.map((pref) => {
                const isSelected = selectedPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePreference(pref)}
                    className={`py-3 px-3.5 rounded-2xl text-xs font-bold transition-all text-right flex items-center justify-between border ${
                      isSelected
                        ? 'bg-deepRose text-white border-deepRose shadow-md scale-[1.02]'
                        : 'bg-surfaceWhite text-textDark/80 border-pink-200 hover:border-deepRose/50 shadow-sm'
                    }`}
                  >
                    <span className="line-clamp-1">{pref}</span>
                    <span className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[10px] ${isSelected ? 'bg-white text-deepRose font-black' : 'border border-pink-300'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 bg-deepRose text-white font-black rounded-2xl hover:bg-primaryRose active:scale-[0.98] transition-all shadow-md flex items-center justify-center mt-6 text-sm"
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