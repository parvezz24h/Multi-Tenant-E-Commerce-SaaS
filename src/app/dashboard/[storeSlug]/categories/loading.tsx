import { FormCardSkeleton, LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading categories" className="grid gap-6">
      <PageHeaderSkeleton />
      <FormCardSkeleton fields={4} columns={2} />
      <TableSkeleton columns={2} rows={5} />
    </LoadingRegion>
  );
}
