/**
 * Search helpers shared by every list in the app.
 *
 * Filtering happens where the rows are already read: in the data function or
 * the server component. None of the lists paginate yet, so a filter in memory
 * costs nothing and keeps one code path for every page. If a list starts
 * paginating, its filter moves into the database query and this file keeps the
 * cleaning and matching rules.
 */

export const SEARCH_QUERY_MAX = 80;

/**
 * Cleans a query before it is compared or put in a URL.
 *
 * Anything that would break a PostgREST filter or a `LIKE` pattern is turned
 * into a space: `,` and `()` separate and group filters, `%` and `_` are
 * `LIKE` wildcards, and `*` is PostgREST's shorthand for `%`. What is left is
 * ordinary text, so a stray bracket can never widen a search.
 */
export function normaliseQuery(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .replace(/[,()*%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_QUERY_MAX);
}

/**
 * True when any of the values contains the query, ignoring case.
 *
 * An empty query matches everything, so a page can call this without first
 * checking whether someone searched.
 */
export function matchesQuery(
  query: string,
  ...values: Array<string | number | null | undefined>
): boolean {
  if (!query) return true;

  const needle = query.toLowerCase();
  return values.some((value) =>
    value === null || value === undefined
      ? false
      : String(value).toLowerCase().includes(needle),
  );
}
