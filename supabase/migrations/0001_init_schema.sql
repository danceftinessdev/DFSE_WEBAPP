-- =====================================================================
-- Dance Fitness SE - Teljes adatbázis séma (v1)
-- PostgreSQL / Supabase
-- =====================================================================
-- Konvenciók:
--   * Minden tábla PK: id UUID DEFAULT gen_random_uuid()
--   * Soft delete: is_active BOOLEAN DEFAULT true (törlés helyett)
--   * Idő oszlopok: created_at, updated_at (trigger frissíti)
--   * Minden módosítás naplózva az audit_logs táblába (trigger)
--   * RLS mindenhol bekapcsolva, policy-k a modul végén
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- kereséshez (hírek, versenyzők)

-- ---------------------------------------------------------------------
-- 0.1 KÖZÖS FUNKCIÓK
-- ---------------------------------------------------------------------

-- updated_at automatikus frissítése
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- 1. RBAC (ROLES & PERMISSIONS)
-- =====================================================================

create type public.app_role as enum ('user', 'parent', 'coach', 'admin');

-- Profiles: 1:1 kapcsolat az auth.users-szel
create table public.profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    first_name      text not null,
    last_name       text not null,
    display_name    text generated always as (first_name || ' ' || last_name) stored,
    email           text not null,
    phone           text,
    birth_date      date,
    avatar_url      text,
    is_active       boolean not null default true,
    gdpr_anonymized boolean not null default false, -- anonimizálás jelzése
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index idx_profiles_email on public.profiles (email);
create index idx_profiles_active on public.profiles (is_active);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Role-ok a felhasználókhoz (több szerepkör is lehet egy usernek)
create table public.user_roles (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    role        public.app_role not null,
    is_active   boolean not null default true,
    created_at  timestamptz not null default now(),
    unique (user_id, role)
);
create index idx_user_roles_user on public.user_roles (user_id);
create index idx_user_roles_role on public.user_roles (role);

-- Modulárisan adható/elvehető jogosultságok (pl. edző pénzügyi hozzáférés)
create table public.permissions (
    id           uuid primary key default gen_random_uuid(),
    code         text not null unique, -- pl. 'finance.view', 'wardrobe.manage'
    description  text,
    created_at   timestamptz not null default now()
);

create table public.user_permissions (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references public.profiles(id) on delete cascade,
    permission_id  uuid not null references public.permissions(id) on delete cascade,
    granted_by     uuid references public.profiles(id),
    granted_at     timestamptz not null default now(),
    unique (user_id, permission_id)
);
create index idx_user_permissions_user on public.user_permissions (user_id);

-- Szülő <-> diák reláció (több diák egy szülőhöz)
create table public.parent_child_links (
    id          uuid primary key default gen_random_uuid(),
    parent_id   uuid not null references public.profiles(id) on delete cascade,
    child_id    uuid not null references public.profiles(id) on delete cascade,
    relation    text default 'parent', -- pl. 'anya', 'apa', 'gondviselő'
    created_at  timestamptz not null default now(),
    unique (parent_id, child_id)
);
create index idx_pcl_parent on public.parent_child_links (parent_id);
create index idx_pcl_child on public.parent_child_links (child_id);

-- Segédfüggvény: van-e a hívó usernek adott role-ja
create or replace function public.has_role(_role public.app_role)
returns boolean as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = _role and ur.is_active = true
  );
$$ language sql security definer stable;

-- Segédfüggvény: van-e a hívó usernek adott permission code-ja
create or replace function public.has_permission(_code text)
returns boolean as $$
  select exists (
    select 1 from public.user_permissions up
    join public.permissions p on p.id = up.permission_id
    where up.user_id = auth.uid() and p.code = _code
  );
$$ language sql security definer stable;

-- Segédfüggvény: admin-e a hívó
create or replace function public.is_admin()
returns boolean as $$
  select public.has_role('admin');
$$ language sql security definer stable;

