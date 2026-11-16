import type { DomainEvent } from "@/lib/events";
import type { EmailMessage } from "@/lib/emails/templates";
import type { EmailCategory } from "@/lib/notifications";

/**
 * Maps an outbox template name back to the event that rendered it. The retry
 * endpoint stores the template name, not the event, so a failed send can only
 * be rebuilt when the mapping is known.
 *
 * Keep this in sync with the template names in lib/emails/templates.ts.
 */
export function eventForTemplate(template: string): DomainEvent | null {
  if (template === "auth.welcome") return "auth.welcome";
  if (template === "auth.signed_in") return "auth.signed_in";
  if (template.startsWith("provider.applied.")) return "provider.applied";
  if (template.startsWith("job.created.")) return "job.created";
  if (template === "provider.approved") return "provider.approved";
  if (template === "provider.rejected") return "provider.rejected";
  if (template === "provider.more_info_requested") return "provider.more_info_requested";
  if (template === "provider.suspended") return "provider.suspended";
  if (template === "provider.reinstated") return "provider.reinstated";
  if (template === "provider.removed") return "provider.removed";
  if (template === "offer.created") return "offer.created";
  if (template === "offer.accepted") return "offer.accepted";
  if (template === "offer.declined") return "offer.declined";
  if (template === "job.cancelled") return "job.cancelled";
  if (template === "job.completed") return "job.completed";
  if (template === "job.removed") return "job.removed";
  if (template === "waitlist.joined") return "waitlist.joined";
  if (template === "report.created") return "report.created";
  return null;
}

/** The optional preference category for an outbox template, if it has one. */
export function emailCategoryForTemplate(
  template: string,
): EmailCategory | null {
  if (template === "offer.declined") return "offer";
  if (template === "job.completed") return "job";
  return null;
}

/**
 * The single template an outbox row must match for a retry. A prefix match
 * covers the customer/admin variants without letting one row pick up the
 * other recipient's message.
 */
export function matchesOutboxRow(
  message: EmailMessage,
  row: { template: string; to_email: string },
) {
  return message.template === row.template && message.to === row.to_email;
}
