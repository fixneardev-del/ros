-- Demo sign-in accounts for the hosted/staging project.
--
-- Run this in the Supabase SQL editor after 0001_init.sql and seed.sql, or
-- let scripts/hosted-setup.sh apply it. It is safe to run again: the password,
-- confirmation and provider metadata are refreshed.
--
-- Do not run this against production.
--
-- The password is hashed with pgcrypto, the same way GoTrue does it. On a
-- hosted project pgcrypto lives in the extensions schema. The instance id is
-- the default GoTrue instance, which is what the local stack uses too; a null
-- instance id creates a row that GoTrue cannot sign in.

delete from auth.users where email = 'probe@localtest.dev';

-- Insert the accounts that do not exist yet. A plain ON CONFLICT cannot be
-- used because auth.users does not have a portable unique constraint on email
-- across the hosted schema and the local stack's schema.
insert into auth.users (
  id, instance_id, email, role, aud, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  v.email,
  'authenticated',
  'authenticated',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', v.full_name),
  now(),
  now()
from (values
  ('admin@example.com', 'Admin Person'),
  ('customer@example.com', 'Nina Customer'),
  ('provider@example.com', 'Petra Provider')
) as v(email, full_name)
where not exists (select 1 from auth.users u where u.email = v.email);

-- Refresh the password and confirmation on every run, including accounts that
-- were created earlier with a different password or an unconfirmed state.
update auth.users
set instance_id = '00000000-0000-0000-0000-000000000000'::uuid,
    encrypted_password = extensions.crypt('password123', extensions.gen_salt('bf')),
    email_confirmed_at = now(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
where email in ('admin@example.com', 'customer@example.com', 'provider@example.com');

-- The migration's trigger creates the profile on insert. This covers an
-- account that existed before the trigger, and keeps re-runs safe.
insert into public.profiles (id, full_name)
select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
from auth.users u
where u.email in ('admin@example.com', 'customer@example.com', 'provider@example.com')
on conflict (id) do nothing;

-- Admin is never self-assigned by the app, so it is set here.
update public.profiles
set role = 'admin'
where id in (select id from auth.users where email = 'admin@example.com');
