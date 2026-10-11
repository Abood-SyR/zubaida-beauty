'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationService } from '@/services/notification_service';

export default function NotificationsPage() {
  const notificationService = new NotificationService();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMessage('تأكد من تسجيل الدخول لعرض الإشعارات');   
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <main className="min-h-screen bg-lightPinkBg pb-16" dir="rtl">
      {/* هيدر الصفحة */}
      <header className="bg-surfaceWhite border-b border-pink-100 px-4 py-4 mb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/home" className="text-primaryRose text-sm font-semibold hover:underline">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-xl font-bold text-deepRose">الإشعارات</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-primaryRose border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorMessage ? (
          <div className="text-center py-20 bg-surfaceWhite rounded-3xl border border-pink-100 shadow-sm p-6">
            <p className="text-gray-500 text-base">{errorMessage}</p>   
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-surfaceWhite rounded-3xl border border-pink-100 shadow-sm">
            <span className="text-6xl mb-4 block">🔔</span>
            <h2 className="text-lg font-bold text-gray-500">لا توجد إشعارات حالياً</h2>   
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item, index) => {
              if (!item || typeof item !== 'object') return null;

              const title = item['title'] || '';   
              const message = item['message'] || '';   

              return (
                <div
                  key={index}
                  className="bg-surfaceWhite rounded-2xl p-4 border border-pink-100 shadow-sm flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-deepRose rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                    🔔
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-textDark text-sm mb-1">{title}</h3>   
                    <p className="text-xs text-gray-500 leading-relaxed">{message}</p>   
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}