import { FormCardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading settings" className="grid gap-6">
      <PageHeaderSkeleton />
      <FormCardSkeleton fields={4} />
      <FormCardSkeleton fields={4} columns={2} />
      <FormCardSkeleton fields={2} columns={2} />
    </LoadingRegion>
  );
}
