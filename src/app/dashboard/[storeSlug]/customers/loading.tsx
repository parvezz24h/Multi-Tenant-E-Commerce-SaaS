import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading customers" className="grid gap-6">
      <PageHeaderSkeleton action />
      <TableSkeleton columns={4} rows={10} />
    </LoadingRegion>
  );
}
