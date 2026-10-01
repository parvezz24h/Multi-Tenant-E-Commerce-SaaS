import { cookies } from "next/headers";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Sidebar layout used by the merchant dashboard and the platform admin.
 * The collapsed/expanded state is remembered in the `sidebar_state` cookie
 * (written by the sidebar component) so it survives reloads without a flash.
 */
export async function SidebarShell({
  sidebar,
  topbar,
  topbarEnd,
  children,
}: {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  topbarEnd?: React.ReactNode;
  children: React.ReactNode;
}) {
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        {sidebar}
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <div className="min-w-0 flex-1">{topbar}</div>
            {topbarEnd}
          </header>
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
