import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getCategories } from "@/lib/data/categories";
import { StitchLine } from "@/components/mend/tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { setCategoryActive, moveCategory, upsertCategory } from "@/lib/actions/admin";
import type { ServiceCategory } from "@/lib/types";

export const metadata: Metadata = { title: "Admin categories" };

type SearchParams = Promise<{ ok?: string; error?: string }>;

function CategoryFields({
  category,
  parents,
}: {
  category?: ServiceCategory;
  parents: ServiceCategory[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <label className="block text-sm font-bold">
        Name
        <Input
          name="name"
          defaultValue={category?.name}
          required
          minLength={2}
          maxLength={80}
          className="mt-1"
        />
      </label>
      <label className="block text-sm font-bold">
        Slug
        <Input
          name="slug"
          defaultValue={category?.slug}
          required
          minLength={2}
          maxLength={80}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="mt-1"
        />
      </label>
      <label className="block text-sm font-bold">
        Parent category
        <select
          name="parentId"
          defaultValue={category?.parent_id ?? ""}
          className="mt-1 block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Top level</option>
          {parents
            .filter((parent) => parent.id !== category?.id)
            .map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
        </select>
      </label>
      <label className="block text-sm font-bold">
        Sort order
        <Input
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          defaultValue={category?.sort_order ?? 0}
          className="mt-1"
        />
      </label>
      <label className="block text-sm font-bold sm:col-span-2">
        Description
        <textarea
          name="description"
          defaultValue={category?.description ?? ""}
          rows={2}
          maxLength={300}
          className="mt-1 block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.is_active ?? true}
          className="size-4 accent-[var(--color-primary)]"
        />
        Active
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="requiresExtraChecks"
          defaultChecked={category?.requires_extra_checks ?? false}
          className="size-4 accent-[var(--color-primary)]"
        />
        Requires extra checks
      </label>
    </div>
  );
}

async function CategoriesContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const categories = await getCategories(true);
  const parents = categories.filter((category) => !category.parent_id);
  const names = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          Categories
        </h1>
        <StitchLine className="mt-4 w-20" />
        <p className="mt-3 text-muted">
          Categories drive search, job posting and provider services. Deactivate
          a category to hide it from new jobs and applications.
        </p>
      </div>

      {params.ok ? (
        <p className="mt-6 rounded-control bg-success-bg p-4 text-sm font-bold text-success-fg">
          {params.ok}
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-6 rounded-control bg-danger-bg p-4 text-sm font-bold text-danger-fg">
          {params.error}
        </p>
      ) : null}

      <section className="mt-8 rounded-surface border border-line bg-surface p-5 md:p-6">
        <h2 className="text-xl font-bold">Add a category</h2>
        <form action={upsertCategory} className="mt-4 space-y-4">
          <CategoryFields parents={parents} />
          <Button type="submit">Add category</Button>
        </form>
      </section>

      <section className="mt-6 space-y-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="rounded-surface border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {category.parent_id ? "↳ " : ""}
                  {category.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {category.slug}
                  {category.parent_id
                    ? ` · parent: ${names.get(category.parent_id) ?? "unknown"}`
                    : ""}
                  {` · sort ${category.sort_order}`}
                </p>
                {category.description ? (
                  <p className="mt-2 text-sm text-muted">{category.description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span
                  className={
                    category.is_active
                      ? "rounded-full bg-success-bg px-3 py-1 text-success-fg"
                      : "rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                  }
                >
                  {category.is_active ? "Active" : "Inactive"}
                </span>
                {category.requires_extra_checks ? (
                  <span className="rounded-full bg-warning-bg px-3 py-1 text-warning-fg">
                    Extra checks
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start gap-4">
              <form action={setCategoryActive}>
                <input type="hidden" name="id" value={category.id} />
                <input
                  type="hidden"
                  name="active"
                  value={category.is_active ? "false" : "true"}
                />
                <Button type="submit" variant="secondary" className="min-h-10 px-3 text-sm">
                  {category.is_active ? "Deactivate" : "Activate"}
                </Button>
              </form>
              <div className="flex items-center gap-2">
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="direction" value="up" />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="min-h-10 px-3 text-sm"
                    aria-label={`Move ${category.name} up`}
                  >
                    Move up
                  </Button>
                </form>
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="min-h-10 px-3 text-sm"
                    aria-label={`Move ${category.name} down`}
                  >
                    Move down
                  </Button>
                </form>
              </div>
              <details className="flex-1">
                <summary className="cursor-pointer text-sm font-bold text-primary">
                  Edit category
                </summary>
                <form action={upsertCategory} className="mt-4 space-y-4">
                  <CategoryFields category={category} parents={parents} />
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

export default function AdminCategoriesPage({
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
      <CategoriesContent searchParams={searchParams} />
    </Suspense>
  );
}
