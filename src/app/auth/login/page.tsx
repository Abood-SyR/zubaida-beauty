/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast_provider';
import { ApiService } from '@/services/api_client';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function UserAuthPage() {
  const router = useRouter();
  const showToast = useToast();
  const [apiService] = useState(() => new ApiService());
  const [isLoading, setIsLoading] = useState(false);

  // تسجيل الدخول عبر جوجل
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;

    setIsLoading(true);
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);

      const response = await apiService.client.post('/auth/google-login', {
        email: decoded.email,
        google_id: decoded.sub,
        full_name: decoded.name || 'عميل جوجل'
      });

      if (response.status === 200 && response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        showToast('تم تسجيل الدخول بواسطة Google بنجاح', 'success');

        const profileRes = await apiService.client.get('/auth/me');
        if (profileRes.status === 200) {
          const user = profileRes.data;
          // تحويل المستخدم لإكمال رقم الهاتف والعنوان إن لم يكونا مكتملين
          if (!user.phone_number || !user.address?.detailed) {
            router.push('/auth/complete-profile');
          } else {
            router.push('/home');
          }
        } else {
          router.push('/home');
        }
      } else {
        showToast(response.data?.detail || 'فشل تسجيل الدخول عبر Google', 'error');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.detail || e?.message || 'حدث خطأ أثناء الاتصال بجوجل', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden" dir="rtl">
      
      {/* زر العودة للمتجر */}
      <div className="w-full max-w-md mx-auto flex justify-start pt-1 mb-2 relative z-20">
        <Link 
          href="/home" 
          className="inline-flex items-center gap-2 text-xs font-bold text-deepRose bg-surfaceWhite/80 hover:bg-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm transition-all border border-pink-100"
        >
          <span>العودة للمتجر</span>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 my-auto -mt-4">
        <header className="mb-6 text-center flex flex-col items-center">
          <div className="w-full px-2 my-6">
            <Image
              src="/logo.png"
              alt="Zubaida-Beauty Logo"
              width={409}
              height={277}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 className="text-sm font-black text-deepRose mb-1">تسجيل الدخول / إنشاء حساب</h1>
          <p className="text-xs text-textDark/70 font-bold tracking-wide">
            مرحباً بك في متجر زبيدة بيوتي
          </p>
        </header>

        <div className=" p-6 rounded-3xl  space-y-5">
          
          {/* 1. خيار Google الأساسي والفعّال */}
          <div className="w-full flex flex-col items-center gap-3">
            
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-deepRose border-t-transparent rounded-full animate-spin my-2" />
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    showToast('فشل تسجيل الدخول عبر Google', 'error');
                  }}
                  shape="circle"
                  theme="outline"
                  width="300"
                />
              </div>
            )}
          </div>

          {/* فاصل */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surfaceWhite px-3 text-textDark/50 font-bold">أو</span>
            </div>
          </div>

          {/* 2. خيار رقم الهاتف المعطّل (قريباً) */}
          <div>
            <button
              type="button"
              disabled={true}
              className="w-full h-12 bg-gray-100 border border-gray-200 rounded-2xl cursor-not-allowed opacity-60 flex items-center justify-center gap-2 font-bold text-gray-500 text-xs shadow-none"
            >
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>المتابعة باستخدام رقم الهاتف (قريباً)</span>
            </button>
          </div>

        </div>

      </div>

      <div className="w-full text-center pb-1 text-[10px] font-bold text-textDark/40">
        جميع الحقوق محفوظة © Zubaida-Beauty 2026
      </div>
    </main>
  );
}