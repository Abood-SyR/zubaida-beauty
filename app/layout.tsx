'use client';

import { usePathname } from 'next/navigation';
import MainLayout from "@/components/layouts/MainLayout";
import { ToastProvider } from "@/components/ui/toast_provider";
import { AppColors } from "@/constants/app_colors";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // التحقق مما إذا كانت الصفحة الحالية هي صفحة الجذر / (حول زبيدة بيوتي)
  const isRootAboutPage = pathname === '/';

  const themeStyle = {
    "--app-primary-rose": AppColors.primaryRose,
    "--app-light-pink-bg": AppColors.lightPinkBg,
    "--app-surface-white": AppColors.surfaceWhite,
    "--app-soft-pink": AppColors.softPink,
    "--app-deep-rose": AppColors.deepRose,
    "--app-text-dark": AppColors.textDark,
    "--app-text-muted": AppColors.textMuted,
  } as React.CSSProperties;

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Zubaida Beauty</title>
        <meta name="description" content="متجر زبيدة بيوتي للتجميل والعناية" />
      </head>
      <body className="bg-lightPinkBg text-textDark font-sans antialiased" style={themeStyle}>
        <ToastProvider>
          {isRootAboutPage ? (
            // إذا كانت صفحة البداية، اعرض المحتوى مباشرة بدون الشريط السفلي أو القوائم
            children
          ) : (
            // باقي صفحات المتجر تعمل بشكل طبيعي مع التخطيط العام
            <MainLayout>{children}</MainLayout>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}