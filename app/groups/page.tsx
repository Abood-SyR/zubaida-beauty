import { Suspense } from "react";
import GroupsPage from "@/app/groups/page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جارٍ تحميل المجموعات...</div>}>
      <GroupsPage />
    </Suspense>
  );
}
