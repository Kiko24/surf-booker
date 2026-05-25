-- School settings table for configurable preferences per school
create table school_settings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  low_occupancy_threshold int not null default 40,
  notify_email_confirmation boolean not null default true,
  notify_reminder_24h boolean not null default true,
  notify_sms_cancellation boolean not null default false,
  notify_new_schedule boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_settings_school_id_key unique (school_id),
  constraint school_settings_low_occupancy_check
    check (low_occupancy_threshold between 1 and 100)
);

create trigger school_settings_updated_at
  before update on school_settings
  for each row execute function set_updated_at();

-- Auto-create settings row when a school is created
create or replace function create_school_settings()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into school_settings (school_id) values (new.id);
  return new;
end;
$$;

create trigger create_school_settings_trigger
  after insert on schools
  for each row execute function create_school_settings();

-- RLS
alter table school_settings enable row level security;

create policy school_settings_select_owner
  on school_settings for select
  using (
    school_id in (select id from schools where owner_user_id = auth.uid())
  );

create policy school_settings_insert_owner
  on school_settings for insert
  with check (
    school_id in (select id from schools where owner_user_id = auth.uid())
  );

create policy school_settings_update_owner
  on school_settings for update
  using (
    school_id in (select id from schools where owner_user_id = auth.uid())
  )
  with check (
    school_id in (select id from schools where owner_user_id = auth.uid())
  );

create policy school_settings_delete_owner
  on school_settings for delete
  using (
    school_id in (select id from schools where owner_user_id = auth.uid())
  );

-- Insert settings for existing schools that don't have them yet
insert into school_settings (school_id)
select id from schools
where id not in (select school_id from school_settings);
