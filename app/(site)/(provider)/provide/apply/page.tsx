import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { getDistricts } from "@/lib/data/locations";
import { ProviderApplicationForm } from "@/components/forms/provider-forms";
import { DashAlert } from "@/components/dash/dash-alert";

export const metadata: Metadata = { title: "Apply to offer services" };

async function ApplyContent() {
  const context = await requireUser("/provide/apply");

  if (context.providerProfile) {
    redirect("/provide");
  }

  const [categories, districts] = await Promise.all([
    getCategories(),
    getDistricts(),
  ]);

  return (
    <div className="dash-page">
      <div>
        <p className="dash-kicker">Provider application</p>
        <h1 className="mt-1">Offer your services</h1>
        <p className="mt-2 max-w-[70ch] text-muted">
          Tell us about your work, choose the services and pilot areas you
          cover, and add photos. An admin reviews every application before it
          appears in search.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="dash-card">
          <ProviderApplicationForm categories={categories} districts={districts} />
        </div>

        <aside className="space-y-4">
          <DashAlert tone="info">
            We are starting in G12, G11, G3 and G4. You must cover at least one
            enabled pilot area.
          </DashAlert>

          <div className="dash-card">
            <h2>What we review</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
              <li>Your name, business name and description.</li>
              <li>The services you offer and the areas you cover.</li>
              <li>At least one clear photo of your work.</li>
              <li>Extra evidence for categories marked as needing checks.</li>
            </ul>
          </div>

          <div className="dash-card">
            <p className="font-bold">Independent providers</p>
            <p className="mt-1 text-muted">
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
    <div className="dash-page">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-hidden>
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
