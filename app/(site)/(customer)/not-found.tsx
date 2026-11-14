import Link from "next/link";

/**
 * The not-found page for the signed-in dashboard. It sits inside the customer
 * layout, so it uses the dashboard chrome rather than the public pages.
 */
export default function CustomerNotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="dash-kicker">404</p>
      <h1 className="mt-2">We couldn&apos;t find that page.</h1>
      <p className="mt-4 text-sm text-muted">
        The link may be old, or the page may have moved. Your jobs are always
        in one place.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/jobs"
          className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 text-base font-bold text-primary-fg hover:bg-primary-hover"
        >
          My jobs
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-control px-5 text-base font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
