import { LoadingRegion, ProductGridSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading store" className="grid gap-12">
      <Skeleton className="h-64 w-full rounded-2xl sm:h-80" />
      <div className="grid gap-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-6 w-48" />
        <ProductGridSkeleton />
      </div>
    </LoadingRegion>
  );
}
