import type { Profile, ProviderProfile } from "@/lib/types";

export type DashboardRole = "admin" | "provider" | "customer";

/**
 * One account has one dashboard. Admin wins over a provider profile; a
 * provider profile wins over the default customer dashboard.
 */
export function dashboardRole(context: {
  profile?: Profile | null;
  providerProfile?: ProviderProfile | null;
}): DashboardRole {
  if (context.profile?.role === "admin") return "admin";
  if (context.providerProfile) return "provider";
  return "customer";
}
