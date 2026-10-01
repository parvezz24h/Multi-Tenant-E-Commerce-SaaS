import { FormCardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading product form" className="grid gap-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={2} columns={2} />
          <FormCardSkeleton fields={2} columns={2} />
        </div>
        <FormCardSkeleton fields={2} />
      </div>
    </LoadingRegion>
  );
}
