-- Provider application and approval rules.

-- A provider can apply with a pending profile.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000004';

insert into public.provider_profiles (
  user_id, provider_type, display_name, bio, service_districts, status, declaration_accepted_at
)
values (
  'aaaaaaaa-0000-4000-8000-000000000004',
  'individual',
  'Pau Pending',
  'Waiting to be reviewed.',
  array['G12'],
  'pending',
  now()
);

-- A provider cannot apply on somebody else's behalf.
do $$
begin
  begin
    insert into public.provider_profiles (
      user_id, provider_type, display_name, bio, service_districts, status, declaration_accepted_at
    )
    values (
      'aaaaaaaa-0000-4000-8000-000000000001',
      'individual',
      'Impostor',
      'This insert should be blocked.',
      array['G12'],
      'pending',
      now()
    );

    raise exception 'FAIL: a provider applied for another user';
  exception
    when others then
      if sqlerrm not like 'new row violates row-level security policy for table "provider_profiles"%' then
        raise;
      end if;
  end;
end;
$$;

-- A provider cannot approve themselves.
do $$
begin
  begin
    update public.provider_profiles
    set status = 'approved'
    where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

    raise exception 'FAIL: a provider approved their own application';
  exception
    when others then
      if sqlerrm not like 'That provider status change is not allowed.%' then
        raise;
      end if;
  end;
end;
$$;

-- A provider cannot set the review fields.
do $$
begin
  begin
    update public.provider_profiles
    set reviewed_by = 'aaaaaaaa-0000-4000-8000-000000000005',
        reviewed_at = now()
    where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

    raise exception 'FAIL: a provider set the review fields';
  exception
    when others then
      if sqlerrm not like 'Only an administrator can review a provider.%' then
        raise;
      end if;
  end;
end;
$$;

-- A provider can read their own pending profile.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

  if v_count <> 1 then
    raise exception 'FAIL: a provider could not read their own profile';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An anonymous visitor sees approved providers but not pending ones.
set local role anon;

do $$
declare
  v_approved int;
  v_pending int;
begin
  select count(*) into v_approved
  from public.provider_profiles
  where status = 'approved';

  select count(*) into v_pending
  from public.provider_profiles
  where status = 'pending';

  if v_approved = 0 then
    raise exception 'FAIL: approved providers are not public';
  end if;

  if v_pending <> 0 then
    raise exception 'FAIL: pending providers are visible to the public';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- A provider can withdraw their own pending application.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000004';

delete from public.provider_profiles
where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

  if v_count <> 0 then
    raise exception 'FAIL: a provider could not withdraw their pending application';
  end if;
end;
$$;

-- The provider applies again, then an admin approves it.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000004';

insert into public.provider_profiles (
  user_id, provider_type, display_name, bio, service_districts, status, declaration_accepted_at
)
values (
  'aaaaaaaa-0000-4000-8000-000000000004',
  'individual',
  'Pau Pending',
  'Applied again after a change.',
  array['G12'],
  'pending',
  now()
);

reset role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

update public.provider_profiles
set status = 'approved',
    reviewed_by = 'aaaaaaaa-0000-4000-8000-000000000005',
    reviewed_at = now()
where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_status text;
begin
  select status::text into v_status
  from public.provider_profiles
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000004';

  if v_status <> 'approved' then
    raise exception 'FAIL: the admin could not approve an application';
  end if;
end;
$$;
