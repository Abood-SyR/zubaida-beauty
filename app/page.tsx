import { Suspense } from 'react';
import RoadJourneyContent from '../src/app/RoadJourneyContent';
import { ProductService } from '../src/services/product_service';

export const metadata = {
  metadataBase: new URL('https://zubaida-beauty.vercel.app'),
  title: 'Zubaida Beauty',
  description: 'علامة تجارية متخصصة في صناعة مستحضرات العناية بالبشرة والشعر.',
  openGraph: {
    title: 'Zubaida Beauty',
    description: 'علامة تجارية متخصصة في صناعة مستحضرات العناية بالبشرة والشعر. تهدف لتقديم منتجات تجمع بين المعرفة والجمال.',
    images: [{ url: '/images.jpg', width: 800, height: 800, alt: 'Zubaida Beauty Logo' }],
    locale: 'ar_SY',
    type: 'website',
  },
};

// دالة جلب المنتجات الفعلية من السيرفر
async function getCachedProducts() {
  try {
    const service = new ProductService();
    const data = await service.getNewProducts();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching products on server:', error);
    return [];
  }
}

// مكون مستقل لجلب وتمرير البيانات داخل Suspense
async function ProductsLoader() {
  const initialProducts = await getCachedProducts();
  return <RoadJourneyContent initialProducts={initialProducts} />;
}

export default function Page() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#FFF0F5] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#880E4F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ProductsLoader />
    </Suspense>
  );
}