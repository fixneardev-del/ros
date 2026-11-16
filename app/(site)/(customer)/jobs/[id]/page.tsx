/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/permissions";
import {
  getContactDetails,
  getJobPhotos,
  getJobWithOffers,
  getProviderServices,
  providerCoversCategory,
} from "@/lib/data/jobs";
import { formatDate } from "@/lib/format";
import { timeframeLabels, TIMEFRAMES } from "@/lib/schemas/job";
import { StatusBadge } from "@/components/mend/status-badge";
import { OfferCard, ContactDetails } from "@/components/mend/offer-card";
import { EmptyState } from "@/components/mend/tag";
import { DashAlert } from "@/components/dash/dash-alert";
import { ActionForm } from "@/components/forms/action-form";
import { EditJobForm } from "@/components/forms/job-forms";
import { CreateOfferForm, EditOfferForm } from "@/components/forms/offer-forms";
import { ReportForm } from "@/components/forms/report-form";
import { ButtonLink } from "@/components/ui/button";
import { acceptOffer, declineOffer, withdrawOffer } from "@/lib/actions/offers";
import { closeJob, deleteJobPhoto, markJobComplete } from "@/lib/actions/jobs";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: "Job details" };

const card = "rounded-surface border border-line bg-surface p-5";

function timeframeLabel(value: string) {
  return TIMEFRAMES.includes(value as (typeof TIMEFRAMES)[number])
    ? timeframeLabels[value as (typeof TIMEFRAMES)[number]]
    : value;
}

function JobSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-hidden>
      <div className="space-y-4">
        <div className="h-12 w-2/3 rounded bg-slate-100" />
        <div className="h-72 rounded-surface bg-slate-100" />
        <div className="h-40 rounded-surface bg-slate-100" />
      </div>
      <div className="h-80 rounded-surface bg-slate-100" />
    </div>
  );
}

