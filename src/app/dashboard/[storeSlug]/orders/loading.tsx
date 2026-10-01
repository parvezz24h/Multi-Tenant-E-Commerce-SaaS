import { FilterBarSkeleton, LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading orders" className="grid gap-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton tabs={6} />
      <TableSkeleton columns={5} rows={10} />
    </LoadingRegion>
  );
}
