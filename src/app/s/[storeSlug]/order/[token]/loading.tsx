import { CardSkeleton, LoadingRegion } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading order" className="mx-auto grid max-w-2xl gap-8">
      <div className="grid justify-items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-12 w-full" />
      <CardSkeleton lines={5} />
      <CardSkeleton lines={3} />
    </LoadingRegion>
  );
}
