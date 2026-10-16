'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import notFoundAnimation from '@/assets/lottie_404.json';

interface LottieProps {
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

const Lottie = dynamic<LottieProps>(
  () => import('lottie-react').then((mod) => (mod as unknown as { default: React.ComponentType<LottieProps> }).default || mod),
  { ssr: false }
);

export default function NotFound() {
  return (
    <main className="min-h-screen bg-lightPinkBg flex flex-col justify-between items-center p-4 sm:p-6" dir="rtl">
      <header className="w-full max-w-4xl flex justify-between items-center py-3 px-4 bg-surfaceWhite/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="شركة زُبيدة بيوتي"
            width={90}
            height={61}
            className="object-contain h-8 sm:h-9 w-auto"
            priority
          />
        </Link>
        <span className="text-xs font-bold text-deepRose/70 bg-pink-100/50 px-3 py-1 rounded-full">
          خطأ 404
        </span>
      </header>

      <section className="w-full max-w-xl mx-auto my-auto flex flex-col items-center text-center py-6">
        <div className="w-full max-w-[320px] sm:max-w-[420px] h-[260px] sm:h-[340px] flex items-center justify-center relative">
          <Lottie
            animationData={notFoundAnimation}
            loop={true}
            autoplay={true}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-2 mt-2 max-w-md">
          <h1 className="text-xl sm:text-2xl font-black text-deepRose">
            يبدو أنك تائه بين الأقسام!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
            الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها. هل أنت ضائع؟ هذه الروابط قد تساعدك للعودة لمسارك:
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full px-2">
          <Link
            href="/home"
            className="flex-1 sm:flex-initial min-w-[130px] bg-deepRose hover:bg-primaryRose text-white text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl shadow-md transition-all duration-300 text-center"
          >
            الرئيسية
          </Link>

          <Link
            href="/help/faq"
            className="flex-1 sm:flex-initial min-w-[130px] bg-surfaceWhite/80 hover:bg-white text-deepRose border border-pink-200/80 text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl backdrop-blur-md transition-all duration-300 text-center"
          >
            حول زبيدة بيوتي
          </Link>

          <Link
            href="/help/contact"
            className="flex-1 sm:flex-initial min-w-[130px] bg-surfaceWhite/80 hover:bg-white text-deepRose border border-pink-200/80 text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl backdrop-blur-md transition-all duration-300 text-center"
          >
            اتصل بنا
          </Link>
        </div>
      </section>

      <footer className="py-2 text-[11px] font-semibold text-gray-400 text-center">
        جميع الحقوق محفوظة © شركة زُبيدة بيوتي لتصنيع منتجات التجميل والعناية
      </footer>
    </main>
  );
}