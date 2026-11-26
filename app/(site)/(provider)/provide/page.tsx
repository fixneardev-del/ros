import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { requireProvider } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { getDistricts } from "@/lib/data/locations";
import { getProviderById } from "@/lib/data/providers";
import { providerPhotoUrl } from "@/lib/storage";
import { getProviderServices } from "@/lib/data/jobs";
import { StatusBadge } from "@/components/mend/status-badge";
import { DashAlert } from "@/components/dash/dash-alert";
import { ActionForm } from "@/components/forms/action-form";
import {
  AddProviderPhotoForm,
  ProviderProfileForm,
} from "@/components/forms/provider-forms";
import { deleteProviderPhoto } from "@/lib/actions/provider";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Provider dashboard" };

type SearchParams = Promise<{ applied?: string; error?: string }>;

const card = "rounded-surface border border-line bg-surface p-5";

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
  const context = await requireProvider();

  const provider = await getProviderById(context.user.id);

  if (!provider) {
    return (
      <DashAlert tone="danger">
        We could not load your provider profile. Refresh and try again.
      </DashAlert>
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
          <p className="dash-kicker">Provider dashboard</p>
          <h1 className="mt-2">{provider.display_name}</h1>
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
        <div className="mt-6">
          <DashAlert tone="success">
            Application sent. We will email you when the admin has reviewed it.
          </DashAlert>
        </div>
      ) : null}

      {params.error === "not-approved" ? (
        <div className="mt-6">
          <DashAlert tone="warning">
            You need an approved provider profile to browse matching jobs or send
            offers.
          </DashAlert>
        </div>
      ) : null}

      <div className={`${card} mt-6`}>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <section className={card}>
            <h2>Profile</h2>
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

          <section className={`${card} mt-6`}>
            <h2>Photos</h2>
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
              <p className="mt-4 text-sm text-muted">No photos yet.</p>
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
          <div className={card}>
            <h2>Your services</h2>
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

          <div className={card}>
            <h2>Your pilot areas</h2>
            <p className="mt-2 text-sm text-muted">
              {provider.service_districts.join(", ") || "No areas selected."}
            </p>
          </div>

          <div className={`${card} text-sm`}>
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
    <div className="dash-page">
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-hidden>
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
