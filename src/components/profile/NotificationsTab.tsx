/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

export default function NotificationsTab({ notifications }: { notifications: any[] }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl text-center shadow-sm">
        <p className="text-xs font-bold text-textDark/60">لا توجد إشعارات جديدة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div key={notif.id} className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-sm space-y-1">
          <h4 className="text-xs font-black text-deepRose">{notif.title}</h4>
          <p className="text-xs text-textDark/80 font-bold">{notif.message}</p>
          <span className="text-[10px] text-textDark/40 block pt-1">{notif.date}</span>
        </div>
      ))}
    </div>
  );
}