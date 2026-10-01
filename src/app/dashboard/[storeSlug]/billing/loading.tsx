import { CardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading subscription" className="grid gap-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={3} />
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
      <CardSkeleton lines={4} />
    </LoadingRegion>
  );
}
