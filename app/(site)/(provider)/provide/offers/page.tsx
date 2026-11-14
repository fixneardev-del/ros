import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireApprovedProvider } from "@/lib/permissions";
import { getProviderOffers } from "@/lib/data/jobs";
import { OfferCard } from "@/components/mend/offer-card";
import { EmptyState } from "@/components/mend/tag";
import { ActionForm } from "@/components/forms/action-form";
import { EditOfferForm } from "@/components/forms/offer-forms";
import { withdrawOffer } from "@/lib/actions/offers";
import { ButtonLink } from "@/components/ui/button";
import { SearchBox } from "@/components/dash/search-box";
import { matchesQuery, normaliseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "My offers" };

type SearchParams = Promise<{ q?: string }>;

async function OffersContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const context = await requireApprovedProvider();
  const offers = await getProviderOffers(context.user.id);
  const query = normaliseQuery(params.q);

  // The status counts describe every offer, so they are built from the full
  // list before the search narrows what is shown.
  const visible = query
    ? offers.filter((offer) =>
        matchesQuery(
          query,
          offer.message,
          offer.status,
          offer.job_requests?.title,
          offer.job_requests?.postcode_district,
          offer.job_requests?.service_categories?.name,
        ),
      )
    : offers;

  const counts = offers.reduce(
    (totals, offer) => {
      totals[offer.status] = (totals[offer.status] ?? 0) + 1;
      return totals;
    },
    {} as Record<string, number>,
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="dash-kicker">Provider offers</p>
          <h1 className="mt-2">My offers</h1>
          <p className="mt-3 text-sm text-muted">
            Track the offers you have sent. You can edit or withdraw an offer
            while it is still submitted.
          </p>
        </div>
        <ButtonLink href="/provide/jobs">Find more jobs</ButtonLink>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {[
          ["submitted", "Submitted"],
          ["accepted", "Accepted"],
          ["declined", "Declined"],
          ["withdrawn", "Withdrawn"],
        ].map(([key, label]) => (
          <span
            key={key}
            className="rounded-full border border-line-strong bg-surface px-3 py-1 font-bold"
          >
            {label}: {counts[key] ?? 0}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <SearchBox
          action="/provide/offers"
          query={query}
          label="Search your offers by job, area or message"
          placeholder="Job, area or message"
          resultCount={visible.length}
          noun="offer"
        />
      </div>

      {visible.length > 0 ? (
        <div className="mt-6 space-y-6">
          {visible.map((offer) => (
            <div key={offer.id}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/jobs/${offer.job_id}`}
                  className="font-bold text-primary underline underline-offset-4"
                >
                  {offer.job_requests?.title ?? "Job"}
                </Link>
                {offer.job_requests ? (
                  <span className="text-sm text-muted">
                    {offer.job_requests.postcode_district}
                    {offer.job_requests.service_categories
                      ? ` · ${offer.job_requests.service_categories.name}`
                      : ""}
                  </span>
                ) : null}
              </div>
              <OfferCard
                offer={offer}
                title="Your offer"
                actions={
                  offer.status === "submitted" ? (
                    <ActionForm
                      action={withdrawOffer}
                      fields={{ id: offer.id }}
                      label="Withdraw offer"
                      variant="destructive"
                      confirmMessage="Withdraw this offer? You cannot send another offer for this job."
                      successMessage="Offer withdrawn."
                    />
                  ) : null
                }
              />
              {offer.status === "submitted" ? (
                <details className="mt-2 rounded-surface border border-line bg-surface p-5">
                  <summary className="cursor-pointer font-bold text-primary">
                    Edit this offer
                  </summary>
                  <div className="mt-5">
                    <EditOfferForm offer={offer} />
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      ) : query ? (
        <div className="mt-6 rounded-surface border border-line bg-surface p-5">
          <EmptyState
            title="No offers match your search"
            description={`Nothing in your offers matches “${query}”. Try a different word, or clear the search.`}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-surface border border-line bg-surface p-5">
          <EmptyState
            title="No offers yet"
            description="When you send an offer for a matching job, it will appear here with its status."
            action={<ButtonLink href="/provide/jobs">Find matching jobs</ButtonLink>}
          />
        </div>
      )}
    </div>
  );
}

export default function ProviderOffersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="dash-page">
      <Suspense
        fallback={
          <div className="space-y-4" aria-hidden>
            <div className="h-12 w-64 rounded bg-slate-100" />
            <div className="h-48 rounded-surface bg-slate-100" />
            <div className="h-48 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <OffersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
