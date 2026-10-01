import { describe, expect, it } from "vitest";

import { contactMessageSchema, topicLabel } from "@/server/contact/schemas";

const valid = {
  name: "Rahim Uddin",
  email: "Rahim@Example.com ",
  phone: "",
  topic: "setup",
  message: "How do I connect my own domain?",
};

describe("contactMessageSchema", () => {
  it("accepts a valid message, lowercases email, empty phone becomes null", () => {
    const r = contactMessageSchema.parse(valid);
    expect(r.email).toBe("rahim@example.com");
    expect(r.phone).toBeNull();
  });

  it("normalizes Bangladeshi phone numbers", () => {
    expect(contactMessageSchema.parse({ ...valid, phone: "+880 1712-345678" }).phone).toBe("01712345678");
  });

  it("rejects bad phone, email, topic and short message", () => {
    const r = contactMessageSchema.safeParse({
      ...valid,
      phone: "12345",
      email: "nope",
      topic: "spam",
      message: "hi",
    });
    expect(r.success).toBe(false);
    const fields = new Set(r.error!.issues.map((i) => i.path[0]));
    expect(fields).toEqual(new Set(["phone", "email", "topic", "message"]));
  });

  it("caps message length", () => {
    expect(contactMessageSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("topicLabel", () => {
  it("maps known topics and falls back to the raw value", () => {
    expect(topicLabel("billing")).toBe("Billing & payments");
    expect(topicLabel("legacy")).toBe("legacy");
  });
});
