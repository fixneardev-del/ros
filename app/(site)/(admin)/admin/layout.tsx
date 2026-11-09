import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/pilot-area", label: "Pilot area" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The check lives here, not in the page, so a signed-in non-admin gets a
  // real 403 status before any of the page streams.
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 lg:px-12">
      <div className="border-b border-line pb-4">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
          Administration
        </p>
        <nav aria-label="Admin" className="mt-3 flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-bold hover:border-primary hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
