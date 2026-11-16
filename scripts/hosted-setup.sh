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
#   ALLOW_DEMO_ACCOUNTS=1 scripts/hosted-setup.sh <database-password> --with-demo-accounts
#
# The database password is not stored. The project ref is read from .env.local
# first, matching Next.js's environment-file precedence, and then .env.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PSQL="${PSQL:-$(command -v psql || echo /opt/homebrew/bin/psql)}"

DB_PASSWORD="${1:-}"
WITH_DEMO_ACCOUNTS="${2:-}"
if [ -z "$DB_PASSWORD" ]; then
  echo "Usage: $0 <database-password> [--with-demo-accounts]" >&2
  exit 1
fi

if [ "$WITH_DEMO_ACCOUNTS" = "--with-demo-accounts" ] && [ "${ALLOW_DEMO_ACCOUNTS:-}" != "1" ]; then
  echo "Set ALLOW_DEMO_ACCOUNTS=1 to confirm creating demo accounts." >&2
  exit 1
fi

ENV_FILE="$ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="$ROOT/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ".env (or .env.local) is missing." >&2
  exit 1
fi

SUPABASE_URL="$(grep NEXT_PUBLIC_SUPABASE_URL "$ENV_FILE" | cut -d= -f2-)"
PROJECT_REF="$(printf '%s' "$SUPABASE_URL" | sed -E 's#https://([^.]+)\..*#\1#')"

if [ -z "$PROJECT_REF" ]; then
  echo "Could not read the project reference from $ENV_FILE." >&2
  exit 1
fi

DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

# The migration is idempotent. Applying it to a project that already has the
# schema upgrades it in place and is safe to run again.
echo "Applying the migration to project ${PROJECT_REF}..."
"$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q \
  -f "$ROOT/supabase/migrations/0001_init.sql"

echo "Applying the seed..."
"$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/seed.sql"

if [ "$WITH_DEMO_ACCOUNTS" = "--with-demo-accounts" ]; then
  echo "Creating the demo sign-in accounts..."
  "$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/demo-accounts.sql"

  echo ""
  echo "Done. The demo sign-in details are:"
  echo "  admin@example.com    / password123   (site owner)"
  echo "  customer@example.com / password123   (a customer)"
  echo "  provider@example.com / password123   (a provider)"
else
  echo ""
  echo "Done. The schema and seed are ready; demo accounts were not changed."
  echo "Use --with-demo-accounts with ALLOW_DEMO_ACCOUNTS=1 to create them."
fi
