import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { signOut } from "@/lib/actions/auth";
import { AccountForm, PasswordForm } from "@/components/forms/account-forms";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My account" };

type SearchParams = Promise<{ error?: string }>;

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "You";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("") || "Y"
  ).toUpperCase();
}

async function AccountContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const context = await requireUser("/account");
  const isAdmin = context.profile.role === "admin";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1>My account</h1>
        <p className="mt-2 text-muted">
          Keep your contact details up to date so a provider can reach you after
          you accept an offer.
        </p>

        <section className="dash-profile-card mt-6">
          <span className="dash-avatar-lg" aria-hidden>
            {initials(context.profile.full_name, context.user.email)}
          </span>
          <div className="dash-profile-copy">
            <h2>{context.profile.full_name || "Your account"}</h2>
            <p>{context.user.email}</p>
          </div>
          <span className="dash-chip">
            {context.profile.role === "admin" ? "Admin" : "Customer"}
          </span>
        </section>

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
            <h2>Your details</h2>
            <p className="mt-1 text-sm text-muted">
              Your name is shown to the other party after an offer is accepted.
            </p>
            <div className="mt-5">
              <AccountForm profile={context.profile} />
            </div>
          </section>

          <section className="rounded-surface border border-line bg-surface p-5 md:p-6">
            <h2>Password</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a new password if you need to. You will stay signed in.
            </p>
            <div className="mt-5">
              <PasswordForm />
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-surface border border-line bg-surface p-5 md:p-6">
          <h2>Sign out</h2>
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
          <h2>Your profiles</h2>
          <p className="mt-1 text-sm text-muted">
            One account can hire help and offer services. Switch whenever you
            like.
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            {!isAdmin ? (
              <Link
                href="/jobs"
                className="font-bold text-primary underline underline-offset-4"
              >
                Customer dashboard
              </Link>
            ) : null}
            <Link
              href="/post-job"
              className="font-bold text-primary underline underline-offset-4"
            >
              Post a job
            </Link>
            <Link
              href="/account/notifications"
              className="font-bold text-primary underline underline-offset-4"
            >
              Notifications and email settings
            </Link>
            {context.providerProfile ? (
              <>
                <Link
                  href="/provide"
                  className="font-bold text-primary underline underline-offset-4"
                >
                  Provider dashboard
                </Link>
                <p className="-mt-1 text-xs text-muted">
                  Application status:{" "}
                  {context.providerProfile.status.replace("_", " ")}
                </p>
              </>
            ) : !isAdmin ? (
              <Link
                href="/provide/apply"
                className="font-bold text-primary underline underline-offset-4"
              >
                Become a provider
              </Link>
            ) : null}
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
    <div className="dash-page">
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
