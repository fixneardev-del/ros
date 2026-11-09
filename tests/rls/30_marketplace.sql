-- Jobs, offers, acceptance and contact release.
--
-- Fixed ids are used throughout so every block can reference the same job and
-- offer without relying on psql variables, which do not expand inside
-- dollar-quoted blocks.

-- The customer posts a job in an enabled pilot district.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

insert into public.job_requests (
  id, customer_id, category_id, title, description, postcode, postcode_district, timeframe
)
values (
  'bbbbbbbb-0000-4000-8000-000000000001',
  'aaaaaaaa-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  'Repair a wobbly chair',
  'The legs on a wooden dining chair have come loose and need tightening.',
  'G12 7AA',
  'G12',
  'this_week'
);

reset role;
reset request.jwt.claim.sub;

-- The matching approved provider can see the job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_count <> 1 then
    raise exception 'FAIL: a matching approved provider cannot see the job';
  end if;
end;
$$;

-- A provider in another district cannot see the job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000003';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_count <> 0 then
    raise exception 'FAIL: a provider outside the district can see the job';
  end if;
end;
$$;

-- Another customer cannot see the job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000006';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_count <> 0 then
    raise exception 'FAIL: another customer can see the job';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- The matching provider sends an offer.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

insert into public.provider_offers (
  id, job_id, provider_id, message, indicative_price_pence, estimated_timeframe
)
values (
  'cccccccc-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000001',
  'aaaaaaaa-0000-4000-8000-000000000002',
  'I can tighten the legs and check the joints this week.',
  4500,
  'This week'
);

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.provider_offers;
  if v_count <> 1 then
    raise exception 'FAIL: the provider could not send an offer';
  end if;
end;
$$;

-- A second approved provider covers the same job and sends a competing offer.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000007';

insert into public.provider_offers (
  id, job_id, provider_id, message, indicative_price_pence, estimated_timeframe
)
values (
  'cccccccc-0000-4000-8000-000000000002',
  'bbbbbbbb-0000-4000-8000-000000000001',
  'aaaaaaaa-0000-4000-8000-000000000007',
  'I can re-glue the joints and do it on Saturday if that suits.',
  4000,
  'This week'
);

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.provider_offers;
  if v_count <> 2 then
    raise exception 'FAIL: the second matching provider could not send an offer';
  end if;
end;
$$;

-- A provider who does not cover the job cannot send an offer.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000003';

do $$
begin
  begin
    insert into public.provider_offers (
      id, job_id, provider_id, message, indicative_price_pence, estimated_timeframe
    )
    values (
      'cccccccc-0000-4000-8000-000000000002',
      'bbbbbbbb-0000-4000-8000-000000000001',
      'aaaaaaaa-0000-4000-8000-000000000003',
      'I can help with this job even though it is outside my usual areas.',
      4000,
      'This week'
    );

    raise exception 'FAIL: a provider offered on a job outside their coverage';
  exception
    when others then
      if sqlerrm not like 'new row violates row-level security policy for table "provider_offers"%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- The provider can read their own offer but not the competing one.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.provider_offers;
  if v_count <> 1 then
    raise exception 'FAIL: the provider cannot read their own offer';
  end if;
end;
$$;

-- The customer reads both offers on their own job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.provider_offers;
  if v_count <> 2 then
    raise exception 'FAIL: the customer cannot read offers on their own job';
  end if;
end;
$$;

-- The customer cannot set accepted_offer_id directly.
do $$
begin
  begin
    update public.job_requests
    set accepted_offer_id = 'cccccccc-0000-4000-8000-000000000001'
    where id = 'bbbbbbbb-0000-4000-8000-000000000001';

    raise exception 'FAIL: a customer set the accepted offer directly';
  exception
    when others then
      if sqlerrm not like 'Only an administrator can change moderation fields.%' then
        raise;
      end if;
  end;
end;
$$;

-- Accepting the offer closes the job and declines the others.
select public.accept_offer('cccccccc-0000-4000-8000-000000000001');

-- The trigger bypass used by accept_offer must not survive it. The customer
-- still cannot repoint the job at the offer they did not accept.
do $$
begin
  begin
    update public.job_requests
    set accepted_offer_id = 'cccccccc-0000-4000-8000-000000000002'
    where id = 'bbbbbbbb-0000-4000-8000-000000000001';

    raise exception 'FAIL: the accept bypass leaked into later writes';
  exception
    when others then
      if sqlerrm not like 'Only an administrator can change moderation fields.%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

do $$
declare
  v_job_status text;
  v_offer_status text;
  v_accepted uuid;
begin
  select status::text, accepted_offer_id into v_job_status, v_accepted
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_job_status <> 'closed' then
    raise exception 'FAIL: the job did not close after accepting an offer';
  end if;

  if v_accepted is distinct from 'cccccccc-0000-4000-8000-000000000001'::uuid then
    raise exception 'FAIL: the accepted offer was not recorded on the job';
  end if;

  select status::text into v_offer_status
  from public.provider_offers
  where id = 'cccccccc-0000-4000-8000-000000000001';

  if v_offer_status <> 'accepted' then
    raise exception 'FAIL: the accepted offer is not marked accepted';
  end if;

  select status::text into v_offer_status
  from public.provider_offers
  where id = 'cccccccc-0000-4000-8000-000000000002';

  if v_offer_status <> 'declined' then
    raise exception 'FAIL: the losing offer was not declined';
  end if;
end;
$$;

-- Contact details are released to the customer and the accepted provider.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_parties text[];
begin
  select array_agg(party order by party) into v_parties
  from public.get_contact_for_accepted_offer('cccccccc-0000-4000-8000-000000000001');

  if array_length(v_parties, 1) <> 2 then
    raise exception 'FAIL: the customer did not receive both contact parties';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

do $$
declare
  v_parties text[];
begin
  select array_agg(party order by party) into v_parties
  from public.get_contact_for_accepted_offer('cccccccc-0000-4000-8000-000000000001');

  if array_length(v_parties, 1) <> 2 then
    raise exception 'FAIL: the accepted provider did not receive both contact parties';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- The provider whose offer was declined gets no contact details.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000007';

do $$
declare
  v_parties text[];
begin
  select array_agg(party) into v_parties
  from public.get_contact_for_accepted_offer('cccccccc-0000-4000-8000-000000000001');

  if v_parties is not null then
    raise exception 'FAIL: contact details leaked to a provider without an accepted offer';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- A provider with no offer at all gets no contact details either.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000003';

do $$
declare
  v_parties text[];
begin
  select array_agg(party) into v_parties
  from public.get_contact_for_accepted_offer('cccccccc-0000-4000-8000-000000000001');

  if v_parties is not null then
    raise exception 'FAIL: contact details leaked to a provider without an accepted offer';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- An anonymous visitor cannot even call the contact function.
set local role anon;

do $$
begin
  begin
    perform * from public.get_contact_for_accepted_offer(
      'cccccccc-0000-4000-8000-000000000001'
    );

    raise exception 'FAIL: an anonymous visitor could read contact details';
  exception
    when others then
      if sqlerrm not like 'permission denied for function get_contact_for_accepted_offer%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- The accepted provider can still see the closed job.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.job_requests
  where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  if v_count <> 1 then
    raise exception 'FAIL: the accepted provider cannot see the closed job';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;
