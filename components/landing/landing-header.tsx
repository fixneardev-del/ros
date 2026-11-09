import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

/**
 * The mobile menu uses a details element rather than state, so it opens
 * before the page hydrates and still works if the script never loads.
 */
export function LandingHeader({
  user,
  isAdmin,
  isProvider,
  hideAuthLinks,
}: {
  user: { email?: string | null } | null;
  isAdmin?: boolean;
  isProvider?: boolean;
  hideAuthLinks?: boolean;
}) {
  const links = [
    { href: "/search", label: "Find help" },
    { href: "/post-job", label: "Post a job" },
    { href: "/provide/apply", label: "Offer your services" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const accountLinks = user
    ? [
        { href: "/account", label: "Account" },
        { href: "/jobs", label: "My jobs" },
        ...(isProvider
          ? [{ href: "/provide", label: "Provider dashboard" }]
          : []),
      ]
    : hideAuthLinks
      ? []
      : [
          { href: "/login", label: "Log in" },
          { href: "/register", label: "Create account" },
        ];

  return (
    <header className="l-header">
      <div className="l-container l-header-row">
        <Link href="/" className="l-brand">
          <span className="l-brand-mark" aria-hidden>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
                stroke="#0F766E"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="2.6 2.2"
              />
            </svg>
          </span>
          Repairs &amp; Other Services
        </Link>

        <nav className="l-nav" aria-label="Main">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="l-header-actions">
          {user ? (
            <>
              <Link href="/account">Account</Link>
              <Link href="/jobs">My jobs</Link>
              {isProvider ? (
                <Link href="/provide" className="l-btn l-btn-sm">
                  Provider dashboard
                </Link>
              ) : null}
              <form action={signOut}>
                <button type="submit" className="l-signout">
                  Sign out
                </button>
              </form>
            </>
          ) : hideAuthLinks ? null : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="l-btn l-btn-sm">
                Create account
              </Link>
            </>
          )}
        </div>

        <details className="l-menu">
          <summary className="l-menu-button" aria-label="Menu">
            <Menu className="l-menu-icon-open size-5" aria-hidden />
            <X className="l-menu-icon-close size-5" aria-hidden />
          </summary>
          <div className="l-menu-panel">
            <nav aria-label="Mobile">
              {[...links, ...accountLinks].map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
              {user ? (
                <form action={signOut}>
                  <button type="submit" className="l-signout">
                    Sign out
                  </button>
                </form>
              ) : null}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
