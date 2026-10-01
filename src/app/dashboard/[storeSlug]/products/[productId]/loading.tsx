import { FormCardSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading product" className="grid gap-6">
      <PageHeaderSkeleton action />
      <div className="grid gap-4 rounded-xl border p-6">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={2} columns={2} />
        </div>
        <FormCardSkeleton fields={2} />
      </div>
    </LoadingRegion>
  );
}
