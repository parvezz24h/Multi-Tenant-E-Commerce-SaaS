import { LoadingRegion, ProductGridSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading products" className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton count={12} />
    </LoadingRegion>
  );
}
