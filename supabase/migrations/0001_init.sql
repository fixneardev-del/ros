-- Repairs and Other Services: initial schema, RLS, storage and RPCs.

create extension if not exists pgcrypto;

create type app_role as enum ('user', 'admin');
create type provider_type as enum ('individual', 'sole_trader', 'business');
create type provider_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type job_status as enum ('open', 'receiving_offers', 'closed', 'removed');
create type offer_status as enum ('submitted', 'accepted', 'declined', 'withdrawn');
create type report_status as enum ('open', 'reviewed', 'dismissed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  full_name text not null,
  phone text,
  is_suspended boolean not null default false,
  suspended_by uuid references profiles(id),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references service_categories(id),
  name text not null,
  slug text not null unique,
  description text,
  requires_extra_checks boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  postcode_district text not null unique,
  area_name text not null,
  is_enabled boolean not null default true
);

create table provider_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  provider_type provider_type not null,
  display_name text not null,
  business_name text,
  bio text not null,
  service_districts text[] not null default '{}',
  price_note text,
  status provider_status not null default 'pending',
  rejection_reason text,
  needs_more_info_note text,
  declaration_accepted_at timestamptz not null,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  suspended_by uuid references profiles(id),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table provider_services (
  provider_id uuid references provider_profiles(user_id) on delete cascade,
  category_id uuid references service_categories(id),
  primary key (provider_id, category_id)
);

