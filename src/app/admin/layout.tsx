import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { SidebarShell } from "@/components/dashboard/sidebar-shell";
import { requireSuperAdmin } from "@/server/auth/session";
import { countInvoicesToReview } from "@/server/billing/admin";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireSuperAdmin();
  const invoicesToReview = await countInvoicesToReview();

  return (
    <SidebarShell
      sidebar={
        <AdminSidebar
          user={{ name: admin.name, email: admin.email, isSuperAdmin: true }}
          invoicesToReview={invoicesToReview}
        />
      }
      topbar={<Breadcrumbs base="/admin" rootLabel="Platform admin" labels={{ billing: "Billing" }} />}
    >
      {children}
    </SidebarShell>
  );
}
