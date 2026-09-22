-- A saját sportolói nézethez egyértelmű kapcsolat kell az auth profil és a tag között.
alter table public.members
  add column if not exists profile_id uuid references public.profiles (id) on delete set null;

create unique index if not exists members_profile_id_unique
  on public.members (profile_id)
  where profile_id is not null;

-- A korábban létrehozott rekordokat csak egyértelmű e-mail egyezés esetén kapcsoljuk.
update public.members m
set profile_id = p.id
from public.profiles p
where m.profile_id is null
  and m.email is not null
  and lower(trim(m.email)) = lower(trim(p.email))
  and not exists (
    select 1
    from public.members other
    where other.profile_id = p.id
  )
  and 1 = (
    select count(*)
    from public.members candidate
    where candidate.profile_id is null
      and candidate.email is not null
      and lower(trim(candidate.email)) = lower(trim(p.email))
  );