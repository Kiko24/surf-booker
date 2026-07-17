-- Add direct FK from pack_purchases.school_id to schools.id
-- Required for PostgREST to resolve school:schools!inner joins
-- in getStudentPacks() and similar queries

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pack_purchases_schools_fk'
      and conrelid = 'pack_purchases'::regclass
  ) then
    alter table pack_purchases
      add constraint pack_purchases_schools_fk
      foreign key (school_id) references schools(id) on delete restrict;
  end if;
end $$;
