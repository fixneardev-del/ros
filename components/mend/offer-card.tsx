import type { ReactNode } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { OfferStatus, ProviderStatus, ProviderType } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/mend/status-badge";

export interface OfferCardProvider {
  user_id: string;
  display_name: string;
  provider_type?: ProviderType;
  service_districts?: string[];
  status?: ProviderStatus;
}

export interface OfferCardOffer {
  id: string;
  message: string;
  indicative_price_pence: number | null;
  estimated_timeframe: string | null;
  status: OfferStatus;
  provider_profiles?: OfferCardProvider | null;
}

export function OfferCard({
  offer,
  actions,
  showStatus = true,
  title,
}: {
  offer: OfferCardOffer;
  actions?: ReactNode;
  showStatus?: boolean;
  title?: string;
}) {
  const provider = offer.provider_profiles;
  const isPublic = !provider?.status || provider.status === "approved";
  const name = title ?? provider?.display_name ?? "Provider";

  return (
    <article className="s-panel rounded-surface border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {provider && !title && isPublic ? (
              <Link
                href={`/providers/${provider.user_id}`}
                className="text-primary underline underline-offset-4"
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </h3>
          {provider && !title ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{provider.provider_type?.replace("_", " ")}</span>
              {provider.service_districts?.length ? (
                <span>Covers {provider.service_districts.join(", ")}</span>
              ) : null}
            </p>
          ) : null}
          {showStatus ? <StatusBadge kind="offer" status={offer.status} className="mt-2" /> : null}
        </div>
        <p className="text-lg font-bold tabular-nums">
          {formatPrice(offer.indicative_price_pence)}
        </p>
      </div>

      <p className="mt-3 whitespace-pre-line text-ink">{offer.message}</p>

      {offer.estimated_timeframe ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <Clock className="size-4" aria-hidden />
          {offer.estimated_timeframe}
        </p>
      ) : null}

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}

export function ContactDetails({
  details,
}: {
  details: Array<{
    party: string;
    full_name: string;
    email: string;
    phone: string | null;
  }>;
}) {
  if (details.length === 0) return null;

  return (
    <div className="rounded-surface border border-success bg-success-bg p-5 text-success-fg">
      <h3 className="text-lg font-bold">You can now contact each other directly</h3>
      <p className="mt-1 text-sm">
        The offer was accepted. Arrange the work between yourselves.
      </p>
      <ul className="mt-4 space-y-3">
        {details.map((detail) => (
          <li key={detail.party} className="text-sm">
            <span className="font-bold capitalize">{detail.party}:</span>{" "}
            {detail.full_name}
            <br />
            <a className="underline" href={`mailto:${detail.email}`}>
              {detail.email}
            </a>
            {detail.phone ? (
              <>
                <br />
                <a className="underline" href={`tel:${detail.phone}`}>
                  {detail.phone}
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
