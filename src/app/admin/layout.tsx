import Link from "next/link";

import { AppHeader } from "@/components/dashboard/app-header";
import { requireSuperAdmin } from "@/server/auth/session";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/users", label: "Users" },
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireSuperAdmin();

  return (
    <>
      <AppHeader>
        <span className="text-muted-foreground" aria-hidden>
          /
        </span>
        <span className="font-medium">Platform admin</span>
      </AppHeader>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <nav aria-label="Admin" className="mb-6 flex gap-1 border-b">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </>
  );
}