-- Automatikus profil + alap 'user' role létrehozása auth.users insert-re
-- (pl. Supabase Auth signUp hívás után). A first_name/last_name a signUp
-- 'options.data' mezőjéből érkezik.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Ismeretlen'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Felhasználó'),
    new.email
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- 2. AUDIT LOG
-- =====================================================================

create table public.audit_logs (
    id           bigint generated always as identity primary key,
    table_name   text not null,
    record_id    text not null,
    action       text not null check (action in ('INSERT','UPDATE','DELETE')),
    old_data     jsonb,
    new_data     jsonb,
    changed_by   uuid references public.profiles(id),
    changed_at   timestamptz not null default now()
);
create index idx_audit_logs_table_record on public.audit_logs (table_name, record_id);
create index idx_audit_logs_changed_by on public.audit_logs (changed_by);
create index idx_audit_logs_changed_at on public.audit_logs (changed_at desc);

-- Generikus audit trigger függvény
create or replace function public.audit_trigger_fn()
returns trigger as $$
declare
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    insert into public.audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, new.id::text, tg_op, null, v_new, auth.uid());
    return new;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    insert into public.audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, new.id::text, tg_op, v_old, v_new, auth.uid());
    return new;
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    insert into public.audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, old.id::text, tg_op, v_old, null, auth.uid());
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Helper: audit trigger felcsatolása egy táblára (később minden releváns táblánál meghívjuk)
-- create trigger trg_audit_<table> after insert or update or delete on public.<table>
-- for each row execute function public.audit_trigger_fn();

-- =====================================================================
-- 3. HÍREK MODUL
-- =====================================================================

