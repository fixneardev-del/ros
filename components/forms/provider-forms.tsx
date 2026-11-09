"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  LocationRow,
  ProviderProfile,
  ServiceCategory,
} from "@/lib/types";
import { topLevelCategories } from "@/lib/category-utils";
import { PROVIDER_TYPES, providerTypeLabels } from "@/lib/schemas/provider";
import {
  addProviderPhoto,
  submitProviderApplication,
  updateProviderProfile,
} from "@/lib/actions/provider";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { PhotoInput } from "@/components/mend/photo-input";
import { SubmitButton } from "@/components/mend/submit-button";
import { Stepper } from "@/components/mend/tag";
import { trackEvent } from "@/components/mend/analytics";

const STEPS = ["About you", "Your services", "Photos", "Review"];

function fieldsFrom(
  state: { ok: boolean; error?: { fields?: Record<string, string> } } | null,
) {
  return state && !state.ok ? state.error?.fields : undefined;
}

function stepForError(
  state: { ok: boolean; error?: { fields?: Record<string, string> } } | null,
) {
  if (!state || state.ok) return null;
  const keys = Object.keys(state.error?.fields ?? {});

  if (
    keys.some((key) =>
      ["providerType", "displayName", "businessName", "bio", "priceNote"].includes(
        key,
      ),
    )
  ) {
    return 0;
  }
  if (keys.some((key) => ["categoryIds", "districts"].includes(key))) return 1;
  if (keys.includes("photos")) return 2;
  if (keys.includes("declaration")) return 3;
  return null;
}

