import { Banknote, ClipboardList, ShoppingCart } from "lucide-react";

const ORDERS = [
  { no: "#1045", name: "Nusrat J.", place: "Mirpur, Dhaka", total: "৳2,410", status: "Pending", style: "bg-amber-100 text-amber-900" },
  { no: "#1044", name: "Tanvir A.", place: "Chattogram", total: "৳1,920", status: "Confirmed", style: "bg-sky-100 text-sky-900" },
  { no: "#1043", name: "Farhana A.", place: "Dhanmondi, Dhaka", total: "৳1,910", status: "Shipped", style: "bg-violet-100 text-violet-900" },
  { no: "#1042", name: "Rakib H.", place: "Sylhet", total: "৳2,620", status: "Delivered", style: "bg-emerald-100 text-emerald-900" },
];

// Relative bar heights for the mini sales chart (illustrative only).
const BARS = [30, 45, 25, 60, 40, 70, 55, 80, 50, 65, 85, 72, 90, 78];

/** Illustration of the merchant dashboard. Decorative; the text beside it explains. */
export function DashboardPreview() {
  return (
    <div aria-hidden className="overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-foreground/10">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-3 text-[11px] text-muted-foreground">Dashboard · Overview</span>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Banknote, label: "Sales today", value: "৳8,960" },
            { icon: ShoppingCart, label: "Orders today", value: "12" },
            { icon: ClipboardList, label: "To handle", value: "3", hot: true },
          ].map(({ icon: Icon, label, value, hot }) => (
            <div key={label} className="grid gap-2 rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-muted-foreground">{label}</span>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${hot ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                >
                  <Icon className="size-3.5" />
                </span>
              </div>
              <span className="text-base font-semibold tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium">Sales · last 14 days</p>
          <div className="mt-3 flex h-20 items-end gap-1">
            {BARS.map((h, i) => (
              <span key={i} className="flex-1 rounded-t-[3px] bg-primary/80" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <ul className="divide-y rounded-xl border">
          {ORDERS.map((o) => (
            <li key={o.no} className="flex items-center gap-3 px-3 py-2.5 text-xs">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                {o.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{o.no}</span> <span className="text-muted-foreground">· {o.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{o.place}</span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${o.style}`}>{o.status}</span>
              <span className="w-14 text-right font-medium tabular-nums">{o.total}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
