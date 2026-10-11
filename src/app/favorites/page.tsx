'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FavoriteService } from '@/services/favorite_service';

const favoriteService = new FavoriteService();

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    void (async () => {
      await Promise.resolve();
      try {
        const localFavorites = favoriteService.getLocalFavorites();
        if (isActive) setFavorites(localFavorites);
        const items = await favoriteService.getFavorites();
        if (isActive) setFavorites(items);
      } catch (error) {
        console.error('Error loading favorites from account:', error);
        if (isActive) {
          setSyncMessage('تعذر تحديث المفضلة؛ يتم عرض المنتجات المحفوظة على هذا الجهاز.');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const getProductName = (nameField: unknown) => {
    if (!nameField) return 'منتج بدون اسم';
    if (typeof nameField === 'string') return nameField;
    if (typeof nameField === 'object') {
      const names = Object.values(nameField);
      const localizedName = (nameField as Record<string, unknown>)['ar']
        || (nameField as Record<string, unknown>)['en'];
      return String(localizedName || names[0] || 'منتج بدون اسم');
    }
    return 'منتج بدون اسم';
  };

  const handleToggleFavorite = async (productId: string) => {
    try {
      const result = await favoriteService.toggleFavorite(productId);
      setFavorites((current) => current.filter((item) => String(item.id) !== productId));
      if (result.syncError) {
        console.error('Error syncing favorites:', result.syncError);
        setSyncMessage('تم تحديث المفضلة محلياً، وتعذرت مزامنتها مع الحساب.');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      setSyncMessage('تعذر تحديث المفضلة المحفوظة على هذا الجهاز.');
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* هيدر الصفحة */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-primaryRose text-sm font-semibold hover:underline">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-xl font-bold text-deepRose">المفضلة   </h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">
        {syncMessage && (
          <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {syncMessage}
          </p>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-primaryRose border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 bg-surfaceWhite rounded-3xl border border-pink-100 shadow-sm">
            <span className="text-6xl mb-4 block">🤍</span>
            <h2 className="text-lg font-bold text-gray-500">قائمة المفضلة فارغة حالياً   </h2>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((item) => {
              if (!item || typeof item !== 'object') return null;

              const productId = String(item['id'] ?? '');
              if (!productId) return null;
              const productName = getProductName(item['name']);
              const imageUrl = item['thumbnail_url'] ?? item['thumbnailUrl'];

              return (
                <div
                  key={productId}
                  className="bg-surfaceWhite rounded-2xl p-4 border border-pink-100 shadow-sm flex items-center justify-between gap-4"
                >
                  <Link href={`/product/${productId}`} className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                      {imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? (
                        <img src={imageUrl} alt={productName} className="product-image w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">صورة</div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-textDark text-sm line-clamp-1">{productName}</h3>
                      <p className="text-xs text-gray-400 mt-1">انقر لعرض التفاصيل   </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleToggleFavorite(productId)}
                    className="p-2 text-primaryRose hover:scale-110 transition"
                  >
                    ❤️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}