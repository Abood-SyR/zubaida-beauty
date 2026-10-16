/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  // 4 حقول لرمز التحقق
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  
  // مؤقت إعادة إرسال الرمز (60 ثانية)
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

  // تنفيذ التحقق تلقائياً فور امتلاء الخانات الأربعة
  useEffect(() => {
    const code = otpValues.join('');
    if (code.length === 4 && phoneStep === 'verify' && !isLoading) {
      handleVerifyOtp(code);
    }
  }, [otpValues]);

  // 1. طلب رمز التحقق برقم الهاتف فقط
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        setCountdown(60); // بدء عداد دقيقة كاملة (60 ثانية)
        setOtpValues(['', '', '', '']);
      } else {
        showToast(response.data?.detail || 'فشل إرسال رمز التحقق', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. التحقق من الرمز
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpValues.join('');
    if (code.length < 4) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.client.post('/auth/phone/verify-otp', {
        phone_number: phoneNumber.trim(),
        code: code.trim()
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
        setOtpValues(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (e: any) {
      showToast(e?.message || 'خطأ في التحقق من الرمز', 'error');
      setOtpValues(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // إدارة كتابة الحقول الأربعة والتنقل واللصق
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    
    // دعم اللصق المباشر (Paste) لـ 4 أرقام
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 4).split('');
      const newValues = ['', '', '', ''];
      pastedDigits.forEach((d, idx) => {
        newValues[idx] = d;
      });
      setOtpValues(newValues);
      const nextIdx = Math.min(pastedDigits.length, 3);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = '';
        setOtpValues(newValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = '';
        setOtpValues(newValues);
      }
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden" dir="rtl">
      
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
                className="w-full px-5 py-3.5 rounded-2xl border border-pink-200 text-sm text-textDark font-bold focus:outline-none focus:ring-2 focus:ring-deepRose/40 bg-surfaceWhite shadow-sm text-right"
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
          <div className="space-y-4">
            <div className="text-center text-xs text-textDark/80 font-bold mb-4 leading-6">
              أدخل رمز التحقق (OTP) المرسل إلى الرقم:<br />
              <span className="font-extrabold text-deepRose text-sm">{phoneNumber}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-textDark/90 mb-3 text-center">
                رمز التحقق المكون من 4 أرقام
              </label>
              {/* 4 حقول مربعة أنيقة ومنفصلة */}
              <div className="flex justify-center gap-3" dir="ltr">
                {otpValues.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-black text-textDark rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-deepRose bg-surfaceWhite shadow-sm"
                  />
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center pt-2">
                <div className="w-6 h-6 border-2 border-deepRose border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* أزرار تعديل الرقم وإعادة إرسال الرمز بانتظار دقيقة كاملة */}
            <div className="flex justify-between items-center pt-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPhoneStep('input');
                  setOtpValues(['', '', '', '']);
                }}
                className="text-deepRose hover:underline"
              >
                تعديل رقم الهاتف
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isLoading}
                onClick={() => handleSendOtp()}
                className={`${countdown > 0 ? 'text-textDark/40 cursor-not-allowed' : 'text-deepRose hover:underline'}`}
              >
                {countdown > 0 ? `إعادة الإرسال بعد (${countdown} ث)` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </div>
        )}

        {/* إخفاء خيارات Google وزر "أو" تماماً عند الانتقال لخطوة الـ verify */}
        {phoneStep === 'input' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-lightPinkBg px-3 text-textDark/60 font-bold">أو</span>
              </div>
            </div>

            <button
              type="button"
              disabled={true}
              className="w-full h-13 bg-gray-100 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm cursor-not-allowed opacity-60 flex items-center justify-center gap-3 font-extrabold text-gray-400 text-sm"
            >
              <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>المتابعة باستخدام Google (قريباً)</span>
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