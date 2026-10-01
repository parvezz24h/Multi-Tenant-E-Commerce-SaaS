import { CardSkeleton, LoadingRegion, PageHeaderSkeleton, StatTilesSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading overview" className="grid gap-6">
      <PageHeaderSkeleton action />
      <StatTilesSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-4 rounded-xl border p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
        <CardSkeleton lines={4} />
      </div>
      <CardSkeleton lines={5} />
    </LoadingRegion>
  );
}
