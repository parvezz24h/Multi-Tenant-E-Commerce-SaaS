import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/server/auth/session";
import { listUsers } from "@/server/admin/service";

export const metadata: Metadata = { title: "Users" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" });

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  const users = await listUsers();

  return (
    <div className="grid gap-6">
      <PageHeader title="Users" description="Everyone with an account." />
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Stores</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.platformRole === "SUPER_ADMIN" ? (
                    <Badge>Super admin</Badge>
                  ) : (
                    <span className="text-muted-foreground">User</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{user._count.memberships}</TableCell>
                <TableCell>{dateFormat.format(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
