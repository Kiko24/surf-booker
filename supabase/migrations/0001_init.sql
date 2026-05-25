-- ============================================================
-- 0001_init.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Helpers
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- SCHOOLS
-- ============================================================
create table schools (
  id uuid primary key default gen_random_uuid(),

  owner_user_id uuid not null
    references auth.users(id) on delete restrict,

  name text not null,
  slug text not null unique,
  description text,
  location text,
  timezone text not null default 'Europe/Lisbon',
  cancellation_window_hours int not null default 24,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint schools_name_check
    check (char_length(btrim(name)) between 2 and 100),

  constraint schools_slug_check
    check (
      char_length(slug) between 3 and 60
      and slug = lower(slug)
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint schools_description_check
    check (description is null or char_length(description) <= 1000),

  constraint schools_location_check
    check (location is null or char_length(btrim(location)) <= 100),

  constraint schools_timezone_check
    check (char_length(timezone) between 3 and 50),

  constraint schools_cancellation_window_check
    check (cancellation_window_hours between 0 and 720)
);

create index schools_owner_user_id_idx on schools(owner_user_id);

create trigger schools_updated_at
  before update on schools
  for each row execute function set_updated_at();

-- ============================================================
-- STUDENTS
-- ============================================================
create table students (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid unique
    references auth.users(id) on delete set null,

  full_name text not null,
  email text,
  phone text,
  is_guest boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint students_full_name_check
    check (char_length(btrim(full_name)) between 1 and 120),

  constraint students_email_check
    check (
      email is null or (
        char_length(btrim(email)) between 5 and 160
        and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    ),

  constraint students_phone_check
    check (
      phone is null or (
        char_length(btrim(phone)) between 6 and 20
        and phone ~ '^[0-9+() /.\-]+$'
      )
    ),

  constraint students_non_guest_email_check
    check (is_guest = true or email is not null),

  constraint students_auth_guest_check
    check (auth_user_id is null or is_guest = false)
);

create unique index students_email_unique_non_guest_idx
  on students(lower(email))
  where is_guest = false and email is not null;

create index students_auth_user_id_idx on students(auth_user_id);

create trigger students_updated_at
  before update on students
  for each row execute function set_updated_at();

-- ============================================================
-- SCHOOL_STUDENTS
-- ============================================================
create table school_students (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references schools(id) on delete cascade,

  student_id uuid not null
    references students(id) on delete restrict,

  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (school_id, student_id)
);

create index school_students_school_id_idx on school_students(school_id);
create index school_students_student_id_idx on school_students(student_id);

-- ============================================================
-- SESSIONS
-- ============================================================
create table sessions (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references schools(id) on delete cascade,

  starts_at timestamptz not null,
  duration_minutes int not null default 90,
  capacity int,
  price_cents int not null,

  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled')),

  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, school_id),

  constraint sessions_duration_check
    check (duration_minutes between 15 and 480),

  constraint sessions_capacity_check
    check (capacity is null or capacity between 1 and 100),

  constraint sessions_price_check
    check (price_cents between 0 and 500000),

  constraint sessions_cancelled_state_check
    check (
      (status = 'scheduled' and cancelled_at is null)
      or
      (status = 'cancelled' and cancelled_at is not null)
    )
);

create index sessions_school_starts_at_idx on sessions(school_id, starts_at);

create trigger sessions_updated_at
  before update on sessions
  for each row execute function set_updated_at();

-- ============================================================
-- BOOKING_GROUPS
-- ============================================================
create table booking_groups (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  session_id uuid not null,
  booked_by_student_id uuid not null,

  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,

  source text not null default 'guest'
    check (source in ('guest', 'account')),

  status text not null default 'active'
    check (status in ('active', 'cancelled')),

  created_at timestamptz not null default now(),
  cancelled_at timestamptz,

  unique (id, session_id),

  constraint booking_groups_session_fk
    foreign key (session_id, school_id)
    references sessions(id, school_id)
    on delete cascade,

  constraint booking_groups_booked_by_school_student_fk
    foreign key (school_id, booked_by_student_id)
    references school_students(school_id, student_id)
    on delete restrict,

  constraint booking_groups_contact_name_check
    check (char_length(btrim(contact_name)) between 1 and 120),

  constraint booking_groups_contact_email_check
    check (
      char_length(btrim(contact_email)) between 5 and 160
      and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),

  constraint booking_groups_contact_phone_check
    check (
      char_length(btrim(contact_phone)) between 6 and 20
      and contact_phone ~ '^[0-9+() /.\-]+$'
    ),

  constraint booking_groups_cancelled_state_check
    check (
      (status = 'active' and cancelled_at is null)
      or
      (status = 'cancelled' and cancelled_at is not null)
    )
);

create index booking_groups_school_id_idx on booking_groups(school_id);
create index booking_groups_session_id_idx on booking_groups(session_id);
create index booking_groups_booked_by_student_id_idx on booking_groups(booked_by_student_id);

-- ============================================================
-- PACKS
-- ============================================================
create table packs (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references schools(id) on delete cascade,

  name text not null,
  total_lessons int not null,
  price_cents int not null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  unique (id, school_id),

  constraint packs_name_check
    check (char_length(btrim(name)) between 1 and 80),

  constraint packs_total_lessons_check
    check (total_lessons between 1 and 100),

  constraint packs_price_check
    check (price_cents between 0 and 500000)
);

create index packs_school_id_idx on packs(school_id);

-- ============================================================
-- PACK_PURCHASES
-- ============================================================
create table pack_purchases (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  pack_id uuid not null,
  student_id uuid not null,

  lessons_remaining int not null,

  status text not null default 'active'
    check (status in ('active', 'exhausted', 'cancelled')),

  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (id, student_id),

  constraint pack_purchases_pack_fk
    foreign key (pack_id, school_id)
    references packs(id, school_id)
    on delete restrict,

  constraint pack_purchases_school_student_fk
    foreign key (school_id, student_id)
    references school_students(school_id, student_id)
    on delete restrict,

  constraint pack_purchases_lessons_remaining_check
    check (lessons_remaining between 0 and 100)
);

create index pack_purchases_school_id_idx on pack_purchases(school_id);
create index pack_purchases_pack_id_idx on pack_purchases(pack_id);
create index pack_purchases_student_id_idx on pack_purchases(student_id);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),

  booking_group_id uuid not null,
  session_id uuid not null,
  student_id uuid not null,

  status text not null default 'confirmed'
    check (status in (
      'confirmed',
      'cancelled_by_student',
      'cancelled_by_school',
      'attended',
      'no_show'
    )),

  payment_method text not null default 'single'
    check (payment_method in ('single', 'pack')),

  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid_offline')),

  pack_purchase_id uuid,
  price_cents int not null,

  created_at timestamptz not null default now(),
  cancelled_at timestamptz,

  unique (session_id, student_id),

  constraint bookings_group_session_fk
    foreign key (booking_group_id, session_id)
    references booking_groups(id, session_id)
    on delete cascade,

  constraint bookings_pack_purchase_student_fk
    foreign key (pack_purchase_id, student_id)
    references pack_purchases(id, student_id)
    on delete restrict,

  constraint bookings_price_check
    check (price_cents between 0 and 500000),

  constraint bookings_pack_consistency_check
    check (
      (payment_method = 'single' and pack_purchase_id is null)
      or
      (payment_method = 'pack' and pack_purchase_id is not null)
    ),

  constraint bookings_cancelled_state_check
    check (
      (status in ('confirmed', 'attended', 'no_show') and cancelled_at is null)
      or
      (status in ('cancelled_by_student', 'cancelled_by_school') and cancelled_at is not null)
    )
);

