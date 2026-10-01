import { LoadingRegion } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading product" className="grid gap-12">
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="grid gap-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid content-start gap-5">
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
