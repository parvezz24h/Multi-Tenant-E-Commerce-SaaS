import { CardSkeleton, LoadingRegion, PageHeaderSkeleton, StatTilesSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading overview" className="grid gap-6">
      <PageHeaderSkeleton action />
      <StatTilesSkeleton />
      <CardSkeleton lines={5} />
      <CardSkeleton lines={4} />
    </LoadingRegion>
  );
}
