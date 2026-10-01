import { CardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading domain settings" className="grid gap-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={1} />
      <CardSkeleton lines={6} />
    </LoadingRegion>
  );
}