function CategoryChoices({
  categories,
  selected = [],
}: {
  categories: ServiceCategory[];
  selected?: string[];
}) {
  const parents = topLevelCategories(categories);

  return (
    <div className="space-y-4">
      {parents.map((parent) => (
        <fieldset key={parent.id} className="rounded-surface border border-line p-4">
          <legend className="px-1 font-bold">{parent.name}</legend>
          <div className="mt-2 space-y-2">
            <Checkbox
              id={`category-${parent.id}`}
              name="categoryIds"
              value={parent.id}
              defaultChecked={selected.includes(parent.id)}
              label={parent.name}
            />
            {categories
              .filter((category) => category.parent_id === parent.id)
              .map((child) => (
                <div key={child.id} className="ml-6">
                  <Checkbox
                    id={`category-${child.id}`}
                    name="categoryIds"
                    value={child.id}
                    defaultChecked={selected.includes(child.id)}
                    label={child.name}
                  />
                </div>
              ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function DistrictChoices({
  districts,
  selected = [],
}: {
  districts: LocationRow[];
  selected?: string[];
}) {
  return (
    <div className="space-y-2">
      {districts.map((district) => (
        <Checkbox
          key={district.id}
          id={`district-${district.postcode_district}`}
          name="districts"
          value={district.postcode_district}
          defaultChecked={selected.includes(district.postcode_district)}
          label={`${district.postcode_district} — ${district.area_name}`}
        />
      ))}
    </div>
  );
}

function ProviderTypeSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Select id="providerType" name="providerType" defaultValue={defaultValue}>
      <option value="">Choose one</option>
      {PROVIDER_TYPES.map((type) => (
        <option key={type} value={type}>
          {providerTypeLabels[type]}
        </option>
      ))}
    </Select>
  );
}

export function ProviderApplicationForm({
  categories,
  districts,
}: {
  categories: ServiceCategory[];
  districts: LocationRow[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dismissedError, setDismissedError] = useState<unknown>(null);
  const [state, action] = useActionState(submitProviderApplication, null);

  useEffect(() => {
    if (state?.ok) {
      void trackEvent("provider_applied");
      router.push(state.data.next);
      router.refresh();
    }
  }, [state, router]);

  const errorStep =
    state && !state.ok && state !== dismissedError ? stepForError(state) : null;
  const currentStep = errorStep ?? step;

  function goToStep(next: number) {
    setDismissedError(state);
    setStep(next);
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      <Stepper steps={STEPS} current={currentStep} />
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />

      <div hidden={currentStep !== 0} className="space-y-5">
        <Field label="I am a" htmlFor="providerType">
          <ProviderTypeSelect />
        </Field>
        <Field
          label="Name customers will see"
          htmlFor="displayName"
          hint="Use the name you want on your public profile."
        >
          <Input id="displayName" name="displayName" />
        </Field>
        <Field
          label="Business name"
          htmlFor="businessName"
          hint="Optional. Leave blank if you work under your own name."
        >
          <Input id="businessName" name="businessName" maxLength={120} />
        </Field>
        <Field
          label="About your work"
          htmlFor="bio"
          hint="Tell customers what you repair or make, your experience and how you work."
        >
          <Textarea id="bio" name="bio" minLength={40} maxLength={1500} />
        </Field>
        <Field
          label="Price note"
          htmlFor="priceNote"
          hint="Optional, for example “From £20” or “Quote on inspection”."
        >
          <Input id="priceNote" name="priceNote" maxLength={80} />
        </Field>
      </div>

      <div hidden={currentStep !== 1} className="space-y-5">
        <div>
          <h2 className="text-lg font-bold">Which services do you offer?</h2>
          <p className="mt-1 text-sm text-muted">
            Choose at least one. You can change these later.
          </p>
        </div>
        <CategoryChoices categories={categories} />

        <div>
          <h2 className="text-lg font-bold">Which pilot areas do you cover?</h2>
          <p className="mt-1 text-sm text-muted">
            Choose at least one area. We are starting with these districts.
          </p>
        </div>
        <DistrictChoices districts={districts} />
      </div>

      <div hidden={currentStep !== 2} className="space-y-5">
        <div>
          <h2 className="text-lg font-bold">Add photos of your work</h2>
          <p className="mt-1 text-sm text-muted">
            Add 1 to 6 photos. They help customers understand what you do.
          </p>
        </div>
        <PhotoInput name="photos" max={6} />
      </div>

      <div hidden={currentStep !== 3} className="space-y-5">
        <div>
          <h2 className="text-lg font-bold">Check and send</h2>
          <p className="mt-1 text-sm text-muted">
            An admin will review your application. We usually reply within 2
            working days.
          </p>
        </div>
        <div className="stitch-box bg-warning-bg p-4 text-sm text-warning-fg">
          <p>
            By sending this application you confirm the details are accurate and
            that you have the right to offer these services. Providers are
            independent. We do not guarantee qualifications, insurance or checks
            unless your profile says so.
          </p>
        </div>
        <Checkbox
          id="declaration"
          name="declaration"
          label="I confirm this application is accurate and I agree to the provider terms."
        />
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4">
        {currentStep > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => goToStep(Math.max(0, currentStep - 1))}
          >
            Back
          </Button>
        ) : (
          <span />
        )}

        {currentStep < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={() => goToStep(Math.min(STEPS.length - 1, currentStep + 1))}
          >
            Continue
          </Button>
        ) : (
          <SubmitButton
            label="Send application"
            pendingLabel="Sending application"
          />
        )}
      </div>
    </form>
  );
}

export function ProviderProfileForm({
  provider,
  categories,
  districts,
  currentCategoryIds,
}: {
  provider: ProviderProfile;
  categories: ServiceCategory[];
  districts: LocationRow[];
  currentCategoryIds: string[];
}) {
  const router = useRouter();
  const [state, action] = useActionState(updateProviderProfile, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={state?.ok ? "Your profile is saved." : null}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="I am a" htmlFor="providerType">
          <ProviderTypeSelect defaultValue={provider.provider_type} />
        </Field>
        <Field label="Name customers will see" htmlFor="displayName">
          <Input
            id="displayName"
            name="displayName"
            defaultValue={provider.display_name}
            required
          />
        </Field>
      </div>

      <Field
        label="Business name"
        htmlFor="businessName"
        hint="Optional."
      >
        <Input
          id="businessName"
          name="businessName"
          defaultValue={provider.business_name ?? ""}
          maxLength={120}
        />
      </Field>

      <Field label="About your work" htmlFor="bio">
        <Textarea
          id="bio"
          name="bio"
          defaultValue={provider.bio}
          minLength={40}
          maxLength={1500}
          required
        />
      </Field>

      <Field label="Price note" htmlFor="priceNote" hint="Optional.">
        <Input
          id="priceNote"
          name="priceNote"
          defaultValue={provider.price_note ?? ""}
          maxLength={80}
        />
      </Field>

      <div>
        <h2 className="text-lg font-bold">Your services</h2>
        <p className="mt-1 text-sm text-muted">
          Changing your name or provider type may send your profile back for
          review.
        </p>
        <div className="mt-3">
          <CategoryChoices
            categories={categories}
            selected={currentCategoryIds}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold">Your pilot areas</h2>
        <div className="mt-3">
          <DistrictChoices
            districts={districts}
            selected={provider.service_districts}
          />
        </div>
      </div>

      <SubmitButton label="Save profile" pendingLabel="Saving profile" />
    </form>
  );
}

export function AddProviderPhotoForm() {
  const router = useRouter();
  const [state, action] = useActionState(addProviderPhoto, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-3">
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={state?.ok ? "Photo added." : null}
      />
      <PhotoInput
        name="photo"
        multiple={false}
        max={1}
        label="Add a photo"
        hint="JPG, PNG or WebP. Up to 5 MB."
      />
      <SubmitButton
        label="Upload photo"
        pendingLabel="Uploading photo"
        variant="secondary"
      />
    </form>
  );
}
