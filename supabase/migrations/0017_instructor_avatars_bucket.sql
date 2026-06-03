-- 0017_instructor_avatars_bucket.sql
-- RLS policies for the instructor-avatars storage bucket
-- The bucket must be created via Dashboard or Management API first:
--   insert into storage.buckets (id, name, public) values ('instructor-avatars', 'instructor-avatars', true);

-- Allow school owners to select/read their instructor avatars
create policy "instructor_avatars_select_owner"
  on storage.objects for select
  using (
    bucket_id = 'instructor-avatars'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

-- Allow school owners to upload instructor avatars
create policy "instructor_avatars_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'instructor-avatars'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

-- Allow school owners to delete instructor avatars
create policy "instructor_avatars_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'instructor-avatars'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );
