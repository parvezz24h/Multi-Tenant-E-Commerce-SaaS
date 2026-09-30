import Link from "next/link";
import { redirect } from "next/navigation";

import { siteConfig } from "@/lib/site";
import { getSession } from "@/server/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        {siteConfig.name}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
