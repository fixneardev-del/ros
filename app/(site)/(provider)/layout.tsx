import { AppShell } from "@/components/shells/app-shell";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
