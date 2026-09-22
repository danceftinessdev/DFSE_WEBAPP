-- ==============================================================================
-- Auth trigger javítása: a régi `handle_new_user()` a távoli `profiles` tábla
-- kért oszlopait (`full_name`, `role`) próbálta írni, amelyek nem léteznek a
-- remote sémában (ott `first_name`/`last_name`/`display_name` vannak). Ez okozta
-- a "Database error creating new user" hibát a Dashboard "Add user" funkciójánál.
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), ''),
    nullif(trim(
      coalesce(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
      coalesce(new.raw_user_meta_data ->> 'last_name', '')
    ), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;
