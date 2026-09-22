-- ==============================================================================
-- Auth trigger javítása (2. kör): a `display_name` a remote `profiles` táblában
-- GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED oszlop, tehát nem
-- írható explicit INSERT-tel. Az előző javítás (20260907100000) ebbe még
-- beleírt, ami a "cannot insert a non-DEFAULT value into column display_name"
-- (SQLSTATE 428C9) hibát okozta minden új felhasználó létrehozásakor.
--
-- Emellett a remote adatbázison két, egymással azonos triggert találtunk az
-- auth.users táblán ("on_auth_user_created" és a korábbi projektből maradt
-- "trg_handle_new_user"), amelyek ugyanazt a függvényt hívták kétszer minden
-- regisztrációkor. Ez nem okozott hibát (a második futás csak UPDATE-elt),
-- de felesleges — a duplikátumot eltávolítjuk.
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

-- A projektben korábbról megmaradt duplikált trigger eltávolítása, csak az
-- ebben a migráció-sorozatban karbantartott "on_auth_user_created" marad.
drop trigger if exists trg_handle_new_user on auth.users;
