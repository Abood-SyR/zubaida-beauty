/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiService } from '@/services/api_client';

const ORDERS_STORAGE_KEY = 'zubaida_my_orders_cache';
const SYNCED_FLAG_KEY = 'zubaida_orders_synced';

export default function MyOrdersPage() {
  const apiService = new ApiService();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // دالة جلب الطلبات من السيرفر وتخزينها محلياً
  const fetchOrdersFromServer = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await apiService.client.get('/orders/', {
        queryParameters: { limit: 50, offset: 0 },
      });

      if (response.status === 200) {
        const fetchedOrders = Array.isArray(response.data) ? response.data : [];
        setOrders(fetchedOrders);

        // حفظ الطلبات في التخزين المحلي وتوثيق أن المزامنة تمت
        if (typeof window !== 'undefined') {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(fetchedOrders));
          localStorage.setItem(SYNCED_FLAG_KEY, 'true');
        }
      }
    } catch (e: any) {
      setErrorMessage(e?.message || e?.response?.data?.detail || 'فشل تحميل الطلبات، تأكد من تسجيل الدخول');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // التحقق من التخزين المحلي عند فتح الصفحة أو التبويب
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSynced = localStorage.getItem(SYNCED_FLAG_KEY);
    const cachedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

    if (isSynced && cachedOrders) {
      try {
        const parsed = JSON.parse(cachedOrders);
        setOrders(Array.isArray(parsed) ? parsed : []);
        setIsLoading(false); // تم الاعتماد على التخزين المحلي ولن يتم إرسال أي طلب للسيرفر
      } catch (e) {
        console.error(e);
        fetchOrdersFromServer(false);
      }
    } else {
      // إذا لم تتم المزامنة من قبل، نقوم بالطلب الأول من السيرفر
      fetchOrdersFromServer(false);
    }
  }, []);

  const translateStatus = (status?: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status || 'غير معروف';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'shipped': return 'bg-purple-100 text-purple-600';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* هيدر الصفحة مع زر التحديث اليدوي */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-primaryRose text-sm font-semibold hover:underline">
            ← العودة للرئيسية
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-deepRose">طلباتي</h1>
            <button
              onClick={() => fetchOrdersFromServer(true)}
              disabled={isRefreshing}
              className="bg-pink-50 text-deepRose border border-pink-200 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:bg-pink-100 flex items-center gap-1.5"
              title="تحديث الطلبات"
            >
              <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>تحديث</span>
            </button>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {isLoading ? (
          /* هيكل وهمي (Shimmer) للتحميل الأولي */
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-pink-100 rounded-full w-28"></div>
                  <div className="h-6 bg-pink-100 rounded-full w-20"></div>
                </div>
                <div className="h-4 bg-pink-100 rounded-full w-full"></div>
              </div>
            ))}
          </div>
        ) : errorMessage && orders.length === 0 ? (
          <div className="text-center py-20 bg-surfaceWhite rounded-3xl border border-pink-100 shadow-sm p-6">
            <p className="text-red-500 font-medium text-sm">{errorMessage}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-surfaceWhite rounded-3xl border border-pink-100 shadow-sm">
            <span className="text-6xl mb-4 block">📦</span>
            <h2 className="text-lg font-bold text-gray-500">لا توجد طلبات سابقة حالياً</h2>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const orderId = order['id']?.toString() || '';
              const shortId = orderId.length > 8 ? orderId.substring(0, 8) : orderId;

              return (
                <Link
                  key={orderId}
                  href={`/orders/${orderId}`}
                  className="block bg-surfaceWhite rounded-3xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-pink-50 text-deepRose flex items-center justify-center font-bold text-xs">🛍️</span>
                      <span className="font-black text-textDark text-base">طلب #{shortId}</span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(order['status'])}`}>
                      {translateStatus(order['status'])}
                    </span>
                  </div>

                  <hr className="border-pink-100" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold">المجموع الكلي:</span>
                    <span className="text-sm font-black text-deepRose">{order['total_amount']} ل.س</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}