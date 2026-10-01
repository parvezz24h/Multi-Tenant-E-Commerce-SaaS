import { CardSkeleton, LoadingRegion } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading cart" className="grid gap-6">
      <Skeleton className="h-7 w-36" />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="divide-y rounded-xl border">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-4 p-4">
              <Skeleton className="size-20 shrink-0 rounded-lg sm:size-24" />
              <div className="grid flex-1 content-start gap-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </div>
        <CardSkeleton lines={5} />
      </div>
    </LoadingRegion>
  );
}
