-- ============================================================
-- 0001_init.sql
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- SCHOOLS
-- ============================================================
create table schools (
  id                        uuid primary key default uuid_generate_v4(),
  owner_user_id             uuid not null references auth.users(id) on delete restrict,
  name                      text not null,
  slug                      text not null unique,
  description               text,
  location                  text,
  timezone                  text not null default 'Europe/Lisbon',
  cancellation_window_hours int  not null default 24,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- STUDENTS
-- ============================================================
create table students (
  id           uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name    text not null,
  email        text not null,
  phone        text not null,
  is_guest     boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index students_email_unique_non_guest
  on students(email)
  where is_guest = false;

-- ============================================================
-- SCHOOL_STUDENTS
-- ============================================================
create table school_students (
  id            uuid primary key default uuid_generate_v4(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique(school_id, student_id)
);

-- ============================================================
-- SESSIONS
-- ============================================================
create table sessions (
  id               uuid primary key default uuid_generate_v4(),
  school_id        uuid not null references schools(id) on delete cascade,
  starts_at        timestamptz not null,
  duration_minutes int not null default 90,
  capacity         int,
  price_cents      int not null,
  status           text not null default 'scheduled'
                   check (status in ('scheduled', 'cancelled')),
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index sessions_school_starts_at on sessions(school_id, starts_at);

-- ============================================================
-- BOOKING_GROUPS
-- ============================================================
create table booking_groups (
  id                   uuid primary key default uuid_generate_v4(),
  school_id            uuid not null references schools(id) on delete cascade,
  session_id           uuid not null references sessions(id) on delete cascade,
  booked_by_student_id uuid references students(id) on delete set null,
  contact_name         text not null,
  contact_email        text not null,
  contact_phone        text not null,
  source               text not null default 'guest'
                       check (source in ('guest', 'account')),
  status               text not null default 'active'
                       check (status in ('active', 'cancelled')),
  created_at           timestamptz not null default now(),
  cancelled_at         timestamptz
);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table bookings (
  id               uuid primary key default uuid_generate_v4(),
  booking_group_id uuid not null references booking_groups(id) on delete cascade,
  session_id       uuid not null references sessions(id) on delete cascade,
  student_id       uuid references students(id) on delete set null,
  status           text not null default 'confirmed'
                   check (status in (
                     'confirmed',
                     'cancelled_by_student',
                     'cancelled_by_school',
                     'attended',
                     'no_show'
                   )),
  payment_method   text not null default 'single'
                   check (payment_method in ('single', 'pack')),
  payment_status   text not null default 'unpaid'
                   check (payment_status in ('unpaid', 'paid_offline')),
  pack_purchase_id uuid,
  price_cents      int not null,
  created_at       timestamptz not null default now(),
  cancelled_at     timestamptz,
  unique(session_id, student_id)
);

-- ============================================================
-- PACKS
-- ============================================================
create table packs (
  id            uuid primary key default uuid_generate_v4(),
  school_id     uuid not null references schools(id) on delete cascade,
  name          text not null,
  total_lessons int not null,
  price_cents   int not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- PACK_PURCHASES
-- ============================================================
create table pack_purchases (
  id                uuid primary key default uuid_generate_v4(),
  school_id         uuid not null references schools(id) on delete cascade,
  pack_id           uuid not null references packs(id) on delete restrict,
  student_id        uuid not null references students(id) on delete cascade,
  lessons_remaining int not null,
  status            text not null default 'active'
                    check (status in ('active', 'exhausted', 'cancelled')),
  purchased_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

alter table bookings
  add constraint bookings_pack_purchase_fk
  foreign key (pack_purchase_id)
  references pack_purchases(id)
  on delete set null;

-- ============================================================
-- WAIVER_VERSIONS
-- ============================================================
create table waiver_versions (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  version    int not null,
  title      text not null,
  body       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique(school_id, version)
);

-- ============================================================
-- WAIVER_ACCEPTANCES
-- ============================================================
create table waiver_acceptances (
  id                uuid primary key default uuid_generate_v4(),
  school_id         uuid not null references schools(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  waiver_version_id uuid not null references waiver_versions(id) on delete restrict,
  accepted_at       timestamptz not null default now(),
  ip                text,
  user_agent        text,
  unique(school_id, student_id, waiver_version_id)
);

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger schools_updated_at
  before update on schools
  for each row execute function set_updated_at();

create trigger students_updated_at
  before update on students
  for each row execute function set_updated_at();

create trigger sessions_updated_at
  before update on sessions
  for each row execute function set_updated_at();