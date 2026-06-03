-- 0018_storage_bucket_policies.sql
-- RLS policies for storage.objects on all three school buckets
-- Protege contra uploads não autorizados por qualquer user autenticado
--
-- NOTA: o dashboard usa service_role (admin client) para uploads,
-- por isso estas policies não afetam o funcionamento normal.
-- Apenas bloqueiam acessos diretos via API com anon key.

-- ============================================================
-- 1. school-logos
-- ============================================================
drop policy if exists "school_logos_select_owner" on storage.objects;
create policy "school_logos_select_owner"
  on storage.objects for select
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

drop policy if exists "school_logos_insert_owner" on storage.objects;
create policy "school_logos_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'school-logos'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

drop policy if exists "school_logos_delete_owner" on storage.objects;
create policy "school_logos_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. school-images
-- ============================================================
drop policy if exists "school_images_select_owner" on storage.objects;
create policy "school_images_select_owner"
  on storage.objects for select
  using (
    bucket_id = 'school-images'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

drop policy if exists "school_images_insert_owner" on storage.objects;
create policy "school_images_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'school-images'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

drop policy if exists "school_images_delete_owner" on storage.objects;
create policy "school_images_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'school-images'
    and exists (
      select 1 from schools
      where id::text = split_part(storage.objects.name, '/', 1)
        and owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. instructor-avatars
-- ============================================================
drop policy if exists "instructor_avatars_select_owner" on storage.objects;
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

drop policy if exists "instructor_avatars_insert_owner" on storage.objects;
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

drop policy if exists "instructor_avatars_delete_owner" on storage.objects;
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
