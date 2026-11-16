import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/mend/auth-shell";
import { RegisterForm } from "@/components/forms/auth-forms";
import { safeNextPath } from "@/lib/next-path";

export const metadata: Metadata = { title: "Create an account" };

type SearchParams = Promise<{ next?: string }>;

async function RegisterContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  // An empty value means "no destination". The sign-up action and Google
  // callback then choose the landing page from the account role.
  const next = params.next ? safeNextPath(params.next) : "";

  return (
    <AuthShell
      eyebrow="Join the pilot"
      title="Create an account"
      description="You need an account to post a job or apply to offer services. It is free."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-bold text-primary underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}

export default function RegisterPage({
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
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}
