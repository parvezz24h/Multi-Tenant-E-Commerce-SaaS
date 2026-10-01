import { CardSkeleton, FilterBarSkeleton, LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading inventory" className="grid gap-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton tabs={3} />
      <TableSkeleton columns={4} rows={10} />
      <CardSkeleton lines={5} />
    </LoadingRegion>
  );
}
