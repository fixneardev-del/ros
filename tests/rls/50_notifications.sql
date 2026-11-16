-- Notification centre, delivery outbox and job-completion rules.

-- Service-role fixtures for two notifications and one delivery row.
insert into public.notifications (id, user_id, type, title, body)
values
  (
    'eeeeeeee-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000001',
    'job.new',
    'A new job matches your services',
    'A customer near G12 needs help.'
  ),
  (
    'eeeeeeee-0000-4000-8000-000000000002',
    'aaaaaaaa-0000-4000-8000-000000000006',
    'job.new',
    'Another job matches your services',
    'This notification belongs to another customer.'
  );

insert into public.notification_deliveries (
  id, user_id, to_email, template, payload, status
)
values (
  'ffffffff-0000-4000-8000-000000000001',
  'aaaaaaaa-0000-4000-8000-000000000001',
  'rls-customer@example.test',
  'job.new',
  '{}'::jsonb,
  'failed'
);

-- A customer reads only their own notification.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.notifications
  where id = 'eeeeeeee-0000-4000-8000-000000000001';

  if v_count <> 1 then
    raise exception 'FAIL: a customer did not see exactly their own notification';
  end if;
end;
$$;

-- The customer can mark their notification read.
update public.notifications
set read_at = now()
where id = 'eeeeeeee-0000-4000-8000-000000000001'
  and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'::uuid;

-- The customer cannot rewrite notification content.
do $$
begin
  begin
    update public.notifications
    set title = 'Changed by the customer'
    where id = 'eeeeeeee-0000-4000-8000-000000000001'
      and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'::uuid;

    raise exception 'FAIL: a customer changed notification content';
  exception
    when others then
      if sqlerrm not like 'Only the read state can be changed.%' then
        raise;
      end if;
  end;
end;
$$;

-- The customer cannot read another customer's notification.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.notifications
  where id = 'eeeeeeee-0000-4000-8000-000000000002';

  if v_count <> 0 then
    raise exception 'FAIL: a customer read another customer notification';
  end if;
end;
$$;

-- The customer can update their own preferences.
update public.notification_preferences
set offer_updates = false
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'::uuid;

do $$
declare
  v_offer_updates boolean;
begin
  select offer_updates into v_offer_updates
  from public.notification_preferences
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'::uuid;

  if v_offer_updates is not false then
    raise exception 'FAIL: a customer could not update their own preferences';
  end if;
end;
$$;

-- The customer cannot read another customer's preferences.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.notification_preferences
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000006';

  if v_count <> 0 then
    raise exception 'FAIL: a customer read another customer preferences';
  end if;
end;
$$;

-- The delivery outbox is admin-only.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.notification_deliveries
  where id = 'ffffffff-0000-4000-8000-000000000001';

  if v_count <> 0 then
    raise exception 'FAIL: a customer read the email delivery outbox';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An admin can inspect the delivery outbox.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000005';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.notification_deliveries
  where id = 'ffffffff-0000-4000-8000-000000000001';

  if v_count <> 1 then
    raise exception 'FAIL: an admin could not inspect the delivery outbox';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- A customer cannot create a job with a forged accepted offer.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
begin
  begin
    insert into public.job_requests (
      id, customer_id, category_id, title, description, postcode,
      postcode_district, timeframe, status, accepted_offer_id, completed_at
    )
    values (
      'bbbbbbbb-0000-4000-8000-000000000003',
      'aaaaaaaa-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      'Forged completed job',
      'This insert must not be allowed.',
      'G12 7AA',
      'G12',
      'this_week',
      'closed',
      'cccccccc-0000-4000-8000-000000000001',
      now()
    );

    raise exception 'FAIL: a customer forged a completed job with an accepted offer';
  exception
    when others then
      if sqlerrm not like 'new row violates row-level security policy for table "job_requests"%' then
        raise;
      end if;
  end;
end;
$$;

-- The customer can cancel an open job and record the cancellation.
insert into public.job_requests (
  id, customer_id, category_id, title, description, postcode,
  postcode_district, timeframe
)
values (
  'bbbbbbbb-0000-4000-8000-000000000004',
  'aaaaaaaa-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Job to cancel',
  'The customer should be able to cancel this job.',
  'G12 7AA',
  'G12',
  'this_week'
);

update public.job_requests
set status = 'closed', cancelled_at = now()
where id = 'bbbbbbbb-0000-4000-8000-000000000004';

do $$
declare
  v_cancelled_at timestamptz;
begin
  select cancelled_at into v_cancelled_at
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000004';

  if v_cancelled_at is null then
    raise exception 'FAIL: the customer could not cancel an open job';
  end if;
end;
$$;

-- An unrelated provider cannot complete the accepted job.
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000007';

update public.job_requests
set completed_at = now()
where id = 'bbbbbbbb-0000-4000-8000-000000000001';

do $$
declare
  v_completed_at timestamptz;
begin
  select completed_at into v_completed_at
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_completed_at is not null then
    raise exception 'FAIL: an unrelated provider completed somebody else''s job';
  end if;
end;
$$;

-- The customer can complete the job once.
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

update public.job_requests
set completed_at = now()
where id = 'bbbbbbbb-0000-4000-8000-000000000001';

do $$
declare
  v_completed_at timestamptz;
begin
  select completed_at into v_completed_at
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_completed_at is null then
    raise exception 'FAIL: the customer could not complete their accepted job';
  end if;
end;
$$;

-- A second completion is rejected instead of sending a duplicate event.
do $$
begin
  begin
    update public.job_requests
    set completed_at = completed_at + interval '1 second'
    where id = 'bbbbbbbb-0000-4000-8000-000000000001';

    raise exception 'FAIL: a job was completed twice';
  exception
    when others then
      if sqlerrm not like 'That job update is not allowed.%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;
