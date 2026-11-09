import type { Metadata } from "next";
import { LegalPage } from "@/components/mend/legal-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="8 November 2026">
      <h2>What this service is</h2>
      <p>
        Repairs and Other Services is a noticeboard and messaging marketplace. We
        help customers post jobs and providers send offers. We are not a party to
        the work agreement and we do not carry out the work.
      </p>

      <h2>Accounts</h2>
      <p>
        You must give accurate information, keep your login secure and use the
        service lawfully. You must be old enough to enter a contract. We may
        suspend accounts that break these terms or put others at risk.
      </p>

      <h2>Posting jobs</h2>
      <p>
        Describe the work honestly, choose the right category and only post jobs
        you are entitled to arrange. Do not include other people&apos;s private
        information without permission. Jobs must be in an enabled pilot area.
      </p>

      <h2>Offers and acceptance</h2>
      <p>
        Providers are responsible for their offers. Customers choose one offer to
        accept. Accepting an offer closes the job and releases contact details to
        both parties. Other offers are declined automatically. Agree the final
        price, scope, timing and any guarantees directly with the other party.
      </p>

      <h2>Providers</h2>
      <p>
        Providers must be approved before sending offers. Keep your services,
        areas and photos accurate. Providers are independent: we do not guarantee
        qualifications, insurance, checks or the quality of work unless a profile
        says so. You must comply with the law and any licensing or safety rules
        that apply to your work.
      </p>

      <h2>Prohibited content and conduct</h2>
      <ul>
        <li>No harassment, discrimination, threats or illegal work.</li>
        <li>No spam, scraping, fake accounts or misleading offers.</li>
        <li>No content that infringes someone else&apos;s rights.</li>
      </ul>
      <p>
        We may remove content, decline or suspend providers, and report serious
        issues to the relevant authorities.
      </p>

      <h2>Payments</h2>
      <p>
        We do not take payments or commission. Any payment is arranged directly
        between the customer and provider. Take care with deposits and never send
        money to someone you do not trust.
      </p>

      <h2>Liability</h2>
      <p>
        We provide the marketplace as it is. To the extent the law allows, we are
        not liable for the acts or omissions of customers or providers, or for
        losses arising from work arranged through the service. Nothing in these
        terms limits liability that cannot be limited by law.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms as the pilot develops. These terms are governed
        by the law of Scotland, and the Scottish courts have jurisdiction.
      </p>
    </LegalPage>
  );
}
