import type { Metadata } from "next";
import { LegalPage } from "@/components/mend/legal-page";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="8 November 2026">
      <h2>Who we are</h2>
      <p>
        Repairs and Other Services is a local marketplace for Glasgow&apos;s West
        End. It helps people post repair and service jobs and helps independent
        providers find work. This notice explains what we collect and how we use
        it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and optional phone number.</li>
        <li>Job details: the work you need, your postcode and any photos you add.</li>
        <li>Offer details: the messages, prices and timeframes providers send.</li>
        <li>Provider applications: business details, services, areas and photos.</li>
        <li>Reports, waitlist signups and basic technical logs.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>
        We use your information to run the marketplace, show relevant jobs and
        providers, send service emails, review provider applications, handle
        reports and keep the service secure. We rely on contract necessity for
        running your account and the marketplace, legitimate interests for safety
        and moderation, and consent where we ask for it.
      </p>

      <h2>Who can see what</h2>
      <p>
        Your full postcode, email address and phone number stay private until you
        accept an offer. At that point they are released to the provider whose
        offer you accepted. Providers can see the postcode district, job
        description and photos while the job is open. Administrators can see
        marketplace data to review applications and moderate content.
      </p>

      <h2>Processors and transfers</h2>
      <p>
        We use Supabase for database and file storage, Resend for transactional
        email and Vercel for hosting. These providers process data on our behalf.
        Some processing may happen outside the UK; where it does, we rely on
        appropriate safeguards.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep account and job data while your account is active and for a
        reasonable period afterwards for safety, disputes and legal obligations.
        We delete or anonymise data when it is no longer needed.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for a copy of your data, ask us to correct or delete it, or
        object to certain processing. Contact us using the address in the footer.
        You can also complain to the Information Commissioner&apos;s Office.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and protect forms. Read the
        cookie notice for details.
      </p>
    </LegalPage>
  );
}
