import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Building blocks for `loading.tsx` files. Each mirrors the shape of the real
 * component so the page doesn't jump when content streams in.
 */

/** Screen-reader text for a loading region (skeletons themselves are aria-hidden). */
export function LoadingRegion({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton({ action = false, description = true }: { action?: boolean; description?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-48" />
        {description && <Skeleton className="h-4 w-72 max-w-[70vw]" />}
      </div>
      {action && <Skeleton className="h-9 w-32" />}
    </div>
  );
}

export function FilterBarSkeleton({ tabs = 4, search = true }: { tabs?: number; search?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        {Array.from({ length: tabs }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      {search && <Skeleton className="h-9 w-full sm:w-72" />}
    </div>
  );
}

export function TableSkeleton({
  rows = 8,
  columns = 4,
  thumbnail = false,
}: {
  rows?: number;
  columns?: number;
  thumbnail?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex gap-4 border-b bg-muted/30 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className={cn("h-4", i === 0 ? "w-40 flex-1" : "w-20")} />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {thumbnail && <Skeleton className="size-10 shrink-0" />}
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-2/5 min-w-32" />
              <Skeleton className="h-3 w-1/4 min-w-20" />
            </div>
            {Array.from({ length: columns - 1 }, (_, c) => (
              <Skeleton key={c} className="hidden h-4 w-20 sm:block" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatTilesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="grid gap-2 rounded-xl border p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3, title = true, className }: { lines?: number; title?: boolean; className?: string }) {
  return (
    <div className={cn("grid gap-4 rounded-xl border p-6", className)}>
      {title && <Skeleton className="h-5 w-36" />}
      <div className="grid gap-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn("h-4", i % 3 === 2 ? "w-3/5" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function FormCardSkeleton({ fields = 3, columns = 1 }: { fields?: number; columns?: 1 | 2 }) {
  return (
    <div className="grid gap-5 rounded-xl border p-6">
      <Skeleton className="h-5 w-32" />
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Storefront ───────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
