/**
 * The analytics event vocabulary.
 *
 * Analytics are first party and cookie free. The client can switch to a
 * hosted tool later; until then these events are recorded in our own table
 * and read in the admin area.
 */
export const ANALYTICS_EVENTS = [
  "page_view",
  "search",
  "job_posted",
  "provider_applied",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return (
    typeof value === "string" &&
    (ANALYTICS_EVENTS as readonly string[]).includes(value)
  );
}

export interface AnalyticsEventRow {
  id: string;
  event: AnalyticsEvent;
  path: string | null;
  props: Record<string, unknown>;
  created_at: string;
}
