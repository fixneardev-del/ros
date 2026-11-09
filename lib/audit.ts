import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * Audit writes use the service role because the RLS policy is intentionally
 * narrow. Without a service key (local UI-only development) the write is
 * skipped rather than failing the user's action.
 */
export async function writeAudit(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminSupabase();
  if (!admin) return;

  await admin.from("audit_log").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });
}
