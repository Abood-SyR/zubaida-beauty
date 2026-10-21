/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// مكون تأثير الكتابة الحرفية
function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

export default function ShamCashHelpPage() {
  const [currentStep, setCurrentStep] = useState(0);

  // استخدام useMemo لتثبيت مصفوفة الخطوات ومنع تغيرها في كل رندر
  const steps = useMemo(() => [
    {
      id: 'step-1',
      step: 'الخطوة الأولى',
      title: 'نسسخ رمز الحساب أو تصوير الباركود',
      desc: 'ققم بفتح تطبيق شام كاش، ثم انسخ رمز الحساب المخصص للتحويل أو قم بتوجيه الكاميرا لتصوير باركود الحساب مباشرة.',
      images: [
        '/sham-cash/1.jpg',
        '/sham-cash/2.jpg',
      ],
    },
    {
      id: 'step-2',
      step: 'الخطوة الثانية',
      title: 'تتحويل المبلغ المطلوب بدقة',
      desc: 'أأدخل قيمة إجمالي الطلب الفعلية في التطبيق، وتأكد من تفاصيل المستلم ثم اضغط لتأكيد عملية التحويل.',
      images: [
        '/sham-cash/3.jpg',
        '/sham-cash/4.jpg',
      ],
    },
    {
      id: 'no', // معرف خاص للوصول المباشر عبر #no لشرح رقم الحوالة
      step: 'الخطوة الثالثة الخيار الاول',
      title: 'ننسخ رقم الحوالة أو الضغط المطول',
      desc: 'يمكنك إما نسخ رقم الحوالة الظاهر أعلى تفاصيل الحوالة مباشرة، أو الضغط المطول لفتح صفحة تفاصيل العملية.',
      images: [
        '/sham-cash/5.jpg',
        '/sham-cash/6.png',
      ],
    },
    {
      id: 'step-4',
      step: 'الخطوة الرابعة الخيار الثاني',
      title: 'تتصدير الايصال او لقطة شاشة ',
      desc: 'بما أن التطبيق قد يمنع أخذ لقطة شاشة (Screenshot)، يمكنك استخدام خيار تصدير الإيصال وحفظه كملف في هاتفك.',
      images: [
        '/sham-cash/7.jpg',
        '/sham-cash/8.jpg',
      ],
    },
    {
      id: 'step-5',
      step: 'الخطوة الأخيرة',
      title: 'إإرفاق الإثبات في صفحة إتمام الطلب',
      desc: 'عودةً لصفحة إتمام الطلب، قم برفع الإثباتات المطلوبة أو إدخال رقم العملية في الخانات المخصصة.',
      images: [
        '/sham-cash/9.jpg',
        '/sham-cash/10.jpg',
        '/sham-cash/11.jpg',
      ],
    },
  ], []);

  // التحقق من الرابط عند التحميل لمعرفة ما إذا كان هناك #no
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const targetIndex = steps.findIndex((s) => s.id === hash);
        if (targetIndex !== -1) {
          setCurrentStep(targetIndex);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [steps]);

  // دعم التمرير بعجلة الماوس للانتقال بين الخطوات
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 30) {
        setCurrentStep((prev) => {
          const next = prev < steps.length - 1 ? prev + 1 : prev;
          window.location.hash = steps[next].id;
          return next;
        });
      } else if (e.deltaY < -30) {
        setCurrentStep((prev) => {
          const next = prev > 0 ? prev - 1 : prev;
          window.location.hash = steps[next].id;
          return next;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [steps]);

  const handleStepChange = (index: number) => {
    setCurrentStep(index);
    window.location.hash = steps[index].id;
  };

  const activeStepData = steps[currentStep];

  return (
    <main className="fixed inset-0 top-[60px] bg-[var(--app-light-pink-bg)] text-[var(--app-text-dark)] select-none overflow-hidden flex flex-col justify-between" dir="rtl">
      {/* هيدر الصفحة الثابت */}
      <header className="fixed top-0 left-0 right-0 bg-[var(--app-surface-white)]/90 backdrop-blur-md border-b border-[var(--app-soft-pink)] px-6 py-8 z-50 flex justify-between items-center shadow-xs">
        <Link href="/checkout" className="text-[var(--app-deep-rose)] text-xs font-bold hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          <span>العودة لإتمام الطلب</span>
        </Link>
        <h1 className="text-sm font-black tracking-wide text-[var(--app-deep-rose)]">دليل الدفع عبر شام كاش</h1>
        <div className="w-16"></div>
      </header>

      {/* منطقة المحتوى */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 flex items-center justify-center relative my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.04, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          >
            {/* قسم الصور بترتيب شرائح مائلة متجاورة */}
            <div className="md:col-span-7 relative h-72 md:h-[400px] w-full flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center gap-2 md:gap-4 px-2">
                {activeStepData.images.map((imgSrc, imgIdx) => {
                  const rotations = ['rotate-[-4deg]', 'rotate-[3deg]', 'rotate-[-2deg]', 'rotate-[5deg]'];
                  const zIndexes = [10, 20, 30, 40];
                  
                  return (
                    <div
                      key={imgIdx}
                      className={`relative flex-1 h-[80%] md:h-[90%] rounded-[24px] overflow-hidden border-4 border-white shadow-xl bg-[var(--app-surface-white)] transition-all duration-300 hover:scale-105 hover:rotate-0 hover:z-50 ${
                        rotations[imgIdx % rotations.length]
                      }`}
                      style={{ zIndex: zIndexes[imgIdx % zIndexes.length] }}
                    >
                      <Image
                        src={imgSrc}
                        alt={`${activeStepData.title} - ${imgIdx + 1}`}
                        fill
                        unoptimized
                        className="object-cover w-full h-full"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* قسم النصوص */}
            <div className="md:col-span-5 bg-[var(--app-surface-white)] p-7 md:p-9 rounded-[32px] border border-[var(--app-soft-pink)] shadow-md space-y-4 text-right flex flex-col justify-center">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black bg-[var(--app-light-pink-bg)] text-[var(--app-deep-rose)] border border-[var(--app-soft-pink)] w-fit">
                {activeStepData.step}
              </span>
              
              <h2 className="text-xl md:text-2xl font-black text-[var(--app-text-dark)] leading-tight min-h-[3rem] flex items-center">
                <TypewriterText key={`title-${currentStep}`} text={activeStepData.title} speed={20} />
              </h2>

              <p className="text-xs md:text-sm text-[var(--app-text-muted)] leading-relaxed">
                <TypewriterText key={`desc-${currentStep}`} text={activeStepData.desc} speed={10} />
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* شريط التنقل السفلي */}
      <footer className="w-full max-w-xl mx-auto px-6 pb-6 flex items-center justify-between z-40">
        <button
          onClick={() => handleStepChange(Math.max(currentStep - 1, 0))}
          disabled={currentStep === 0}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${
            currentStep === 0
              ? 'opacity-40 cursor-not-allowed border-transparent bg-gray-100 text-gray-400'
              : 'bg-[var(--app-surface-white)] text-[var(--app-deep-rose)] border-[var(--app-soft-pink)] hover:bg-[var(--app-light-pink-bg)] shadow-xs'
          }`}
        >
          السابق
        </button>

        {/* مؤشر النقاط */}
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleStepChange(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-[var(--app-deep-rose)]' : 'w-2 bg-[var(--app-soft-pink)]'
              }`}
            />
          ))}
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => handleStepChange(Math.min(currentStep + 1, steps.length - 1))}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--app-deep-rose)] text-white shadow-sm hover:opacity-95 transition"
          >
            التالي
          </button>
        ) : (
          <Link
            href="/checkout"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm hover:opacity-95 transition flex items-center gap-1"
          >
            <span>إتمام الطلب</span>
          </Link>
        )}
      </footer>
    </main>
  );
}