create index bookings_booking_group_id_idx on bookings(booking_group_id);
create index bookings_session_id_idx on bookings(session_id);
create index bookings_student_id_idx on bookings(student_id);
create index bookings_pack_purchase_id_idx on bookings(pack_purchase_id);

-- ============================================================
-- WAIVER_VERSIONS
-- ============================================================
create table waiver_versions (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references schools(id) on delete cascade,

  version int not null,
  title text not null,
  body text not null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  unique (school_id, version),
  unique (id, school_id),

  constraint waiver_versions_version_check
    check (version between 1 and 1000),

  constraint waiver_versions_title_check
    check (char_length(btrim(title)) between 1 and 150),

  constraint waiver_versions_body_check
    check (char_length(body) between 1 and 20000)
);

create unique index waiver_versions_one_active_per_school_idx
  on waiver_versions(school_id)
  where is_active = true;

create index waiver_versions_school_id_idx on waiver_versions(school_id);

-- ============================================================
-- WAIVER_ACCEPTANCES
-- ============================================================
create table waiver_acceptances (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  student_id uuid not null,
  waiver_version_id uuid not null,

  accepted_at timestamptz not null default now(),
  ip text,
  user_agent text,

  unique (school_id, student_id, waiver_version_id),

  constraint waiver_acceptances_waiver_version_fk
    foreign key (waiver_version_id, school_id)
    references waiver_versions(id, school_id)
    on delete restrict,

  constraint waiver_acceptances_school_student_fk
    foreign key (school_id, student_id)
    references school_students(school_id, student_id)
    on delete restrict,

  constraint waiver_acceptances_ip_check
    check (ip is null or char_length(ip) <= 45),

  constraint waiver_acceptances_user_agent_check
    check (user_agent is null or char_length(user_agent) <= 400)
);

create index waiver_acceptances_school_id_idx on waiver_acceptances(school_id);
create index waiver_acceptances_student_id_idx on waiver_acceptances(student_id);
create index waiver_acceptances_waiver_version_id_idx on waiver_acceptances(waiver_version_id);