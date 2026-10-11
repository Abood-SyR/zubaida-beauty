import { Suspense } from "react";
import GroupDetailPage from "@/app/groups/[id]/page";
import PageLoadingSkeleton from "@/components/ui/page_loading_skeleton";

export default function Page() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <GroupDetailPage />
    </Suspense>
  );
}
