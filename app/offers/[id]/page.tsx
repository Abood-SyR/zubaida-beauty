import { Suspense } from "react";
import OfferDetailPage from "@/app/offers/[id]/page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل العرض...</div>}>
      <OfferDetailPage />
    </Suspense>
  );
}
