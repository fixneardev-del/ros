import { ButtonLink } from "@/components/ui/button";
import { studioSans, studioSerif } from "@/lib/fonts";
import "@/app/design-system.css";
import "@/app/studio.css";

export default function Forbidden() {
  return (
    <html lang="en-GB">
      <body>
        <div className={`studio ${studioSans.variable} ${studioSerif.variable}`}>
          <main id="main" className="l-container s-page s-page-narrow">
            <p className="l-kicker">403</p>
            <h1 className="mt-3">You cannot see this page.</h1>
            <p className="l-lead mt-4">
              Your account does not have access to this area. If you think that
              is wrong, contact the site owner.
            </p>
            <div className="mt-8">
              <ButtonLink href="/">Go home</ButtonLink>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
