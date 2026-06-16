-- 0021_student_self_service.sql
-- RLS policies for authenticated students to view their own data

-- ============================================================
-- SCHOOL_STUDENTS: student can see their own links
-- ============================================================
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

-- ============================================================
-- BOOKINGS: student can see their own bookings
-- ============================================================
create policy bookings_select_self
  on bookings
  for select
  to authenticated
  using (
    exists (
      select 1
      from students s
      where s.id = bookings.student_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKING_GROUPS: student can see groups they booked
-- ============================================================
create policy booking_groups_select_self
  on booking_groups
  for select
  to authenticated
  using (
    exists (
      select 1
      from students s
      where s.id = booking_groups.booked_by_student_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- PACK_PURCHASES: student can see their own purchases
-- ============================================================
create policy pack_purchases_select_self
  on pack_purchases
  for select
  to authenticated
  using (
    exists (
      select 1
      from students s
      where s.id = pack_purchases.student_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVER_ACCEPTANCES: student can see their own acceptances
-- ============================================================
create policy waiver_acceptances_select_self
  on waiver_acceptances
  for select
  to authenticated
  using (
    exists (
      select 1
      from students s
      where s.id = waiver_acceptances.student_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVER_VERSIONS: allow students to see waiver content
-- (only for schools they are linked to)
-- ============================================================
create policy waiver_versions_select_student
  on waiver_versions
  for select
  to authenticated
  using (
    exists (
      select 1
      from school_students ss
      join students s on s.id = ss.student_id
      where ss.school_id = waiver_versions.school_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- SESSIONS: allow students to see sessions from their schools
-- (needed to show lesson history with session details)
-- ============================================================
create policy sessions_select_student
  on sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from school_students ss
      join students s on s.id = ss.student_id
      where ss.school_id = sessions.school_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- CLASS_TYPES: allow students to see class types from their schools
-- ============================================================
create policy class_types_select_student
  on class_types
  for select
  to authenticated
  using (
    exists (
      select 1
      from school_students ss
      join students s on s.id = ss.student_id
      where ss.school_id = class_types.school_id
        and s.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- PACKS: allow students to see packs from their schools
-- ============================================================
create policy packs_select_student
  on packs
  for select
  to authenticated
  using (
    exists (
      select 1
      from school_students ss
      join students s on s.id = ss.student_id
      where ss.school_id = packs.school_id
        and s.auth_user_id = auth.uid()
    )
  );
