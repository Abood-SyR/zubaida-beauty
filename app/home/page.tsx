import { Suspense } from "react";
import HomeScreen from "@/app/home/page";
import PageLoadingSkeleton from "@/components/ui/page_loading_skeleton";

export default function Page() {
  return (
    <Suspense fallback={<PageLoadingSkeleton variant="category" />}>
      <HomeScreen />
    </Suspense>
  );
}
