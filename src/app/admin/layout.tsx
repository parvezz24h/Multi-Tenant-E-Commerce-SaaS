import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { SidebarShell } from "@/components/dashboard/sidebar-shell";
import { requireSuperAdmin } from "@/server/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireSuperAdmin();

  return (
    <SidebarShell
      sidebar={<AdminSidebar user={{ name: admin.name, email: admin.email, isSuperAdmin: true }} />}
      topbar={<Breadcrumbs base="/admin" rootLabel="Platform admin" />}
    >
      {children}
    </SidebarShell>
  );
}
