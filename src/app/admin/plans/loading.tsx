import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading plans" className="grid gap-6">
      <PageHeaderSkeleton />
      <TableSkeleton columns={5} rows={6} />
    </LoadingRegion>
  );
}
