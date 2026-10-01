import { FilterBarSkeleton, LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading products" className="grid gap-6">
      <PageHeaderSkeleton action />
      <FilterBarSkeleton />
      <TableSkeleton columns={4} rows={10} thumbnail />
    </LoadingRegion>
  );
}
