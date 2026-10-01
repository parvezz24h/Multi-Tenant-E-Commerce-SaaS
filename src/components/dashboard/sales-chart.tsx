"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { DailySales } from "@/server/orders/service";

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longDayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Round up to a clean axis maximum: 1, 2 or 5 × 10^n taka. */
function niceMax(maxTaka: number) {
  if (maxTaka <= 0) return 1000;
  const exp = 10 ** Math.floor(Math.log10(maxTaka));
  const step = [1, 2, 5, 10].find((m) => m * exp >= maxTaka)!;
  return step * exp;
}

const compactTaka = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Single-series column chart of daily sales. No legend (the title names the
 * series), recessive hairline grid, per-bar tooltip on hover and focus, and
 * a table view for screen readers and exact values.
 */
export function SalesChart({ data }: { data: DailySales[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.total, 0);
  const orders = data.reduce((sum, d) => sum + d.orders, 0);
  const maxTaka = niceMax(Math.max(...data.map((d) => d.total)) / 100);
  const ticks = [maxTaka, maxTaka / 2, 0];
  const label = (d: DailySales) => longDayFormat.format(new Date(`${d.day}T00:00:00Z`));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums">{formatMoney(total)}</span>
        <span className="text-sm text-muted-foreground">
          from {orders} {orders === 1 ? "order" : "orders"} in the last {data.length} days
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-3" aria-hidden>
        {/* Y axis */}
        <div className="relative h-40 w-10 text-right text-[11px] text-muted-foreground tabular-nums">
          {ticks.map((t, i) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            >
              ৳{compactTaka.format(t)}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative h-40">
          {ticks.map((t, i) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-border"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5">
            {data.map((d, i) => {
              const height = (d.total / 100 / maxTaka) * 100;
              return (
                <div key={d.day} className="relative flex h-full flex-1 items-end justify-center">
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    className="absolute inset-0 cursor-default"
                    aria-hidden
                  />
                  <div
                    className={cn(
                      "pointer-events-none w-full max-w-6 rounded-t-[4px] bg-primary transition-opacity",
                      active !== null && active !== i && "opacity-40",
                    )}
                    style={{ height: `${height}%`, minHeight: d.total > 0 ? 2 : 0 }}
                  />
                  {active === i && (
                    <div
                      className={cn(
                        "pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-lg border bg-popover px-3 py-2 text-xs shadow-md",
                        i < 3 ? "left-0" : i > data.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      <div className="font-medium">{label(d)}</div>
                      <div className="tabular-nums">{formatMoney(d.total)}</div>
                      <div className="text-muted-foreground">
                        {d.orders} {d.orders === 1 ? "order" : "orders"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* X axis: label a few days, not every bar */}
        <div />
        <div className="mt-2 flex gap-0.5 text-[11px] text-muted-foreground">
          {data.map((d, i) => (
            <span key={d.day} className="flex-1 text-center whitespace-nowrap">
              {i === data.length - 1 ? "Today" : i % 4 === 0 ? dayFormat.format(new Date(`${d.day}T00:00:00Z`)) : ""}
            </span>
          ))}
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
        <table className="mt-3 w-full text-left">
          <caption className="sr-only">Daily sales for the last {data.length} days</caption>
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Orders</th>
              <th className="py-1 text-right font-medium">Sales</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data
              .slice()
              .reverse()
              .map((d) => (
                <tr key={d.day}>
                  <td className="py-1.5">{label(d)}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.orders}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatMoney(d.total)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
