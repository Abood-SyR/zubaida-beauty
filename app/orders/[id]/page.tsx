import { Suspense } from "react";
import OrderDetailPage from "@/app/orders/[id]/page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل الطلب...</div>}>
      <OrderDetailPage />
    </Suspense>
  );
}
