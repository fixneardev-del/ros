import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

/**
 * The dashboard feedback panel. It follows the Movexa compact alert pattern:
 * a tinted circular icon beside a block of text.
 */
export function DashAlert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const icons = {
    info: Info,
    success: CircleCheck,
    warning: TriangleAlert,
    danger: CircleAlert,
  };
  const Icon = icons[tone];

  return (
    <div className={`dash-alert dash-alert-${tone}`} role="status">
      <span className="dash-alert-icon">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="dash-alert-body">{children}</div>
    </div>
  );
}
