import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSession } from "@/server/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      {/* Same header as the marketing pages; signed-in users never get here. */}
      <SiteHeader signedIn={false} />
      <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
