import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Params = Record<string, string | number | undefined | null>;

/** `/path?a=1&b=2`, dropping empty values. */
export function hrefWith(path: string, params: Params) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

/** GET search form that keeps other filters as hidden fields. */
export function SearchBox({
  action,
  defaultValue,
  placeholder,
  keep = {},
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  keep?: Params;
}) {
  return (
    <form action={action} role="search" className="relative w-full sm:w-72">
      {Object.entries(keep).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={String(value)} /> : null,
      )}
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </form>
  );
}

export function FilterTabs({
  items,
}: {
  items: { label: string; href: string; active: boolean; count?: number }[];
}) {
  return (
    <nav aria-label="Filter" className="-mx-1 flex gap-1 overflow-x-auto px-1">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap",
            item.active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="rounded bg-background px-1.5 text-xs tabular-nums">{item.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
      <span className="mr-2 text-sm text-muted-foreground tabular-nums">
        Page {page} of {pageCount}
      </span>
      {page > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={hrefFor(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}
      {page < pageCount ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={hrefFor(page + 1)}>Next</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}

export function parsePage(value: string | string[] | undefined) {
  const n = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) || undefined;
}
