#!/bin/bash
# Add demo content to the local database so the dashboards have something to
# show. It only touches the local stack.
#
# Usage: scripts/local-demo-data.sh

set -euo pipefail

PGPORT="${PGPORT:-55433}"
DB="${DB:-app}"
PSQL="${PSQL:-$(command -v psql || echo /opt/homebrew/bin/psql)}"

psql_run() {
  "$PSQL" -h 127.0.0.1 -p "$PGPORT" -U postgres -d "$DB" -v ON_ERROR_STOP=1 "$@"
}

# The category ids are read by slug so the script keeps working if the seed
# changes them.
category_id() {
  psql_run -tAc "select id from service_categories where slug = '$1';" | head -1
}

# The accounts are created here rather than assumed. GoTrue stores a bcrypt
# hash in `encrypted_password`, so a row inserted directly signs in exactly
# like one it created itself. That keeps this script working on the local
# stack and on the Supabase CLI containers a CI run uses.
#
# The ids are only used when the account is missing, so a database that
# already has them keeps whatever ids GoTrue gave them.
psql_run <<'SQL'
insert into auth.users (id, instance_id, email, role, aud, encrypted_password,
                        email_confirmed_at, confirmation_token, recovery_token,
                        email_change_token_new, email_change, raw_app_meta_data,
                        raw_user_meta_data, created_at, updated_at)
select v.id, '00000000-0000-0000-0000-000000000000'::uuid, v.email,
       'authenticated', 'authenticated',
       crypt('password123', gen_salt('bf')), now(),
       '', '', '', '',
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', v.full_name), now(), now()
from (values
  ('bbbbbbbb-0000-4000-8000-000000000001'::uuid, 'customer@example.com', 'Nina Customer'),
  ('bbbbbbbb-0000-4000-8000-000000000002'::uuid, 'callum@example.com', 'Callum Customer'),
  ('bbbbbbbb-0000-4000-8000-000000000003'::uuid, 'pending@example.com', 'Pau Pending'),
  ('bbbbbbbb-0000-4000-8000-000000000004'::uuid, 'provider@example.com', 'Petra Provider'),
  ('bbbbbbbb-0000-4000-8000-000000000005'::uuid, 'admin@example.com', 'Admin Person')
) as v(id, email, full_name)
where not exists (select 1 from auth.users where email = v.email);
SQL

# The auth trigger creates the profile row, so the ids are read back rather
# than assumed. psql separates columns with a pipe, so the output is read the
# same way.
IDS="$(psql_run -tAc "
select
  (select id from auth.users where email = 'customer@example.com'),
  (select id from auth.users where email = 'provider@example.com'),
  (select id from auth.users where email = 'admin@example.com');")"

CUSTOMER="$(printf '%s' "$IDS" | cut -d'|' -f1)"
PROVIDER="$(printf '%s' "$IDS" | cut -d'|' -f2)"
ADMIN="$(printf '%s' "$IDS" | cut -d'|' -f3)"

FURNITURE="$(category_id furniture-repair)"
WOODWORK="$(category_id woodwork-joinery)"
HEMMING="$(category_id zip-seam-repairs)"
SMALL_FIXES="$(category_id small-home-fixes)"
ALTERATIONS="$(category_id clothing-alterations)"

if [ -z "$CUSTOMER" ] || [ -z "$PROVIDER" ] || [ -z "$ADMIN" ]; then
  echo "The demo accounts could not be created." >&2
  exit 1
fi

# The site owner is the only account with the admin role. The approved demo
# provider opens the provider dashboard; everyone else starts as a customer.
psql_run -c "update public.profiles set role = 'admin' where id = '${ADMIN}'::uuid;" >/dev/null
psql_run -c "update public.profiles set active_dashboard = 'provider' where id = '${PROVIDER}'::uuid;" >/dev/null

psql_run <<SQL
-- An approved provider with services.
insert into provider_profiles (
  user_id, provider_type, display_name, bio, service_districts, status,
  declaration_accepted_at, price_note, created_at, updated_at)
values ('${PROVIDER}', 'individual', 'Petra Mends',
        'Upholstery, small woodwork and home repairs. Ten years on the sofa.',
        array['G12', 'G11'], 'approved', now(), 'From £25 for a repair', now(), now())
on conflict (user_id) do update set status = 'approved', display_name = excluded.display_name;

insert into provider_services (provider_id, category_id)
values ('${PROVIDER}', '${FURNITURE}'),
       ('${PROVIDER}', '${WOODWORK}'),
       ('${PROVIDER}', '${SMALL_FIXES}')
on conflict do nothing;

-- A pending application so the admin review queue has work in it.
insert into provider_profiles (
  user_id, provider_type, display_name, bio, service_districts, status,
  declaration_accepted_at, created_at, updated_at)
values ('bbbbbbbb-0000-4000-8000-000000000003', 'sole_trader', 'Ade Alters',
        'Clothing alterations, hemming and zip repairs.',
        array['G11'], 'pending', now(), now(), now())
on conflict (user_id) do update set status = 'pending', display_name = excluded.display_name;

insert into provider_services (provider_id, category_id)
values ('bbbbbbbb-0000-4000-8000-000000000003', '${ALTERATIONS}')
on conflict do nothing;

-- Jobs in a few states.
insert into job_requests (
  id, customer_id, category_id, title, description, postcode, postcode_district,
  timeframe, status, created_at, updated_at)
values
  ('cccccccc-0000-4000-8000-000000000001', '${CUSTOMER}',
   '${WOODWORK}', 'Repair a wobbly dining chair',
   'The legs have come away from the seat and it rocks when you sit down.',
   'G12 8QQ', 'G12', 'this_week', 'receiving_offers', now() - interval '2 days', now()),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002',
   '${HEMMING}', 'Hem three pairs of jeans',
   'Two pairs of jeans and one pair of trousers, if that is possible.',
   'G11 1AA', 'G11', 'flexible', 'open', now() - interval '1 day', now()),
  ('cccccccc-0000-4000-8000-000000000003', '${CUSTOMER}',
   '${SMALL_FIXES}', 'Hang a shelf in the hallway',
   'Two shelves and a coat rail, plaster walls.',
   'G12 8QQ', 'G12', 'this_week', 'closed', now() - interval '9 days', now())
on conflict (id) do nothing;

-- An offer on the first job.
insert into provider_offers (id, job_id, provider_id, message, indicative_price_pence, status, created_at, updated_at)
values ('dddddddd-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
        '${PROVIDER}',
        'I can re-glue both legs properly. Should take an hour.',
        3500, 'submitted', now() - interval '1 day', now())
on conflict (id) do nothing;
SQL

echo "Demo data added."
psql_run -tAc "
select 'providers: ' || count(*) from provider_profiles
union all select 'jobs: ' || count(*) from job_requests
union all select 'offers: ' || count(*) from provider_offers;"
