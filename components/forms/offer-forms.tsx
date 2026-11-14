"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ProviderOffer } from "@/lib/types";
import { createOffer, updateOffer } from "@/lib/actions/offers";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";

function fieldsFrom(
  state: { ok: boolean; error?: { fields?: Record<string, string> } } | null,
) {
  return state && !state.ok ? state.error?.fields : undefined;
}

export function CreateOfferForm({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const [state, action] = useActionState(createOffer, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />
      <input type="hidden" name="jobId" value={jobId} />

      <div>
        <p className="text-sm text-muted">Your offer for</p>
        <p className="font-bold">{jobTitle}</p>
      </div>

      <Field
        label="Your message"
        htmlFor="message"
        hint="Say how you can help, what you would do and anything the customer should know."
      >
        <Textarea
          id="message"
          name="message"
          minLength={20}
          maxLength={1000}
          required
        />
      </Field>

      <Field
        label="Indicative price in pounds"
        htmlFor="price"
        hint="Optional. Leave blank for “Quote on inspection”."
      >
        <Input
          id="price"
          name="price"
          inputMode="decimal"
          placeholder="For example 45"
          maxLength={12}
        />
      </Field>

      <Field
        label="When could you do it?"
        htmlFor="estimatedTimeframe"
        hint="Optional, for example “This weekend”."
      >
        <Input
          id="estimatedTimeframe"
          name="estimatedTimeframe"
          maxLength={80}
        />
      </Field>

      <SubmitButton label="Send offer" pendingLabel="Sending offer" />
    </form>
  );
}

export function EditOfferForm({ offer }: { offer: ProviderOffer }) {
  const router = useRouter();
  const [state, action] = useActionState(updateOffer, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={state?.ok ? "Your offer is saved." : null}
      />
      <input type="hidden" name="id" value={offer.id} />

      <Field label="Your message" htmlFor="message">
        <Textarea
          id="message"
          name="message"
          defaultValue={offer.message}
          minLength={20}
          maxLength={1000}
          required
        />
      </Field>

      <Field
        label="Indicative price in pounds"
        htmlFor="price"
        hint="Optional. Leave blank for “Quote on inspection”."
      >
        <Input
          id="price"
          name="price"
          inputMode="decimal"
          defaultValue={
            offer.indicative_price_pence == null
              ? ""
              : String(offer.indicative_price_pence / 100)
          }
          maxLength={12}
        />
      </Field>

      <Field
        label="When could you do it?"
        htmlFor="estimatedTimeframe"
      >
        <Input
          id="estimatedTimeframe"
          name="estimatedTimeframe"
          defaultValue={offer.estimated_timeframe ?? ""}
          maxLength={80}
        />
      </Field>

      <SubmitButton label="Save offer" pendingLabel="Saving offer" />
    </form>
  );
}
