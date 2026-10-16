/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import emptyAnimation from '@/assets/ComingSoon.json';

interface NotificationsTabProps {
  notifications: any[];
  onRefresh?: () => Promise<void> | void; // دالة اختيارية لتحديث الإشعارات إن وجدت
}

export default function NotificationsTab({ notifications, onRefresh }: NotificationsTabProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const emptyAnimContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((!notifications || notifications.length === 0) && emptyAnimContainerRef.current) {
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
  }, [notifications]);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* شريط العنوان (عدد الإشعارات) وزر التحديث اليدوي */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-gray-400">
          الإشعارات ({notifications?.length || 0})
        </span>
        {onRefresh && (
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-pink-50 text-deepRose border border-pink-200 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:bg-pink-100 flex items-center gap-1.5 cursor-pointer"
            title="تحديث الإشعارات"
          >
            <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>تحديث</span>
          </button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl text-center shadow-sm flex flex-col items-center justify-center space-y-2 border border-pink-100">
          <div className="w-48 h-48 mx-auto flex items-center justify-center">
            <div ref={emptyAnimContainerRef} className="w-full h-full object-contain" />
          </div>
          <p className="text-xs font-bold text-textDark/60 mt-2">قريباً...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div key={notif.id} className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-pink-100 space-y-1">
              <h4 className="text-xs font-black text-deepRose">{notif.title}</h4>
              <p className="text-xs text-textDark/80 font-bold">{notif.message}</p>
              <span className="text-[10px] text-textDark/40 block pt-1">{notif.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}