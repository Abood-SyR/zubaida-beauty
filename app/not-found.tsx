'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import notFoundAnimation from '@/assets/lottie_404.json';

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: notFoundAnimation,
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <main className="min-h-screen bg-lightPinkBg flex flex-col justify-between items-center p-4 sm:p-6" dir="rtl">
      <header className="w-full max-w-4xl flex justify-between items-center py-3 px-4 bg-lightPink ">
        
      </header>

      <section className="w-full max-w-xl mx-auto my-auto flex flex-col items-center text-center py-6">
        <div className="w-full max-w-[420px] sm:max-w-[420px] h-[300px] sm:h-[350px] flex items-center justify-center relative">
          <div ref={containerRef} className="w-full h-full object-contain" />
        </div>

        <div className="space-y-2 mt-2 max-w-md">
          <h1 className="text-xl sm:text-2xl font-black text-deepRose">
            مضيع الطريق؟
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
           
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full px-2">
          <Link
            href="/home"
            className="flex-1 sm:flex-initial min-w-[130px] bg-deepRose hover:bg-primaryRose text-white text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl shadow-md transition-all duration-300 text-center"
          >
            الصفحة الرئيسية
          </Link>

          <Link
            href="/"
            className="flex-1 sm:flex-initial min-w-[130px] bg-surfaceWhite/80 hover:bg-white text-deepRose border border-pink-200/80 text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl backdrop-blur-md transition-all duration-300 text-center"
          >
            حول زبيدة بيوتي
          </Link>

          
        </div>
      </section>

      <footer className="py-2 text-[11px] font-semibold text-gray-400 text-center">
        جميع الحقوق محفوظة © شركة Zubaida-Beauty لتصنيع منتجات التجميل والعناية
      </footer>
    </main>
  );
}