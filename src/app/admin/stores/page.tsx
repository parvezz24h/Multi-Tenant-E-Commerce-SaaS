import type { Metadata } from "next";

import { SuspendStoreButton } from "@/components/admin/suspend-store-button";
import { StoreStatusBadge } from "@/components/stores/store-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { storeHostname } from "@/lib/site";
import { requireSuperAdmin } from "@/server/auth/session";
import { listStores } from "@/server/admin/service";

export const metadata: Metadata = { title: "Stores" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" });

export default async function AdminStoresPage() {
  await requireSuperAdmin();
  const stores = await listStores();

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Store</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No stores yet.
              </TableCell>
            </TableRow>
          )}
          {stores.map((store) => {
            const owner = store.members[0]?.user;
            return (
              <TableRow key={store.id}>
                <TableCell>
                  <div className="font-medium">{store.name}</div>
                  <div className="text-xs text-muted-foreground">{storeHostname(store.slug)}</div>
                </TableCell>
                <TableCell>
                  {owner ? (
                    <>
                      <div>{owner.name}</div>
                      <div className="text-xs text-muted-foreground">{owner.email}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StoreStatusBadge status={store.status} />
                </TableCell>
                <TableCell>{dateFormat.format(store.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <SuspendStoreButton
                    storeId={store.id}
                    storeName={store.name}
                    suspended={store.status === "SUSPENDED"}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
