import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAdminOffers } from "@/lib/data/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/mend/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { removeOffer } from "@/lib/actions/admin";
import { DashAlert } from "@/components/dash/dash-alert";
import { SearchBox } from "@/components/dash/search-box";
import { normaliseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Admin offers" };

type SearchParams = Promise<{ q?: string; ok?: string; error?: string }>;

async function OffersContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const query = normaliseQuery(params.q);
  const offers = await getAdminOffers(query);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>
            Offers
          </h1>
          <p className="mt-3 text-muted">
            Read every offer sent on the marketplace. Removing an offer withdraws
            it from the customer.
          </p>
        </div>
        <ButtonLink href="/api/admin/export/offers" variant="secondary">
          Export CSV
        </ButtonLink>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <div className="mt-6">
        <SearchBox
          action="/admin/offers"
          query={query}
          label="Search offers by provider, job or message"
          placeholder="Provider, job or message"
          resultCount={offers.length}
          noun="offer"
        />
      </div>

      {offers.length > 0 ? (
        <div className="mt-6 space-y-4">
          {offers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-surface border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2>
                    {offer.provider_profiles?.display_name ?? "Unknown provider"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {offer.job_requests ? (
                      <Link
                        href={`/jobs/${offer.job_requests.id}`}
                        className="font-bold text-primary underline underline-offset-4"
                      >
                        {offer.job_requests.title}
                      </Link>
                    ) : (
                      "Job unavailable"
                    )}{" "}
                    · {formatDate(offer.created_at)}
                  </p>
                </div>
                <StatusBadge kind="offer" status={offer.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span>
                  <strong>Price:</strong>{" "}
                  {formatPrice(offer.indicative_price_pence)}
                </span>
                <span>
                  <strong>Timeframe:</strong>{" "}
                  {offer.estimated_timeframe || "Not stated"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                {offer.message}
              </p>

              {offer.status !== "withdrawn" ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-bold text-danger-fg">
                    Remove this offer
                  </summary>
                  <form action={removeOffer} className="mt-3 max-w-xl space-y-3">
                    <input type="hidden" name="id" value={offer.id} />
                    <label
                      htmlFor={`remove-offer-${offer.id}`}
                      className="block text-sm font-bold"
                    >
                      Reason
                    </label>
                    <textarea
                      id={`remove-offer-${offer.id}`}
                      name="reason"
                      rows={2}
                      minLength={10}
                      maxLength={500}
                      required
                      className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button type="submit" variant="destructive">
                      Withdraw offer
                    </Button>
                  </form>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-surface border border-line bg-surface p-5 text-muted">
          {query
            ? `No offers match “${query}”.`
            : "No offers have been sent yet."}
        </p>
      )}
    </div>
  );
}

export default function AdminOffersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-64 rounded bg-slate-100" />
          <div className="h-40 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <OffersContent searchParams={searchParams} />
    </Suspense>
  );
}
