"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/lib/actions/contact";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

export function ContactForm() {
  const [state, action] = useActionState(sendContactMessage, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error : null}
        success={
          state?.ok
            ? "Thanks. We have your message and will reply by email."
            : null
        }
      />

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name">
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Email" htmlFor="contact-email">
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="contact-subject">
        <Input id="contact-subject" name="subject" required />
      </Field>

      <Field
        label="Message"
        htmlFor="contact-message"
        hint="Tell us what you need. Do not include card or password details."
      >
        <Textarea id="contact-message" name="message" rows={6} required />
      </Field>

      <SubmitButton label="Send message" pendingLabel="Sending message" />
    </form>
  );
}
