'use client';

import { Suspense } from 'react';
import HomeScreen from '@/app/home/page';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل الصفحة...</div>}>
      <HomeScreen />
    </Suspense>
  );
}