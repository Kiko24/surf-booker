-- ============================================================
-- 0003_profiles_and_class_types.sql
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  accepted_terms_at timestamptz not null,
  accepted_privacy_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_check
    check (char_length(btrim(full_name)) between 1 and 120),

  constraint profiles_phone_check
    check (
      char_length(btrim(phone)) between 6 and 20
      and phone ~ '^[0-9+() /.\-]+$'
    )
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- CLASS_TYPES
-- ============================================================
create table class_types (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,

  name text not null,
  default_duration_minutes int not null default 90,
  price_cents int not null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, school_id),

  constraint class_types_name_check
    check (char_length(btrim(name)) between 1 and 80),

  constraint class_types_duration_check
    check (default_duration_minutes between 15 and 240),

  constraint class_types_price_check
    check (price_cents between 0 and 500000)
);

create index class_types_school_id_idx on class_types(school_id);

create unique index class_types_unique_name_per_school_idx
  on class_types(school_id, lower(btrim(name)))
  where is_active = true;

create trigger class_types_updated_at
  before update on class_types
  for each row execute function set_updated_at();

-- ============================================================
-- SCHOOLS — logo_url
-- ============================================================
alter table schools
  add column logo_url text;

alter table schools
  add constraint schools_logo_url_check
    check (logo_url is null or char_length(logo_url) <= 500);

-- ============================================================
-- SESSIONS — class_type_id (snapshot mantém-se em price_cents)
-- ============================================================
alter table sessions
  add column class_type_id uuid;

alter table sessions
  add constraint sessions_class_type_fk
    foreign key (class_type_id, school_id)
    references class_types(id, school_id)
    on delete restrict;

create index sessions_class_type_id_idx on sessions(class_type_id);

-- ============================================================
-- RLS
-- ============================================================
alter table profiles enable row level security;
alter table class_types enable row level security;

-- ----------------------------
-- profiles
-- ----------------------------
drop policy if exists profiles_select_own on profiles;
drop policy if exists profiles_insert_own on profiles;
drop policy if exists profiles_update_own on profiles;

create policy profiles_select_own
  on profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy profiles_insert_own
  on profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy profiles_update_own
  on profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------
-- class_types
-- ----------------------------
drop policy if exists class_types_select_owner on class_types;
drop policy if exists class_types_insert_owner on class_types;
drop policy if exists class_types_update_owner on class_types;
drop policy if exists class_types_delete_owner on class_types;

create policy class_types_select_owner
  on class_types
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = class_types.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy class_types_insert_owner
  on class_types
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = class_types.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy class_types_update_owner
  on class_types
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = class_types.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = class_types.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy class_types_delete_owner
  on class_types
  for delete
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = class_types.school_id
        and s.owner_user_id = auth.uid()
    )
  );