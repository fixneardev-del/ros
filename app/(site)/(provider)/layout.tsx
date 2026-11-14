import { DashShell } from "@/components/shells/dash-shell";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashShell variant="provider">{children}</DashShell>;
}
