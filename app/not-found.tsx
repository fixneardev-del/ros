import { ButtonLink } from "@/components/ui/button";
import { studioSans, studioSerif } from "@/lib/fonts";
import "@/app/design-system.css";
import "@/app/studio.css";

export default function NotFound() {
  return (
    <div className={`studio ${studioSans.variable} ${studioSerif.variable}`}>
      <main id="main" className="l-container s-page s-page-narrow">
        <p className="l-kicker">404</p>
        <h1 className="mt-3">We couldn&apos;t find that page.</h1>
        <p className="l-lead mt-4">
          The link may be old, or the page may have moved. Try the homepage or
          search for the help you need.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/search" variant="secondary">
            Find help
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
