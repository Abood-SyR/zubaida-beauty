/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast_provider';
import { ApiService } from '@/services/api_client';

import ProfileTab from '@/components/profile/ProfileTab';
import OrdersTab from '@/components/profile/OrdersTab';
import NotificationsTab from '@/components/profile/NotificationsTab';

const CACHE_KEY = 'zubaida_profile_cache_data';

export default function ProfilePage() {
  const showToast = useToast();
  const apiService = new ApiService();

  const [userData, setUserData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'notifications'>('profile');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      setIsLoading(false);
      showToast('يرجى تسجيل الدخول لعرض الملف الشخصي', 'error');
      return;
    }

    // محاولة قراءة البيانات من الكاش المحلي
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.userData) {
          setUserData(parsed.userData);
          setOrders(parsed.orders || []);
          setNotifications(parsed.notifications || []);
          setIsLoading(false);
          return; // التوقف وعدم إرسال أي طلب للسيرفر طالما البيانات موجودة محلياً
        }
      } catch (e) {
        console.error(e);
      }
    }

    // إذا لم تكن البيانات موجودة محلياً فقط، يتم جلبها من السيرفر لمرة واحدة
    const fetchUserData = async () => {
      try {
        const profileRes = await apiService.client.get('/auth/me');

        if (profileRes && profileRes.status === 200) {
          const freshUser = profileRes.data;
          setUserData(freshUser);

          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              userData: freshUser,
              orders: [],
              notifications: [],
            })
          );
        }
      } catch (e: any) {
        showToast(e?.message || 'حدث خطأ أثناء تحميل البيانات', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem(CACHE_KEY);
      window.location.href = '/auth/login';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FFF5F7] pb-16 relative" dir="rtl">
        <header className="bg-white border-b border-pink-100 px-6 py-4 sticky top-0 z-40">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div className="h-4 bg-pink-100 rounded-full w-16 animate-pulse"></div>
            <div className="h-5 bg-pink-100 rounded-full w-24 animate-pulse"></div>
            <div className="h-4 bg-pink-100 rounded-full w-10 animate-pulse"></div>
          </div>
        </header>

        <div className="max-w-xl mx-auto px-4 pt-6 space-y-6 animate-pulse">
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center border border-pink-100 space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-pink-100"></div>
            <div className="h-5 bg-pink-100 rounded-full w-32 mx-auto"></div>
            <div className="h-4 bg-pink-100 rounded-full w-24 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!userData) {
    return (
      <main className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-6" dir="rtl">
        <div className="text-center bg-white rounded-3xl p-8 shadow-sm max-w-sm w-full space-y-4 border border-pink-100">
          <div className="w-16 h-16 bg-pink-100 text-deepRose rounded-full mx-auto flex items-center justify-center font-bold text-2xl">
            !
          </div>
          <p className="text-textDark text-sm font-bold">يرجى تسجيل الدخول لعرض الملف الشخصي</p>
          <Link
            href="/auth/login"
            className="block w-full bg-deepRose text-white font-black py-3 rounded-2xl shadow-md text-sm text-center hover:bg-primaryRose transition"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF5F7] pb-16 relative" dir="rtl">
      
      <header className="bg-white border-b border-pink-100 px-6 py-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <Link href="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-deepRose hover:scale-105 transition">
            <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>الرئيسية</span>
          </Link>
          <h1 className="text-base font-black text-deepRose">الملف الشخصي</h1>
          <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:opacity-80 transition">
            خروج
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-6 relative z-10 space-y-6">

        <div className="bg-white rounded-3xl p-6 shadow-sm text-center relative border border-pink-100">
          <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden shadow-sm bg-pink-50 flex items-center justify-center">
            {userData?.avatar_url ? (
              <Image src={userData.avatar_url} alt="Profile Avatar" fill className="object-cover" />
            ) : (
              <svg className="w-10 h-10 text-deepRose" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          
          <h2 className="text-base font-black text-textDark">
            {userData?.full_name || userData?.username || userData?.name || 'عميل زبيدة بيوتي'}
          </h2>
          <p className="text-xs font-bold text-textDark/60 mt-1">
            {userData?.phone_number || userData?.phone || 'غير متوفر'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-2xl shadow-xs border border-pink-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 text-[11px] font-black rounded-xl transition ${activeTab === 'profile' ? 'bg-deepRose text-white shadow-sm' : 'text-textDark/70 hover:bg-pink-50'}`}
          >
            حسابي
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 text-[11px] font-black rounded-xl transition ${activeTab === 'orders' ? 'bg-deepRose text-white shadow-sm' : 'text-textDark/70 hover:bg-pink-50'}`}
          >
            طلباتي ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 text-[11px] font-black rounded-xl transition ${activeTab === 'notifications' ? 'bg-deepRose text-white shadow-sm' : 'text-textDark/70 hover:bg-pink-50'}`}
          >
            الإشعارات
          </button>
        </div>

        {activeTab === 'profile' && <ProfileTab userData={userData} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} />}
        {activeTab === 'notifications' && <NotificationsTab notifications={notifications} />}

      </div>
    </main>
  );
}