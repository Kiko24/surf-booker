-- 0009_instructor_and_payment.sql
-- Ensure instructors table exists + add instructor_id to sessions

create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  level text default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (id, school_id)
);

-- Add instructor_id to sessions
alter table sessions
  add column if not exists instructor_id uuid references instructors(id) on delete set null;