create table provider_photos (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references provider_profiles(user_id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table job_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references service_categories(id),
  title text not null,
  description text not null,
  postcode text not null,
  postcode_district text not null,
  timeframe text not null,
  status job_status not null default 'open',
  accepted_offer_id uuid,
  removed_reason text,
  removed_by uuid references profiles(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_requests(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table provider_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_requests(id) on delete cascade,
  provider_id uuid not null references provider_profiles(user_id) on delete cascade,
  message text not null,
  indicative_price_pence int,
  estimated_timeframe text,
  status offer_status not null default 'submitted',
  removed_by uuid references profiles(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, provider_id)
);

alter table job_requests
  add constraint fk_accepted_offer foreign key (accepted_offer_id) references provider_offers(id);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  target_type text not null check (target_type in ('provider', 'job')),
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table interest_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  postcode text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  to_email text not null,
  template text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table site_settings (
  key text primary key,
  value text not null
);

-- First party analytics. No cookies, no IP address, no third party script.
-- Events are written by the public collector and read by admins only.
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  path text,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_analytics_events_event on analytics_events(event);
create index idx_analytics_events_created on analytics_events(created_at desc);

create index idx_provider_services_category on provider_services(category_id);
create index idx_provider_profiles_status on provider_profiles(status);
create index idx_provider_photos_provider on provider_photos(provider_id);
create index idx_job_requests_status_district on job_requests(status, postcode_district);
create index idx_job_requests_customer on job_requests(customer_id);
create index idx_job_photos_job on job_photos(job_id);
create index idx_offers_job on provider_offers(job_id);
create index idx_offers_provider on provider_offers(provider_id);
create index idx_reports_status on reports(status);
create index idx_notifications_status on notifications(status);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_suspended()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_suspended from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_approved_provider()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from provider_profiles
    where user_id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.can_view_provider(p_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from provider_profiles
    where user_id = p_provider_id
      and (status = 'approved' or user_id = auth.uid() or is_admin())
  );
$$;

create or replace function public.can_view_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from job_requests j
    where j.id = p_job_id
      and (
        j.customer_id = auth.uid()
        or is_admin()
        or exists (
          select 1
          from provider_profiles p
          join provider_services ps on ps.provider_id = p.user_id
          join service_categories sc on sc.id = ps.category_id
          where p.user_id = auth.uid()
            and p.status = 'approved'
            and j.status in ('open', 'receiving_offers')
            and j.postcode_district = any (p.service_districts)
            and (
              sc.id = j.category_id
              or sc.id = (select parent_id from service_categories where id = j.category_id)
            )
        )
        or exists (
          select 1
          from provider_offers po
          where po.job_id = j.id
            and po.provider_id = auth.uid()
            and po.status = 'accepted'
        )
      )
  );
$$;

create or replace function public.can_provide_for_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from job_requests j
    join provider_profiles p on p.user_id = auth.uid() and p.status = 'approved'
    where j.id = p_job_id
      and j.status in ('open', 'receiving_offers')
      and j.postcode_district = any (p.service_districts)
      and exists (
        select 1
        from provider_services ps
        join service_categories sc on sc.id = ps.category_id
        where ps.provider_id = p.user_id
          and (
            sc.id = j.category_id
            or sc.id = (select parent_id from service_categories where id = j.category_id)
          )
      )
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
for each row execute function set_updated_at();

create trigger provider_profiles_updated_at before update on provider_profiles
for each row execute function set_updated_at();

create trigger job_requests_updated_at before update on job_requests
for each row execute function set_updated_at();

create trigger provider_offers_updated_at before update on provider_offers
for each row execute function set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'Neighbour'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.is_suspended is distinct from old.is_suspended then
    raise exception 'Only an administrator can change roles or suspension.';
  end if;

  return new;
end;
$$;

create trigger profiles_enforce_update before update on profiles
for each row execute function enforce_profile_update();

create or replace function public.enforce_provider_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'Not allowed.';
  end if;

  if new.user_id <> old.user_id then
    raise exception 'Not allowed.';
  end if;

  if new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'Only an administrator can review a provider.';
  end if;

  if new.status is distinct from old.status then
    if not (
      new.status = 'pending'
      and old.status in ('approved', 'rejected')
      and (
        old.status = 'rejected'
        or new.display_name is distinct from old.display_name
        or new.provider_type is distinct from old.provider_type
      )
    ) then
      raise exception 'That provider status change is not allowed.';
    end if;
  end if;

  return new;
end;
$$;

create trigger provider_profiles_enforce_update before update on provider_profiles
for each row execute function enforce_provider_update();

create or replace function public.enforce_job_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.accept_offer', true) = 'on' then
    return new;
  end if;

  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.status = 'receiving_offers'
    and old.status = 'open'
    and can_provide_for_job(old.id) then
    return new;
  end if;

  if old.customer_id <> auth.uid() then
    raise exception 'Not allowed.';
  end if;

  if new.customer_id <> old.customer_id
    or new.category_id <> old.category_id
    or new.postcode <> old.postcode
    or new.postcode_district <> old.postcode_district then
    raise exception 'You cannot change the owner, category or postcode of a job.';
  end if;

  if new.accepted_offer_id is distinct from old.accepted_offer_id
    or new.removed_reason is distinct from old.removed_reason then
    raise exception 'Only an administrator can change moderation fields.';
  end if;

  if new.status is distinct from old.status then
    if not (old.status in ('open', 'receiving_offers') and new.status = 'closed') then
      raise exception 'That job status change is not allowed.';
    end if;
  end if;

  if old.status <> 'open'
    and (
      new.title <> old.title
      or new.description <> old.description
      or new.timeframe <> old.timeframe
    ) then
    raise exception 'You can only edit a job while it is open.';
  end if;

  return new;
end;
$$;

create trigger job_requests_enforce_update before update on job_requests
for each row execute function enforce_job_update();

create or replace function public.enforce_offer_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.accept_offer', true) = 'on' then
    return new;
  end if;

  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if old.provider_id = auth.uid() then
    if new.job_id <> old.job_id or new.provider_id <> old.provider_id then
      raise exception 'Not allowed.';
    end if;

    if new.status is distinct from old.status
      and not (old.status = 'submitted' and new.status = 'withdrawn') then
      raise exception 'That offer status change is not allowed.';
    end if;

    if old.status <> 'submitted'
      and (
        new.message <> old.message
        or new.indicative_price_pence is distinct from old.indicative_price_pence
        or new.estimated_timeframe is distinct from old.estimated_timeframe
      ) then
      raise exception 'You can only edit an offer before the customer decides.';
    end if;

    return new;
  end if;

  if exists (
    select 1 from job_requests
    where id = old.job_id and customer_id = auth.uid()
  ) then
    if new.status is distinct from old.status
      and not (old.status = 'submitted' and new.status in ('accepted', 'declined')) then
      raise exception 'That offer status change is not allowed.';
    end if;

    if new.message <> old.message
      or new.indicative_price_pence is distinct from old.indicative_price_pence
      or new.estimated_timeframe is distinct from old.estimated_timeframe then
      raise exception 'Only the provider can edit an offer.';
    end if;

    return new;
  end if;

  raise exception 'Not allowed.';
end;
$$;

create trigger provider_offers_enforce_update before update on provider_offers
for each row execute function enforce_offer_update();

create or replace function public.limit_provider_photos()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from provider_photos where provider_id = new.provider_id) >= 6 then
    raise exception 'A provider can have at most 6 photos.';
  end if;
  return new;
end;
$$;

create trigger provider_photos_limit before insert on provider_photos
for each row execute function limit_provider_photos();

create or replace function public.limit_job_photos()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from job_photos where job_id = new.job_id) >= 4 then
    raise exception 'A job can have at most 4 photos.';
  end if;
  return new;
