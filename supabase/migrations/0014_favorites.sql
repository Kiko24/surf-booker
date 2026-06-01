-- 0014_favorites.sql
-- User-school favorites for public page

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);

alter table favorites enable row level security;

-- Users can only see their own favorites
create policy favorites_select_own
  on favorites
  for select
  to authenticated
  using (user_id = auth.uid());

-- Users can only insert their own favorites
create policy favorites_insert_own
  on favorites
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can only delete their own favorites
create policy favorites_delete_own
  on favorites
  for delete
  to authenticated
  using (user_id = auth.uid());