create table public.news_posts (
    id            uuid primary key default gen_random_uuid(),
    title         text not null,
    slug          text not null unique,
    content       jsonb not null, -- TipTap rich text JSON
    excerpt       text,
    cover_image_url text,
    author_id     uuid references public.profiles(id),
    is_published  boolean not null default false,
    published_at  timestamptz,
    is_active     boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index idx_news_slug on public.news_posts (slug);
create index idx_news_published on public.news_posts (is_published, published_at desc);
create index idx_news_content_trgm on public.news_posts using gin (title gin_trgm_ops);

create trigger trg_news_updated_at
before update on public.news_posts
for each row execute function public.set_updated_at();

create trigger trg_audit_news_posts
after insert or update or delete on public.news_posts
for each row execute function public.audit_trigger_fn();

-- Hírekhez kapcsolt referenciák/források
create table public.news_references (
    id          uuid primary key default gen_random_uuid(),
    news_id     uuid not null references public.news_posts(id) on delete cascade,
    label       text not null,
    url         text
);
create index idx_news_references_news on public.news_references (news_id);

-- =====================================================================
-- 4. VERSENYZŐK BEMUTATÁSA (publikus)
-- =====================================================================

create table public.athletes_showcase (
    id            uuid primary key default gen_random_uuid(),
    profile_id    uuid references public.profiles(id),
    display_name  text not null,
    bio           text,
    photo_url     text,
    achievements  text,
    sort_order    int default 0,
    is_active     boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index idx_athletes_showcase_active on public.athletes_showcase (is_active, sort_order);

create trigger trg_athletes_showcase_updated_at
before update on public.athletes_showcase
for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. ÓRAREND & JELENLÉTI ÍV MODUL
-- =====================================================================

create table public.class_types (
    id           uuid primary key default gen_random_uuid(),
    name         text not null, -- pl. 'Kezdő Hip-Hop'
    description  text,
    color        text default '#6366f1',
    level        text, -- pl. 'kezdő', 'haladó', 'versenyző'
    is_active    boolean not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);
create index idx_class_types_active on public.class_types (is_active);

create trigger trg_class_types_updated_at
before update on public.class_types
for each row execute function public.set_updated_at();

create trigger trg_audit_class_types
after insert or update or delete on public.class_types
for each row execute function public.audit_trigger_fn();

create table public.scheduled_classes (
    id             uuid primary key default gen_random_uuid(),
    class_type_id  uuid not null references public.class_types(id),
    coach_id       uuid references public.profiles(id),
    location       text,
    starts_at      timestamptz not null,
    ends_at        timestamptz not null,
    capacity       int,
    status         text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
    is_active      boolean not null default true,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);
create index idx_scheduled_classes_type on public.scheduled_classes (class_type_id);
create index idx_scheduled_classes_coach on public.scheduled_classes (coach_id);
create index idx_scheduled_classes_starts_at on public.scheduled_classes (starts_at);
create index idx_scheduled_classes_status on public.scheduled_classes (status);

create trigger trg_scheduled_classes_updated_at
before update on public.scheduled_classes
for each row execute function public.set_updated_at();

create trigger trg_audit_scheduled_classes
after insert or update or delete on public.scheduled_classes
for each row execute function public.audit_trigger_fn();

create table public.attendance (
    id                   uuid primary key default gen_random_uuid(),
    scheduled_class_id   uuid not null references public.scheduled_classes(id) on delete cascade,
    student_id           uuid not null references public.profiles(id),
    status               text not null default 'present' check (status in ('present','absent','excused','late')),
    marked_by            uuid references public.profiles(id),
    marked_at            timestamptz not null default now(),
    note                 text,
    unique (scheduled_class_id, student_id)
);
create index idx_attendance_class on public.attendance (scheduled_class_id);
create index idx_attendance_student on public.attendance (student_id);
create index idx_attendance_status on public.attendance (status);

create trigger trg_audit_attendance
after insert or update or delete on public.attendance
for each row execute function public.audit_trigger_fn();

-- =====================================================================
-- 6. VERSENYKEZELŐ ÉS PÉNZÜGYI MODUL
-- =====================================================================

create table public.competitions (
    id             uuid primary key default gen_random_uuid(),
    name           text not null,
    location       text,
    starts_at      timestamptz not null,
    ends_at        timestamptz,
    description    text,
    is_active      boolean not null default true,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);
create index idx_competitions_starts_at on public.competitions (starts_at);
create index idx_competitions_active on public.competitions (is_active);

create trigger trg_competitions_updated_at
before update on public.competitions
for each row execute function public.set_updated_at();

create trigger trg_audit_competitions
after insert or update or delete on public.competitions
for each row execute function public.audit_trigger_fn();

-- Versenyre jelentkezett/hozzárendelt tagok + logisztika/pénzügy
create table public.competition_participants (
    id                  uuid primary key default gen_random_uuid(),
    competition_id      uuid not null references public.competitions(id) on delete cascade,
    student_id          uuid not null references public.profiles(id),
    entry_fee_amount    numeric(10,2) default 0,
    entry_fee_paid      boolean not null default false,
    travel_mode         text, -- pl. 'busz', 'saját autó', 'vonat'
    accommodation_cost  numeric(10,2) default 0,
    accommodation_paid  boolean not null default false,
    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (competition_id, student_id)
);
create index idx_comp_participants_competition on public.competition_participants (competition_id);
create index idx_comp_participants_student on public.competition_participants (student_id);
create index idx_comp_participants_unpaid on public.competition_participants (entry_fee_paid, accommodation_paid);

create trigger trg_comp_participants_updated_at
before update on public.competition_participants
for each row execute function public.set_updated_at();

create trigger trg_audit_comp_participants
after insert or update or delete on public.competition_participants
for each row execute function public.audit_trigger_fn();

-- Havi tagdíjak
create table public.membership_fees (
    id             uuid primary key default gen_random_uuid(),
    student_id     uuid not null references public.profiles(id),
    period_year    int not null,
    period_month   int not null check (period_month between 1 and 12),
    amount         numeric(10,2) not null,
    status         text not null default 'pending' check (status in ('pending','paid','overdue','waived')),
    paid_at        timestamptz,
    is_active      boolean not null default true,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (student_id, period_year, period_month)
);
create index idx_membership_fees_student on public.membership_fees (student_id);
create index idx_membership_fees_status on public.membership_fees (status);
create index idx_membership_fees_period on public.membership_fees (period_year, period_month);

create trigger trg_membership_fees_updated_at
before update on public.membership_fees
for each row execute function public.set_updated_at();

create trigger trg_audit_membership_fees
after insert or update or delete on public.membership_fees
for each row execute function public.audit_trigger_fn();

-- =====================================================================
-- 7. VERSENYZŐI PROFIL (CRM) & GDPR
-- =====================================================================

create table public.athlete_categories (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique, -- pl. 'Mini', 'Junior', 'Senior'
    min_age     int,
    max_age     int,
    is_active   boolean not null default true
);

create table public.athlete_profiles (
    id                   uuid primary key default gen_random_uuid(),
    student_id           uuid not null unique references public.profiles(id) on delete cascade,
    category_id          uuid references public.athlete_categories(id),
    medical_certificate_expiry date,
    medical_certificate_url    text,
    notes                text,
    is_active            boolean not null default true,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);
create index idx_athlete_profiles_category on public.athlete_profiles (category_id);
create index idx_athlete_profiles_medical_expiry on public.athlete_profiles (medical_certificate_expiry);

create trigger trg_athlete_profiles_updated_at
before update on public.athlete_profiles
for each row execute function public.set_updated_at();

create trigger trg_audit_athlete_profiles
after insert or update or delete on public.athlete_profiles
for each row execute function public.audit_trigger_fn();

-- GDPR / Fotó-Videó nyilatkozatok
create table public.gdpr_consents (
    id             uuid primary key default gen_random_uuid(),
    student_id     uuid not null references public.profiles(id) on delete cascade,
    consent_type   text not null check (consent_type in ('gdpr_data','photo_video')),
    accepted       boolean not null default false,
    accepted_at    timestamptz,
    document_url   text,
    created_at     timestamptz not null default now()
);
create index idx_gdpr_consents_student on public.gdpr_consents (student_id);
create index idx_gdpr_consents_type on public.gdpr_consents (consent_type);

create trigger trg_audit_gdpr_consents
after insert or update or delete on public.gdpr_consents
for each row execute function public.audit_trigger_fn();

-- =====================================================================
-- 8. RUHÁZAT ÉS FELSZERELÉS (WARDROBE) MODUL
-- =====================================================================

create table public.costumes (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    size          text,
    stock_quantity int not null default 0,
    photo_url     text,
    is_active     boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index idx_costumes_active on public.costumes (is_active);

create trigger trg_costumes_updated_at
before update on public.costumes
for each row execute function public.set_updated_at();

create trigger trg_audit_costumes
after insert or update or delete on public.costumes
for each row execute function public.audit_trigger_fn();

-- Kikölcsönzés diákokhoz
create table public.user_costumes (
    id            uuid primary key default gen_random_uuid(),
    costume_id    uuid not null references public.costumes(id),
    student_id    uuid not null references public.profiles(id),
    borrowed_at   timestamptz not null default now(),
    returned_at   timestamptz,
    status        text not null default 'borrowed' check (status in ('borrowed','returned','lost','damaged')),
    created_at    timestamptz not null default now()
);
create index idx_user_costumes_costume on public.user_costumes (costume_id);
create index idx_user_costumes_student on public.user_costumes (student_id);
create index idx_user_costumes_status on public.user_costumes (status);

create trigger trg_audit_user_costumes
after insert or update or delete on public.user_costumes
for each row execute function public.audit_trigger_fn();

-- =====================================================================
-- 9. KOREOGRÁFIA TERVEZŐ ÉS SZABÁLYRENDSZER (RULE ENGINE)
-- =====================================================================

create table public.choreographies (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    category_id   uuid references public.athlete_categories(id),
    competition_id uuid references public.competitions(id),
    duration_seconds int,
    is_active     boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index idx_choreographies_category on public.choreographies (category_id);
create index idx_choreographies_competition on public.choreographies (competition_id);

create trigger trg_choreographies_updated_at
before update on public.choreographies
for each row execute function public.set_updated_at();

create trigger trg_audit_choreographies
after insert or update or delete on public.choreographies
for each row execute function public.audit_trigger_fn();

-- Ruhák hozzárendelése koreográfiákhoz
create table public.choreography_costumes (
    id              uuid primary key default gen_random_uuid(),
    choreography_id uuid not null references public.choreographies(id) on delete cascade,
    costume_id      uuid not null references public.costumes(id),
    quantity_needed int default 1,
    unique (choreography_id, costume_id)
);
create index idx_choreo_costumes_choreo on public.choreography_costumes (choreography_id);

-- Elemek szótára (tánc/torna elemek)
create table public.elements (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    element_type  text not null, -- pl. 'akrobatika', 'ugrás', 'forgás'
    difficulty    int not null default 1, -- 1-5
    is_active     boolean not null default true,
    created_at    timestamptz not null default now()
);
create index idx_elements_type on public.elements (element_type);
create index idx_elements_difficulty on public.elements (difficulty);

-- Egy koreográfia elemeinek listája
create table public.choreography_elements (
    id              uuid primary key default gen_random_uuid(),
    choreography_id uuid not null references public.choreographies(id) on delete cascade,
    element_id      uuid not null references public.elements(id),
    sequence_order  int default 0,
    created_at      timestamptz not null default now()
);
create index idx_choreo_elements_choreo on public.choreography_elements (choreography_id);
create index idx_choreo_elements_element on public.choreography_elements (element_id);

create trigger trg_audit_choreography_elements
after insert or update or delete on public.choreography_elements
for each row execute function public.audit_trigger_fn();

-- Versenyszabályzatok (pl. max. 3 akrobatika elem kezdőknél)
create table public.rules (
    id               uuid primary key default gen_random_uuid(),
    code             text not null unique, -- pl. 'MAX_ACRO_BEGINNER'
    description      text not null,
    category_id      uuid references public.athlete_categories(id), -- melyik korosztályra vonatkozik
    element_type     text, -- melyik elemtípusra vonatkozik (NULL = mindegyikre)
    max_count        int, -- maximum engedélyezett darabszám
    min_difficulty    int,
    max_difficulty    int,
    is_active        boolean not null default true,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
create index idx_rules_category on public.rules (category_id);
create index idx_rules_active on public.rules (is_active);

create trigger trg_rules_updated_at
before update on public.rules
for each row execute function public.set_updated_at();

create trigger trg_audit_rules
after insert or update or delete on public.rules
for each row execute function public.audit_trigger_fn();

-- =====================================================================
-- 9.1 VALIDÁCIÓS FÜGGVÉNY (Rule Engine)
-- Visszaadja a megszegett szabályokat (rule_id, description) egy
-- koreográfiára. Az API/RPC réteg ezt hívja meg elem hozzáadás előtt.
-- =====================================================================

create or replace function public.validate_choreography_rules(_choreography_id uuid)
returns table (rule_id uuid, rule_code text, rule_description text, actual_count bigint, max_count int)
language sql
stable
as $$
  select
    r.id as rule_id,
    r.code as rule_code,
    r.description as rule_description,
    count(ce.id) as actual_count,
    r.max_count
  from public.choreographies c
  join public.rules r
    on r.is_active = true
   and (r.category_id is null or r.category_id = c.category_id)
  left join public.choreography_elements ce
    on ce.choreography_id = c.id
  left join public.elements e
    on e.id = ce.element_id
   and (r.element_type is null or e.element_type = r.element_type)
   and (r.min_difficulty is null or e.difficulty >= r.min_difficulty)
   and (r.max_difficulty is null or e.difficulty <= r.max_difficulty)
  where c.id = _choreography_id
  group by r.id, r.code, r.description, r.max_count
  having r.max_count is not null and count(ce.id) > r.max_count;
$$;

-- =====================================================================
-- 10. GDPR ANONIMIZÁLÁS FÜGGVÉNY
-- Személyes adatok anonimizálása, statisztikai rekordok megmaradnak.
-- =====================================================================

create or replace function public.anonymize_profile(_profile_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set first_name = 'Törölt',
      last_name  = 'Felhasználó',
      email      = 'anonim_' || _profile_id || '@deleted.local',
      phone      = null,
      avatar_url = null,
      birth_date = null,
      is_active  = false,
      gdpr_anonymized = true
  where id = _profile_id;

  update public.athlete_profiles
  set medical_certificate_url = null,
      notes = null
  where student_id = _profile_id;
end;
$$;

-- =====================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_permissions enable row level security;
alter table public.parent_child_links enable row level security;
alter table public.audit_logs enable row level security;
alter table public.news_posts enable row level security;
alter table public.news_references enable row level security;
alter table public.athletes_showcase enable row level security;
alter table public.class_types enable row level security;
alter table public.scheduled_classes enable row level security;
alter table public.attendance enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_participants enable row level security;
alter table public.membership_fees enable row level security;
alter table public.athlete_categories enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.gdpr_consents enable row level security;
alter table public.costumes enable row level security;
alter table public.user_costumes enable row level security;
alter table public.choreographies enable row level security;
alter table public.choreography_costumes enable row level security;
alter table public.elements enable row level security;
alter table public.choreography_elements enable row level security;
alter table public.rules enable row level security;

-- --- PROFILES ---
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (
    id = auth.uid() or public.is_admin() or public.has_role('coach')
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = profiles.id)
  );
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

-- --- ROLES / PERMISSIONS (csak admin írhat, mindenki más csak a sajátját olvassa) ---
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());
create policy "user_roles_manage_admin" on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "permissions_select_all_authenticated" on public.permissions
  for select using (auth.uid() is not null);
create policy "permissions_manage_admin" on public.permissions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "user_permissions_select_own_or_admin" on public.user_permissions
  for select using (user_id = auth.uid() or public.is_admin());
create policy "user_permissions_manage_admin" on public.user_permissions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "parent_child_links_select" on public.parent_child_links
  for select using (parent_id = auth.uid() or child_id = auth.uid() or public.is_admin());
create policy "parent_child_links_manage_admin" on public.parent_child_links
  for all using (public.is_admin()) with check (public.is_admin());

-- --- AUDIT LOGS (csak admin olvashatja) ---
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (public.is_admin());

-- --- NEWS (publikus olvasás, admin/coach ír) ---
create policy "news_posts_select_public" on public.news_posts
  for select using (is_published = true and is_active = true or public.is_admin() or public.has_role('coach'));
create policy "news_posts_manage_staff" on public.news_posts
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

create policy "news_references_select_public" on public.news_references
  for select using (true);
create policy "news_references_manage_staff" on public.news_references
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- ATHLETES SHOWCASE (publikus) ---
create policy "athletes_showcase_select_public" on public.athletes_showcase
  for select using (is_active = true or public.is_admin());
create policy "athletes_showcase_manage_staff" on public.athletes_showcase
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- CLASS TYPES / SCHEDULE (publikus olvasás, staff ír) ---
create policy "class_types_select_public" on public.class_types
  for select using (true);
create policy "class_types_manage_staff" on public.class_types
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

create policy "scheduled_classes_select_public" on public.scheduled_classes
  for select using (true);
create policy "scheduled_classes_manage_staff" on public.scheduled_classes
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- ATTENDANCE (diák/szülő saját, staff mindenki) ---
create policy "attendance_select" on public.attendance
  for select using (
    student_id = auth.uid() or public.is_admin() or public.has_role('coach')
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = attendance.student_id)
  );
create policy "attendance_manage_staff" on public.attendance
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- COMPETITIONS (publikus olvasás, staff ír) ---
create policy "competitions_select_public" on public.competitions
  for select using (true);
create policy "competitions_manage_staff" on public.competitions
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- COMPETITION PARTICIPANTS (pénzügyi -> permission alapú) ---
create policy "competition_participants_select" on public.competition_participants
  for select using (
    student_id = auth.uid() or public.is_admin() or public.has_permission('finance.view')
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = competition_participants.student_id)
  );
create policy "competition_participants_manage" on public.competition_participants
  for all using (public.is_admin() or public.has_permission('finance.manage'))
  with check (public.is_admin() or public.has_permission('finance.manage'));

-- --- MEMBERSHIP FEES (pénzügyi -> permission alapú) ---
create policy "membership_fees_select" on public.membership_fees
  for select using (
    student_id = auth.uid() or public.is_admin() or public.has_permission('finance.view')
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = membership_fees.student_id)
  );
create policy "membership_fees_manage" on public.membership_fees
  for all using (public.is_admin() or public.has_permission('finance.manage'))
  with check (public.is_admin() or public.has_permission('finance.manage'));

-- --- ATHLETE CATEGORIES (publikus olvasás) ---
create policy "athlete_categories_select_public" on public.athlete_categories
  for select using (true);
create policy "athlete_categories_manage_staff" on public.athlete_categories
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- ATHLETE PROFILES (CRM, GDPR érzékeny) ---
create policy "athlete_profiles_select" on public.athlete_profiles
  for select using (
    student_id = auth.uid() or public.is_admin() or public.has_role('coach')
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = athlete_profiles.student_id)
  );
