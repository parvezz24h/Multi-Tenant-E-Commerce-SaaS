"use client";

import { CheckCircle2, Send } from "lucide-react";
import { startTransition, useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessageAction } from "@/server/contact/actions";
import { CONTACT_TOPICS } from "@/server/contact/schemas";
import type { ActionState } from "@/server/errors";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(sendContactMessageAction, {});
  // "Send another message" hides the success view for this result only.
  const [dismissed, setDismissed] = useState<ActionState | null>(null);
  const errors = state.ok ? {} : (state.fieldErrors ?? {});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  if (state.ok && dismissed !== state) {
    return (
      <div role="status" className="grid justify-items-center gap-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <div className="grid gap-1">
          <p className="text-lg font-semibold">Message sent</p>
          <p className="max-w-sm text-sm text-muted-foreground">{state.message}</p>
        </div>
        <Button variant="outline" size="lg" className="px-4" onClick={() => setDismissed(state)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-5" noValidate>
      {!state.ok && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="name" label="Your name" errors={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            aria-invalid={!!errors.name}
            aria-describedby="name-desc"
          />
        </FormField>
        <FormField id="email" label="Email" errors={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby="email-desc"
          />
        </FormField>
        <FormField id="phone" label="Mobile number (optional)" errors={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            aria-invalid={!!errors.phone}
            aria-describedby="phone-desc"
          />
        </FormField>
        <FormField id="topic" label="Topic" errors={errors.topic}>
          <Select name="topic" defaultValue="general">
            <SelectTrigger
              id="topic"
              className="w-full"
              aria-invalid={!!errors.topic}
              aria-describedby="topic-desc"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TOPICS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField id="message" label="Message" errors={errors.message}>
        <Textarea
          id="message"
          name="message"
          rows={6}
          required
          maxLength={2000}
          placeholder="How can we help?"
          aria-invalid={!!errors.message}
          aria-describedby="message-desc"
        />
      </FormField>

      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="xl" disabled={pending}>
          {pending ? "Sending…" : "Send message"} <Send />
        </Button>
        <p className="text-xs text-muted-foreground">We’ll reply to the email address you enter.</p>
      </div>
    </form>
  );
}
