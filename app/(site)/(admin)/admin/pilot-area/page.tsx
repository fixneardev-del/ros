import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getDistricts } from "@/lib/data/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { setDistrictEnabled, upsertDistrict } from "@/lib/actions/admin";
import type { LocationRow } from "@/lib/types";
import { DashAlert } from "@/components/dash/dash-alert";

export const metadata: Metadata = { title: "Admin pilot area" };

type SearchParams = Promise<{ ok?: string; error?: string }>;

function DistrictFields({ district }: { district?: LocationRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {district ? <input type="hidden" name="id" value={district.id} /> : null}
      <label className="block text-sm font-bold">
        Postcode district
        <Input
          name="postcodeDistrict"
          defaultValue={district?.postcode_district}
          required
          maxLength={4}
          placeholder="G12"
          className="mt-1 uppercase"
        />
      </label>
      <label className="block text-sm font-bold">
        Area name
        <Input
          name="areaName"
          defaultValue={district?.area_name}
          required
          minLength={2}
          maxLength={80}
          placeholder="West End"
          className="mt-1"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input
          type="checkbox"
          name="isEnabled"
          defaultChecked={district?.is_enabled ?? true}
          className="size-4 accent-[var(--color-primary)]"
        />
        Enabled for the pilot
      </label>
    </div>
  );
}

async function PilotAreaContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const districts = await getDistricts(true);

  return (
    <div>
      <div>
        <h1>
          Pilot area
        </h1>
        <p className="mt-3 text-muted">
          Only enabled postcode districts can post jobs, appear in search and be
          selected by providers. Disabling a district does not remove existing
          jobs.
        </p>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <section className="mt-8 rounded-surface border border-line bg-surface p-5 md:p-6">
        <h2>Add a district</h2>
        <form action={upsertDistrict} className="mt-4 space-y-4">
          <DistrictFields />
          <Button type="submit">Add district</Button>
        </form>
      </section>

      <section className="mt-6 space-y-3">
        {districts.map((district) => (
          <article
            key={district.id}
            className="rounded-surface border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2>{district.postcode_district}</h2>
                <p className="mt-1 text-sm text-muted">{district.area_name}</p>
              </div>
              <span
                className={
                  district.is_enabled
                    ? "rounded-full bg-success-bg px-3 py-1 text-sm font-bold text-success-fg"
                    : "rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600"
                }
              >
                {district.is_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-start gap-4">
              <form action={setDistrictEnabled}>
                <input type="hidden" name="id" value={district.id} />
                <input
                  type="hidden"
                  name="enabled"
                  value={district.is_enabled ? "false" : "true"}
                />
                <Button type="submit" variant="secondary" className="min-h-10 px-3 text-sm">
                  {district.is_enabled ? "Disable" : "Enable"}
                </Button>
              </form>
              <details className="flex-1">
                <summary className="cursor-pointer text-sm font-bold text-primary">
                  Edit district
                </summary>
                <form action={upsertDistrict} className="mt-4 space-y-4">
                  <DistrictFields district={district} />
                  <Button type="submit" className="min-h-10 px-4 text-sm">
                    Save changes
                  </Button>
                </form>
              </details>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default function AdminPilotAreaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-64 rounded bg-slate-100" />
          <div className="h-64 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <PilotAreaContent searchParams={searchParams} />
    </Suspense>
  );
}
