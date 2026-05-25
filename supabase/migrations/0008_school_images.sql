-- 0008_school_images.sql
-- Store showcase images for the school using Supabase Storage

-- Storage bucket must be created via Dashboard or Management API first.
-- Run in Supabase SQL Editor:
--   insert into storage.buckets (id, name, public) values ('school-images', 'school-images', true);
--
-- Replace the existing bucket-level policies with ownership-aware ones:
-- (drop old ones first if they exist)
--   drop policy if exists "school_images_select" on storage.objects;
--   drop policy if exists "school_images_insert" on storage.objects;
--   drop policy if exists "school_images_delete" on storage.objects;
--
--   create policy "school_images_select_owner" on storage.objects
--     for select using (
--       bucket_id = 'school-images'
--       and exists (
--         select 1 from schools
--         where id::text = split_part(storage.objects.name, '/', 1)
--           and owner_user_id = auth.uid()
--       )
--     );
--
--   create policy "school_images_insert_owner" on storage.objects
--     for insert with check (
--       bucket_id = 'school-images'
--       and exists (
--         select 1 from schools
--         where id::text = split_part(storage.objects.name, '/', 1)
--           and owner_user_id = auth.uid()
--       )
--     );
--
--   create policy "school_images_delete_owner" on storage.objects
--     for delete using (
--       bucket_id = 'school-images'
--       and exists (
--         select 1 from schools
--         where id::text = split_part(storage.objects.name, '/', 1)
--           and owner_user_id = auth.uid()
--       )
--     );

create table school_images (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  file_path text not null,
  created_at timestamptz not null default now()
);

create index school_images_school_id_idx on school_images(school_id);

alter table school_images enable row level security;

create policy school_images_select_owner
  on school_images for select
  using (
    exists (
      select 1 from schools s
      where s.id = school_images.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy school_images_insert_owner
  on school_images for insert
  with check (
    exists (
      select 1 from schools s
      where s.id = school_images.school_id
        and s.owner_user_id = auth.uid()
    )
  );

create policy school_images_delete_owner
  on school_images for delete
  using (
    exists (
      select 1 from schools s
      where s.id = school_images.school_id
        and s.owner_user_id = auth.uid()
    )
  );
