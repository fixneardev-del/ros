-- Repairs and Other Services: schema, RLS, storage and RPCs.
--
-- This file is safe to run more than once. It is both the bootstrap for a new
-- project and the upgrade path for an existing one: tables use IF NOT EXISTS,
-- policies and triggers are recreated, and the old email outbox is moved to
-- notification_deliveries before the in-app notifications table is created.
--
-- The migration is one transaction. A failure therefore rolls back the
-- trigger and policy replacement instead of leaving a partially upgraded
-- database without its access controls.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'app_role'
  ) then
    execute 'create type public.app_role as enum (''user'', ''admin'')';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'provider_type'
  ) then
    execute 'create type public.provider_type as enum (''individual'', ''sole_trader'', ''business'')';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'provider_status'
  ) then
    execute 'create type public.provider_status as enum (''pending'', ''approved'', ''rejected'', ''suspended'')';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'job_status'
  ) then
    execute 'create type public.job_status as enum (''open'', ''receiving_offers'', ''closed'', ''removed'')';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'offer_status'
  ) then
    execute 'create type public.offer_status as enum (''submitted'', ''accepted'', ''declined'', ''withdrawn'')';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'report_status'
  ) then
    execute 'create type public.report_status as enum (''open'', ''reviewed'', ''dismissed'')';
  end if;
end $$;

-- Older projects called the email outbox "notifications". Move it out of the
-- way before the in-app notification centre takes that name.
do $$
begin
  if to_regclass('public.notifications') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notifications'
        and column_name = 'template'
    )
  then
    if to_regclass('public.notification_deliveries') is not null then
      raise exception 'Both public.notifications (email outbox) and public.notification_deliveries exist. Rename the outbox before running this migration.';
    end if;

    alter table public.notifications rename to notification_deliveries;

    -- The primary-key index keeps its old name after the table rename. Move
    -- it now so a fresh and an upgraded database end with the same names.
    if exists (
      select 1 from pg_constraint
      where conname = 'notifications_pkey'
        and conrelid = 'public.notification_deliveries'::regclass
    ) and not exists (
      select 1 from pg_constraint
      where conname = 'notification_deliveries_pkey'
        and conrelid = 'public.notification_deliveries'::regclass
    ) then
      alter table public.notification_deliveries
        rename constraint notifications_pkey to notification_deliveries_pkey;
    end if;
  end if;
end $$;

drop index if exists public.idx_notifications_status;

create table if not exists profiles (
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

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references service_categories(id),
  name text not null,
  slug text not null unique,
  description text,
  requires_extra_checks boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  postcode_district text not null unique,
  area_name text not null,
  is_enabled boolean not null default true
);

