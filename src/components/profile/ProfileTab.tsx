/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast_provider';
import { ApiService } from '@/services/api_client';

const CACHE_KEY = 'zubaida_profile_cache_data';

export default function ProfileTab({ userData, onUpdate }: { userData: any; onUpdate: (updatedUser: any) => void }) {
  const showToast = useToast();
  const apiService = new ApiService();
  const [detailedAddress, setDetailedAddress] = useState(userData?.address?.detailed || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUpdating(true);
    try {
      const response = await apiService.client.patch('/auth/me/profile', {
        address: { detailed: detailedAddress.trim() }
      });

      if (response.status === 200) {
        showToast('تم حفظ عنوان التوصيل بنجاح', 'success');
        const updatedUser = {
          ...userData,
          address: { ...(userData?.address || {}), detailed: detailedAddress.trim() }
        };
        onUpdate(updatedUser);

        // تحديث التخزين المحلي مباشرة
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.userData = updatedUser;
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
          }
        }
      } else {
        showToast(response.data?.detail || 'فشل حفظ العنوان', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpdateAddress} className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-pink-100">
        <h3 className="text-xs font-black text-deepRose flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>عنوان مكان لتوصيل الطلبات (اختياري)</span>
        </h3>
        <p className="text-[11px] text-textDark/70 font-bold">يمكنك إدخال أو تعديل تفاصيل عنوانك (المدينة، الحي، الشارع، البناء) لتسهيل توصيل طلباتك.</p>
        <textarea
          value={detailedAddress}
          onChange={(e) => setDetailedAddress(e.target.value)}
          rows={3}
          placeholder="مثال: دمشق، المزة، شارع الفردوس، بناء رقم 12"
          className="w-full p-4 rounded-2xl border border-pink-200 text-xs text-textDark font-bold bg-pink-50/30 focus:outline-none focus:ring-2 focus:ring-deepRose/40 resize-none"
        />
        <button
          type="submit"
          disabled={isUpdating}
          className="w-full h-12 bg-deepRose text-white font-black rounded-2xl hover:bg-primaryRose transition shadow-md text-xs"
        >
          {isUpdating ? 'جاري الحفظ...' : 'حفظ عنوان التوصيل'}
        </button>
      </form>
    </div>
  );
}