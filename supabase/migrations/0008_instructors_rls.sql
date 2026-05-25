-- ============================================================
-- 0008_instructors_rls.sql
-- ============================================================

alter table instructors enable row level security;

drop policy if exists instructors_select_owner on instructors;
drop policy if exists instructors_insert_owner on instructors;
drop policy if exists instructors_update_owner on instructors;
drop policy if exists instructors_delete_owner on instructors;

create policy instructors_select_owner
  on instructors
  for select
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = instructors.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy instructors_insert_owner
  on instructors
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from schools s
      where s.id = instructors.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy instructors_update_owner
  on instructors
  for update
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = instructors.school_id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from schools s
      where s.id = instructors.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy instructors_delete_owner
  on instructors
  for delete
  to authenticated
  using (
    exists (
      select 1
      from schools s
      where s.id = instructors.school_id
        and s.owner_user_id = auth.uid()
    )
  );
