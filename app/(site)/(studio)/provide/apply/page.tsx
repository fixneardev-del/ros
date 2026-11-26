import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { getDistricts } from "@/lib/data/locations";
import { ProviderApplicationForm } from "@/components/forms/provider-forms";

export const metadata: Metadata = { title: "Apply to offer services" };

async function ApplyContent() {
  const context = await requireUser("/provide/apply");

  // This is the public application path for someone who has not applied yet.
  // An existing application is tracked on the account page, whether it is
  // pending or approved, so the form is never shown twice.
  if (context.profile.role === "admin") redirect("/admin");
  if (context.providerProfile) redirect("/account");

  const [categories, districts] = await Promise.all([
    getCategories(),
    getDistricts(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-muted">
          Provider application
        </p>
        <h1 className="mt-1 text-3xl font-bold">Offer your services</h1>
        <p className="mt-2 max-w-[70ch] text-muted">
          Tell us about your work, choose the services and pilot areas you
          cover, and add photos. An admin reviews every application before it
          appears in search.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="panel">
          <ProviderApplicationForm categories={categories} districts={districts} />
        </div>

        <aside className="space-y-4">
          <p className="s-alert bg-warning-bg p-4 text-sm text-warning-fg">
            We are starting in G12, G11, G3 and G4. You must cover at least one
            enabled pilot area.
          </p>

          <div className="panel">
            <h2 className="text-lg font-bold">What we check</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>Your profile, photos and chosen services.</li>
              <li>At least one photo of your work.</li>
              <li>Extra evidence for categories marked as needing checks.</li>
            </ul>
          </div>

          <div className="panel">
            <p className="font-bold">Independent providers</p>
            <p className="mt-1 text-sm text-muted">
              Providers are independent. We do not guarantee qualifications,
              insurance or checks unless a profile says so. You agree the work
              and price directly with the customer.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-6xl py-10">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]" aria-hidden>
            <div className="h-[720px] rounded-surface bg-slate-100" />
            <div className="h-64 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <ApplyContent />
      </Suspense>
    </div>
  );
}
