import { CardSkeleton, FormCardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading customer" className="grid gap-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <CardSkeleton lines={6} />
        <div className="grid content-start gap-6">
          <CardSkeleton lines={3} />
          <FormCardSkeleton fields={3} />
        </div>
      </div>
    </LoadingRegion>
  );
}