end;
$$;

create trigger job_photos_limit before insert on job_photos
for each row execute function limit_job_photos();

-- Row Level Security

alter table profiles enable row level security;
alter table service_categories enable row level security;
alter table locations enable row level security;
alter table provider_profiles enable row level security;
alter table provider_services enable row level security;
alter table provider_photos enable row level security;
alter table job_requests enable row level security;
alter table job_photos enable row level security;
alter table provider_offers enable row level security;
alter table reports enable row level security;
alter table interest_signups enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table site_settings enable row level security;
alter table analytics_events enable row level security;

create policy profiles_select on profiles for select
using (id = auth.uid() or is_admin());

create policy profiles_update_own on profiles for update
using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_admin on profiles for update
using (is_admin()) with check (is_admin());

create policy categories_select on service_categories for select
using (is_active or is_admin());

create policy categories_admin_insert on service_categories for insert
with check (is_admin());

create policy categories_admin_update on service_categories for update
using (is_admin()) with check (is_admin());

create policy categories_admin_delete on service_categories for delete
using (is_admin());

create policy locations_select on locations for select
using (is_enabled or is_admin());

create policy locations_admin_insert on locations for insert
with check (is_admin());

create policy locations_admin_update on locations for update
using (is_admin()) with check (is_admin());

create policy locations_admin_delete on locations for delete
using (is_admin());

create policy providers_select on provider_profiles for select
using (status = 'approved' or user_id = auth.uid() or is_admin());

create policy providers_insert_own on provider_profiles for insert
with check (user_id = auth.uid() and status = 'pending' and not is_suspended());

create policy providers_update_own on provider_profiles for update
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy providers_update_admin on provider_profiles for update
using (is_admin()) with check (is_admin());

create policy providers_delete_own_pending on provider_profiles for delete
using (user_id = auth.uid() and status = 'pending');

create policy providers_delete_admin on provider_profiles for delete
using (is_admin());

create policy provider_services_select on provider_services for select
using (can_view_provider(provider_id));

create policy provider_services_insert_own on provider_services for insert
with check (provider_id = auth.uid());

create policy provider_services_update_own on provider_services for update
using (provider_id = auth.uid()) with check (provider_id = auth.uid());

create policy provider_services_delete_own on provider_services for delete
using (provider_id = auth.uid() or is_admin());

create policy provider_photos_select on provider_photos for select
using (can_view_provider(provider_id));

