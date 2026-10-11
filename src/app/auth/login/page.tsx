/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast_provider';
import { ApiService } from '@/services/api_client';

export default function UserAuthPage() {
  const router = useRouter();
  const showToast = useToast();
  const apiService = new ApiService();

  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // مؤقت إعادة إرسال الرمز (30 ثانية)
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // 1. طلب رمز التحقق برقم الهاتف فقط
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      showToast('يرجى إدخال رقم الهاتف', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.client.post('/auth/phone/send-otp', {
        phone_number: phoneNumber.trim(),
        full_name: 'temporary'
      });

      if (response.status === 200 || response.status === 201) {
        showToast('تم إرسال رمز التحقق إلى هاتفك بنجاح', 'success');
        setPhoneStep('verify');
        setCountdown(30); // بدء عداد 30 ثانية
      } else {
        showToast(response.data?.detail || 'فشل إرسال رمز التحقق', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. التحقق من الرمز ومعرفة ما إذا كان الحساب جديداً أو قديماً
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      showToast('يرجى إدخال رمز التحقق', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.client.post('/auth/phone/verify-otp', {
        phone_number: phoneNumber.trim(),
        code: otpCode.trim()
      });

      if (response.status === 200 && response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        showToast('تم تسجيل الدخول بنجاح', 'success');

        const profileRes = await apiService.client.get('/auth/me');
        if (profileRes.status === 200) {
          const user = profileRes.data;
          if (!user.full_name || user.full_name === 'عميل جديد' || !user.address?.detailed) {
            router.push('/auth/complete-profile');
          } else {
            router.push('/home');
          }
        } else {
          router.push('/home');
        }

      } else {
        showToast(response.data?.detail || 'رمز التحقق غير صحيح', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'خطأ في التحقق من الرمز', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // تسجيل الدخول عبر Google
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.client.post('/auth/google-login', {
        email: 'user@gmail.com',
        google_id: 'google_oauth_token_placeholder',
        full_name: 'مستخدم جوجل'
      });

      if (response.status === 200 && response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        showToast('تم تسجيل الدخول عبر Google بنجاح', 'success');
        router.push('/home');
      } else {
        showToast(response.data?.detail || 'فشل تسجيل الدخول عبر Google', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'خطأ في الاتصال', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF9a9e] via-[#fecfef] to-[#ffecd2] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden" dir="rtl">
      
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] rounded-full bg-pink-300/40 blur-[90px] animate-pulse pointer-events-none" style={{ animationDuration: '9s' }} />
      <div className="absolute bottom-[-15%] right-[-15%] w-[650px] h-[650px] rounded-full bg-purple-300/35 blur-[110px] animate-bounce pointer-events-none" style={{ animationDuration: '12s' }} />

      <div className="w-full max-w-md mx-auto flex justify-start pt-1 mb-2 relative z-20">
        <Link 
          href="/home" 
          className="inline-flex items-center gap-2 text-xs font-bold text-deepRose bg-white/60 hover:bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm transition-all"
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
          <p className="text-xs text-textDark/70 font-bold tracking-wide">
            {phoneStep === 'input' ? 'تسجيل الدخول برقم الهاتف' : 'تأكيد رمز التحقق'}
          </p>
        </header>

        {phoneStep === 'input' ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-textDark/90 mb-1.5 pr-1">
                رقم الهاتف المحمول <span className="text-deepRose">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-2xl border-none text-sm text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-white/85 backdrop-blur-md shadow-sm text-right"
                placeholder="09xxxxxxxx"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 bg-deepRose text-white font-black rounded-2xl hover:bg-primaryRose transition-all shadow-md flex items-center justify-center mt-5 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'متابعة وإرسال رمز التحقق'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center text-xs text-textDark/80 font-bold mb-4 leading-6">
              أدخل رمز التحقق (OTP) المرسل إلى الرقم:<br />
              <span className="font-extrabold text-deepRose text-sm">{phoneNumber}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-textDark/90 mb-1.5 text-center">
                رمز التحقق المكون من 4 أرقام
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                maxLength={4}
                className="w-full px-4 py-4 text-center tracking-[0.6em] text-2xl font-black text-textDark rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-white/85 shadow-sm"
                placeholder="1234"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 bg-deepRose text-white font-black rounded-2xl hover:bg-primaryRose transition-all shadow-md flex items-center justify-center mt-5 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'تحقق وتأكيد الدخول'
              )}
            </button>

            {/* أزرار تعديل الرقم وإعادة إرسال الرمز بانتظار 30 ثانية */}
            <div className="flex justify-between items-center pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPhoneStep('input')}
                className="text-deepRose hover:underline"
              >
                تعديل رقم الهاتف
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isLoading}
                onClick={handleSendOtp}
                className={`${countdown > 0 ? 'text-textDark/40 cursor-not-allowed' : 'text-deepRose hover:underline'}`}
              >
                {countdown > 0 ? `إعادة الإرسال بعد (${countdown} ث)` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </form>
        )}

        {/* إخفاء خيارات Google وزر "أو" تماماً عند الانتقال لخطوة الـ verify */}
        {phoneStep === 'input' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-300/40" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-3 text-textDark/60 font-bold">أو</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full h-13 bg-white/90 hover:bg-white backdrop-blur-md border-none rounded-2xl shadow-sm transition-all duration-300 flex items-center justify-center gap-3 font-extrabold text-textDark text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>المتابعة باستخدام Google</span>
            </button>
          </>
        )}

      </div>

      <div className="w-full text-center pb-1 text-[10px] font-bold text-textDark/40">
        جميع الحقوق محفوظة © Zubaida-Beauty 2026
      </div>
    </main>
  );
}