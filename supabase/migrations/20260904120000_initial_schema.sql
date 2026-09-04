-- ==============================================================================
-- DFSE (Dance Fitness Sportegyesület - Jászberény)
-- Initial Database Schema & Migrations
-- ==============================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Profiles (auth.users kiegészítése az adminok és oktatók számára)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'admin' check (role in ('admin', 'instructor', 'member')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. Groups (tánc és aerobik foglalkozási csoportok)
-- ------------------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style text not null,
  level text default 'Kezdő',
  age_group text default 'Vegyes',
  monthly_fee integer not null default 12000,
  schedule_description text,
  max_capacity integer default 25,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. Members (egyesületi tagok / sportolók)
-- ------------------------------------------------------------------------------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date,
  gender text,
  guardian_name text,
  guardian_phone text,
  email text,
  phone text,
  city text not null default 'Jászberény',
  address text,
  status text not null default 'active' check (status in ('active', 'pending', 'inactive')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. Enrollments (tagok beiratkozása a csoportokba)
-- ------------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'pending', 'cancelled')),
  fee_status text not null default 'paid' check (fee_status in ('paid', 'pending', 'overdue')),
  joined_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (member_id, group_id)
);

-- ------------------------------------------------------------------------------
-- 5. Attendance (jelenléti ív / KRÉTA-szerű órai napló)
-- ------------------------------------------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  session_date date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'excused', 'late')),
  notes text,
  created_at timestamptz not null default now(),
  unique (group_id, member_id, session_date)
);

-- ------------------------------------------------------------------------------
-- 6. Events (Órarend / Naptári események a FullCalendar felülethez)
-- ------------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  group_id uuid references public.groups (id) on delete set null,
  location text default 'DFSE Terem - Jászberény',
  event_type text not null default 'Primary' check (event_type in ('Primary', 'Success', 'Warning', 'Danger')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 7. Fee payments (Tagdíj és befizetés nyilvántartás)
-- ------------------------------------------------------------------------------
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  group_id uuid references public.groups (id) on delete set null,
  amount integer not null,
  period text not null, -- pl. '2026-09'
  status text not null default 'paid' check (status in ('paid', 'pending', 'overdue')),
  payment_date date default current_date,
  payment_method text not null default 'transfer' check (payment_method in ('transfer', 'cash', 'card')),
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.events enable row level security;
alter table public.fee_payments enable row level security;

-- Profiles: bejelentkezett felhasználók látják az összes profilt, szerkeszteni a sajátjukat tudják
create policy "Authenticated users can read profiles" on public.profiles
  for select to authenticated using (true);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (id = auth.uid());

-- Csoportok: a nyilvános weboldal is olvashatja (anon), módosítani csak bejelentkezett admin
create policy "Allow public read on groups" on public.groups
  for select to anon, authenticated using (is_active = true);
create policy "Authenticated users can manage groups" on public.groups
  for all to authenticated using (true) with check (true);

-- Események / Órarend: nyilvánosan olvasható, csak admin szerkesztheti
create policy "Allow public read on events" on public.events
  for select to anon, authenticated using (true);
create policy "Authenticated users can manage events" on public.events
  for all to authenticated using (true) with check (true);

-- Tagok, beiratkozások, jelenlét, tagdíjak: csak bejelentkezett felhasználók (admin)
create policy "Authenticated users can manage members" on public.members
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage enrollments" on public.enrollments
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage attendance" on public.attendance
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage fee_payments" on public.fee_payments
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------------------------
-- Auth trigger: új felhasználó regisztrációjakor profil létrehozása
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    trim(
      coalesce(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
      coalesce(new.raw_user_meta_data ->> 'last_name', '')
    ),
    new.email,
    'admin'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- Kezdeti mintaadatok (DFSE csoportok és tagok)
-- ------------------------------------------------------------------------------
insert into public.groups (id, name, style, level, age_group, monthly_fee, schedule_description)
values
  ('11111111-1111-1111-1111-111111111111', 'Zumba - Haladó', 'Zumba', 'Haladó', 'Felnőtt', 12000, 'Hétfő, Szerda 18:00 - 19:30'),
  ('22222222-2222-2222-2222-222222222222', 'Hip-Hop - Kezdő', 'Hip-Hop', 'Kezdő', 'Gyerek', 10000, 'Kedd, Csütörtök 16:30 - 18:00'),
  ('33333333-3333-3333-3333-333333333333', 'Balett - Versenyző', 'Balett', 'Versenyző', 'Ifjúsági', 15000, 'Hétfő, Péntek 15:00 - 17:00'),
  ('44444444-4444-4444-4444-444444444444', 'Aerobik - Felnőtt', 'Aerobik', 'Vegyes', 'Felnőtt', 9000, 'Kedd, Szombat 09:00 - 10:30'),
  ('55555555-5555-5555-5555-555555555555', 'Modern tánc - Ifjúsági', 'Modern tánc', 'Kezdő', 'Ifjúsági', 12000, 'Szerda, Péntek 17:00 - 18:30')
on conflict (id) do nothing;

insert into public.members (id, full_name, birth_date, city, status, phone, email)
values
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kiss Petra', '2010-04-12', 'Jászberény', 'active', '+36 30 111 2233', 'petra.kiss@example.com'),
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nagy Bence', '2012-08-23', 'Jászberény', 'pending', '+36 30 222 3344', 'bence.nagy@example.com'),
  ('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tóth Zsófia', '2008-11-05', 'Jászberény', 'active', '+36 30 333 4455', 'zsofi.toth@example.com'),
  ('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Szabó Levente', '2011-02-17', 'Jászapáti', 'inactive', '+36 30 444 5566', 'levente.szabo@example.com'),
  ('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Horváth Emma', '2013-06-30', 'Jászberény', 'active', '+36 30 555 6677', 'emma.horvath@example.com'),
  ('a6666666-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kovács Zsombor', '2014-09-14', 'Jászberény', 'active', '+36 30 666 7788', 'zsombor.kovacs@example.com'),
  ('a7777777-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Varga Luca', '2012-12-01', 'Budapest', 'pending', '+36 30 777 8899', 'luca.varga@example.com')
on conflict (id) do nothing;

insert into public.enrollments (member_id, group_id, status, fee_status)
values
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'active', 'paid'),
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'pending', 'pending'),
  ('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'active', 'paid'),
  ('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'cancelled', 'overdue'),
  ('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'active', 'paid'),
  ('a6666666-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'active', 'paid'),
  ('a7777777-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'pending', 'pending')
on conflict (member_id, group_id) do nothing;

insert into public.events (title, description, start_time, end_time, group_id, event_type)
values
  ('Zumba Edzés', 'Délutáni pörgős Zumba foglalkozás', now() + interval '1 day', now() + interval '1 day 1 hour 30 minutes', '11111111-1111-1111-1111-111111111111', 'Primary'),
  ('Hip-Hop Bajnokság Felkészülés', 'Versenycsapat próbája a teremben', now() + interval '2 days', now() + interval '2 days 2 hours', '22222222-2222-2222-2222-222222222222', 'Warning'),
  ('Balett Nyílt Nap', 'Szülői bemutató és nyílt óra', now() + interval '4 days', now() + interval '4 days 2 hours', '33333333-3333-3333-3333-333333333333', 'Success'),
  ('DFSE Évzáró Gála', 'Közös fellépés Jászberényben', now() + interval '14 days', now() + interval '14 days 4 hours', null, 'Danger')
on conflict do nothing;

