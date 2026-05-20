-- 0007_service_refactor.sql
-- Add modality and avulso_enabled to class_types
-- Link packs to class_types via class_type_id

alter table class_types
  add column modality text not null default '',
  add column avulso_enabled boolean not null default true;

alter table packs
  add column class_type_id uuid references class_types(id) on delete cascade;

create index if not exists packs_class_type_id_idx on packs(class_type_id);
