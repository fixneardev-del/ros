import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/permissions";
import {
  getAdminJobs,
  getAdminOffers,
  getAdminProviders,
  getInterestSignups,
} from "@/lib/data/admin";

type Params = Promise<{ type: string }>;

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const context = await getSessionContext();

  if (!context.user || context.profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await params;
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "providers") {
    const providers = await getAdminProviders();
    const rows: Array<Array<unknown>> = [
      [
        "user_id",
        "display_name",
        "account_name",
        "status",
        "provider_type",
        "pilot_areas",
        "services",
        "created_at",
      ],
      ...providers.map((provider) => [
        provider.user_id,
        provider.display_name,
        provider.profiles?.full_name ?? "",
        provider.status,
        provider.provider_type,
        provider.service_districts.join(" "),
        provider.provider_services
          .map((service) => service.service_categories?.name)
          .filter(Boolean)
          .join(" "),
        provider.created_at,
      ]),
    ];
    return csvResponse(`providers-${stamp}.csv`, toCsv(rows));
  }

  if (type === "jobs") {
    const jobs = await getAdminJobs();
    const rows: Array<Array<unknown>> = [
      [
        "id",
        "title",
        "customer",
        "status",
        "category",
        "district",
        "postcode",
        "offers",
        "created_at",
        "removed_reason",
      ],
      ...jobs.map((job) => [
        job.id,
        job.title,
        job.profiles?.full_name ?? "",
        job.status,
        job.service_categories?.name ?? "",
        job.postcode_district,
        job.postcode,
        job.provider_offers?.[0]?.count ?? 0,
        job.created_at,
        job.removed_reason ?? "",
      ]),
    ];
    return csvResponse(`jobs-${stamp}.csv`, toCsv(rows));
  }

  if (type === "offers") {
    const offers = await getAdminOffers();
    const rows: Array<Array<unknown>> = [
      [
        "id",
        "job",
        "provider",
        "status",
        "price_pence",
        "timeframe",
        "created_at",
      ],
      ...offers.map((offer) => [
        offer.id,
        offer.job_requests?.title ?? "",
        offer.provider_profiles?.display_name ?? "",
        offer.status,
        offer.indicative_price_pence ?? "",
        offer.estimated_timeframe ?? "",
        offer.created_at,
      ]),
    ];
    return csvResponse(`offers-${stamp}.csv`, toCsv(rows));
  }

  if (type === "waitlist") {
    const signups = await getInterestSignups();
    const rows: Array<Array<unknown>> = [
      ["email", "postcode", "created_at"],
      ...signups.map((signup) => [
        signup.email,
        signup.postcode,
        signup.created_at,
      ]),
    ];
    return csvResponse(`waitlist-${stamp}.csv`, toCsv(rows));
  }

  return NextResponse.json({ error: "Unknown export type" }, { status: 404 });
}