create policy provider_photos_insert_own on provider_photos for insert
with check (provider_id = auth.uid());

create policy provider_photos_update_own on provider_photos for update
using (provider_id = auth.uid()) with check (provider_id = auth.uid());

create policy provider_photos_delete_own on provider_photos for delete
using (provider_id = auth.uid() or is_admin());

create policy jobs_select on job_requests for select
using (can_view_job(id));

create policy jobs_insert_own on job_requests for insert
with check (customer_id = auth.uid() and not is_suspended());

create policy jobs_update_own on job_requests for update
using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy jobs_update_admin on job_requests for update
using (is_admin()) with check (is_admin());

create policy job_photos_select on job_photos for select
using (can_view_job(job_id));

create policy job_photos_insert_own on job_photos for insert
with check (
  exists (
    select 1 from job_requests
    where id = job_id and customer_id = auth.uid()
  )
);

create policy job_photos_delete_own on job_photos for delete
using (
  exists (
    select 1 from job_requests
    where id = job_id and customer_id = auth.uid()
  )
);

create policy offers_select on provider_offers for select
using (
  provider_id = auth.uid()
  or exists (select 1 from job_requests where id = job_id and customer_id = auth.uid())
  or is_admin()
);

create policy offers_insert_own on provider_offers for insert
with check (
  provider_id = auth.uid()
  and is_approved_provider()
  and can_provide_for_job(job_id)
  and not is_suspended()
);

create policy offers_update_participants on provider_offers for update
using (
  provider_id = auth.uid()
  or exists (select 1 from job_requests where id = job_id and customer_id = auth.uid())
  or is_admin()
)
with check (
  provider_id = auth.uid()
  or exists (select 1 from job_requests where id = job_id and customer_id = auth.uid())
  or is_admin()
);

create policy reports_insert_own on reports for insert
with check (reporter_id = auth.uid());

create policy reports_select_admin on reports for select
using (is_admin());

create policy reports_update_admin on reports for update
using (is_admin()) with check (is_admin());

create policy interest_signups_insert_public on interest_signups for insert
with check (true);

create policy interest_signups_select_admin on interest_signups for select
using (is_admin());

create policy notifications_select_admin on notifications for select
using (is_admin());

create policy audit_select_admin on audit_log for select
using (is_admin());

create policy audit_insert_admin on audit_log for insert
with check (is_admin());

create policy site_settings_select_public on site_settings for select
using (true);

create policy analytics_events_insert_public on analytics_events for insert
with check (event = any (array[
  'page_view',
  'search',
  'job_posted',
  'provider_applied'
]));

create policy analytics_events_select_admin on analytics_events for select
using (is_admin());

create policy site_settings_admin_insert on site_settings for insert
with check (is_admin());

create policy site_settings_admin_update on site_settings for update
using (is_admin()) with check (is_admin());

-- RPCs

