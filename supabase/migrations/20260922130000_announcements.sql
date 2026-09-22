-- Admin által megjeleníthető, címzettekhez kötött felugró üzenetek.
insert into public.permissions (code, description)
values ('announcements.manage', 'Felugró üzenetek létrehozása és kezelése')
on conflict (code) do update set description = excluded.description;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  display_mode text not null default 'login' check (display_mode in ('login', 'all_pages', 'selected_pages')),
  pages text[] not null default '{}',
  target_profile_ids uuid[],
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (display_mode <> 'selected_pages' or cardinality(pages) > 0)
);

create index if not exists idx_announcements_active on public.announcements (is_active, starts_at, ends_at);
alter table public.announcements enable row level security;

create policy "Recipients can read active announcements" on public.announcements
  for select to authenticated using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and (target_profile_ids is null or auth.uid() = any(target_profile_ids))
  );

create policy "Staff can manage announcements" on public.announcements
  for all to authenticated using (public.is_admin() or public.has_permission('announcements.manage'))
  with check (public.is_admin() or public.has_permission('announcements.manage'));