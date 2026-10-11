import { Suspense } from "react";
import ProductDetailPage from "@/app/product/[id]/page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل المنتج...</div>}>
      <ProductDetailPage />
    </Suspense>
  );
}
