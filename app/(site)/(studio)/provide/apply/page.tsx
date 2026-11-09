import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { getDistricts } from "@/lib/data/locations";
import { ProviderApplicationForm } from "@/components/forms/provider-forms";
import { PilotNotice, StitchLine } from "@/components/mend/tag";

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
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="l-kicker">
          Provider application
        </p>
        <h1 className="mt-2">
          Offer your services
        </h1>
        <StitchLine className="mt-4 w-24" />
        <p className="l-lead mt-4">
          Tell us about your work, choose the services and pilot areas you cover,
          and add photos. An admin reviews every application before it appears in
          search.
        </p>
        <div className="panel mt-6 md:p-6">
          <ProviderApplicationForm categories={categories} districts={districts} />
        </div>
      </div>

      <aside className="space-y-4">
        <PilotNotice>
          We are starting in G12, G11, G3 and G4. You must cover at least one
          enabled pilot area.
        </PilotNotice>
        <div className="panel text-sm">
          <h2 className="text-lg font-bold">What we review</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>Your name, business name and description.</li>
            <li>The services you offer and the areas you cover.</li>
            <li>At least one clear photo of your work.</li>
            <li>Extra evidence for categories marked as needing checks.</li>
          </ul>
        </div>
        <div className="panel text-sm">
          <p className="font-bold">Independent providers</p>
          <p className="mt-1 text-muted">
            Providers are independent. We do not guarantee qualifications,
            insurance or checks unless a profile says so. You agree the work and
            price directly with the customer.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div className="l-container s-page">
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
