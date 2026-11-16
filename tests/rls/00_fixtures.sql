-- Shared fixtures for the RLS suite.
-- Runs as the table owner so RLS does not block setup. Everything is
-- rolled back by the runner at the end of the session.

begin;

-- Fixed ids so tests can set the simulated signed-in user.
--
--   customer     posts jobs and accepts offers
--   provider     approved, covers G12 and furniture repair
--   provider2    approved, covers G11 and clothing alterations
--   provider3    approved, also covers G12 and furniture repair
--   pending      has not been approved yet
--   admin        runs the moderation tools

insert into auth.users (id, email, raw_user_meta_data)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'rls-customer@example.test', '{"full_name":"Nina Customer"}'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'rls-provider@example.test', '{"full_name":"Petra Provider"}'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'rls-provider2@example.test', '{"full_name":"Ade Another"}'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'rls-pending@example.test', '{"full_name":"Pau Pending"}'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'rls-admin@example.test', '{"full_name":"Admin Person"}'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'rls-customer2@example.test', '{"full_name":"Callum Customer"}'),
  ('aaaaaaaa-0000-4000-8000-000000000007', 'rls-provider3@example.test', '{"full_name":"Robin Runner"}');

update public.profiles
set role = 'admin'
where id = 'aaaaaaaa-0000-4000-8000-000000000005';

-- The furniture category and its child come from the seed file.
insert into public.provider_profiles (
  user_id, provider_type, display_name, bio, service_districts, status, declaration_accepted_at
)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000002',
    'individual',
    'Petra Mends',
    'Upholstery and small woodwork repairs.',
    array['G12'],
    'approved',
    now()
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000003',
    'sole_trader',
    'Ade Alters',
    'Clothing alterations and hemming.',
    array['G11'],
    'approved',
    now()
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000007',
    'business',
    'Robin Runner',
    'Furniture repair and upholstery.',
    array['G12'],
    'approved',
    now()
  );

insert into public.provider_services (provider_id, category_id)
values
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111113'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111');
