import { PackageX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function StorefrontNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PackageX className="size-6" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">This product or page doesn&apos;t exist anymore.</p>
      <Button asChild>
        <Link href="/products">Browse products</Link>
      </Button>
    </div>
  );
}
