import { FormCardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading store design" className="grid gap-6">
      <PageHeaderSkeleton />
      <FormCardSkeleton fields={2} columns={2} />
      <FormCardSkeleton fields={1} />
      <FormCardSkeleton fields={5} />
    </LoadingRegion>
  );
}
