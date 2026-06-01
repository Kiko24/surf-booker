-- 0013_class_types_category.sql
-- Add category column to class_types for public page filtering

alter table class_types
  add column category text;

alter table class_types
  add constraint class_types_category_check
    check (category is null or category in ('aula', 'pack', 'aluguer'));
