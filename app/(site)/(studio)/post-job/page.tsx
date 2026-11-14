import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { CreateJobForm } from "@/components/forms/job-forms";
import { PilotNotice, StitchLine } from "@/components/mend/tag";

export const metadata: Metadata = { title: "Post a job" };

async function PostJobContent() {
  const context = await requireUser("/post-job");
  const categories = await getCategories();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="l-kicker">New request</p>
        <h1 className="mt-2">Post a job</h1>
        <StitchLine className="mt-4 w-24" />
        <p className="l-lead mt-4">
          Describe what you need. Approved providers who cover your area and
          service can send an offer. Your full postcode is visible only to you
          and the admin.
        </p>
        <div className="panel mt-6 md:p-6">
          <CreateJobForm categories={categories} />
        </div>
      </div>

      <aside className="space-y-4">
        <PilotNotice>
          We are starting in G12, G11, G3 and G4. If your postcode is outside
          these districts, post the job and we will keep you informed as the
          pilot grows.
        </PilotNotice>
        <div className="panel text-sm">
          <h2 className="text-lg font-bold">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
            <li>Your job appears to matching approved providers.</li>
            <li>They can send an offer with a message and indicative price.</li>
            <li>You accept one offer. Other offers are declined.</li>
            <li>Contact details are released and you arrange the work.</li>
          </ol>
        </div>
        <p className="text-sm text-muted">
          Signed in as {context.user.email}. You can manage this job from{" "}
          <Link href="/jobs" className="font-bold text-primary underline">
            My jobs
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <div className="l-container s-page">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-hidden>
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
