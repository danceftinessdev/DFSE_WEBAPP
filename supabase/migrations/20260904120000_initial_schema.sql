-- Kezdeti DFSE adatbázis séma: tagok, csoportok, jelentkezések, jelenlét.
-- Futtatás: `supabase db push` (linkelt projekt esetén) vagy a Supabase Dashboard SQL Editorában.

create extension if not exists pgcrypto;

-- Profiles: egy sor minden bejelentkezett admin/oktató felhasználóhoz (auth.users kiegészítése)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'instructor')),
  created_at timestamptz not null default now()
);

-- Groups: tánc/aerobik csoportok (pl. "Zumba - Kezdő csoport")
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style text not null,
  level text,
  weekly_fee numeric(10, 2),
  created_at timestamptz not null default now()
);

-- Members: egyesületi tagok
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date,
  guardian_name text,
  guardian_phone text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- Enrollments: tag <-> csoport kapcsolat és tagdíj állapot
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'pending', 'cancelled')),
  fee_paid boolean not null default false,
  joined_at date not null default current_date,
  unique (member_id, group_id)
);

-- Attendance: jelenléti ív foglalkozásonként
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  session_date date not null,
  present boolean not null default true,
  created_at timestamptz not null default now(),
  unique (enrollment_id, session_date)
);

-- Row Level Security: jelenleg nincs nyilvános tagi portál, csak bejelentkezett
-- admin/oktató felhasználók férhetnek hozzá az egyesületi adatokhoz.
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;

create policy "Authenticated users can read profiles" on public.profiles
  for select to authenticated using (true);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (id = auth.uid());

create policy "Authenticated users can manage groups" on public.groups
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage members" on public.members
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage enrollments" on public.enrollments
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage attendance" on public.attendance
  for all to authenticated using (true) with check (true);

-- Automatikusan létrehoz egy profiles sort minden új regisztráció után.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    trim(
      coalesce(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
      coalesce(new.raw_user_meta_data ->> 'last_name', '')
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
