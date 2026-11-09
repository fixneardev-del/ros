"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { JobRequest, ServiceCategory } from "@/lib/types";
import { topLevelCategories } from "@/lib/category-utils";
import { TIMEFRAMES, timeframeLabels } from "@/lib/schemas/job";
import { createJob, updateJob } from "@/lib/actions/jobs";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/mend/form-message";
import { SubmitButton } from "@/components/mend/submit-button";
import { PhotoInput } from "@/components/mend/photo-input";
import { trackEvent } from "@/components/mend/analytics";
import { MAX_JOB_PHOTOS } from "@/lib/uploads";

function fieldsFrom(
  state: { ok: boolean; error?: { fields?: Record<string, string> } } | null,
) {
  return state && !state.ok ? state.error?.fields : undefined;
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: ServiceCategory[];
  defaultValue?: string;
}) {
  const parents = topLevelCategories(categories);

  return (
    <Select id="categoryId" name="categoryId" defaultValue={defaultValue} required>
      <option value="">Choose a service</option>
      {parents.map((parent) => (
        <optgroup key={parent.id} label={parent.name}>
          <option value={parent.id}>{parent.name}</option>
          {categories
            .filter((category) => category.parent_id === parent.id)
            .map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
        </optgroup>
      ))}
    </Select>
  );
}

function TimeframeSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Select id="timeframe" name="timeframe" defaultValue={defaultValue} required>
      {TIMEFRAMES.map((value) => (
        <option key={value} value={value}>
          {timeframeLabels[value]}
        </option>
      ))}
    </Select>
  );
}

export function CreateJobForm({ categories }: { categories: ServiceCategory[] }) {
  const router = useRouter();
  const [state, action] = useActionState(createJob, null);

  useEffect(() => {
    if (state?.ok) {
      void trackEvent("job_posted");
      router.push(`/jobs/${state.data.id}?created=1`);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
      />

      <Field label="What do you need?" htmlFor="categoryId">
        <CategorySelect categories={categories} />
      </Field>

      <Field
        label="Job title"
        htmlFor="title"
        hint="A short summary, like “Fix a wobbly dining chair”."
      >
        <Input id="title" name="title" maxLength={100} required />
      </Field>

      <Field
        label="Describe the job"
        htmlFor="description"
        hint="Include size, materials, access and anything a provider should know."
      >
        <Textarea
          id="description"
          name="description"
          minLength={20}
          maxLength={2000}
          required
        />
      </Field>

      <Field label="Postcode" htmlFor="postcode" hint="For example G12 8QQ">
        <Input
          id="postcode"
          name="postcode"
          autoComplete="postal-code"
          required
        />
      </Field>

      <Field label="When do you need it?" htmlFor="timeframe">
        <TimeframeSelect defaultValue="flexible" />
      </Field>

      <PhotoInput name="photos" max={MAX_JOB_PHOTOS} />

      <SubmitButton label="Post job" pendingLabel="Posting job" />
    </form>
  );
}

export function EditJobForm({ job }: { job: JobRequest }) {
  const router = useRouter();
  const [state, action] = useActionState(updateJob, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage
        error={state && !state.ok ? state.error.message : null}
        fields={fieldsFrom(state)}
        success={state?.ok ? "Your job is saved." : null}
      />
      <input type="hidden" name="id" value={job.id} />

      <Field label="Job title" htmlFor="title">
        <Input
          id="title"
          name="title"
          defaultValue={job.title}
          maxLength={100}
          required
        />
      </Field>

      <Field label="Describe the job" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={job.description}
          minLength={20}
          maxLength={2000}
          required
        />
      </Field>

      <Field label="When do you need it?" htmlFor="timeframe">
        <TimeframeSelect defaultValue={job.timeframe} />
      </Field>

      <SubmitButton label="Save changes" pendingLabel="Saving changes" />
    </form>
  );
}
