import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { MessageReadToggle } from "@/components/admin/message-read-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { requireSuperAdmin } from "@/server/auth/session";
import { topicLabel } from "@/server/contact/schemas";
import { listContactMessages } from "@/server/contact/service";

export const metadata: Metadata = { title: "Messages" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dhaka",
});

export default async function AdminMessagesPage() {
  await requireSuperAdmin();
  const messages = await listContactMessages();
  const unread = messages.filter((m) => m.status === "NEW").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Messages"
        description={
          unread
            ? `${unread} new message${unread === 1 ? "" : "s"} from the contact page.`
            : "Messages sent from the contact page."
        }
      />
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No messages yet.
        </div>
      ) : (
        <ul className="grid gap-4">
          {messages.map((m) => {
            const isNew = m.status === "NEW";
            return (
              <li
                key={m.id}
                className={cn("grid gap-3 rounded-xl border p-5", isNew && "border-primary/40 bg-primary/5")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {m.name}
                      {isNew && <Badge>New</Badge>}
                      <Badge variant="outline">{topicLabel(m.topic)}</Badge>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                        <Mail className="size-3.5" aria-hidden /> {m.email}
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                          <Phone className="size-3.5" aria-hidden /> {m.phone}
                        </a>
                      )}
                      <time dateTime={m.createdAt.toISOString()}>{dateFormat.format(m.createdAt)}</time>
                    </div>
                  </div>
                  <MessageReadToggle id={m.id} read={!isNew} />
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
