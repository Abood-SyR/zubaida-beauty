import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zubaida Beauty',
  description: 'متجر زبيدة بيوتي للتجميل والعناية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-lightPinkBg text-textDark font-sans antialiased">
        {children}
      </body>
    </html>
  );
}