/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import lottie from 'lottie-web';
import emptyAnimation from '@/assets/empty.json';
import { ApiService } from '@/services/api_client';

const ORDERS_STORAGE_KEY = 'zubaida_my_orders_cache';
const SYNCED_FLAG_KEY = 'zubaida_orders_synced';
const apiService = new ApiService();

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // مرجع لعنصر الـ Lottie Animation للطلبات الفارغة
  const emptyAnimContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orders.length === 0 && !isLoading && emptyAnimContainerRef.current) {
      const anim = lottie.loadAnimation({
        container: emptyAnimContainerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: emptyAnimation,
      });

      return () => {
        anim.destroy();
      };
    }
  }, [orders.length, isLoading]);

  const fetchOrdersFromServer = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiService.client.get('/orders/', {
        queryParameters: { limit: 50, offset: 0 },
      });

      if (response.status === 200) {
        const fetchedOrders = Array.isArray(response.data) ? response.data : [];
        setOrders(fetchedOrders);

        if (typeof window !== 'undefined') {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(fetchedOrders));
          localStorage.setItem(SYNCED_FLAG_KEY, 'true');
        }
      }
    } catch (e: any) {
      setErrorMessage(e?.message || e?.response?.data?.detail || 'فشل تحميل الطلبات');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isActive = true;
    const initializeOrders = async () => {
      await Promise.resolve();
      if (!isActive) return;

      const isSynced = localStorage.getItem(SYNCED_FLAG_KEY);
      const cachedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

      if (isSynced && cachedOrders) {
        try {
          const parsed = JSON.parse(cachedOrders);
          if (isActive) {
            setOrders(Array.isArray(parsed) ? parsed : []);
            setIsLoading(false);
          }
        } catch (error) {
          console.error(error);
          if (isActive) void fetchOrdersFromServer(false);
        }
      } else {
        if (isActive) void fetchOrdersFromServer(false);
      }
    };

    void initializeOrders();
    return () => {
      isActive = false;
    };
  }, [fetchOrdersFromServer]);

  const translateStatus = (status?: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'processing': return 'قيد التجهيز';
      case 'shipping': return 'تم الشحن';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status || 'غير معروف';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'shipping': return 'bg-purple-100 text-purple-600';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* شريط العنوان وزر التحديث اليدوي */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-gray-400">قائمة الطلبات ({orders.length})</span>
        <button
          onClick={() => fetchOrdersFromServer(true)}
          disabled={isRefreshing}
          className="bg-pink-50 text-deepRose border border-pink-200 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:bg-pink-100 flex items-center gap-1.5 cursor-pointer"
          title="تحديث الطلبات"
        >
          <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>تحديث</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surfaceWhite rounded-3xl p-5 border border-pink-100 shadow-sm space-y-3">
              <div className="h-4 bg-pink-100 rounded-full w-32"></div>
              <div className="h-4 bg-pink-100 rounded-full w-24"></div>
            </div>
          ))}
        </div>
      ) : errorMessage && orders.length === 0 ? (
        <div className="bg-surfaceWhite rounded-3xl p-8 text-center border border-pink-100 shadow-sm">
          <p className="text-red-500 text-xs font-bold">{errorMessage}</p>
        </div>
      ) : orders.length === 0 ? (
        /* عرض ملف الـ Lottie Animation للطلبات الفارغة */
        <div className="bg-surfaceWhite rounded-3xl p-10 text-center border border-pink-100 shadow-sm flex flex-col items-center justify-center space-y-2">
          <div className="w-48 h-48 mx-auto flex items-center justify-center">
            <div ref={emptyAnimContainerRef} className="w-full h-full object-contain" />
          </div>
          <p className="text-xs font-bold text-gray-500 mt-2">لا توجد طلبات سابقة حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const orderId = order.id?.toString() || '';
            const shortId = orderId.length > 8 ? orderId.substring(0, 8) : orderId;

            return (
              <Link
                key={order.id}
                href={`/orders/${orderId}`}
                className="block bg-surfaceWhite p-5 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-textDark text-xs">طلب رقم: #{shortId}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {translateStatus(order.status)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                  <span>الإجمالي: <strong className="text-deepRose">{order.total_amount} ل.س</strong></span>
                  <span>{order.created_at ? new Date(order.created_at).toLocaleDateString('ar-SY') : ''}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}