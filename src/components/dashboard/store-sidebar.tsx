"use client";

import {
  Boxes,
  Check,
  ChevronsUpDown,
  CreditCard,
  ExternalLink,
  FolderTree,
  Globe,
  LayoutDashboard,
  Package,
  Palette,
  Plus,
  Settings,
  ShoppingCart,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { StoreStatus } from "@/generated/prisma/enums";

import { SidebarUserMenu, type SidebarUser } from "./sidebar-user-menu";

type NavItem = {
  label: string;
  icon: LucideIcon;
  /** Path below the store base; omit for roadmap items shown as "Soon". */
  path?: string;
  /** External link (opens in a new tab). */
  external?: string;
  badge?: number;
};

type Props = {
  store: { name: string; slug: string; status: StoreStatus; url: string };
  stores: { name: string; slug: string }[];
  canCreateStore: boolean;
  pendingOrders: number;
  /** Owner-only sections are hidden from staff who can't open them. */
  canManageDomain: boolean;
  user: SidebarUser;
};

const STATUS_LABEL: Record<StoreStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Live",
  SUSPENDED: "Suspended",
};

export function StoreSidebar({ store, stores, canCreateStore, pendingOrders, canManageDomain, user }: Props) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const base = `/dashboard/${store.slug}`;

  const groups: { label?: string; items: NavItem[] }[] = [
    { items: [{ label: "Overview", icon: LayoutDashboard, path: "" }] },
    {
      label: "Sales",
      items: [
        { label: "Orders", icon: ShoppingCart, path: "/orders", badge: pendingOrders },
        { label: "Customers", icon: Users, path: "/customers" },
        { label: "Coupons", icon: Ticket },
      ],
    },
    {
      label: "Catalog",
      items: [
        { label: "Products", icon: Package, path: "/products" },
        { label: "Categories", icon: FolderTree, path: "/categories" },
        { label: "Inventory", icon: Boxes, path: "/inventory" },
      ],
    },
    {
      label: "Online store",
      items: [
        { label: "Store design", icon: Palette, path: "/design" },
        ...(store.status === "ACTIVE"
          ? [{ label: "View store", icon: ExternalLink, external: store.url }]
          : []),
        ...(canManageDomain ? [{ label: "Domain", icon: Globe, path: "/domain" }] : []),
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Settings", icon: Settings, path: "/settings" },
        { label: "Payments", icon: Wallet },
        { label: "Subscription", icon: CreditCard },
      ],
    },
  ];

  function isActive(path: string) {
    const href = `${base}${path}`;
    // Overview is exact; sections stay active on their nested pages.
    return path === "" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{store.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{STATUS_LABEL[store.status]}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Your stores</DropdownMenuLabel>
                {stores.map((s) => (
                  <DropdownMenuItem key={s.slug} asChild>
                    <Link href={`/dashboard/${s.slug}`}>
                      <span className="flex size-6 items-center justify-center rounded-md border text-xs">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{s.name}</span>
                      {s.slug === store.slug && <Check className="ml-auto" />}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {canCreateStore && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/onboarding">
                        <Plus /> Create store
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? i}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    {item.path !== undefined ? (
                      <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.label}>
                        <Link href={`${base}${item.path}`} onClick={() => setOpenMobile(false)}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : item.external ? (
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <a href={item.external} target="_blank" rel="noopener noreferrer">
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        aria-disabled
                        tooltip={`${item.label} — coming soon`}
                        className="cursor-default opacity-50 hover:bg-transparent"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                    {item.badge ? (
                      <SidebarMenuBadge className="rounded-full bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground">
                        {item.badge > 99 ? "99+" : item.badge}
                        <span className="sr-only"> pending</span>
                      </SidebarMenuBadge>
                    ) : item.path === undefined && !item.external ? (
                      <SidebarMenuBadge className="text-[10px] font-normal text-muted-foreground">
                        Soon
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
