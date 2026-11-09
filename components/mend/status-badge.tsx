import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Pause,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type {
  JobStatus,
  OfferStatus,
  ProviderStatus,
  ReportStatus,
} from "@/lib/types";
import { cn } from "@/lib/cn";

type StatusKind = "provider" | "job" | "offer" | "report";

const badgeBase =
  "badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold";

const tones = {
  info: "bg-info-bg text-info-fg",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  neutral: "bg-slate-100 text-slate-600",
} as const;

const providerStatus: Record<
  ProviderStatus,
  { label: string; tone: keyof typeof tones; Icon: typeof Clock }
> = {
  pending: { label: "Waiting for review", tone: "warning", Icon: Clock },
  approved: { label: "Approved", tone: "success", Icon: Check },
  rejected: { label: "Not approved", tone: "danger", Icon: X },
  suspended: { label: "Suspended", tone: "neutral", Icon: Pause },
};

const jobStatus: Record<
  JobStatus,
  { label: string; tone: keyof typeof tones; Icon: typeof Clock }
> = {
  open: { label: "Open", tone: "info", Icon: Circle },
  receiving_offers: { label: "Receiving offers", tone: "info", Icon: MessageSquare },
  closed: { label: "Closed", tone: "neutral", Icon: CheckCircle2 },
  removed: { label: "Removed", tone: "danger", Icon: Trash2 },
};

const offerStatus: Record<
  OfferStatus,
  { label: string; tone: keyof typeof tones; Icon: typeof Clock }
> = {
  submitted: { label: "Sent", tone: "info", Icon: Send },
  accepted: { label: "Accepted", tone: "success", Icon: Check },
  declined: { label: "Declined", tone: "neutral", Icon: X },
  withdrawn: { label: "Withdrawn", tone: "neutral", Icon: Undo2 },
};

const reportStatus: Record<
  ReportStatus,
  { label: string; tone: keyof typeof tones; Icon: typeof Clock }
> = {
  open: { label: "Open", tone: "warning", Icon: Clock },
  reviewed: { label: "Reviewed", tone: "success", Icon: CheckCircle2 },
  dismissed: { label: "Dismissed", tone: "neutral", Icon: X },
};

export function StatusBadge({
  kind,
  status,
  className,
}: {
  kind: StatusKind;
  status: ProviderStatus | JobStatus | OfferStatus | ReportStatus;
  className?: string;
}) {
  const entry =
    kind === "provider"
      ? providerStatus[status as ProviderStatus]
      : kind === "job"
        ? jobStatus[status as JobStatus]
        : kind === "offer"
          ? offerStatus[status as OfferStatus]
          : reportStatus[status as ReportStatus];

  if (!entry) return null;

  return (
    <span className={cn(badgeBase, tones[entry.tone], className)}>
      <entry.Icon className="size-4" aria-hidden />
      {entry.label}
    </span>
  );
}
