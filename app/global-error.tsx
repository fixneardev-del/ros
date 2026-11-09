"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink">
        <main className="mx-auto flex min-h-dvh max-w-[720px] flex-col justify-center px-4 py-16 md:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Something went wrong
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-5xl">
            The site hit a problem.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Reload the page to try again. If it keeps happening, contact us using
            the address in the footer.
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 text-base font-bold text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
