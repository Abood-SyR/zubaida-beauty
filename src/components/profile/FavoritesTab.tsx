/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FavoriteService } from '@/services/favorite_service';

const favoriteService = new FavoriteService();

export default function FavoritesTab({ favorites: initialFavorites }: { favorites?: any[] }) {
  const [favorites, setFavorites] = useState<any[]>(initialFavorites || []);
  const [isLoading, setIsLoading] = useState(!initialFavorites);

  useEffect(() => {
    let isActive = true;
    void (async () => {
      try {
        // جلب المفضلة باستخدام خدمة المفضلة لضمان مطابقتها لصفحة المفضلة الرئيسية
        const localFavorites = favoriteService.getLocalFavorites();
        if (isActive && localFavorites.length > 0) {
          setFavorites(localFavorites);
        }
        const items = await favoriteService.getFavorites();
        if (isActive && items && items.length > 0) {
          setFavorites(items);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
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
      await favoriteService.toggleFavorite(productId);
      setFavorites((current) => current.filter((item) => String(item.id) !== productId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10 bg-white rounded-3xl border border-pink-100 shadow-sm">
        <div className="w-6 h-6 border-3 border-deepRose border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-pink-100">
        <span className="text-4xl mb-2 block">🤍</span>
        <p className="text-xs font-bold text-textDark/60">قائمة المفضلة فارغة حالياً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((item: any, index: number) => {
        if (!item || typeof item !== 'object') return null;

        const productId = String(item['id'] ?? index);
        const productName = getProductName(item['name']);
        const imageUrl = item['thumbnail_url'] ?? item['thumbnailUrl'];

        return (
          <div
            key={productId}
            className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex items-center justify-between gap-4"
          >
            <Link href={`/product/${productId}`} className="flex items-center gap-3 flex-1">
              <div className="w-14 h-14 bg-pink-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-deepRose font-bold">صورة</span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-textDark line-clamp-1">{productName}</h4>
                <p className="text-[11px] text-deepRose font-bold mt-1">
                  {item.price ? `${item.price} ل.س` : 'انقر لعرض التفاصيل'}
                </p>
              </div>
            </Link>

            <button
              onClick={() => handleToggleFavorite(productId)}
              className="p-2 text-deepRose hover:scale-110 transition"
              title="إزالة من المفضلة"
            >
              ❤️
            </button>
          </div>
        );
      })}
    </div>
  );
}