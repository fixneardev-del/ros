import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { getDistricts } from "@/lib/data/locations";
import { getProviderById } from "@/lib/data/providers";
import { providerPhotoUrl } from "@/lib/storage";
import { getProviderServices } from "@/lib/data/jobs";
import { StatusBadge } from "@/components/mend/status-badge";
import { StitchLine } from "@/components/mend/tag";
import { ActionForm } from "@/components/forms/action-form";
import {
  AddProviderPhotoForm,
  ProviderProfileForm,
} from "@/components/forms/provider-forms";
import { deleteProviderPhoto } from "@/lib/actions/provider";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Provider dashboard" };

type SearchParams = Promise<{ applied?: string; error?: string }>;

function statusCopy(status: string) {
  if (status === "approved") {
    return "Your profile is live. Browse matching jobs and send offers when the work fits.";
  }
  if (status === "pending") {
    return "Your application is with the admin. We usually reply within 2 working days.";
  }
  if (status === "rejected") {
    return "Your application was not approved. Read the note below and contact the administrator if you think this is a mistake.";
  }
  return "Your provider profile is suspended. You cannot send new offers while it is suspended.";
}

async function ProvideContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const context = await requireUser("/provide");

  // A customer can land here from the header. Explain what a provider profile
  // is rather than dropping them straight into the application form.
  if (!context.providerProfile) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Offer your services
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-5xl">
          Good with your hands?
        </h1>
        <StitchLine className="mt-4 w-24" />
        <p className="mt-4 text-lg text-muted">
          Apply to join the marketplace. Tell us what you do, which services
          you offer, the areas you cover and add photos of your work. An admin
          reviews every application before you appear in search.
        </p>
        <ul className="mt-6 space-y-2 text-muted">
          <li>You choose your own services and postcode areas.</li>
          <li>You send offers and agree the work directly with the customer.</li>
          <li>There is no commission and no subscription.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/provide/apply">Start an application</ButtonLink>
          <ButtonLink href="/search" variant="secondary">
            Find work first
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-muted">
          Providers are independent. We do not guarantee qualifications,
          insurance or checks unless a profile says so.
        </p>
      </div>
    );
  }

  const provider = await getProviderById(context.user.id);

  if (!provider) {
    return (
      <div className="rounded-surface bg-danger-bg p-5 text-danger-fg">
        We could not load your provider profile. Refresh and try again.
      </div>
    );
  }

  const [categories, districts, currentCategoryIds] = await Promise.all([
    getCategories(),
    getDistricts(),
    getProviderServices(context.user.id),
  ]);

  const photos = [...provider.provider_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Provider dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-5xl">
            {provider.display_name}
          </h1>
          <StitchLine className="mt-4 w-20" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge kind="provider" status={provider.status} />
            <span className="text-sm text-muted">
              {provider.provider_type.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {provider.status === "approved" ? (
            <>
              <ButtonLink href="/provide/jobs">Find jobs</ButtonLink>
              <ButtonLink href="/provide/offers" variant="secondary">
                My offers
              </ButtonLink>
            </>
          ) : null}
          <ButtonLink
            href={`/providers/${provider.user_id}`}
            variant="secondary"
          >
            View public profile
          </ButtonLink>
        </div>
      </div>

      {params.applied ? (
        <div className="mt-6 flex gap-3 rounded-surface bg-success-bg p-5 text-success-fg">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm font-bold">
            Application sent. We will email you when the admin has reviewed it.
          </p>
        </div>
      ) : null}

      {params.error === "not-approved" ? (
        <div className="mt-6 flex gap-3 rounded-surface bg-warning-bg p-5 text-warning-fg">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm font-bold">
            You need an approved provider profile to browse matching jobs or send
            offers.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-surface border border-line bg-surface p-5">
        <p className="font-bold">{statusCopy(provider.status)}</p>
        {provider.needs_more_info_note ? (
          <p className="mt-2 rounded-control bg-warning-bg p-3 text-sm text-warning-fg">
            Admin note: {provider.needs_more_info_note}
          </p>
        ) : null}
        {provider.rejection_reason ? (
          <p className="mt-2 rounded-control bg-danger-bg p-3 text-sm text-danger-fg">
            Reason: {provider.rejection_reason}
          </p>
        ) : null}
        {provider.status === "suspended" ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-danger-fg">
            <ShieldAlert className="size-4" aria-hidden />
            Contact the administrator to resolve this.
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2 className="text-2xl font-bold">Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Keep your services, areas and photos accurate. Changing your name
              or provider type may send your profile back for review.
            </p>
            <div className="mt-5">
              <ProviderProfileForm
                provider={provider}
                categories={categories}
                districts={districts}
                currentCategoryIds={currentCategoryIds}
              />
            </div>
          </section>

          <section className="mt-6 rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2 className="text-2xl font-bold">Photos</h2>
            <p className="mt-1 text-sm text-muted">
              Add 1 to 6 photos. The first photo is used on your public profile.
            </p>

            {photos.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {photos.map((photo) => {
                  const url = providerPhotoUrl(photo.storage_path);
                  return (
                    <figure
                      key={photo.id}
                      className="overflow-hidden rounded-photo border border-line"
                    >
                      {url ? (
                        <Image
                          src={url}
                          alt={photo.alt_text || `Work by ${provider.display_name}`}
                          width={400}
                          height={300}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-muted">
                          Photo unavailable
                        </div>
                      )}
                      <figcaption className="border-t border-line bg-surface p-2">
                        <ActionForm
                          action={deleteProviderPhoto}
                          fields={{ photoId: photo.id }}
                          label="Remove"
                          variant="quiet"
                          confirmMessage="Remove this photo from your profile?"
                          successMessage="Photo removed."
                          className="text-sm"
                        />
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-muted">No photos yet.</p>
            )}

            {photos.length < 6 ? (
              <div className="mt-5 max-w-md">
                <AddProviderPhotoForm />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                You have the maximum of 6 photos.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-surface border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">Your services</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {provider.provider_services.map((service) =>
                service.service_categories ? (
                  <span
                    key={service.category_id}
                    className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm font-bold"
                  >
                    {service.service_categories.name}
                  </span>
                ) : null,
              )}
            </div>
          </div>

          <div className="rounded-surface border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">Your pilot areas</h2>
            <p className="mt-2 text-sm text-muted">
              {provider.service_districts.join(", ") || "No areas selected."}
            </p>
          </div>

          <div className="rounded-surface border border-line bg-surface p-5 text-sm">
            <p className="font-bold">Need help?</p>
            <p className="mt-1 text-muted">
              Read the provider guidance in the{" "}
              <Link
                href="/terms"
                className="font-bold text-primary underline underline-offset-4"
              >
                terms
              </Link>
              . For account problems, contact the administrator.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ProvidePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 lg:px-12">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-hidden>
            <div className="h-96 rounded-surface bg-slate-100" />
            <div className="h-64 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <ProvideContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