create table if not exists provider_profiles (
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

create table if not exists provider_services (
  provider_id uuid references provider_profiles(user_id) on delete cascade,
  category_id uuid references service_categories(id),
  primary key (provider_id, category_id)
);

create table if not exists provider_photos (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references provider_profiles(user_id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists job_requests (
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
  cancelled_at timestamptz,
  completed_at timestamptz,
  removed_reason text,
  removed_by uuid references profiles(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table job_requests add column if not exists cancelled_at timestamptz;
alter table job_requests add column if not exists completed_at timestamptz;

create table if not exists job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_requests(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table if not exists provider_offers (
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_accepted_offer'
      and conrelid = 'public.job_requests'::regclass
  ) then
    alter table public.job_requests
      add constraint fk_accepted_offer
      foreign key (accepted_offer_id) references public.provider_offers(id);
  end if;
end $$;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  target_type text not null check (target_type in ('provider', 'job')),
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists interest_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  postcode text not null,
  created_at timestamptz not null default now()
);

-- In-app notification centre. These rows are written by the service role and
-- read by the owner (or an administrator).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  job_updates boolean not null default true,
  offer_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transactional email outbox. A row is written before the send so a failed
-- message can be retried without losing the recipient or the payload.
create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  notification_id uuid references notifications(id) on delete set null,
  to_email text not null,
  template text not null,
  payload jsonb not null default '{}',
  channel text not null default 'email',
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempt_count int not null default 0,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

-- The first version of the outbox had only the email columns. Add the
-- delivery-tracking columns when the table was renamed into place.
alter table notification_deliveries add column if not exists notification_id uuid references notifications(id) on delete set null;
alter table notification_deliveries add column if not exists channel text not null default 'email';
alter table notification_deliveries add column if not exists attempt_count int not null default 0;
alter table notification_deliveries add column if not exists provider_message_id text;
alter table notification_deliveries add column if not exists updated_at timestamptz not null default now();

-- Reconcile the renamed legacy outbox with the fresh table definition. The
-- old user_id foreign key used the default NO ACTION behaviour, which would
-- prevent user deletion on an upgraded database.
do $$
declare
  user_id_constraint text;
begin
  select c.conname
  into user_id_constraint
  from pg_constraint c
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = c.conkey[1]
  where c.conrelid = 'public.notification_deliveries'::regclass
    and c.contype = 'f'
    and a.attname = 'user_id'
  limit 1;

  if user_id_constraint is not null then
    execute format(
      'alter table public.notification_deliveries drop constraint %I',
      user_id_constraint
    );
  end if;

  alter table public.notification_deliveries
    add constraint notification_deliveries_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete set null;
end $$;

-- Keep the delivery state constraint identical for fresh and renamed tables.
alter table notification_deliveries
  drop constraint if exists notifications_status_check;
alter table notification_deliveries
  drop constraint if exists notification_deliveries_status_check;
alter table notification_deliveries
  add constraint notification_deliveries_status_check
  check (status in ('queued', 'sent', 'failed', 'skipped'));

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text not null
);

-- First party analytics. No cookies, no IP address, no third party script.
-- Events are written by the public collector and read by admins only.
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  path text,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_event on analytics_events(event);
create index if not exists idx_analytics_events_created on analytics_events(created_at desc);

create index if not exists idx_provider_services_category on provider_services(category_id);
create index if not exists idx_provider_profiles_status on provider_profiles(status);
create index if not exists idx_provider_photos_provider on provider_photos(provider_id);
create index if not exists idx_job_requests_status_district on job_requests(status, postcode_district);
create index if not exists idx_job_requests_customer on job_requests(customer_id);
create index if not exists idx_job_photos_job on job_photos(job_id);
create index if not exists idx_offers_job on provider_offers(job_id);
create index if not exists idx_offers_provider on provider_offers(provider_id);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_notifications_user_created on notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread on notifications(user_id) where read_at is null;
create index if not exists idx_notification_deliveries_status on notification_deliveries(status);
create index if not exists idx_notification_deliveries_retry
  on notification_deliveries(status, updated_at);

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

-- Recreate triggers so a re-run picks up changes to the functions above.
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('profiles', 'profiles_updated_at'),
      ('provider_profiles', 'provider_profiles_updated_at'),
      ('job_requests', 'job_requests_updated_at'),
      ('provider_offers', 'provider_offers_updated_at'),
      ('auth.users', 'on_auth_user_created'),
      ('profiles', 'profiles_enforce_update'),
      ('provider_profiles', 'provider_profiles_enforce_update'),
      ('job_requests', 'job_requests_enforce_update'),
      ('provider_offers', 'provider_offers_enforce_update'),
      ('provider_photos', 'provider_photos_limit'),
      ('job_photos', 'job_photos_limit'),
      ('notifications', 'notifications_enforce_update'),
      ('notification_preferences', 'notification_preferences_updated_at'),
      ('notification_deliveries', 'notification_deliveries_updated_at')
    ) as triggers(tbl, trg)
  loop
    execute format('drop trigger if exists %I on %s', item.trg, item.tbl);
  end loop;
end $$;

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

  insert into notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

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
    and can_provide_for_job(old.id)
    and new.completed_at is not distinct from old.completed_at
    and new.cancelled_at is not distinct from old.cancelled_at then
    return new;
  end if;

  -- Completion is a separate event from closing. The customer or the accepted
  -- provider can mark a closed job complete, and nothing else may change in
  -- the same update.
  if new.completed_at is distinct from old.completed_at then
    if old.status = 'closed'
      and old.accepted_offer_id is not null
      and old.completed_at is null
      and new.completed_at is not null
      and exists (
        select 1
        from provider_offers
        where id = old.accepted_offer_id
          and job_id = old.id
          and status = 'accepted'
      )
      and (
        old.customer_id = auth.uid()
        or exists (
          select 1
          from provider_offers
          where id = old.accepted_offer_id
            and job_id = old.id
            and provider_id = auth.uid()
            and status = 'accepted'
        )
      )
      and (to_jsonb(new) - 'completed_at' - 'updated_at')
        = (to_jsonb(old) - 'completed_at' - 'updated_at')
    then
      return new;
    end if;

    raise exception 'That job update is not allowed.';
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

  if new.cancelled_at is distinct from old.cancelled_at then
    if not (
      new.cancelled_at is not null
      and new.status = 'closed'
      and old.status in ('open', 'receiving_offers')
      and old.accepted_offer_id is null
    ) then
      raise exception 'That job update is not allowed.';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not (
      old.status in ('open', 'receiving_offers')
      and new.status = 'closed'
      and old.accepted_offer_id is null
    ) then
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

create or replace function public.enforce_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.user_id <> old.user_id
    or new.type <> old.type
    or new.title <> old.title
    or new.body <> old.body
    or new.data is distinct from old.data
    or new.created_at <> old.created_at then
    raise exception 'Only the read state can be changed.';
  end if;

  return new;
end;
$$;

create trigger notifications_enforce_update before update on notifications
for each row execute function enforce_notification_update();

create trigger notification_preferences_updated_at before update on notification_preferences
for each row execute function set_updated_at();

create trigger notification_deliveries_updated_at before update on notification_deliveries
for each row execute function set_updated_at();

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
alter table notification_preferences enable row level security;
alter table notification_deliveries enable row level security;
alter table audit_log enable row level security;
alter table site_settings enable row level security;
alter table analytics_events enable row level security;

-- Existing users need a preferences row too. New sign-ups get one from the
-- handle_new_user trigger.
insert into notification_preferences (user_id)
select id from profiles
on conflict (user_id) do nothing;

-- Drop the policies this migration owns before recreating them. That keeps a
-- re-run predictable and lets renamed policies disappear.
do $$
declare
  item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'service_categories',
        'locations',
        'provider_profiles',
        'provider_services',
        'provider_photos',
        'job_requests',
        'job_photos',
        'provider_offers',
        'reports',
        'interest_signups',
        'notifications',
        'notification_preferences',
        'notification_deliveries',
        'audit_log',
        'site_settings',
        'analytics_events'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      item.policyname,
      item.schemaname,
      item.tablename
    );
  end loop;
end $$;

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
with check (
  customer_id = auth.uid()
  and not is_suspended()
  and status = 'open'
  and accepted_offer_id is null
  and cancelled_at is null
  and completed_at is null
  and removed_reason is null
  and removed_by is null
  and removed_at is null
);

create policy jobs_update_own on job_requests for update
using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- The accepted provider can mark a closed job completed. The trigger limits
-- this policy to the completed_at column so it cannot be used to edit the job.
create policy jobs_update_accepted_provider on job_requests for update
using (
  exists (
    select 1
    from provider_offers
    where provider_offers.job_id = job_requests.id
      and provider_offers.provider_id = auth.uid()
      and provider_offers.status = 'accepted'
  )
)
with check (
  exists (
    select 1
    from provider_offers
    where provider_offers.job_id = job_requests.id
      and provider_offers.provider_id = auth.uid()
      and provider_offers.status = 'accepted'
  )
);

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

create policy notifications_select_own on notifications for select
using (user_id = auth.uid() or is_admin());

create policy notifications_update_own on notifications for update
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_preferences_select_own on notification_preferences for select
using (user_id = auth.uid() or is_admin());

create policy notification_preferences_insert_own on notification_preferences for insert
with check (user_id = auth.uid());

create policy notification_preferences_update_own on notification_preferences for update
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_deliveries_select_admin on notification_deliveries for select
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

drop policy if exists provider_photos_public_read on storage.objects;
drop policy if exists provider_photos_owner_write on storage.objects;
drop policy if exists provider_photos_admin_delete on storage.objects;
drop policy if exists job_photos_permitted_read on storage.objects;
drop policy if exists job_photos_owner_insert on storage.objects;
drop policy if exists job_photos_owner_delete on storage.objects;

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

commit;
