import type {
  ActiveDashboard,
  Profile,
  ProviderProfile,
} from "@/lib/types";

export type DashboardRole = "admin" | "provider" | "customer";

type RoleContext = {
  profile?: Pick<Profile, "role" | "active_dashboard"> | null;
  providerProfile?: Pick<ProviderProfile, "status"> | null;
};

/** A provider profile only opens the provider dashboard once it is approved. */
export function isApprovedProvider(
  context: Pick<RoleContext, "providerProfile">,
) {
  return context.providerProfile?.status === "approved";
}

/** The dashboards this account is allowed to open. */
export function availableDashboards(context: RoleContext): DashboardRole[] {
  if (context.profile?.role === "admin") return ["admin"];
  if (!isApprovedProvider(context)) return ["customer"];
  return ["customer", "provider"];
}

/**
 * The dashboard currently in use. An approved provider keeps using the saved
 * choice until they switch; if the saved value is not available yet (the
 * hosted migration is still pending), they open the provider dashboard so
 * sign-in and the provider pages agree.
 */
export function dashboardRole(context: RoleContext): DashboardRole {
  if (context.profile?.role === "admin") return "admin";
  if (!isApprovedProvider(context)) return "customer";
  if (context.profile?.active_dashboard === "customer") return "customer";
  return "provider";
}

export function canSwitchDashboard(context: RoleContext) {
  return availableDashboards(context).length > 1;
}

export function isActiveDashboard(value: unknown): value is ActiveDashboard {
  return value === "customer" || value === "provider";
}