create policy "athlete_profiles_manage_staff" on public.athlete_profiles
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

-- --- GDPR CONSENTS ---
create policy "gdpr_consents_select" on public.gdpr_consents
  for select using (
    student_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = gdpr_consents.student_id)
  );
create policy "gdpr_consents_insert_own_or_parent" on public.gdpr_consents
  for insert with check (
    student_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.parent_child_links pcl where pcl.parent_id = auth.uid() and pcl.child_id = gdpr_consents.student_id)
  );
create policy "gdpr_consents_manage_admin" on public.gdpr_consents
  for update using (public.is_admin());

-- --- WARDROBE ---
create policy "costumes_select_staff" on public.costumes
  for select using (public.is_admin() or public.has_role('coach') or public.has_permission('wardrobe.view'));
create policy "costumes_manage_permission" on public.costumes
  for all using (public.is_admin() or public.has_permission('wardrobe.manage'))
  with check (public.is_admin() or public.has_permission('wardrobe.manage'));

create policy "user_costumes_select" on public.user_costumes
  for select using (
    student_id = auth.uid() or public.is_admin() or public.has_permission('wardrobe.view')
  );
create policy "user_costumes_manage_permission" on public.user_costumes
  for all using (public.is_admin() or public.has_permission('wardrobe.manage'))
  with check (public.is_admin() or public.has_permission('wardrobe.manage'));

-- --- CHOREOGRAPHIES / ELEMENTS / RULES (staff) ---
create policy "choreographies_select_staff" on public.choreographies
  for select using (public.is_admin() or public.has_role('coach'));
create policy "choreographies_manage_staff" on public.choreographies
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

create policy "choreography_costumes_select_staff" on public.choreography_costumes
  for select using (public.is_admin() or public.has_role('coach'));
create policy "choreography_costumes_manage_staff" on public.choreography_costumes
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

create policy "elements_select_staff" on public.elements
  for select using (public.is_admin() or public.has_role('coach'));
create policy "elements_manage_admin" on public.elements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "choreography_elements_select_staff" on public.choreography_elements
  for select using (public.is_admin() or public.has_role('coach'));
create policy "choreography_elements_manage_staff" on public.choreography_elements
  for all using (public.is_admin() or public.has_role('coach')) with check (public.is_admin() or public.has_role('coach'));

create policy "rules_select_staff" on public.rules
  for select using (public.is_admin() or public.has_role('coach'));
create policy "rules_manage_admin" on public.rules
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- VÉGE
-- =====================================================================
