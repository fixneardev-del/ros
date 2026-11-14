import type { Metadata } from "next";
import { LegalPage } from "@/components/mend/legal-page";

export const metadata: Metadata = { title: "Cookie notice" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie notice" updated="8 November 2026">
      <h2>What cookies are</h2>
      <p>
        Cookies are small files stored on your device. We use them to keep you
        signed in, protect forms and remember basic preferences.
      </p>

      <h2>Essential cookies</h2>
      <p>
        Supabase sets session cookies when you sign in. These are needed for your
        account, job posting, provider dashboard and admin tools. They are not
        used for advertising.
      </p>

      <h2>Analytics</h2>
      <p>
        If we enable privacy-friendly analytics during the pilot, we will list the
        provider here and ask for consent where the law requires it. We do not use
        advertising cookies.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can block or delete cookies in your browser settings. Blocking
        essential cookies will stop you signing in and using the marketplace.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies or privacy can go to the contact address in the
        footer.
      </p>
    </LegalPage>
  );
}
