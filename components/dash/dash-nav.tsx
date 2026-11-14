"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Flag,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Tags,
  UserCog,
  Users,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/providers", label: "Providers", Icon: Users },
  { href: "/admin/jobs", label: "Jobs", Icon: Briefcase },
  { href: "/admin/offers", label: "Offers", Icon: MessageSquare },
  { href: "/admin/categories", label: "Categories", Icon: Tags },
  { href: "/admin/pilot-area", label: "Pilot area", Icon: MapPin },
  { href: "/admin/users", label: "Users", Icon: UserCog },
  { href: "/admin/reports", label: "Reports", Icon: Flag },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
];

export function DashNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="dash-tabs">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
          >
            <link.Icon aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
