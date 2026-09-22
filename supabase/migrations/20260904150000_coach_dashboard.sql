-- ==============================================================================
-- DFSE Coach Dashboard (edzői felület) – feature tables & extensions
-- A dance-fitness-se alkalmazás edzői funkcióinak adatmodellje,
-- a members/groups modellhez igazítva.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Meglévő táblák bővítése
-- ------------------------------------------------------------------------------

-- Tagok: sportorvosi és versenyengedély lejárat (figyelmeztetésekhez)
alter table public.members add column if not exists license_expiry date;
alter table public.members add column if not exists medical_expiry date;

-- Versenyek: típus, nyilvánosság, indulás, szállás
alter table public.competitions add column if not exists type text;
alter table public.competitions add column if not exists is_public boolean not null default true;
alter table public.competitions add column if not exists departure_location text;
alter table public.competitions add column if not exists departure_time text;
alter table public.competitions add column if not exists accommodation_address text;
alter table public.competitions add column if not exists accommodation_price integer;
alter table public.competitions add column if not exists accommodation_note text;
alter table public.competitions add column if not exists check_in_time text;
alter table public.competitions add column if not exists check_out_time text;

-- Koreográfiák: típus, jelmez, zene, megjegyzés, célcsoport
alter table public.choreographies add column if not exists type text not null default 'Csoportos';
alter table public.choreographies add column if not exists costume text;
alter table public.choreographies add column if not exists music_url text;
alter table public.choreographies add column if not exists note text;
alter table public.choreographies add column if not exists target_group text;

-- Hírek: galéria és kiemelés
alter table public.news_posts add column if not exists gallery_urls jsonb not null default '[]'::jsonb;
alter table public.news_posts add column if not exists is_prior boolean not null default false;

-- ------------------------------------------------------------------------------
-- 2. Beosztás / órarend (heti ismétlődő és egyszeri órák)
-- ------------------------------------------------------------------------------
create table if not exists public.training_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_id uuid references public.groups (id) on delete set null,
  class_type text not null default 'weekly' check (class_type in ('weekly', 'single')),
  day_of_week smallint check (day_of_week between 0 and 6), -- 0 = hétfő ... 6 = vasárnap
  specific_date date,
  start_time time not null,
  end_time time not null,
  location text,
  coach_name text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (class_type = 'weekly' and day_of_week is not null)
    or (class_type = 'single' and specific_date is not null)
  )
);

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.training_classes (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, member_id)
);

-- Alkalmankénti felülírások / státusz (meghirdetett óra egy konkrét dátumon)
create table if not exists public.session_status (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.training_classes (id) on delete cascade,
  session_date date not null,
  status text not null default 'held' check (status in ('held', 'cancelled')),
  note text,
  override_start_time time,
  override_end_time time,
  override_coach text,
  override_location text,
  created_at timestamptz not null default now(),
  unique (class_id, session_date)
);

-- Jelenléti ív alkalmanként (vendég esetén member_id null + guest_name)
create table if not exists public.class_attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.training_classes (id) on delete cascade,
  member_id uuid references public.members (id) on delete cascade,
  session_date date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'excused')),
  guest_name text,
  created_at timestamptz not null default now(),
  unique (class_id, member_id, session_date)
);

-- ------------------------------------------------------------------------------
-- 3. Befizetések (tetszőleges megnevezésű kiírások tagonként)
-- ------------------------------------------------------------------------------
create table if not exists public.member_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  title text not null,
  amount integer not null default 0 check (amount >= 0),
  due_date date not null default current_date,
  is_paid boolean not null default false,
  paid_at date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. Versenyek: nevezések, fizetések, utazás
-- ------------------------------------------------------------------------------
create table if not exists public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  choreography_id uuid references public.choreographies (id) on delete set null,
  temp_name text,
  temp_type text,
  temp_category text,
  temp_music_url text,
  temp_costume text,
  temp_dancers jsonb not null default '[]'::jsonb,
  temp_elements jsonb not null default '[]'::jsonb,
  entry_fee integer not null default 0,
  entry_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.competition_payments (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  entry_fee_amount integer not null default 0,
  entry_fee_paid boolean not null default false,
  entry_fee_note text,
  travel_fee_amount integer not null default 0,
  travel_fee_paid boolean not null default false,
  travel_fee_note text,
  created_at timestamptz not null default now(),
  unique (competition_id, member_id)
);

