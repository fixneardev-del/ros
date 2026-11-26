import { DashShell } from "@/components/shells/dash-shell";

// Page guards and the proxy both enforce the provider-only role. Keeping the
// layout free of session reads lets the shell stream inside Suspense.
export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashShell>{children}</DashShell>;
}
