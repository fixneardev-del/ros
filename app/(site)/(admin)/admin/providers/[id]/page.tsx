import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { getProviderById } from "@/lib/data/providers";
import { providerPhotoUrl } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/mend/status-badge";
import { DashAlert } from "@/components/dash/dash-alert";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  approveProvider,
  rejectProvider,
  removeProvider,
  requestMoreInfo,
  reinstateProvider,
  suspendProvider,
} from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Admin provider review" };

type Params = Promise<{ id: string }>;

async function ProviderContent({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const [provider, categories] = await Promise.all([
    getProviderById(id),
    getCategories(true),
  ]);

  if (!provider) notFound();

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const requiresChecks = provider.provider_services.some(
    (service) => categoryMap.get(service.category_id)?.requires_extra_checks,
  );
  const photos = [...provider.provider_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div>
      <Link
        href="/admin/providers"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to providers
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>
            {provider.display_name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge kind="provider" status={provider.status} />
            <span className="text-sm text-muted">
              {provider.provider_type.replace("_", " ")}
            </span>
          </div>
        </div>
        <ButtonLink
          href={`/providers/${provider.user_id}`}
          variant="secondary"
        >
          Public profile
          <ExternalLink className="size-4" aria-hidden />
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2>Application</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold">Account name</dt>
                <dd className="text-muted">{provider.profiles?.full_name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt className="font-bold">Pilot areas</dt>
                <dd className="text-muted">
                  {provider.service_districts.join(", ") || "None selected"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold">Services</dt>
                <dd className="text-muted">
                  {provider.provider_services
                    .map((service) => service.service_categories?.name)
                    .filter(Boolean)
                    .join(", ") || "None selected"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold">Bio</dt>
                <dd className="mt-1 whitespace-pre-line leading-7">
                  {provider.bio}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold">Price note</dt>
                <dd className="text-muted">
                  {provider.price_note || "No price note"}
                </dd>
              </div>
            </dl>

            {provider.needs_more_info_note ? (
              <div className="mt-4">
                <DashAlert tone="warning">
                  <strong>More information requested:</strong>{" "}
                  {provider.needs_more_info_note}
                </DashAlert>
              </div>
            ) : null}
            {provider.rejection_reason ? (
              <div className="mt-4">
                <DashAlert tone="danger">
                  <strong>Rejection reason:</strong>{" "}
                  {provider.rejection_reason}
                </DashAlert>
              </div>
            ) : null}

            <dl className="mt-6 border-t border-line pt-4 text-sm">
              <div className="grid gap-1 sm:grid-cols-2">
                <dt className="font-bold">Last reviewed</dt>
                <dd className="text-muted">
                  {provider.reviewed_at
                    ? formatDate(provider.reviewed_at)
                    : "Not reviewed yet"}
                </dd>
                <dt className="font-bold">Suspended</dt>
                <dd className="text-muted">
                  {provider.suspended_at ? formatDate(provider.suspended_at) : "Never"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2>Photos</h2>
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
                    </figure>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-muted">No photos uploaded.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {provider.status === "pending" || provider.status === "rejected" ? (
            <section className="rounded-surface border border-line bg-surface p-5">
              <h2>Approve</h2>
              <p className="mt-1 text-sm text-muted">
                Approving makes this profile visible in search and lets the
                provider send offers.
              </p>
              <form action={approveProvider} className="mt-4 space-y-3">
                <input type="hidden" name="providerId" value={provider.user_id} />
                {requiresChecks ? (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="extraChecksConfirmed"
                      className="mt-1 size-4 accent-[var(--color-primary)]"
                    />
                    <span>
                      I have seen the extra evidence required for the selected
                      categories.
                    </span>
                  </label>
                ) : null}
                <Button type="submit" className="w-full">
                  Approve provider
                </Button>
              </form>
            </section>
          ) : null}

          {provider.status === "pending" ? (
            <section className="rounded-surface border border-line bg-surface p-5">
              <h2>Ask for more information</h2>
              <form action={requestMoreInfo} className="mt-4 space-y-3">
                <input type="hidden" name="providerId" value={provider.user_id} />
                <label htmlFor="more-info" className="block text-sm font-bold">
                  What should they change?
                </label>
                <textarea
                  id="more-info"
                  name="note"
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  required
                  className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button type="submit" variant="secondary" className="w-full">
                  Send request
                </Button>
              </form>
            </section>
          ) : null}

          {provider.status !== "rejected" && provider.status !== "suspended" ? (
            <section className="rounded-surface border border-line bg-surface p-5">
              <h2>Not approved</h2>
              <p className="mt-1 text-sm text-muted">
                Give a clear reason. It is shown to the provider.
              </p>
              <form action={rejectProvider} className="mt-4 space-y-3">
                <input type="hidden" name="providerId" value={provider.user_id} />
                <label htmlFor="reject-reason" className="block text-sm font-bold">
                  Reason
                </label>
                <textarea
                  id="reject-reason"
                  name="reason"
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  required
                  className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button type="submit" variant="destructive" className="w-full">
                  Reject application
                </Button>
              </form>
            </section>
          ) : null}

          <section className="rounded-surface border border-line bg-surface p-5">
            <h2>Account status</h2>
            {provider.status === "suspended" ? (
              <form action={reinstateProvider} className="mt-4">
                <input type="hidden" name="providerId" value={provider.user_id} />
                <Button type="submit" variant="secondary" className="w-full">
                  Reinstate provider
                </Button>
              </form>
            ) : (
              <form action={suspendProvider} className="mt-4">
                <input type="hidden" name="providerId" value={provider.user_id} />
                <Button type="submit" variant="destructive" className="w-full">
                  Suspend provider
                </Button>
              </form>
            )}
          </section>

          <section className="rounded-surface border border-line bg-surface p-5">
            <h2>Remove application</h2>
            <p className="mt-1 text-sm text-muted">
              This deletes the provider profile, its services and its photos. The
              account stays, so they can apply again. Use suspend to hide
              someone temporarily.
            </p>
            <form action={removeProvider} className="mt-4 space-y-3">
              <input type="hidden" name="providerId" value={provider.user_id} />
              <label htmlFor="remove-reason" className="block text-sm font-bold">
                Reason
              </label>
              <textarea
                id="remove-reason"
                name="reason"
                rows={2}
                minLength={10}
                maxLength={500}
                required
                className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" variant="destructive" className="w-full">
                Remove provider
              </Button>
            </form>
          </section>

        </aside>
      </div>
    </div>
  );
}

export default function AdminProviderPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-64 rounded bg-slate-100" />
          <div className="h-64 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <ProviderContent params={params} />
    </Suspense>
  );
}
