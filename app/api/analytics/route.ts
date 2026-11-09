import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAnalyticsEvent } from "@/lib/analytics";
import { isAnalyticsEnabled } from "@/lib/analytics-server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Public analytics collector.
 *
 * It records the event name, the page path and a small set of properties.
 * It never records an IP address, a user id or a cookie. The event name has
 * to be one of the known values, and the body is size limited.
 */
const MAX_BODY_BYTES = 2048;
const MAX_PROPS = 8;

export async function GET() {
  return NextResponse.json({ enabled: await isAnalyticsEnabled() });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!(await isAnalyticsEnabled())) {
    return new NextResponse(null, { status: 204 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { event, path, props } = body as {
    event?: unknown;
    path?: unknown;
    props?: unknown;
  };

  if (!isAnalyticsEvent(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cleanPath =
    typeof path === "string" ? path.slice(0, 200).replace(/[^\w\-/?=&.]/g, "") : null;

  const cleanProps: Record<string, unknown> = {};
  if (typeof props === "object" && props !== null) {
    for (const [key, value] of Object.entries(props).slice(0, MAX_PROPS)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        cleanProps[key.slice(0, 40)] = String(value).slice(0, 120);
      }
    }
  }

  // A per browser token keeps one noisy tab from filling the table. It is
  // random and is never tied to a person.
  const token =
    request.headers.get("x-analytics-token")?.slice(0, 64) ?? "anonymous";
  const limit = checkRateLimit(`analytics:${token}`, 120, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("analytics_events").insert({
    event,
    path: cleanPath,
    props: cleanProps,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
