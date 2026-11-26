"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Bell,
  Briefcase,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { initials } from "@/lib/initials";

type DashVariant = "customer" | "provider" | "admin";

type NavLink = {
  href: string;
  label: string;
  Icon: typeof Briefcase;
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }

  // "/jobs" and "/provide" are section roots, so their tab should not stay
  // selected while the user is on a child page such as /provide/jobs.
  if (href === "/jobs" || href === "/provide") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashHeader({
  user,
  name,
  unreadCount = 0,
  variant = "customer",
}: {
  user: { email?: string | null } | null;
  name?: string | null;
  unreadCount?: number;
  variant?: DashVariant;
}) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const email = user?.email ?? null;

  // The header survives soft navigations, so the mobile menu would otherwise
  // stay open over the page the user just navigated to.
  useEffect(() => {
    if (menuRef.current?.open) {
      menuRef.current.open = false;
    }
  }, [pathname]);

  const links: NavLink[] =
    variant === "provider"
      ? [
          { href: "/provide/jobs", label: "Matching jobs", Icon: Briefcase },
          { href: "/provide/offers", label: "My offers", Icon: MessageSquare },
          { href: "/provide", label: "My profile", Icon: Wrench },
        ]
      : variant === "customer"
        ? [
            { href: "/jobs", label: "My jobs", Icon: Briefcase },
            { href: "/search", label: "Find help", Icon: Search },
          ]
        : [];

  // The admin area has its own section navigation, so it stays out of the
  // main menu. The account page still links to it.

  return (
    <header className="dash-header">
      <Link href="/" className="dash-brand">
        Repairs{" "}
        <span className="dash-brand-accent">&amp;</span> Other Services
        {variant === "admin" ? (
          <span className="dash-brand-chip">Admin</span>
        ) : null}
      </Link>

      {variant !== "admin" ? (
        <nav aria-label="Dashboard" className="dash-header-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="dash-header-actions">
        {variant === "customer" ? (
          <Link href="/post-job" className="dash-action-dark">
            <Plus className="size-3.5" aria-hidden />
            Post a job
          </Link>
        ) : (
          <Link href="/" className="dash-action-light">
            View site
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        )}
        <Link
          href="/account/notifications"
          className="dash-icon-button dash-notification-button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 ? (
            <span className="dash-notification-count" aria-hidden>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/account"
          className="dash-avatar"
          aria-label={`Your account${email ? `, signed in as ${email}` : ""}`}
        >
          {initials(name, email)}
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="dash-icon-button"
            aria-label="Sign out"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>

        <details className="dash-menu" ref={menuRef}>
          <summary aria-label="Open dashboard menu">
            <Menu className="dash-menu-icon-open size-4" aria-hidden />
            <X className="dash-menu-icon-close size-4" aria-hidden />
          </summary>
          <div className="dash-menu-panel">
            <nav aria-label="Dashboard menu">
              {variant !== "admin"
                ? links.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <link.Icon className="size-4" aria-hidden />
                      {link.label}
                    </Link>
                  ))
                : null}

              {variant === "customer" ? (
                <Link href="/post-job">
                  <Plus className="size-4" aria-hidden />
                  Post a job
                </Link>
              ) : (
                <Link href="/">
                  <ArrowUpRight className="size-4" aria-hidden />
                  View site
                </Link>
              )}
              <Link href="/account/notifications">
                <Bell className="size-4" aria-hidden />
                Notifications
                {unreadCount > 0 ? (
                  <span className="dash-notification-count" aria-hidden>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <Link href="/account">
                <ShieldCheck className="size-4" aria-hidden />
                Account
              </Link>
              <form action={signOut}>
                <button type="submit" className="dash-menu-signout">
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </button>
              </form>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
