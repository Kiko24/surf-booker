-- ============================================================
-- Migration 0029: Fix RLS recursion for student self-service
-- ============================================================
--
-- Problem: students_select_self_or_owner_linked queried school_students
-- → school_students_select_self queried students → recursion.
-- Migration 0022 dropped school_students_select_self to break the cycle,
-- but that broke all student-facing policies that query school_students
-- (packs_select_student, sessions_select_student, schools_select_student, etc.)
--
-- Fix: Use a SECURITY DEFINER function for the owner subquery in
-- students_select_self_or_owner_linked, which bypasses RLS on
-- school_students and breaks the recursion. Then re-create
-- school_students_select_self for student-facing policies.

-- ============================================================
-- Step 1: SECURITY DEFINER function
-- Returns TRUE if auth.uid() owns a school that the given
-- student is linked to via school_students.
-- Safe because: takes only a UUID, returns boolean, cannot be
-- used to leak data (auth.uid() is always the current user),
-- and is marked stable (read-only).
-- ============================================================
create or replace function fn_auth_uid_owns_student_link(student_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from school_students ss
    join schools s on s.id = ss.school_id
    where ss.student_id = fn_auth_uid_owns_student_link.student_id
      and s.owner_user_id = auth.uid()
  );
$$;

-- ============================================================
-- Step 2: Drop existing students_select_self_or_owner_linked
-- and recreate using the SECURITY DEFINER function
-- ============================================================
drop policy if exists students_select_self_or_owner_linked on students;

create policy students_select_self_or_owner_linked
  on students
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or fn_auth_uid_owns_student_link(id)
  );

-- ============================================================
-- Step 3: Re-create school_students_select_self
-- (was dropped in migration 0022)
-- Allows students to see their own school_students links
-- ============================================================
drop policy if exists school_students_select_self on school_students;

create policy school_students_select_self
  on school_students
  for select
  to authenticated
  using (
    exists (
      select 1
      from students s
      where s.id = school_students.student_id
        and s.auth_user_id = auth.uid()
    )
  );
