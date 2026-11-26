#!/bin/bash
# Run the local Supabase stack without Docker.
#
# Docker Desktop is not available on this machine, so `supabase start` cannot
# run. PostgREST and GoTrue are standalone binaries that talk to Postgres, so
# this script starts the same three services directly:
#
#   Postgres   the database, on port 55432
#   GoTrue     the auth API, on port 9999
#   PostgREST  the REST API, on port 3000
#
# It installs the real Supabase `auth` and `storage` schemas, then this
# project's migration and seed. The result is a working local environment with
# real sign in, real RLS and real data.
#
# Usage:
#   scripts/local-supabase.sh start     start everything and load the schema
#   scripts/local-supabase.sh stop      stop the services
#   scripts/local-supabase.sh reset     reload the schema, seed and users
#   scripts/local-supabase.sh url       print the values for .env.local
#
# After `start`, copy the printed values into .env.local and sign in with
# admin@example.com.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The stack lives outside the OS temporary directory, because macOS purges that
# folder in the background and takes the database with it.
STACK="${STACK_ROOT:-${XDG_DATA_HOME:-$HOME/.local/share}/repairs-and-other-services/local-supabase}"
PGROOT="${PGROOT:-$STACK/postgres}"
PGPORT="${PGPORT:-55433}"
# The gateway serves one URL, the way Supabase's Kong does. PostgREST and
# GoTrue sit behind it on their own ports.
GATEWAY_PORT="${GATEWAY_PORT:-54321}"
REST_PORT="${REST_PORT:-54322}"
AUTH_PORT="${AUTH_PORT:-9999}"
DB=app
PSQL="${PSQL:-$(command -v psql || echo /opt/homebrew/bin/psql)}"
INITDB="${INITDB:-$(command -v initdb || echo /opt/homebrew/bin/initdb)}"
PGCTL="${PGCTL:-$(command -v pg_ctl || echo /opt/homebrew/bin/pg_ctl)}"

# A fixed secret keeps the JWTs valid across restarts.
JWT_SECRET="local-development-secret-at-least-32-characters-long"
ANON_KEY_JWT_ROLE=authenticated

# The local keys are signed with the fixed secret above, so they stay valid
# across restarts and can be handed to a test runner as environment
# variables instead of being written to a file.
anon_key() {
  node -e "
const b=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const p=Buffer.from(JSON.stringify({iss:'supabase-local',ref:'anon',role:'anon',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+31536000})).toString('base64url');
const s=require('crypto').createHmac('sha256','${JWT_SECRET}').update(b+'.'+p).digest('base64url');
console.log(b+'.'+p+'.'+s);
"
}

service_role_key() {
  node -e "
const b=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const p=Buffer.from(JSON.stringify({iss:'supabase-local',ref:'service_role',role:'service_role',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+31536000})).toString('base64url');
const s=require('crypto').createHmac('sha256','${JWT_SECRET}').update(b+'.'+p).digest('base64url');
console.log(b+'.'+p+'.'+s);
"
}

if [ ! -x "$PSQL" ] || [ ! -x "$INITDB" ]; then
  echo "PostgreSQL client tools are required. Install them and try again." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Binaries
# ---------------------------------------------------------------------------

POSTGREST_VERSION="v16.5"
AUTH_VERSION="v2.197.0"

download() {
  local url="$1" out="$2"
  if [ -x "$out" ]; then
    return
  fi
  echo "Downloading $(basename "$out")..."
  curl -sL --max-time 300 -o "$out" "$url"
}

