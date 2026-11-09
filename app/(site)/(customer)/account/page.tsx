import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { signOut } from "@/lib/actions/auth";
import { AccountForm, PasswordForm } from "@/components/forms/account-forms";
import { StitchLine } from "@/components/mend/tag";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My account" };

type SearchParams = Promise<{ error?: string }>;

async function AccountContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const context = await requireUser("/account");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          My account
        </h1>
        <StitchLine className="mt-4 w-20" />
        <p className="mt-3 text-muted">
          Signed in as {context.user.email}. Keep your contact details up to
          date so a provider can reach you after you accept an offer.
        </p>

        {params.error === "suspended" ? (
          <div className="mt-6 flex gap-3 rounded-surface bg-danger-bg p-5 text-danger-fg">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Your account is suspended</p>
              <p className="mt-1 text-sm">
                You cannot post jobs or send offers while suspended. Contact the
                administrator if you think this is a mistake.
              </p>
            </div>
          </div>
        ) : null}

        {params.error === "forbidden" ? (
          <div className="mt-6 rounded-surface bg-warning-bg p-5 text-warning-fg">
            <p className="font-bold">That area is for admins</p>
            <p className="mt-1 text-sm">
              Your account does not have admin access.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2 className="text-xl font-bold">Your details</h2>
            <p className="mt-1 text-sm text-muted">
              Your name is shown to the other party after an offer is accepted.
            </p>
            <div className="mt-5">
              <AccountForm profile={context.profile} />
            </div>
          </section>

          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2 className="text-xl font-bold">Password</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a new password if you need to. You will stay signed in.
            </p>
            <div className="mt-5">
              <PasswordForm />
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-surface border border-line bg-surface p-5 md:p-6">
          <h2 className="text-xl font-bold">Sign out</h2>
          <p className="mt-1 text-sm text-muted">
            Sign out on this device. You can log back in at any time.
          </p>
          <form action={signOut} className="mt-4">
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-surface border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Your marketplace</h2>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <Link
              href="/jobs"
              className="font-bold text-primary underline underline-offset-4"
            >
              My jobs
            </Link>
            <Link
              href="/post-job"
              className="font-bold text-primary underline underline-offset-4"
            >
              Post a job
            </Link>
            {context.providerProfile ? (
              <Link
                href="/provide"
                className="font-bold text-primary underline underline-offset-4"
              >
                Provider dashboard
              </Link>
            ) : (
              <Link
                href="/provide/apply"
                className="font-bold text-primary underline underline-offset-4"
              >
                Apply to offer services
              </Link>
            )}
            {context.profile.role === "admin" ? (
              <Link
                href="/admin"
                className="font-bold text-primary underline underline-offset-4"
              >
                Admin area
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-surface border border-line bg-surface p-5 text-sm">
          <p className="font-bold">Privacy</p>
          <p className="mt-1 text-muted">
            We show your postcode district to matching providers. Your full
            postcode, email and phone are released only after you accept an
            offer.
          </p>
          <Link
            href="/privacy"
            className="mt-3 inline-block font-bold text-primary underline underline-offset-4"
          >
            Read the privacy notice
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default function AccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 lg:px-12">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-hidden>
            <div className="h-96 rounded-surface bg-slate-100" />
            <div className="h-64 rounded-surface bg-slate-100" />
          </div>
        }
      >
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
