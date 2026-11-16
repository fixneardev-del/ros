"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/mend/form-message";
import { safeNextPath } from "@/lib/next-path";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export const ACCEPTED_TERMS_ID = "acceptedTerms";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.61 0-4.83-1.76-5.62-4.13H3.03v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.38 13.89A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.31-1.89V7.52H3.03A10 10 0 0 0 2 12c0 1.61.39 3.14 1.03 4.48l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2A10 10 0 0 0 3.03 7.52l3.35 2.59C7.17 7.74 9.39 5.98 12 5.98Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  next,
  requireTerms = false,
  acceptedTerms = false,
}: {
  next: string;
  requireTerms?: boolean;
  acceptedTerms?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startGoogleSignIn() {
    setError(null);

    if (requireTerms && !acceptedTerms) {
      setError(
        "Accept the terms and privacy notice before continuing with Google.",
      );
      document.getElementById(ACCEPTED_TERMS_ID)?.focus();
      return;
    }

    setPending(true);

    try {
      const callback = new URL("/auth/callback", window.location.origin);
      const destination = safeNextPath(next || null, "");
      if (destination) callback.searchParams.set("next", destination);

      const supabase = getBrowserSupabase();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });

      if (oauthError) {
        setError("We couldn't open Google sign-in. Please try again.");
        setPending(false);
      }
    } catch (error) {
      console.error("Google sign-in could not start", error);
      setError("We couldn't open Google sign-in. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={startGoogleSignIn}
        disabled={pending}
        aria-busy={pending}
      >
        <GoogleIcon />
        {pending ? "Opening Google…" : "Continue with Google"}
      </Button>
      {!requireTerms ? (
        <p className="mt-2 text-center text-xs leading-relaxed text-muted">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-bold text-primary underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-bold text-primary underline">
            privacy notice
          </Link>
          .
        </p>
      ) : null}
      {error ? (
        <div className="mt-2">
          <FormMessage error={error} />
        </div>
      ) : null}
    </div>
  );
}
