-- Identity and reference data rules.

-- A new auth user gets a customer profile.
do $$
declare
  v_name text;
begin
  select full_name into v_name
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  if v_name is distinct from 'Nina Customer' then
    raise exception 'FAIL: expected a profile for the new user, got %', coalesce(v_name, 'none');
  end if;
end;
$$;

-- Google sends `name` on some accounts; that name is stored on the profile.
do $$
declare
  v_name text;
begin
  select full_name into v_name
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000008';

  if v_name is distinct from 'Gina Google' then
    raise exception 'FAIL: expected the Google name on the profile, got %', coalesce(v_name, 'none');
  end if;
end;
$$;

-- A customer reads their own profile.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  if v_count <> 1 then
    raise exception 'FAIL: a customer could not read their own profile';
  end if;
end;
$$;

-- A customer cannot read somebody else's profile.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000005';

  if v_count <> 0 then
    raise exception 'FAIL: a customer read another user profile';
  end if;
end;
$$;

-- A customer cannot rename themselves, but can update contact details.
do $$
begin
  begin
    update public.profiles
    set full_name = 'Renamed By Customer'
    where id = 'aaaaaaaa-0000-4000-8000-000000000001';

    raise exception 'FAIL: a customer changed their own name';
  exception
    when others then
      if sqlerrm not like 'Name is set by your sign-in provider%' then
        raise;
      end if;
  end;
end;
$$;

update public.profiles
set phone = '07700 900123'
where id = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_phone text;
begin
  select phone into v_phone
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  if v_phone is distinct from '07700 900123' then
    raise exception 'FAIL: a customer could not update their phone number';
  end if;
end;
$$;

-- A customer cannot promote themselves to admin.
do $$
begin
  begin
    update public.profiles
    set role = 'admin'
    where id = 'aaaaaaaa-0000-4000-8000-000000000001';

    raise exception 'FAIL: a customer changed their own role';
  exception
    when others then
      if sqlerrm not like 'Only an administrator can change roles or suspension.%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An admin can suspend an account.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

update public.profiles
set is_suspended = true
where id = 'aaaaaaaa-0000-4000-8000-000000000001';

-- An administrator can still correct a name.
update public.profiles
set full_name = 'Renamed By Admin'
where id = 'aaaaaaaa-0000-4000-8000-000000000004';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_suspended boolean;
  v_name text;
begin
  select is_suspended into v_suspended
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  if v_suspended is not true then
    raise exception 'FAIL: an admin could not suspend an account';
  end if;

  select full_name into v_name
  from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000004';

  if v_name is distinct from 'Renamed By Admin' then
    raise exception 'FAIL: an admin could not correct a name';
  end if;
end;
$$;

-- A suspended customer cannot post a job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
begin
  begin
    insert into public.job_requests (
      customer_id, category_id, title, description, postcode, postcode_district, timeframe
    )
    values (
      'aaaaaaaa-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      'Suspended customer job',
      'This insert should be blocked by the suspension rule.',
      'G12 7AA',
      'G12',
      'this_week'
    );

    raise exception 'FAIL: a suspended customer posted a job';
  exception
    when others then
      if sqlerrm not like 'new row violates row-level security policy for table "job_requests"%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- Undo the suspension so later tests can post jobs.
update public.profiles
set is_suspended = false
where id = 'aaaaaaaa-0000-4000-8000-000000000001';

-- Reference data is readable by everyone.
set local role anon;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.service_categories where is_active;
  if v_count = 0 then
    raise exception 'FAIL: no active categories are readable';
  end if;

  select count(*) into v_count from public.locations where is_enabled;
  if v_count = 0 then
    raise exception 'FAIL: no enabled pilot districts are readable';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;
