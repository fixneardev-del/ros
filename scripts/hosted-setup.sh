#!/bin/bash
# Apply the schema and seed to a hosted Supabase project, then create the
# local sign-in accounts.
#
# The migration is applied with psql rather than the Supabase CLI, because the
# CLI expects its own local stack and a naming convention the project does not
# use.
#
# Usage:
#   scripts/hosted-setup.sh <database-password>
#
# The database password is not stored. The project ref is read from
# NEXT_PUBLIC_SUPABASE_URL in .env.local.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PSQL="${PSQL:-$(command -v psql || echo /opt/homebrew/bin/psql)}"

DB_PASSWORD="${1:-}"
if [ -z "$DB_PASSWORD" ]; then
  echo "Usage: $0 <database-password>" >&2
  exit 1
fi

if [ ! -f "$ROOT/.env.local" ]; then
  echo ".env.local is missing." >&2
  exit 1
fi

SUPABASE_URL="$(grep NEXT_PUBLIC_SUPABASE_URL "$ROOT/.env.local" | cut -d= -f2-)"
PROJECT_REF="$(printf '%s' "$SUPABASE_URL" | sed -E 's#https://([^.]+)\..*#\1#')"

if [ -z "$PROJECT_REF" ]; then
  echo "Could not read the project reference from .env.local." >&2
  exit 1
fi

DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "Applying the migration to project ${PROJECT_REF}..."
"$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q \
  -f "$ROOT/supabase/migrations/0001_init.sql"

echo "Applying the seed..."
"$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/seed.sql"

echo "Creating the sign-in accounts..."
"$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
-- Remove the probe account left behind by the setup check.
delete from auth.users where email = 'probe@localtest.dev';

-- The password is hashed with pgcrypto, the same way GoTrue does it.
-- pgcrypto lives in the extensions schema on a hosted project.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (null, gen_random_uuid(), 'authenticated', 'authenticated', 'admin@example.com',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Admin Person"}'::jsonb, now(), now()),
  (null, gen_random_uuid(), 'authenticated', 'authenticated', 'customer@example.com',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Nina Customer"}'::jsonb, now(), now()),
  (null, gen_random_uuid(), 'authenticated', 'authenticated', 'provider@example.com',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Petra Provider"}'::jsonb, now(), now())
on conflict (email) do update
  set encrypted_password = excluded.encrypted_password,
      email_confirmed_at = now(),
      raw_app_meta_data = excluded.raw_app_meta_data;

-- The project migration adds a trigger that creates the profile row, so the
-- admin role is set here.
update public.profiles
set role = 'admin'
where id in (select id from auth.users where email = 'admin@example.com');
SQL

echo ""
echo "Done. The sign-in details are:"
echo "  admin@example.com    / password123   (site owner)"
echo "  customer@example.com / password123   (a customer)"
echo "  provider@example.com / password123   (a provider)"
