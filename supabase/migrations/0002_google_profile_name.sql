-- Google sign-in supplies the person's name in raw_user_meta_data. Keep that
-- name in the profile and stop dashboard users from editing it. Other profile
-- fields, such as phone, stay editable.

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
      nullif(new.raw_user_meta_data ->> 'name', ''),
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

  if new.full_name is distinct from old.full_name then
    raise exception 'Name is set by your sign-in provider. Ask an administrator to change it.';
  end if;

  return new;
end;
$$;

-- Accounts created before this migration fell back to the email prefix. Fill
-- those profiles from Google's metadata, without overwriting a name that was
-- deliberately set another way.
update public.profiles p
set full_name = g.full_name
from (
  select
    u.id,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', '')
    ) as full_name,
    split_part(coalesce(u.email, ''), '@', 1) as email_name
  from auth.users u
) g
where p.id = g.id
  and g.full_name is not null
  and p.full_name = g.email_name;
