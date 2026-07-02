-- 0022_fix_rls_recursion.sql
-- Fix infinite recursion in RLS policies
--
-- The cycle was:
--   students policy → school_students → school_students_select_self → students → ...
--
-- school_students_select_self (migration 0021) queried students,
-- whose policy (students_select_self_or_owner_linked) queried school_students back.
-- For any user who is a school owner but NOT in the students table,
-- condition 1 (auth_user_id = auth.uid()) was FALSE, so condition 2 ran,
-- querying school_students → school_students_select_self queried students → recursion.
--
-- Fix: drop school_students_select_self. Student self-service flows
-- use createAdminClient() (bypasses RLS), so this policy is not yet needed.
-- When student self-service is wired via regular client, a security definer
-- function will be used to break the cycle.

drop policy if exists school_students_select_self on school_students;
