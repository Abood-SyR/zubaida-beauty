import RoadJourneyContent from '../src/app/RoadJourneyContent';
import { ProductService } from '../src/services/product_service';

export const metadata = {
  title: 'شركة زُبيدة بيوتي | مستحضرات العناية الطبيعية',
  description: 'تأسست زُبيدة بيوتي عام 2021 لتقديم أرقى مستحضرات التجميل والعناية الطبيعية تحت إشراف خبيرة معتمدة.',
  openGraph: {
    title: 'شركة زُبيدة بيوتي | مستحضرات العناية الطبيعية',
    description: 'تأسست زُبيدة بيوتي عام 2021 لتقديم أرقى مستحضرات التجميل والعناية الطبيعية تحت إشراف خبيرة معتمدة.',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'Zubaida Beauty Logo',
      },
    ],
    locale: 'ar_SY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'شركة زُبيدة بيوتي | مستحضرات العناية الطبيعية',
    description: 'تأسست زُبيدة بيوتي عام 2021 لتقديم أرقى مستحضرات التجميل والعناية الطبيعية.',
    images: ['/logo.png'],
  },
};

/* جلب البيانات وتخزينها مؤقتاً على الخادم للسرعة الفائقة */
async function getCachedProducts() {
  try {
    const service = new ProductService();
    // يمكنك تعديل هذه الدالة حسب طريقة التخزين أو جلب المنتجات المتاحة لديك
    const data = await service.getNewProducts();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching products on server:', error);
    return [];
  }
}

export default async function Page() {
  const initialProducts = await getCachedProducts();

  return <RoadJourneyContent initialProducts={initialProducts} />;
}