create or replace function public.mark_job_receiving_offers(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_provide_for_job(p_job_id) then
    raise exception 'Not allowed.';
  end if;

  update job_requests
  set status = 'receiving_offers', updated_at = now()
  where id = p_job_id and status = 'open';
end;
$$;

create or replace function public.swap_category_order(p_category_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current service_categories%rowtype;
  v_other service_categories%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an administrator can reorder categories.';
  end if;

  if p_direction not in ('up', 'down') then
    raise exception 'Unknown direction.';
  end if;

  select * into v_current
  from service_categories
  where id = p_category_id
  for update;

  if not found then
    raise exception 'Category not found.';
  end if;

  if p_direction = 'up' then
    select * into v_other
    from service_categories
    where parent_id is not distinct from v_current.parent_id
      and sort_order < v_current.sort_order
    order by sort_order desc
    limit 1
    for update;
  else
    select * into v_other
    from service_categories
    where parent_id is not distinct from v_current.parent_id
      and sort_order > v_current.sort_order
    order by sort_order asc
    limit 1
    for update;
  end if;

  if v_other.id is null then
    return;
  end if;

  update service_categories set sort_order = v_other.sort_order where id = v_current.id;
  update service_categories set sort_order = v_current.sort_order where id = v_other.id;
end;
$$;

create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_status offer_status;
  v_job_status job_status;
  v_customer_id uuid;
begin
  select job_id, status into v_job_id, v_status
  from provider_offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'Offer not found.';
  end if;

  select customer_id, status into v_customer_id, v_job_status
  from job_requests
  where id = v_job_id
  for update;

  if v_customer_id <> auth.uid() then
    raise exception 'Not allowed.';
  end if;

  if v_status <> 'submitted' then
    raise exception 'That offer is no longer open.';
  end if;

  if v_job_status not in ('open', 'receiving_offers') then
    raise exception 'That job is closed.';
  end if;

  perform set_config('app.accept_offer', 'on', true);

  update provider_offers
  set status = 'accepted', updated_at = now()
  where id = p_offer_id;

  update provider_offers
  set status = 'declined', updated_at = now()
  where job_id = v_job_id and id <> p_offer_id and status = 'submitted';

  update job_requests
  set status = 'closed', accepted_offer_id = p_offer_id, updated_at = now()
  where id = v_job_id;

  -- Clear the trigger bypass so later writes in this transaction are checked
  -- normally.
  perform set_config('app.accept_offer', 'off', true);
end;
$$;

create or replace function public.get_contact_for_accepted_offer(p_offer_id uuid)
returns table (party text, full_name text, email text, phone text)
language sql
stable
security definer
set search_path = public, auth
as $$
  with accepted as (
    select po.*, j.customer_id
    from provider_offers po
    join job_requests j on j.id = po.job_id
    where po.id = p_offer_id
      and po.status = 'accepted'
      and (j.customer_id = auth.uid() or po.provider_id = auth.uid())
  )
  select 'customer'::text, p.full_name, u.email, p.phone
  from accepted a
  join profiles p on p.id = a.customer_id
  join auth.users u on u.id = p.id
  union all
  select 'provider'::text, p.full_name, u.email, p.phone
  from accepted a
  join profiles p on p.id = a.provider_id
  join auth.users u on u.id = p.id;
$$;

-- Grants. Supabase sets these as project defaults, but the migration states
-- them explicitly so it behaves the same on a clean project.
-- Row level security is the real access control on every table above.

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- These RPCs decide who sees contact details and who can accept an offer, so
-- they are only executable by a signed-in user.

revoke execute on function public.accept_offer(uuid) from public, anon;
revoke execute on function public.mark_job_receiving_offers(uuid) from public, anon;
revoke execute on function public.get_contact_for_accepted_offer(uuid) from public, anon;
revoke execute on function public.swap_category_order(uuid, text) from public, anon;

grant execute on function public.accept_offer(uuid) to authenticated;
grant execute on function public.mark_job_receiving_offers(uuid) to authenticated;
grant execute on function public.get_contact_for_accepted_offer(uuid) to authenticated;
grant execute on function public.swap_category_order(uuid, text) to authenticated;

-- Storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('provider-photos', 'provider-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('job-photos', 'job-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy provider_photos_public_read on storage.objects for select
using (bucket_id = 'provider-photos');

create policy provider_photos_owner_write on storage.objects for all
using (
  bucket_id = 'provider-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'provider-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy provider_photos_admin_delete on storage.objects for delete
using (bucket_id = 'provider-photos' and is_admin());

create policy job_photos_permitted_read on storage.objects for select
using (
  bucket_id = 'job-photos'
  and can_view_job(((storage.foldername(name))[2])::uuid)
);

create policy job_photos_owner_insert on storage.objects for insert
with check (
  bucket_id = 'job-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy job_photos_owner_delete on storage.objects for delete
using (
  bucket_id = 'job-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
