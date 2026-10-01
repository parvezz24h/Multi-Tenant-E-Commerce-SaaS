"use client";

import { ArrowLeft, Layers, LayoutDashboard, ReceiptText, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark, BrandName } from "@/components/brand";
import { SidebarUserMenu, type SidebarUser } from "@/components/dashboard/sidebar-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Billing", href: "/admin/billing", icon: ReceiptText },
  { label: "Plans", href: "/admin/plans", icon: Layers },
];

export function AdminSidebar({ user, invoicesToReview }: { user: SidebarUser; invoicesToReview: number }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <BrandMark />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <BrandName className="truncate" />
                  <span className="truncate text-xs text-muted-foreground">Platform admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map(({ label, href, icon: Icon }) => {
                const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link href={href} onClick={() => setOpenMobile(false)}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {href === "/admin/billing" && invoicesToReview > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-primary text-primary-foreground">
                        {invoicesToReview}
                        <span className="sr-only"> to verify</span>
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to my stores">
                  <Link href="/dashboard">
                    <ArrowLeft />
                    <span>Back to my stores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
