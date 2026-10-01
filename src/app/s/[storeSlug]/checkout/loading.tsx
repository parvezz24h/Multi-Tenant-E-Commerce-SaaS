import { CardSkeleton, FormCardSkeleton, LoadingRegion } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading checkout" className="grid gap-6">
      <Skeleton className="h-7 w-32" />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-6">
          <FormCardSkeleton fields={3} columns={2} />
          <FormCardSkeleton fields={6} columns={2} />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <CardSkeleton lines={6} />
      </div>
    </LoadingRegion>
  );
}
