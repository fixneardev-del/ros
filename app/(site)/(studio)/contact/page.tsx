import Link from "next/link";
import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { getServerEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Ask Repairs and Other Services a question about the Glasgow pilot, jobs or provider applications.",
};

export default function ContactPage() {
  const env = getServerEnv();
  const email = env.supportEmail || env.adminEmail;

  return (
    <div className="l-container">
      <div className="s-page s-page-narrow">
        <p className="l-kicker">Contact</p>
        <h1 className="mt-3">Contact us</h1>
        <p className="mt-3 max-w-[70ch] text-muted">
          Questions about a job, your account or becoming a provider? Send us a
          message and we will reply by email.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
          <section className="panel">
            <h2 className="text-xl font-bold">Send a message</h2>
            <p className="mt-1 text-sm text-muted">
              We aim to reply within two working days.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </section>

          <aside className="space-y-4">
            {email ? (
              <div className="panel">
                <h2 className="text-lg font-bold">Email</h2>
                <a
                  href={`mailto:${email}`}
                  className="mt-2 block break-all font-bold underline underline-offset-4"
                >
                  {email}
                </a>
              </div>
            ) : null}

            <div className="panel">
              <h2 className="text-lg font-bold">Provider applications</h2>
              <p className="mt-2 text-sm text-muted">
                Ready to offer your services? Apply online, then an admin
                reviews your profile. You will get an email once the review is
                complete.
              </p>
              <Link
                href="/provide/apply"
                className="mt-3 inline-block font-bold underline underline-offset-4"
              >
                Apply to offer services
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
