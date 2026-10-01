import { LoadingRegion, PageHeaderSkeleton, StatTilesSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading platform overview" className="grid gap-6">
      <PageHeaderSkeleton />
      <StatTilesSkeleton count={4} />
    </LoadingRegion>
  );
}
