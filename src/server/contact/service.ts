import "server-only";

import { db } from "@/lib/db";
import { AppError } from "@/server/errors";

import type { ContactMessageInput } from "./schemas";

/** Per-IP limit on contact form submissions. */
export const CONTACT_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

export async function createContactMessage(input: ContactMessageInput, ipAddress: string | null) {
  if (ipAddress) {
    const recent = await db.contactMessage.count({
      where: { ipAddress, createdAt: { gte: new Date(Date.now() - CONTACT_LIMIT.windowMs) } },
    });
    if (recent >= CONTACT_LIMIT.max) {
      throw new AppError(
        "LIMIT_REACHED",
        "You've sent several messages already. Please wait a while, or call or email us directly.",
      );
    }
  }
  await db.contactMessage.create({ data: { ...input, ipAddress } });
}

export async function listContactMessages() {
  return db.contactMessage.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      topic: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function countNewContactMessages() {
  return db.contactMessage.count({ where: { status: "NEW" } });
}

export async function setContactMessageRead(id: string, read: boolean) {
  const { count } = await db.contactMessage.updateMany({
    where: { id },
    data: { status: read ? "READ" : "NEW" },
  });
  if (!count) throw new AppError("NOT_FOUND", "Message not found.");
}
