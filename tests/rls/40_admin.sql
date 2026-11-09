-- Admin-only capabilities: removal, suspension, audit fields and ordering.

-- An admin can suspend a provider, and the suspension is recorded.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

update public.provider_profiles
set status = 'suspended',
    suspended_by = 'aaaaaaaa-0000-4000-8000-000000000005',
    suspended_at = now()
where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_status text;
  v_by uuid;
begin
  select status::text, suspended_by into v_status, v_by
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

  if v_status <> 'suspended' then
    raise exception 'FAIL: an admin could not suspend a provider';
  end if;

  if v_by is distinct from 'aaaaaaaa-0000-4000-8000-000000000005' then
    raise exception 'FAIL: the suspension did not record who did it';
  end if;
end;
$$;

-- A suspended provider is not visible to the public.
set local role anon;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

  if v_count <> 0 then
    raise exception 'FAIL: a suspended provider is still publicly visible';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- A provider cannot suspend somebody else. Row level security filters the
-- row out, so the update silently affects nothing.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000003';

update public.provider_profiles
set status = 'suspended',
    suspended_by = 'aaaaaaaa-0000-4000-8000-000000000003'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_by uuid;
begin
  select suspended_by into v_by
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

  if v_by is distinct from 'aaaaaaaa-0000-4000-8000-000000000005' then
    raise exception 'FAIL: a provider suspended another provider';
  end if;
end;
$$;

-- A provider cannot delete their own approved profile.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

delete from public.provider_profiles
where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

  if v_count <> 1 then
    raise exception 'FAIL: a provider deleted their own approved profile';
  end if;
end;
$$;

-- Only an admin can remove a provider profile.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

delete from public.provider_profiles
where user_id = 'aaaaaaaa-0000-4000-8000-000000000003';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000003';

  if v_count <> 0 then
    raise exception 'FAIL: an admin could not remove a provider profile';
  end if;
end;
$$;

-- Removing a provider takes their services with it.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.provider_services
  where provider_id = 'aaaaaaaa-0000-4000-8000-000000000003';

  if v_count <> 0 then
    raise exception 'FAIL: removing a provider left their services behind';
  end if;
end;
$$;

-- The customer posts a job that the admin then moderates.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

insert into public.job_requests (
  id, customer_id, category_id, title, description, postcode, postcode_district, timeframe
)
values (
  'bbbbbbbb-0000-4000-8000-000000000002',
  'aaaaaaaa-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Job to be moderated',
  'This job should be removed by an administrator.',
  'G12 7AA',
  'G12',
  'this_week'
);

reset role;
reset request.jwt.claim.sub;

-- An admin records who removed a job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

update public.job_requests
set status = 'removed',
    removed_reason = 'Not a real job.',
    removed_by = 'aaaaaaaa-0000-4000-8000-000000000005',
    removed_at = now()
where id = 'bbbbbbbb-0000-4000-8000-000000000002';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_by uuid;
  v_at timestamptz;
begin
  select removed_by, removed_at into v_by, v_at
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000002';

  if v_by is distinct from 'aaaaaaaa-0000-4000-8000-000000000005' then
    raise exception 'FAIL: removing a job did not record who did it';
  end if;

  if v_at is null then
    raise exception 'FAIL: removing a job did not record when';
  end if;
end;
$$;

-- A removed job disappears from the matching jobs a provider can see.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000002';

  if v_count <> 0 then
    raise exception 'FAIL: a removed job is still visible to a provider';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An admin records who suspended a user account.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

update public.profiles
set is_suspended = true,
    suspended_by = 'aaaaaaaa-0000-4000-8000-000000000005',
    suspended_at = now()
where id = 'aaaaaaaa-0000-4000-8000-000000000006';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_by uuid;
begin
  select suspended_by into v_by
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000006';

  if v_by is distinct from 'aaaaaaaa-0000-4000-8000-000000000005' then
    raise exception 'FAIL: suspending an account did not record who did it';
  end if;
end;
$$;

-- Category ordering can only be changed by an admin.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000003';

do $$
begin
  begin
    perform public.swap_category_order(
      '11111111-1111-4111-8111-111111111111',
      'down'
    );

    raise exception 'FAIL: a non-admin reordered the categories';
  exception
    when others then
      if sqlerrm not like 'Only an administrator can reorder categories.%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An admin can move a category down, and the order actually changes.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

do $$
declare
  v_before int;
  v_after int;
begin
  select sort_order into v_before
  from public.service_categories
  where id = '11111111-1111-4111-8111-111111111111';

  perform public.swap_category_order(
    '11111111-1111-4111-8111-111111111111',
    'down'
  );

  select sort_order into v_after
  from public.service_categories
  where id = '11111111-1111-4111-8111-111111111111';

  if v_after = v_before then
    raise exception 'FAIL: moving a category down did not change its order';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- Analytics events can be recorded by anyone, but only admins can read them.
set local role anon;

insert into public.analytics_events (event, path, props)
values ('page_view', '/', '{}'::jsonb);

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.analytics_events;
  if v_count <> 1 then
    raise exception 'FAIL: an anonymous page view was not recorded';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.analytics_events;
  if v_count <> 0 then
    raise exception 'FAIL: a customer can read analytics events';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.analytics_events;
  if v_count <> 1 then
    raise exception 'FAIL: an admin cannot read analytics events';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An unknown event name is rejected.
set local role anon;

do $$
begin
  begin
    insert into public.analytics_events (event, path)
    values ('not_a_real_event', '/');

    raise exception 'FAIL: an unknown analytics event was accepted';
  exception
    when others then
      if sqlerrm not like 'new row violates row-level security policy for table "analytics_events"%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;