install_binaries() {
  mkdir -p "$STACK/bin"

  if [ ! -x "$STACK/bin/postgrest" ]; then
    local archive="$STACK/postgrest.tar.xz"
    download "https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-${POSTGREST_VERSION}-macos-aarch64.tar.xz" "$archive"
    tar -xJf "$archive" -C "$STACK" postgrest
    mv "$STACK/postgrest" "$STACK/bin/postgrest"
    rm -f "$archive"
  fi

  if [ ! -x "$STACK/bin/auth" ]; then
    local archive="$STACK/auth.tar.gz"
    download "https://github.com/supabase/auth/releases/download/${AUTH_VERSION}/auth-${AUTH_VERSION}-darwin-arm64.tar.gz" "$archive"
    tar -xzf "$archive" -C "$STACK" auth
    mv "$STACK/auth" "$STACK/bin/auth"
    rm -f "$archive"
  fi
}

# ---------------------------------------------------------------------------
# Postgres
# ---------------------------------------------------------------------------

start_postgres() {
  if [ ! -d "$PGROOT/data" ]; then
    mkdir -p "$PGROOT"
    "$INITDB" -D "$PGROOT/data" -U postgres --auth=trust >/dev/null 2>&1
  fi

  if ! "$PGCTL" -D "$PGROOT/data" status >/dev/null 2>&1; then
    "$PGCTL" -D "$PGROOT/data" -o "-p $PGPORT -k $PGROOT" -l "$PGROOT/pg.log" start >/dev/null
    sleep 1
  fi
}

psql_run() {
  "$PSQL" -h 127.0.0.1 -p "$PGPORT" -U postgres -d "${2:-postgres}" -v ON_ERROR_STOP=1 "$@"
}

# The roles PostgREST and the RLS policies expect.
write_roles() {
  psql_run -d postgres <<'SQL'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end; $$;
grant anon, authenticated, service_role to postgres;
SQL
}

# Existing users created before the default role was configured keep an empty
# role in auth.users. Patch them in place without touching any other column.
fix_user_roles() {
  psql_run -d "$DB" <<'SQL'
do $$
begin
  if to_regclass('auth.users') is not null then
    update auth.users set role = 'authenticated' where role is null or role = '';
    update auth.users set aud = 'authenticated' where aud is null or aud = '';
  end if;
end; $$;
SQL
}

# ---------------------------------------------------------------------------
# GoTrue environment
# ---------------------------------------------------------------------------

# GoTrue reads its settings from the environment. The values here match the
# project config in supabase/config.toml.
auth_env() {
  export API_EXTERNAL_URL="http://127.0.0.1:${AUTH_PORT}"
  export GOTRUE_API_HOST="0.0.0.0"
  export GOTRUE_API_PORT="${AUTH_PORT}"
  export GOTRUE_SITE_URL="http://localhost:3001"
  export GOTRUE_URI_ALLOW_LIST="http://localhost:3001"
  export GOTRUE_DB_DRIVER="postgres"
  # The search_path matters: GoTrue's queries are not schema-qualified, so
  # the auth schema has to be on the path.
  export DATABASE_URL="postgres://postgres@127.0.0.1:${PGPORT}/${DB}?sslmode=disable&search_path=auth,public"
  export GOTRUE_JWT_SECRET="${JWT_SECRET}"
  export GOTRUE_JWT_EXP="3600"
  export GOTRUE_JWT_AUD="authenticated"
  # GoTrue otherwise issues a JWT with an empty role for users created through
  # the public sign-up endpoint, and PostgREST cannot map that to a Postgres
  # role. Demo users are patched in seed.sql; this covers everyone else.
  export GOTRUE_JWT_DEFAULT_GROUP_NAME="authenticated"
  export GOTRUE_JWT_ISSUER="supabase-local"
  export GOTRUE_DISABLE_SIGNUP="false"
  export GOTRUE_MAILER_AUTOCONFIRM="true"
  export GOTRUE_MAILER_MAX_FREQUENCY="1s"
  export GOTRUE_EXTERNAL_EMAIL_ENABLED="true"
  export GOTRUE_SMS_AUTOCONFIRM="true"
  export GOTRUE_LOG_LEVEL="info"
  export GOTRUE_DB_MAX_CONNS="10"
  export GOTRUE_DB_MIN_CONNS="2"
  export GOTRUE_DB_MAX_CONN_LIFETIME="7200s"
  export GOTRUE_DB_HEALTH_CHECK_INTERVAL="15s"
  export API_REQUEST_ID_HEADER="X-Request-Id"
}

