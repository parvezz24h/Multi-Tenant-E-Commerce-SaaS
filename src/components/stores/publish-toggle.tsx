"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setStorePublishedAction } from "@/server/stores/actions";

export function PublishToggle({ storeId, published }: { storeId: string; published: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setStorePublishedAction(storeId, !published);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message ?? "Something went wrong.");
    });
  }

  return (
    <Button variant={published ? "outline" : "default"} onClick={toggle} disabled={pending}>
      {pending ? "Saving…" : published ? "Unpublish store" : "Publish store"}
    </Button>
  );
}
