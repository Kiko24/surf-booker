-- 0019_class_types_description.sql
-- Add description column to class_types (if not already present)

alter table class_types
  add column if not exists description text;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'class_types'
      and constraint_name = 'class_types_description_check'
  ) then
    alter table class_types
      add constraint class_types_description_check
        check (description is null or char_length(description) <= 1000);
  end if;
end $$;
