-- Add waiver_signed column to students
alter table students
  add column waiver_signed boolean not null default false;

-- RLS: allow school owner to update waiver_signed on any student linked to their school
create policy students_update_waiver_owner
  on students
  for update
  to authenticated
  using (
    exists (
      select 1
      from school_students ss
      join schools s on s.id = ss.school_id
      where ss.student_id = students.id
        and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from school_students ss
      join schools s on s.id = ss.school_id
      where ss.student_id = students.id
        and s.owner_user_id = auth.uid()
    )
  );
