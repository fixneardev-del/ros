import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { getProviderById } from "@/lib/data/providers";
import { providerPhotoUrl } from "@/lib/storage";
import { getSessionContext } from "@/lib/permissions";
import { providerTypeLabels } from "@/lib/schemas/provider";
import { StatusBadge } from "@/components/mend/status-badge";
import { PilotNotice, StitchLine } from "@/components/mend/tag";
import { ReportForm } from "@/components/forms/report-form";
import { ButtonLink } from "@/components/ui/button";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = {
  title: "Provider profile",
};

function ProfileSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-hidden>
      <div className="space-y-4">
        <div className="h-10 w-2/3 rounded bg-slate-100" />
        <div className="h-80 rounded-surface bg-slate-100" />
        <div className="h-40 rounded-surface bg-slate-100" />
      </div>
      <div className="h-72 rounded-surface bg-slate-100" />
    </div>
  );
}

async function ProviderProfileContent({ params }: { params: Params }) {
  const { id } = await params;
  const [provider, context] = await Promise.all([
    getProviderById(id),
    getSessionContext(),
  ]);

  if (!provider) notFound();

  const isOwner = context.user?.id === provider.user_id;
  const isAdmin = context.profile?.role === "admin";

  if (provider.status !== "approved" && !isOwner && !isAdmin) {
    notFound();
  }

  const photos = [...provider.provider_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const services = provider.provider_services
    .map((service) => service.service_categories)
    .filter((service): service is NonNullable<typeof service> => Boolean(service));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to search
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1>
              {provider.display_name}
            </h1>
            {provider.business_name ? (
              <p className="mt-1 text-lg text-muted">{provider.business_name}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-bold text-info-fg">
                {providerTypeLabels[provider.provider_type]}
              </span>
              {provider.status === "approved" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1 text-sm font-bold text-success-fg">
                  <BadgeCheck className="size-4" aria-hidden />
                  Approved provider
                </span>
              ) : (
                <StatusBadge kind="provider" status={provider.status} />
              )}
            </div>
          </div>
          <div className="panel px-4 py-3 text-sm">
            <p className="font-bold">{provider.price_note || "Quote on inspection"}</p>
            <p className="mt-1 text-muted">Indicative price note</p>
          </div>
        </div>

        <StitchLine className="mt-5 w-24" />

        <div className="s-media mt-6">
          {photos.length > 0 && providerPhotoUrl(photos[0].storage_path) ? (
            <Image
              src={providerPhotoUrl(photos[0].storage_path) as string}
              alt={
                photos[0].alt_text ||
                `Work by ${provider.display_name}`
              }
              width={1200}
              height={800}
              className="aspect-[3/2] w-full object-cover"
              priority
            />
          ) : (
            <div className="flex aspect-[3/2] items-center justify-center bg-slate-100">
              <p className="text-muted">No photos added yet.</p>
            </div>
          )}
        </div>

        {photos.length > 1 ? (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.slice(1).map((photo) => {
              const url = providerPhotoUrl(photo.storage_path);
              if (!url) return null;
              return (
                <div
                  key={photo.id}
                  className="s-thumb overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={photo.alt_text || `More work by ${provider.display_name}`}
                    width={320}
                    height={240}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="text-2xl font-bold">About the work</h2>
          <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-7">
            {provider.bio}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Services</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service.id}
                className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm font-bold"
              >
                {service.name}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Pilot areas</h2>
          <p className="mt-3 flex items-center gap-2 text-muted">
            <MapPin className="size-5 text-primary" aria-hidden />
            {provider.service_districts.join(", ")}
          </p>
        </section>

        <div className="mt-8">
          <ReportForm targetType="provider" targetId={provider.user_id} />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="panel">
          <h2 className="text-xl font-bold">Ask {provider.display_name} for a job</h2>
          <p className="mt-2 text-sm text-muted">
            Post a job with your postcode. If this provider covers your area and
            service, they can send an offer.
          </p>
          <div className="mt-4">
            <ButtonLink href="/post-job" className="w-full">
              Post a job
            </ButtonLink>
          </div>
        </div>

        <PilotNotice>
          Providers are independent. We do not guarantee qualifications,
          insurance or checks unless a profile says so. Agree the work, price and
          timing directly.
        </PilotNotice>

        <div className="panel">
          <p className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-5 text-success" aria-hidden />
            Contact stays private
          </p>
          <p className="mt-2 text-sm text-muted">
            Your email and phone are released only after you accept an offer.
          </p>
        </div>

        {isOwner || isAdmin ? (
          <div className="panel text-sm">
            <p className="font-bold">Preview mode</p>
            <p className="mt-1 text-muted">
              You can see this profile while it is {provider.status}.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {isOwner ? (
                <Link
                  href="/provide"
                  className="font-bold text-primary underline underline-offset-4"
                >
                  Open provider dashboard
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  href={`/admin/providers/${provider.user_id}`}
                  className="font-bold text-primary underline underline-offset-4"
                >
                  Review in admin
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default function ProviderProfilePage({ params }: { params: Params }) {
  return (
    <div className="l-container s-page">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProviderProfileContent params={params} />
      </Suspense>
    </div>
  );
}
