-- ============================================================
-- 0002_rls.sql
-- ============================================================

-- ============================================================
-- Enable RLS
-- ============================================================
alter table schools enable row level security;
alter table students enable row level security;
alter table school_students enable row level security;
alter table sessions enable row level security;
alter table booking_groups enable row level security;
alter table bookings enable row level security;
alter table packs enable row level security;
alter table pack_purchases enable row level security;
alter table waiver_versions enable row level security;
alter table waiver_acceptances enable row level security;

-- ============================================================
-- Drop existing policies
-- ============================================================
drop policy if exists schools_select_own on schools;
drop policy if exists schools_insert_own on schools;
drop policy if exists schools_update_own on schools;

drop policy if exists students_select_self_or_owner_linked on students;
drop policy if exists students_update_self on students;
drop policy if exists students_update_owner_guest_linked on students;

drop policy if exists school_students_select_owner on school_students;
drop policy if exists school_students_insert_owner on school_students;
drop policy if exists school_students_update_owner on school_students;
drop policy if exists school_students_delete_owner on school_students;

drop policy if exists sessions_select_owner on sessions;
drop policy if exists sessions_insert_owner on sessions;
drop policy if exists sessions_update_owner on sessions;

drop policy if exists booking_groups_select_owner on booking_groups;
drop policy if exists booking_groups_insert_owner on booking_groups;
drop policy if exists booking_groups_update_owner on booking_groups;

drop policy if exists bookings_select_owner on bookings;
drop policy if exists bookings_insert_owner on bookings;
drop policy if exists bookings_update_owner on bookings;

drop policy if exists packs_select_owner on packs;
drop policy if exists packs_insert_owner on packs;
drop policy if exists packs_update_owner on packs;

drop policy if exists pack_purchases_select_owner on pack_purchases;
drop policy if exists pack_purchases_insert_owner on pack_purchases;
drop policy if exists pack_purchases_update_owner on pack_purchases;

drop policy if exists waiver_versions_select_owner on waiver_versions;
drop policy if exists waiver_versions_insert_owner on waiver_versions;
drop policy if exists waiver_versions_update_owner on waiver_versions;

drop policy if exists waiver_acceptances_select_owner on waiver_acceptances;
drop policy if exists waiver_acceptances_insert_owner on waiver_acceptances;

-- ============================================================
-- SCHOOLS
-- ============================================================
create policy schools_select_own
  on schools
  for select
  to authenticated
  using (owner_user_id = auth.uid());

create policy schools_insert_own
  on schools
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy schools_update_own
  on schools
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- ============================================================
-- STUDENTS
-- Nota: sem INSERT directo.
-- Criação de students deve ser server-side quando chegares ao flow.
-- ============================================================
create policy students_select_self_or_owner_linked
  on students
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or exists (
      select 1
      from school_students ss
      join schools s on s.id = ss.school_id
      where ss.student_id = students.id
        and s.owner_user_id = auth.uid()
    )
  );

create policy students_update_self
  on students
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (
    auth_user_id = auth.uid()
    and is_guest = false
  );

create policy students_update_owner_guest_linked
  on students
  for update
  to authenticated
  using (
    auth_user_id is null
    and is_guest = true
    and exists (
      select 1
      from school_students ss
      join schools s on s.id = ss.school_id
      where ss.student_id = students.id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    auth_user_id is null
    and is_guest = true
    and exists (
      select 1
      from school_students ss
      join schools s on s.id = ss.school_id
      where ss.student_id = students.id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- SCHOOL_STUDENTS
-- ============================================================
create policy school_students_select_owner
  on school_students
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = school_students.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy school_students_insert_owner
  on school_students
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = school_students.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy school_students_update_owner
  on school_students
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = school_students.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = school_students.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy school_students_delete_owner
  on school_students
  for delete
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = school_students.school_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- SESSIONS
-- ============================================================
create policy sessions_select_owner
  on sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = sessions.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy sessions_insert_owner
  on sessions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = sessions.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy sessions_update_owner
  on sessions
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = sessions.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = sessions.school_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKING_GROUPS
-- ============================================================
create policy booking_groups_select_owner
  on booking_groups
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = booking_groups.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy booking_groups_insert_owner
  on booking_groups
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = booking_groups.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy booking_groups_update_owner
  on booking_groups
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = booking_groups.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = booking_groups.school_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
create policy bookings_select_owner
  on bookings
  for select
  to authenticated
  using (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy bookings_insert_owner
  on bookings
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
    and exists (
      select 1
      from booking_groups bg
      join school_students ss on ss.school_id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and ss.student_id = bookings.student_id
    )
    and (
      bookings.payment_method = 'single'
      or exists (
        select 1
        from booking_groups bg
        join pack_purchases pp on pp.id = bookings.pack_purchase_id
        where bg.id = bookings.booking_group_id
          and bg.session_id = bookings.session_id
          and pp.school_id = bg.school_id
          and pp.student_id = bookings.student_id
          and pp.status = 'active'
          and pp.lessons_remaining > 0
      )
    )
  );

create policy bookings_update_owner
  on bookings
  for update
  to authenticated
  using (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from booking_groups bg
      join schools s on s.id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and s.owner_user_id = auth.uid()
    )
    and exists (
      select 1
      from booking_groups bg
      join school_students ss on ss.school_id = bg.school_id
      where bg.id = bookings.booking_group_id
        and bg.session_id = bookings.session_id
        and ss.student_id = bookings.student_id
    )
    and (
      bookings.payment_method = 'single'
      or exists (
        select 1
        from booking_groups bg
        join pack_purchases pp on pp.id = bookings.pack_purchase_id
        where bg.id = bookings.booking_group_id
          and bg.session_id = bookings.session_id
          and pp.school_id = bg.school_id
          and pp.student_id = bookings.student_id
          and pp.status = 'active'
          and pp.lessons_remaining > 0
      )
    )
  );

-- ============================================================
-- PACKS
-- ============================================================
create policy packs_select_owner
  on packs
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = packs.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy packs_insert_owner
  on packs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = packs.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy packs_update_owner
  on packs
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = packs.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = packs.school_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- PACK_PURCHASES
-- ============================================================
create policy pack_purchases_select_owner
  on pack_purchases
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = pack_purchases.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy pack_purchases_insert_owner
  on pack_purchases
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = pack_purchases.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy pack_purchases_update_owner
  on pack_purchases
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = pack_purchases.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = pack_purchases.school_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVER_VERSIONS
-- ============================================================
create policy waiver_versions_select_owner
  on waiver_versions
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = waiver_versions.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy waiver_versions_insert_owner
  on waiver_versions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = waiver_versions.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy waiver_versions_update_owner
  on waiver_versions
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = waiver_versions.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = waiver_versions.school_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVER_ACCEPTANCES
-- ============================================================
create policy waiver_acceptances_select_owner
  on waiver_acceptances
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = waiver_acceptances.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy waiver_acceptances_insert_owner
  on waiver_acceptances
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = waiver_acceptances.school_id
        and s.owner_user_id = auth.uid()
    )
  );