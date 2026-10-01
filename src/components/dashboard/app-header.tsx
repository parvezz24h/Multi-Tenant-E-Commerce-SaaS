import { BrandLogo } from "@/components/brand";
import { UserMenu } from "@/components/dashboard/user-menu";
import { requireUser } from "@/server/auth/session";

export async function AppHeader({ children }: { children?: React.ReactNode }) {
  const user = await requireUser();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4">
        <BrandLogo href="/dashboard" markClassName="size-7" />
        {children}
        <div className="ml-auto">
          <UserMenu
            name={user.name}
            email={user.email}
            isSuperAdmin={user.platformRole === "SUPER_ADMIN"}
          />
        </div>
      </div>
    </header>
  );
}
