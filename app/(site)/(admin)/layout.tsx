import { AppShell } from "@/components/shells/app-shell";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
