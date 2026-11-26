import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/mend/auth-shell";
import { AuthErrorCleaner } from "@/components/forms/auth-error-cleaner";
import { LoginForm } from "@/components/forms/auth-forms";
import { safeNextPath } from "@/lib/next-path";

export const metadata: Metadata = { title: "Log in" };

type SearchParams = Promise<{
  next?: string;
  registered?: string;
  error?: string;
}>;

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  // The raw requested path is passed through, empty when there is none. The
  // sign-in action decides the landing page from the role, so it needs to be
  // able to tell "no destination" from "the account page".
  const next = params.next ? safeNextPath(params.next) : "";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      description="Log in to post a job, manage your offers or review the marketplace."
      footer={
        <>
          New here?{" "}
          <Link
            href={
              next ? `/register?next=${encodeURIComponent(next)}` : "/register"
            }
            className="font-bold text-primary underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <AuthErrorCleaner />
      {params.registered ? (
        <p
          role="status"
          className="mb-4 bg-success-bg p-4 text-sm font-bold text-success-fg"
        >
          Your account is created. Check your email if confirmation is required,
          then log in.
        </p>
      ) : null}
      {params.error ? (
        <p
          role="alert"
          className="mb-4 bg-danger-bg p-4 text-sm font-bold text-danger-fg"
        >
          We could not complete that sign-in. Try again or request a new link.
        </p>
      ) : null}
      <LoginForm next={next} />
    </AuthShell>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="h-96 rounded-surface bg-slate-100" aria-hidden />
        </div>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
