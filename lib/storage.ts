import { getPublicEnv } from "@/lib/env";

export function providerPhotoUrl(path: string | null | undefined) {
  if (!path) return null;
  const { supabaseUrl } = getPublicEnv();
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/provider-photos/${path}`;
}
