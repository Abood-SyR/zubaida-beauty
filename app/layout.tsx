import MainLayout from "@/components/layouts/MainLayout";
import { ToastProvider } from "@/components/ui/toast_provider";
import { AppColors } from "@/constants/app_colors";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

export const metadata = {
  title: 'Zubaida Beauty',
  description: 'متجر زبيدة بيوتي للتجميل والعناية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <body className="bg-lightPinkBg text-textDark font-sans antialiased" style={themeStyle}>
        <ToastProvider>
          <MainLayout>{children}</MainLayout>
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}