# ---------------------------------------------------------------------------
# PostgREST configuration
# ---------------------------------------------------------------------------

write_rest_config() {
  cat > "$STACK/postgrest.conf" <<EOF
db-uri = "postgres://postgres@127.0.0.1:${PGPORT}/${DB}?sslmode=disable&application_name=postgrest"
db-schema = "public"
db-anon-role = "anon"
jwt-secret = "${JWT_SECRET}"
server-host = "127.0.0.1"
server-port = ${REST_PORT}
jwt-role-claim-key = "\$\$.role"
EOF
}

# ---------------------------------------------------------------------------
# Load the schema
# ---------------------------------------------------------------------------

load_schema() {
  echo "Loading the auth and storage schemas..."
  psql_run -d postgres -c "drop database if exists ${DB};" >/dev/null
  psql_run -d postgres -c "create database ${DB};" >/dev/null

  # GoTrue's own migrations create the real auth schema, but they expect the
  # schema itself to exist first.
  psql_run -d "$DB" -c "create schema if not exists auth;" >/dev/null

  # GoTrue's own migrations create the real auth schema.
  ( auth_env; "$STACK/bin/auth" migrate ) >"$STACK/auth-migrate.log" 2>&1 || {
    echo "The auth migration failed:" >&2
    tail -30 "$STACK/auth-migrate.log" >&2
    exit 1
  }

  # Storage schema. The project migration creates the buckets and policies.
  psql_run -d "$DB" <<'SQL'
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb
);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/'); $$;
SQL

  echo "Applying the project migrations..."
  for migration in "$ROOT"/supabase/migrations/*.sql; do
    [ -f "$migration" ] || continue
    psql_run -d "$DB" -f "$migration" >"$STACK/migration.out" 2>&1 || {
      echo "The migration $(basename "$migration") failed:" >&2
      tail -30 "$STACK/migration.out" >&2
      exit 1
    }
  done

  echo "Applying the seed..."
  psql_run -d "$DB" -f "$ROOT/supabase/seed.sql" >"$STACK/seed.out" 2>&1 || {
    echo "The seed failed:" >&2
    tail -30 "$STACK/seed.out" >&2
    exit 1
  }

  create_users
}

# Creates the local sign-in accounts and promotes the admin.
#
# GoTrue's own `admin createuser` command hashes the password correctly, so
# the accounts can actually sign in.
create_users() {
  echo "Creating the local accounts..."

  local email
  for email in customer@example.com provider@example.com admin@example.com; do
    # The project migration has a trigger on auth.users that creates the
    # profile row, so the name is set on the profile afterwards.
    ( auth_env; "$STACK/bin/auth" admin createuser "$email" password123 --confirm ) \
      >/dev/null 2>&1 || true
  done

  psql_run -d "$DB" <<'SQL'
-- GoTrue reads the role from the auth user row. Without it the issued JWT
-- has an empty role and PostgREST cannot map it to a Postgres role.
update auth.users
set role = 'authenticated',
    aud = 'authenticated',
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb;

update public.profiles set full_name = 'Nina Customer' where id in (select id from auth.users where email = 'customer@example.com');
update public.profiles set full_name = 'Petra Provider' where id in (select id from auth.users where email = 'provider@example.com');
update public.profiles set full_name = 'Admin Person' where id in (select id from auth.users where email = 'admin@example.com');
update public.profiles set role = 'admin' where id in (select id from auth.users where email = 'admin@example.com');
update public.profiles set active_dashboard = 'provider' where id in (select id from auth.users where email = 'provider@example.com');
SQL
}

# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

start_services() {
  if ! curl -sf "http://127.0.0.1:${AUTH_PORT}/health" >/dev/null 2>&1; then
    echo "Starting the auth service..."
    ( auth_env; exec "$STACK/bin/auth" ) >"$STACK/auth.log" 2>&1 &
    echo $! >"$STACK/auth.pid"
  fi

  if ! curl -sf "http://127.0.0.1:${REST_PORT}/" >/dev/null 2>&1; then
    echo "Starting the REST service..."
    "$STACK/bin/postgrest" "$STACK/postgrest.conf" >"$STACK/postgrest.log" 2>&1 &
    echo $! >"$STACK/postgrest.pid"
  fi

  if ! curl -s -o /dev/null "http://127.0.0.1:${GATEWAY_PORT}/rest/v1/service_categories" >/dev/null 2>&1; then
    echo "Starting the API gateway..."
    GATEWAY_PORT="${GATEWAY_PORT}" AUTH_URL="http://127.0.0.1:${AUTH_PORT}" REST_URL="http://127.0.0.1:${REST_PORT}" \
      node "$ROOT/scripts/local-supabase-gateway.mjs" >"$STACK/gateway.log" 2>&1 &
    echo $! >"$STACK/gateway.pid"
  fi

  # Wait for all three to answer.
  for _ in $(seq 1 40); do
    if curl -sf "http://127.0.0.1:${AUTH_PORT}/health" >/dev/null 2>&1 \
      && curl -sf "http://127.0.0.1:${REST_PORT}/" >/dev/null 2>&1 \
      && curl -s -o /dev/null "http://127.0.0.1:${GATEWAY_PORT}/rest/v1/service_categories" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  echo "The services did not start. Check $STACK/auth.log and $STACK/postgrest.log." >&2
  exit 1
}

stop_services() {
  for name in auth postgrest gateway; do
    if [ -f "$STACK/$name.pid" ]; then
      kill "$(cat "$STACK/$name.pid")" 2>/dev/null || true
      rm -f "$STACK/$name.pid"
    fi
  done

  if [ -d "$PGROOT/data" ]; then
    "$PGCTL" -D "$PGROOT/data" stop -m fast >/dev/null 2>&1 || true
  fi

  echo "The local Supabase stack stopped."
}

print_url() {
  cat <<EOF

Add these to .env.local:

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${GATEWAY_PORT}
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(anon_key)
SUPABASE_SERVICE_ROLE_KEY=$(service_role_key)

Then sign in with:
  admin@example.com / password123     (the site owner)
  customer@example.com / password123  (a customer)
  provider@example.com / password123  (a provider)
EOF
}

# The same keys, as shell assignments. Used by the test runner, which starts
# the app with them rather than writing a file.
print_env() {
  cat <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${GATEWAY_PORT}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$(anon_key)
SUPABASE_SECRET_KEY=$(service_role_key)
EOF
}

case "${1:-start}" in
  start)
    install_binaries
    start_postgres
    write_roles
    write_rest_config
    load_schema
    start_services
    echo "The local Supabase stack is running."
    print_url
    ;;
  ensure)
    # Starts everything and loads the schema only if it is not there yet.
    # Unlike `start`, this never drops an existing database, so it is safe
    # to call while a development server is using it.
    install_binaries
    start_postgres
    write_roles
    write_rest_config
    if ! psql_run -d "$DB" -tAc "select 1 from service_categories limit 1" >/dev/null 2>&1; then
      load_schema
    fi
    fix_user_roles
    start_services
    echo "The local Supabase stack is running."
    ;;
  reset)
    write_rest_config
    load_schema
    fix_user_roles
    start_services
    echo "The local Supabase stack is running."
    print_url
    ;;
  env)
    print_env
    ;;
  stop)
    stop_services
    ;;
  url)
    print_url
    ;;
  *)
    echo "Usage: $0 {start|ensure|reset|env|stop|url}" >&2
    exit 1
    ;;
esac
