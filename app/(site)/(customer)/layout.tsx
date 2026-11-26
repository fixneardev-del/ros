import { DashShell } from "@/components/shells/dash-shell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashShell>{children}</DashShell>;
}
