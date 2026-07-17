-- ============================================================
-- Migration 0030: Fix RLS recursion on schools
-- ============================================================
--
-- Problem: schools_select_student (migration 0028) queries
-- school_students directly → school_students_select_owner
-- queries schools → schools_select_student again → recursion.
-- PostgreSQL aborts the query, affecting even the owner's
-- schools_select_own policy.
--
-- Fix: Use a SECURITY DEFINER function to list the school_ids
-- for the current student, breaking the cycle.
-- ============================================================

-- ============================================================
-- Step 1: SECURITY DEFINER function
-- Returns the set of school_ids that the current auth user
-- is linked to via school_students.
-- Safe because: only uses auth.uid() (not user-supplied),
-- returns only belongs to the current user, and is marked
-- stable (read-only).
-- ============================================================
create or replace function fn_auth_uid_school_ids_for_student()
returns setof uuid
language sql
stable
security definer
as $$
  select ss.school_id
  from school_students ss
  join students s on s.id = ss.student_id
  where s.auth_user_id = auth.uid();
$$;

-- ============================================================
-- Step 2: Drop old schools_select_student policy that causes
-- recursion and replace with one using the SECURITY DEFINER
-- function
-- ============================================================
drop policy if exists schools_select_student on schools;

create policy schools_select_student
  on schools
  for select
  to authenticated
  using (
    id in (select fn_auth_uid_school_ids_for_student())
  );
