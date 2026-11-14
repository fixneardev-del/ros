import Link from "next/link";
import { Search } from "lucide-react";
import { SEARCH_QUERY_MAX } from "@/lib/search";

/**
 * A search box for a dashboard list.
 *
 * It is a plain GET form, so the query lives in the address bar. Results can
 * be linked to, the back button works, and the page is still rendered on the
 * server with no client JavaScript involved.
 *
 * Any other filter the page is using is carried in `hidden`, so searching
 * narrows what is already on screen instead of throwing the filter away.
 */
export function SearchBox({
  action,
  query,
  placeholder,
  label,
  hidden = {},
  resultCount,
  noun = "result",
}: {
  action: string;
  query: string;
  placeholder: string;
  label?: string;
  hidden?: Record<string, string | undefined>;
  resultCount?: number;
  noun?: string;
}) {
  const kept = Object.entries(hidden).filter(([, value]) => value) as Array<
    [string, string]
  >;

  const clearParams = new URLSearchParams(kept);
  const clearQuery = clearParams.toString();
  const clearHref = clearQuery ? `${action}?${clearQuery}` : action;

  return (
    <form action={action} method="get" role="search" className="dash-search">
      {kept.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <label htmlFor="search-q" className="sr-only">
        {label ?? "Search"}
      </label>

      <div className="dash-search-row">
        <span className="dash-search-icon" aria-hidden>
          <Search />
        </span>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={placeholder}
          maxLength={SEARCH_QUERY_MAX}
          autoComplete="off"
          className="dash-search-input"
        />
        <button type="submit" className="dash-search-submit">
          Search
        </button>
      </div>

      {query ? (
        <p className="dash-search-meta">
          <span>
            {resultCount ?? 0} {noun}
            {(resultCount ?? 0) === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </span>
          <Link href={clearHref}>Clear search</Link>
        </p>
      ) : null}
    </form>
  );
}
