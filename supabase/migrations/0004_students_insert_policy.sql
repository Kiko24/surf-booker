-- ============================================================
-- MISSING RLS POLICIES
-- ============================================================

-- Students INSERT: school owner can create guest students
create policy students_insert_owner_guest
  on students
  for insert
  to authenticated
  with check (
    is_guest = true
    and auth_user_id is null
  );

-- Sessions DELETE: school owner can delete their own sessions
create policy sessions_delete_owner
  on sessions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = sessions.school_id
        and s.owner_user_id = auth.uid()
    )
  );
