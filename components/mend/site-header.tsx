"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ButtonLink } from "@/components/ui/button";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function SiteHeader({
  user,
  isAdmin = false,
  isProvider = false,
}: {
  user: { email?: string | null } | null;
  isAdmin?: boolean;
  isProvider?: boolean;
}) {
  const pathname = usePathname();

  // The sign in and create account links live on the auth pages themselves.
  // Repeating them in the header would give two links that go to the same
  // place, and the header one would lose where the visitor was heading.
  const onAuthPage = AUTH_PATHS.includes(pathname);

  const nav = (
    <>
      <Link href="/search" className="whitespace-nowrap font-bold hover:text-primary">
        Find help
      </Link>
      <Link href="/post-job" className="whitespace-nowrap font-bold hover:text-primary">
        Post a job
      </Link>
      <Link
        href="/provide/apply"
        className="whitespace-nowrap font-bold hover:text-primary"
      >
        Offer your services
      </Link>
      {isProvider ? (
        <Link
          href="/provide"
          className="whitespace-nowrap font-bold hover:text-primary"
        >
          Provider dashboard
        </Link>
      ) : null}
      {isAdmin ? (
        <Link href="/admin" className="whitespace-nowrap font-bold hover:text-primary">
          Admin
        </Link>
      ) : null}
    </>
  );

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-3 px-4 py-2 md:px-8 lg:px-12">
        <Link
          href="/"
          className="font-display text-base font-extrabold leading-tight tracking-tight whitespace-nowrap lg:text-xl"
        >
          Repairs <span className="text-primary">&amp;</span> Other Services
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-5 text-sm xl:flex"
        >
          {nav}
        </nav>

        <div className="hidden items-center gap-3 text-sm xl:flex">
          {onAuthPage ? null : user ? (
            <>
              <Link
                href="/account"
                className="whitespace-nowrap font-bold hover:text-primary"
              >
                Account
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="whitespace-nowrap font-bold text-muted hover:text-primary"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap font-bold hover:text-primary"
              >
                Log in
              </Link>
              <ButtonLink
                href="/register"
                variant="secondary"
                className="min-h-10 whitespace-nowrap px-4 text-sm"
              >
                Create account
              </ButtonLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <ButtonLink href="/post-job" className="min-h-10 px-3 text-sm">
            Post a job
          </ButtonLink>
          <details className="relative">
            <summary
              aria-label="Menu"
              className="flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-control border border-line-strong px-2.5 text-sm font-bold sm:px-3 [&::-webkit-details-marker]:hidden"
            >
              <Menu className="size-5" aria-hidden />
              <span className="hidden sm:inline">Menu</span>
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-surface border border-line bg-surface p-4 shadow-[var(--shadow-overlay)]">
              <nav aria-label="Mobile" className="flex flex-col gap-3 text-sm">
                {nav}
                {onAuthPage ? null : user ? (
                  <>
                    <Link href="/account" className="font-bold hover:text-primary">
                      Account
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="font-bold text-muted hover:text-primary"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="font-bold hover:text-primary">
                      Log in
                    </Link>
                    <Link href="/register" className="font-bold hover:text-primary">
                      Create account
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
