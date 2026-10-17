'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const MainNavigation = dynamic(() => import('./MainNavigation'), {
  ssr: false,
});

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lightPinkBg relative flex" dir="rtl">
      <div className="main-layout-content min-w-0 flex-1">{children}</div>
      <Suspense fallback={null}>
        <MainNavigation />
      </Suspense>
    </div>
  );
}