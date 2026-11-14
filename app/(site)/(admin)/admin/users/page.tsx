import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { getAdminUsers } from "@/lib/data/admin";
import { getUserEmails } from "@/lib/auth-admin";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { suspendUser, unsuspendUser } from "@/lib/actions/admin";
import { DashAlert } from "@/components/dash/dash-alert";
import { SearchBox } from "@/components/dash/search-box";
import { matchesQuery, normaliseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Admin users" };

type SearchParams = Promise<{ q?: string; ok?: string; error?: string }>;

async function UsersContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireAdmin();
  const query = normaliseQuery(params.q);
  const users = await getAdminUsers();
  const emails = await getUserEmails(users.map((user) => user.id));

  // The email lives in `auth.users`, which the browser client cannot read, so
  // it arrives in a second lookup. That makes this one list that filters here
  // rather than in the data function: matching on a name without its email
  // would miss the most common way an admin looks someone up.
  const visible = query
    ? users.filter((user) =>
        matchesQuery(query, user.full_name, emails.get(user.id), user.role),
      )
    : users;

  return (
    <div>
      <div>
        <h1>Users</h1>
        <p className="mt-3 text-muted">
          Suspend an account to block posting jobs, sending offers and accessing
          admin areas. Suspension does not delete data.
        </p>
      </div>

      {params.ok ? <DashAlert tone="success">{params.ok}</DashAlert> : null}
      {params.error ? <DashAlert tone="danger">{params.error}</DashAlert> : null}

      <div className="mt-6">
        <SearchBox
          action="/admin/users"
          query={query}
          label="Search users by name, email or role"
          placeholder="Name, email or role"
          resultCount={visible.length}
          noun="user"
        />
      </div>

      {visible.length > 0 ? (
        <div className="mt-6 space-y-3">
          {visible.map((user) => (
          <article
            key={user.id}
            className="rounded-surface border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2>{user.full_name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {emails.get(user.id) ?? "Email unavailable"} · joined{" "}
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span
                  className={
                    user.role === "admin"
                      ? "rounded-full bg-info-bg px-3 py-1 text-info-fg"
                      : "rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                  }
                >
                  {user.role === "admin" ? "Admin" : "Customer"}
                </span>
                <span
                  className={
                    user.is_suspended
                      ? "rounded-full bg-danger-bg px-3 py-1 text-danger-fg"
                      : "rounded-full bg-success-bg px-3 py-1 text-success-fg"
                  }
                >
                  {user.is_suspended ? "Suspended" : "Active"}
                </span>
              </div>
            </div>

            <form
              action={user.is_suspended ? unsuspendUser : suspendUser}
              className="mt-4"
            >
              <input type="hidden" name="id" value={user.id} />
              <Button
                type="submit"
                variant={user.is_suspended ? "secondary" : "destructive"}
                className="min-h-10 px-4 text-sm"
              >
                {user.is_suspended ? "Reinstate account" : "Suspend account"}
              </Button>
            </form>
          </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-surface border border-line bg-surface p-5 text-muted">
          {query ? `No users match “${query}”.` : "No users yet."}
        </p>
      )}
    </div>
  );
}

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden>
          <div className="h-12 w-64 rounded bg-slate-100" />
          <div className="h-32 rounded-surface bg-slate-100" />
          <div className="h-32 rounded-surface bg-slate-100" />
        </div>
      }
    >
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}
