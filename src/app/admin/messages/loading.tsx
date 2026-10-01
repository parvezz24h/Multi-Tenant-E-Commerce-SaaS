import { LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading messages" className="grid gap-6">
      <PageHeaderSkeleton />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </LoadingRegion>
  );
}
