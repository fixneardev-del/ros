#!/bin/bash
# Start a throwaway Postgres so the RLS suite can run without Docker.
#
# Supabase's own auth and storage schemas are stubbed, because the rules we
# are testing live in our own tables, policies and functions.
#
# Usage:
#   scripts/local-postgres.sh start    start it and load the schema and seed
#   scripts/local-postgres.sh stop     stop it
#   scripts/local-postgres.sh reset    drop and recreate the database
#
# The suite then runs with:
#   SUPABASE_DB_URL=postgresql://postgres@127.0.0.1:55432/app npm run test:rls

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGROOT="${PGROOT:-${TMPDIR:-/tmp}/repairs-rls-postgres}"
PORT="${PGPORT:-55432}"
PSQL="${PSQL:-$(command -v psql || echo /opt/homebrew/bin/psql)}"
INITDB="${INITDB:-$(command -v initdb || echo /opt/homebrew/bin/initdb)}"
PGCTL="${PGCTL:-$(command -v pg_ctl || echo /opt/homebrew/bin/pg_ctl)}"
DB=app

if [ ! -x "$PSQL" ] || [ ! -x "$INITDB" ]; then
  echo "PostgreSQL client tools are required. Install them and try again." >&2
  exit 1
fi

write_stubs() {
  cat > "$PGROOT/stubs.sql" <<'SQL'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end; $$;
create schema if not exists auth;
create schema if not exists storage;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(), email text,
  raw_user_meta_data jsonb not null default '{}', created_at timestamptz not null default now());
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.role', true), 'anon'); $$;
create table if not exists storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text not null, owner uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/'); $$;
SQL
}

start() {
  if [ ! -d "$PGROOT/data" ]; then
    mkdir -p "$PGROOT"
    "$INITDB" -D "$PGROOT/data" -U postgres --auth=trust >/dev/null 2>&1
    "$PGCTL" -D "$PGROOT/data" -o "-p $PORT -k $PGROOT" -l "$PGROOT/pg.log" start >/dev/null
    sleep 1
  fi
  echo "Postgres is running on port $PORT."
}

load() {
  "$PSQL" -h "$PGROOT" -p "$PORT" -U postgres -d postgres -c "drop database if exists ${DB};" >/dev/null
  "$PSQL" -h "$PGROOT" -p "$PORT" -U postgres -d postgres -c "create database ${DB};" >/dev/null
  write_stubs
  "$PSQL" -h "$PGROOT" -p "$PORT" -U postgres -d "$DB" -v ON_ERROR_STOP=1 -f "$PGROOT/stubs.sql" >/dev/null
  "$PSQL" -h "$PGROOT" -p "$PORT" -U postgres -d "$DB" -v ON_ERROR_STOP=1 \
    -f "$ROOT/supabase/migrations/0001_init.sql" > "$PGROOT/migration.out" 2>&1 || {
      echo "Migration failed:" >&2; tail -30 "$PGROOT/migration.out" >&2; exit 1;
    }
  "$PSQL" -h "$PGROOT" -p "$PORT" -U postgres -d "$DB" -v ON_ERROR_STOP=1 \
    -f "$ROOT/supabase/seed.sql" > "$PGROOT/seed.out" 2>&1 || {
      echo "Seed failed:" >&2; tail -30 "$PGROOT/seed.out" >&2; exit 1;
    }
  echo "Migration and seed applied cleanly."
}

stop() {
  "$PGCTL" -D "$PGROOT/data" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$PGROOT"
  echo "Postgres stopped."
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  reset) start; load ;;
  load) load ;;
  *) echo "Usage: $0 {start|stop|reset|load}" >&2; exit 1 ;;
esac
