import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireCustomer } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { CreateJobForm } from "@/components/forms/job-forms";
import { DashAlert } from "@/components/dash/dash-alert";

export const metadata: Metadata = { title: "Post a job" };

const card = "dash-card";

async function PostJobContent() {
  const context = await requireCustomer("/post-job");
  const categories = await getCategories();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="dash-kicker">New request</p>
        <h1 className="mt-2">Post a job</h1>
        <p className="mt-2 text-muted">
          Describe what you need. Approved providers who cover your area and
          service can send an offer. Your full postcode is visible only to you
          and the admin.
        </p>

        <section className={`${card} mt-6`}>
          <CreateJobForm categories={categories} />
        </section>
      </div>

      <aside className="space-y-4">
        <DashAlert tone="info">
          <strong>Pilot area.</strong> We are starting in G12, G11, G3 and G4.
          If your postcode is outside these districts, post the job and we will
          keep you informed as the pilot grows.
        </DashAlert>

        <div className={card}>
          <h2>What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Your job appears to matching approved providers.</li>
            <li>They can send an offer with a message and indicative price.</li>
            <li>You accept one offer. Other offers are declined.</li>
            <li>Contact details are released and you arrange the work.</li>
          </ol>
        </div>

        <div className={`${card} text-sm`}>
          <p className="font-bold">Signed in as {context.user.email}</p>
          <p className="mt-1 text-muted">
            You can manage this job from{" "}
            <Link
              href="/jobs"
              className="font-bold text-primary underline underline-offset-4"
            >
              My jobs
            </Link>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <div className="dash-page">
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-hidden>
            <div className="h-[640px] rounded-surface bg-slate-100" />
            <div className="h-64 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <PostJobContent />
      </Suspense>
    </div>
  );
}
