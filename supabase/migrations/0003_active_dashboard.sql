-- An approved provider may also use the customer dashboard. The saved choice
-- decides which dashboard opens after sign-in and which role checks apply.
-- Admins keep the admin dashboard regardless of this value.

-- Only approved providers use this value. Defaulting to 'provider' means an
-- approval opens their own dashboard; an explicit switch to customer is saved
-- as 'customer'. Accounts without an approved profile ignore the column.
alter table public.profiles
  add column if not exists active_dashboard text not null default 'provider';

do $$
begin
  alter table public.profiles
    drop constraint if exists profiles_active_dashboard_check;

  alter table public.profiles
    add constraint profiles_active_dashboard_check
      check (active_dashboard in ('customer', 'provider'));
end $$;

-- Accounts that already had an approved provider profile keep their previous
-- landing page. Pending, rejected and suspended applicants stay customers.
update public.profiles p
set active_dashboard = 'provider',
    updated_at = now()
from public.provider_profiles pp
where pp.user_id = p.id
  and pp.status = 'approved';
