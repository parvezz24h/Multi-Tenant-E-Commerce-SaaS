"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setContactMessageReadAction } from "@/server/contact/actions";

export function MessageReadToggle({ id, read }: { id: string; read: boolean }) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await setContactMessageReadAction(id, !read);
      if (!result.ok) toast.error(result.message ?? "Something went wrong.");
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={run} disabled={pending}>
      {pending ? "Saving…" : read ? "Mark as new" : "Mark as read"}
    </Button>
  );
}