async function JobDetailContent({ params }: { params: Params }) {
  const { id } = await params;
  const context = await requireUser(`/jobs/${id}`);
  const job = await getJobWithOffers(id);

  if (!job) notFound();

  const isOwner = job.customer_id === context.user.id;
  const isAdmin = context.profile?.role === "admin";
  const offers = job.provider_offers ?? [];
  const myOffer = offers.find((offer) => offer.provider_id === context.user.id);

  let isMatchingProvider = false;
  if (
    !isOwner &&
    !isAdmin &&
    context.providerProfile?.status === "approved" &&
    job.service_categories &&
    context.providerProfile.service_districts.includes(job.postcode_district)
  ) {
    const services = await getProviderServices(context.user.id);
    isMatchingProvider = providerCoversCategory(services, job.service_categories);
  }

  const isAcceptedProvider = Boolean(myOffer && myOffer.status === "accepted");

  // A second line of defence. Row level security normally hides a job the
  // viewer has no claim on, so this only runs if a policy ever drifts. It
  // says what happened instead of rendering a page with someone else's job.
  if (!isOwner && !isAdmin && !isMatchingProvider && !isAcceptedProvider) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="dash-kicker">Job request</p>
        <h1 className="mt-2">This job is not available to you.</h1>
        <p className="mt-4 text-sm text-muted">
          It may be closed, or it may be outside the services or areas you
          cover. Browse the jobs that match your profile to see what you can
          offer on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/provide/jobs">Matching jobs</ButtonLink>
          <ButtonLink href="/jobs" variant="secondary">
            My jobs
          </ButtonLink>
        </div>
      </div>
    );
  }

  const photos = await getJobPhotos(job.job_photos.map((photo) => photo.storage_path));
  const photoUrl = new Map(photos.map((photo) => [photo.path, photo.url]));
  const sortedPhotos = [...job.job_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const contactDetails =
    job.accepted_offer_id && (isOwner || isAdmin || isAcceptedProvider)
      ? await getContactDetails(job.accepted_offer_id)
      : [];

  const canOffer =
    isMatchingProvider &&
    !isOwner &&
    !isAdmin &&
    !myOffer &&
    ["open", "receiving_offers"].includes(job.status);

  const sortedOffers = [...offers].sort((a, b) => {
    const rank: Record<string, number> = {
      submitted: 0,
      accepted: 1,
      declined: 2,
      withdrawn: 3,
    };
    return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <Link
          href={isOwner ? "/jobs" : isAdmin ? "/admin/jobs" : "/provide/jobs"}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {isOwner ? "Back to my jobs" : isAdmin ? "Back to admin jobs" : "Back to matching jobs"}
        </Link>

        <div className="mt-5">
          <p className="dash-kicker">Job request</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge kind="job" status={job.status} />
            {job.completed_at ? (
              <span className="rounded-full bg-success-bg px-3 py-1 text-sm font-bold text-success-fg">
                Completed {formatDate(job.completed_at)}
              </span>
            ) : null}
            {job.service_categories ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
                {job.service_categories.name}
              </span>
            ) : null}
            <span className="text-sm text-muted">Posted {formatDate(job.created_at)}</span>
          </div>
          <h1 className="mt-3">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {isOwner || isAdmin || isAcceptedProvider
                ? job.postcode
                : job.postcode_district}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {timeframeLabel(job.timeframe)}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="size-4" aria-hidden />
              {offers.length} {offers.length === 1 ? "offer" : "offers"}
            </span>
          </div>
        </div>

        {job.status === "removed" && job.removed_reason ? (
          <div className="mt-5">
            <DashAlert tone="danger">
              <strong>This job was removed.</strong> {job.removed_reason}
            </DashAlert>
          </div>
        ) : null}

        {sortedPhotos.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {sortedPhotos.map((photo) => {
              const url = photoUrl.get(photo.storage_path);
              if (!url) return null;
              return (
                <figure
                  key={photo.id}
                  className="rounded-photo overflow-hidden border border-line bg-slate-100"
                >
                  <img
                    src={url}
                    alt={`Photo for ${job.title}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {isOwner && job.status === "open" ? (
                    <figcaption className="border-t border-line bg-surface p-2">
                      <ActionForm
                        action={deleteJobPhoto}
                        fields={{ photoId: photo.id }}
                        label="Remove photo"
                        variant="quiet"
                        confirmMessage="Remove this photo from the job?"
                        successMessage="Photo removed."
                        className="text-sm"
                      />
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        ) : null}

        <section className={`${card} mt-6`}>
          <h2>What needs doing</h2>
          <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-6">
            {job.description}
          </p>
        </section>

        {contactDetails.length > 0 ? (
          <div className="mt-6">
            <ContactDetails details={contactDetails} />
          </div>
        ) : null}

        {isOwner || isAdmin ? (
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2>{isOwner ? "Offers" : "Offers on this job"}</h2>
                <p className="mt-1 text-sm text-muted">
                  {isOwner
                    ? "Accept one offer to close the job and release contact details. Other offers are declined automatically."
                    : "Read-only admin view."}
                </p>
              </div>
              {isAdmin ? (
                <ButtonLink href={`/admin/jobs`} variant="secondary">
                  Admin job tools
                </ButtonLink>
              ) : null}
            </div>

            {sortedOffers.length > 0 ? (
              <div className="mt-5 space-y-4">
                {sortedOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    actions={
                      isOwner && offer.status === "submitted" ? (
                        <>
                          <ActionForm
                            action={acceptOffer}
                            fields={{ offerId: offer.id }}
                            label="Accept offer"
                            confirmMessage="Accept this offer? The job will close and all other offers will be declined."
                            successMessage="Offer accepted. Contact details are now visible."
                          />
                          <ActionForm
                            action={declineOffer}
                            fields={{ offerId: offer.id }}
                            label="Decline"
                            variant="secondary"
                            confirmMessage="Decline this offer?"
                            successMessage="Offer declined."
                          />
                        </>
                      ) : null
                    }
                  />
                ))}
              </div>
            ) : (
              <div className={`${card} mt-5`}>
                <EmptyState
                  title="No offers yet"
                  description="Matching approved providers can see this job and send an offer. You can close the job if you no longer need help."
                />
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8">
            <h2>Your offer</h2>
            {myOffer ? (
              <div className="mt-5 space-y-4">
                <OfferCard offer={myOffer} title="Your offer" />
                {myOffer.status === "submitted" ? (
                  <>
                    <details className={card}>
                      <summary className="cursor-pointer font-bold text-primary">
                        Edit your offer
                      </summary>
                      <div className="mt-5">
                        <EditOfferForm offer={myOffer} />
                      </div>
                    </details>
                    <ActionForm
                      action={withdrawOffer}
                      fields={{ id: myOffer.id }}
                      label="Withdraw offer"
                      variant="destructive"
                      confirmMessage="Withdraw this offer? You cannot send another offer for this job."
                      successMessage="Offer withdrawn."
                    />
                  </>
                ) : null}
                {myOffer.status === "accepted" ? (
                  <DashAlert tone="success">
                    This offer was accepted. Contact details are shown above.
                  </DashAlert>
                ) : null}
              </div>
            ) : canOffer ? (
              <div className={`${card} mt-5`}>
                <CreateOfferForm jobId={job.id} jobTitle={job.title} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                This job is not taking offers from you. It may be closed, or it
                may be outside the services or areas you cover.
              </p>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <div className={card}>
          <h2>Job summary</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd>
                <StatusBadge kind="job" status={job.status} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Area</dt>
              <dd className="font-bold">{job.postcode_district}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Timeframe</dt>
              <dd className="font-bold">{timeframeLabel(job.timeframe)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Posted</dt>
              <dd className="font-bold">{formatDate(job.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Offers</dt>
              <dd className="font-bold">{offers.length}</dd>
            </div>
          </dl>
        </div>

        {isOwner && job.status === "open" && !job.accepted_offer_id ? (
          <details className={card}>
            <summary className="cursor-pointer font-bold text-primary">
              Edit job details
            </summary>
            <div className="mt-5">
              <EditJobForm job={job} />
            </div>
          </details>
        ) : null}

        {isOwner && ["open", "receiving_offers"].includes(job.status) ? (
          <ActionForm
            action={closeJob}
            fields={{ id: job.id }}
            label="Close job"
            variant="secondary"
            confirmMessage="Close this job? Providers will no longer be able to send offers."
            successMessage="Job closed."
          />
        ) : null}

        {job.status === "closed" &&
        job.accepted_offer_id &&
        !job.completed_at &&
        (isOwner || isAcceptedProvider) ? (
          <ActionForm
            action={markJobComplete}
            fields={{ id: job.id }}
            label="Mark job completed"
            variant="secondary"
            confirmMessage="Mark this job as completed? This tells the other party the work is finished."
            successMessage="Job marked completed."
          />
        ) : null}

        {job.completed_at ? (
          <div className={`${card} text-sm`}>
            <p className="font-bold">Work completed</p>
            <p className="mt-1 text-muted">
              Marked completed on {formatDate(job.completed_at)}. Contact details
              stay available on this page.
            </p>
          </div>
        ) : null}

        {isAdmin ? (
          <div className={`${card} text-sm`}>
            <p className="font-bold">Admin view</p>
            <p className="mt-1 text-muted">
              You can see the full postcode and all offers. Use the admin job
              list to remove a job or contact the customer.
            </p>
            <Link
              href="/admin/jobs"
              className="mt-3 inline-block font-bold text-primary underline underline-offset-4"
            >
              Open admin jobs
            </Link>
          </div>
        ) : null}

        <div className={card}>
          <p className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-5 text-success" aria-hidden />
            Contact stays private
          </p>
          <p className="mt-2 text-sm text-muted">
            Full postcode, email and phone are released only after an offer is
            accepted.
          </p>
        </div>

        {!isOwner && !isAdmin ? (
          <ReportForm targetType="job" targetId={job.id} />
        ) : null}

        <DashAlert tone="info">
          Agree the work, price and timing directly with the provider. We do not
          take payments or commission.
        </DashAlert>

        <p className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays className="size-3.5" aria-hidden />
          Job reference {job.id.slice(0, 8)}
        </p>
      </aside>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Params }) {
  return (
    <div className="dash-page">
      <Suspense fallback={<JobSkeleton />}>
        <JobDetailContent params={params} />
      </Suspense>
    </div>
  );
}