create table if not exists public.travel_vehicles (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  type text not null default 'Autó',
  driver_name text,
  capacity integer not null default 4 check (capacity > 0),
  note text,
  passengers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 5. Koreográfiák: táncosok és elemkönyv (ad-hoc elemek pontértékkel)
-- ------------------------------------------------------------------------------
create table if not exists public.choreography_dancers (
  id uuid primary key default gen_random_uuid(),
  choreography_id uuid not null references public.choreographies (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (choreography_id, member_id)
);

create table if not exists public.choreography_parts (
  id uuid primary key default gen_random_uuid(),
  choreography_id uuid not null references public.choreographies (id) on delete cascade,
  name text not null,
  points numeric(4, 2) not null default 0.2 check (points >= 0.2 and points <= 1.0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 6. Indexek
-- ------------------------------------------------------------------------------
create index if not exists idx_class_enrollments_class on public.class_enrollments (class_id);
create index if not exists idx_class_enrollments_member on public.class_enrollments (member_id);
create index if not exists idx_session_status_class_date on public.session_status (class_id, session_date);
create index if not exists idx_class_attendance_class_date on public.class_attendance (class_id, session_date);
create index if not exists idx_class_attendance_member on public.class_attendance (member_id);
create index if not exists idx_member_payments_member on public.member_payments (member_id);
create index if not exists idx_competition_entries_competition on public.competition_entries (competition_id);
create index if not exists idx_competition_entries_choreo on public.competition_entries (choreography_id);
create index if not exists idx_competition_payments_member on public.competition_payments (member_id);
create index if not exists idx_travel_vehicles_competition on public.travel_vehicles (competition_id);
create index if not exists idx_choreography_dancers_choreo on public.choreography_dancers (choreography_id);
create index if not exists idx_choreography_dancers_member on public.choreography_dancers (member_id);
create index if not exists idx_choreography_parts_choreo on public.choreography_parts (choreography_id);

-- ------------------------------------------------------------------------------
-- 7. Row Level Security
-- ------------------------------------------------------------------------------
alter table public.training_classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.session_status enable row level security;
alter table public.class_attendance enable row level security;
alter table public.member_payments enable row level security;
alter table public.competition_entries enable row level security;
alter table public.competition_payments enable row level security;
alter table public.travel_vehicles enable row level security;
alter table public.choreography_dancers enable row level security;
alter table public.choreography_parts enable row level security;

create policy "Authenticated users can manage training_classes" on public.training_classes
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage class_enrollments" on public.class_enrollments
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage session_status" on public.session_status
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage class_attendance" on public.class_attendance
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage member_payments" on public.member_payments
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage competition_entries" on public.competition_entries
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage competition_payments" on public.competition_payments
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage travel_vehicles" on public.travel_vehicles
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage choreography_dancers" on public.choreography_dancers
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage choreography_parts" on public.choreography_parts
  for all to authenticated using (true) with check (true);

-- Nyilvános versenyek és publikált hírek a weboldal számára is olvashatók
create policy "Public can read public competitions" on public.competitions
  for select to anon using (is_public = true and is_active = true);
create policy "Public can read published news" on public.news_posts
  for select to anon using (is_published = true and is_active = true);

-- ------------------------------------------------------------------------------
-- 8. Storage: hír képek bucket (publikus olvasás, hitelesített írás)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read news images" on storage.objects;
create policy "Public read news images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'news-images');

drop policy if exists "Authenticated upload news images" on storage.objects;
create policy "Authenticated upload news images" on storage.objects
  for insert to authenticated with check (bucket_id = 'news-images');

drop policy if exists "Authenticated update news images" on storage.objects;
create policy "Authenticated update news images" on storage.objects
  for update to authenticated using (bucket_id = 'news-images') with check (bucket_id = 'news-images');

drop policy if exists "Authenticated delete news images" on storage.objects;
create policy "Authenticated delete news images" on storage.objects
  for delete to authenticated using (bucket_id = 'news-images');
