import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Search } from "lucide-react";
import { checkPostcode } from "@/lib/actions/search";
import {
  getCategories,
  getCategoryAndChildren,
  getCategoryBySlug,
} from "@/lib/data/categories";
import { topLevelCategories } from "@/lib/category-utils";
import { searchProviders } from "@/lib/data/providers";
import type { SearchProvider } from "@/lib/types";
import { SearchForm } from "@/components/mend/search-form";
import { ProviderCard } from "@/components/mend/provider-card";
import { EmptyState, PilotNotice, StitchLine } from "@/components/mend/tag";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { ButtonLink } from "@/components/ui/button";
import { normaliseQuery } from "@/lib/search";

export const metadata: Metadata = {
  title: "Find local help",
  description:
    "Search approved local providers in Glasgow's West End by service and postcode district.",
};

type SearchParams = Promise<{ service?: string; postcode?: string; q?: string }>;

function SearchSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]" aria-hidden>
      <div className="h-80 rounded-surface bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-72 rounded-surface bg-slate-100" />
        <div className="h-72 rounded-surface bg-slate-100" />
      </div>
    </div>
  );
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const service = params.service?.trim() ?? "";
  const postcode = params.postcode?.trim() ?? "";
  const query = normaliseQuery(params.q);
  const categories = await getCategories();
  const parents = topLevelCategories(categories);

  if (!service || !postcode) {
    return (
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="panel">
          <h2 className="text-xl font-bold">Start a search</h2>
          <p className="mt-1 text-sm text-muted">
            Choose a service and enter your postcode.
          </p>
          <div className="mt-4">
            <SearchForm
              categories={categories}
              defaultService={service}
              defaultPostcode={postcode}
              defaultQuery={query}
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Browse by service</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {parents.map((category) => (
              <Link
                key={category.id}
                href={`/search?service=${category.slug}${
                  postcode ? `&postcode=${encodeURIComponent(postcode)}` : ""
                }`}
                className="panel transition hover:-translate-y-0.5"
              >
                <span className="font-bold">{category.name}</span>
                {category.description ? (
                  <span className="mt-1 block text-sm text-muted">
                    {category.description}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          {parents.length === 0 ? (
            <p className="mt-4 text-muted">
              Categories have not been seeded yet. Run the Supabase seed file.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const postcodeCheck = await checkPostcode(postcode);
  const category = await getCategoryBySlug(service);

  if (!postcodeCheck.valid) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="s-alert bg-danger-bg p-5 text-danger-fg">
          <h2 className="text-xl font-bold">That postcode does not look right</h2>
          <p className="mt-1 text-sm">
            Enter a Glasgow postcode like G12 8QQ. We use the district only.
          </p>
        </div>
        <div className="mt-6 panel">
          <SearchForm
            categories={categories}
            defaultService={service}
            defaultPostcode={postcode}
            defaultQuery={query}
          />
        </div>
      </div>
    );
  }

  if (!postcodeCheck.inPilot) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PilotNotice>
          We are not in {postcodeCheck.district} yet. We are starting in
          Glasgow&apos;s West End and selected university communities. Leave your
          email and we will let you know when we arrive.
        </PilotNotice>
        <div className="panel">
          <h2 className="text-xl font-bold">Join the waitlist</h2>
          <p className="mt-1 text-sm text-muted">
            We will only use this to tell you about the pilot.
          </p>
          <div className="mt-4">
            <WaitlistForm postcode={postcode} />
          </div>
        </div>
        <ButtonLink href="/search" variant="secondary">
          Try another search
        </ButtonLink>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="s-alert bg-warning-bg p-5 text-warning-fg">
          <h2 className="text-xl font-bold">That service is not available</h2>
          <p className="mt-1 text-sm">
            Choose a service from the list. The client can rename or deactivate
            categories in the admin area.
          </p>
        </div>
        <div className="panel">
          <SearchForm
            categories={categories}
            defaultPostcode={postcode}
            defaultQuery={query}
          />
        </div>
      </div>
    );
  }

  const children = await getCategoryAndChildren(category.id);
  const providers = (await searchProviders(
    category.id,
    children?.ids.filter((id) => id !== category.id) ?? [],
    postcodeCheck.district ?? "",
    query,
  )) as unknown as SearchProvider[];

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <div className="panel">
          <h2 className="text-xl font-bold">Search again</h2>
          <div className="mt-4">
            <SearchForm
              categories={categories}
              defaultService={service}
              defaultPostcode={postcode}
              defaultQuery={query}
            />
          </div>
        </div>
        <div className="panel">
          <p className="flex items-center gap-2 text-sm font-bold">
            <MapPin className="size-4 text-primary" aria-hidden />
            {postcodeCheck.district} pilot area
          </p>
          <p className="mt-2 text-sm text-muted">
            Providers are shown when they cover this district and offer this
            service. We do not use distance or maps.
          </p>
        </div>
      </aside>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="s-section-title">
              {category.name} in {postcodeCheck.district}
            </h2>
            <p className="mt-1 text-muted">
              {providers.length}{" "}
              {providers.length === 1 ? "approved provider" : "approved providers"}
              {query ? ` matching “${query}”` : ""}
            </p>
          </div>
          <ButtonLink href="/post-job" variant="secondary">
            Post a job instead
          </ButtonLink>
        </div>
        <StitchLine className="mt-4 w-24" />

        {providers.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.user_id}
                provider={provider}
                categoryName={category.name}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              query
                ? "No providers match that keyword"
                : "No approved providers here yet"
            }
            description={
              query
                ? `No approved ${category.name.toLowerCase()} providers in ${postcodeCheck.district} match “${query}”. Try a different word, or search again without a keyword.`
                : `We are still growing in ${postcodeCheck.district}. Post a job so local providers can find you, or check another service.`
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/post-job">Post a job</ButtonLink>
                <ButtonLink href="/provide/apply" variant="secondary">
                  Offer your services
                </ButtonLink>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="l-container s-page">
      <div className="mb-8 max-w-3xl">
        <p className="l-kicker flex items-center gap-2">
          <Search className="size-4" aria-hidden />
          Local search
        </p>
        <h1 className="mt-2">Find someone nearby.</h1>
        <p className="l-lead mt-3">
          Search approved providers by service and postcode district. Contact
          details are released only after you accept an offer.
        </p>
      </div>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
