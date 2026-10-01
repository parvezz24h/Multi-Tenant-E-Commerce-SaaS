import { CardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading order" className="grid gap-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={6} />
          <CardSkeleton lines={4} />
        </div>
        <div className="grid content-start gap-6">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </LoadingRegion>
  );
}
