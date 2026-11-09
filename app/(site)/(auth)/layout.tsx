import { StudioShell } from "@/components/shells/studio-shell";
import "@/app/design-system.css";
import "@/app/studio.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioShell hideAuthLinks>{children}</StudioShell>;
}
